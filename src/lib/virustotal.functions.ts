import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Stateless proxy to VirusTotal API v3. The user's API key is passed per request,
// forwarded only to VirusTotal in the x-apikey header, and never stored or logged.

const VT = "https://www.virustotal.com/api/v3";

export type VtStats = {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  timeout: number;
};

export type VtResult =
  | { kind: "report"; id: string; stats: VtStats; lastAnalysisDate: number | null }
  | { kind: "not_found" }
  | { kind: "queued"; analysisId: string }
  | { kind: "analysis"; status: string; stats: VtStats | null; urlId: string }
  | { kind: "error"; code: number; message: string };

function urlId(url: string) {
  return btoa(unescape(encodeURIComponent(url))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function errorFor(status: number): VtResult {
  const messages: Record<number, string> = {
    401: "The API key is invalid or missing. Check that you copied it correctly from your VirusTotal profile.",
    403: "Access denied. Your API key doesn't have permission for this request.",
    404: "No report was found for this website.",
    429: "VirusTotal's request limit was reached. Please wait a minute and try again.",
  };
  return { kind: "error", code: status, message: messages[status] ?? "VirusTotal could not be reached right now. Please try again later." };
}

function toStats(s: Partial<VtStats> | undefined): VtStats {
  return {
    malicious: s?.malicious ?? 0,
    suspicious: s?.suspicious ?? 0,
    harmless: s?.harmless ?? 0,
    undetected: s?.undetected ?? 0,
    timeout: s?.timeout ?? 0,
  };
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("report"), apiKey: z.string().min(10).max(200), url: z.string().url().max(2048) }),
  z.object({ action: z.literal("submit"), apiKey: z.string().min(10).max(200), url: z.string().url().max(2048) }),
  z.object({ action: z.literal("analysis"), apiKey: z.string().min(10).max(200), analysisId: z.string().min(1).max(300), url: z.string().url().max(2048) }),
]);

export const virusTotalRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }): Promise<VtResult> => {
    if (!/^https?:\/\//i.test(data.url)) return { kind: "error", code: 400, message: "Only http:// and https:// addresses are supported." };
    const headers = { "x-apikey": data.apiKey, accept: "application/json" };
    try {
      if (data.action === "report") {
        const id = urlId(data.url);
        const res = await fetch(`${VT}/urls/${id}`, { headers });
        if (res.status === 404) return { kind: "not_found" };
        if (!res.ok) return errorFor(res.status);
        const j = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: VtStats; last_analysis_date?: number } } };
        const a = j.data?.attributes;
        return { kind: "report", id, stats: toStats(a?.last_analysis_stats), lastAnalysisDate: a?.last_analysis_date ?? null };
      }
      if (data.action === "submit") {
        const res = await fetch(`${VT}/urls`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ url: data.url }).toString(),
        });
        if (!res.ok) return errorFor(res.status);
        const j = (await res.json()) as { data?: { id?: string } };
        if (!j.data?.id) return { kind: "error", code: 500, message: "VirusTotal returned an unexpected response." };
        return { kind: "queued", analysisId: j.data.id };
      }
      const res = await fetch(`${VT}/analyses/${encodeURIComponent(data.analysisId)}`, { headers });
      if (!res.ok) return errorFor(res.status);
      const j = (await res.json()) as { data?: { attributes?: { status?: string; stats?: VtStats } } };
      const st = j.data?.attributes?.status ?? "queued";
      return { kind: "analysis", status: st, stats: st === "completed" ? toStats(j.data?.attributes?.stats) : null, urlId: urlId(data.url) };
    } catch {
      return { kind: "error", code: 0, message: "Network error while contacting VirusTotal." };
    }
  });
