import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function serverClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const url = process.env.SUPABASE_URL!;
  const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getPublicData = createServerFn({ method: "GET" }).handler(async () => {
  const c = serverClient();
  const [tips, alerts, tools] = await Promise.all([
    c.from("daily_tips").select("id,body,order_idx").eq("active", true).order("order_idx"),
    c.from("security_alerts").select("id,title,body,severity,created_at").eq("active", true).order("created_at", { ascending: false }).limit(5),
    c.from("tool_config").select("slug,label,enabled"),
  ]);
  return {
    tips: (tips.data ?? []) as { id: string; body: string; order_idx: number }[],
    alerts: (alerts.data ?? []) as { id: string; title: string; body: string; severity: string; created_at: string }[],
    tools: (tools.data ?? []) as { slug: string; label: string; enabled: boolean }[],
  };
});

export const getWeakPatterns = createServerFn({ method: "GET" }).handler(async () => {
  const c = serverClient();
  const { data } = await c.from("weak_patterns").select("pattern");
  return (data ?? []).map((r: { pattern: string }) => r.pattern);
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((d: { event: string }) =>
    z.object({ event: z.string().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = serverClient();
    await c.from("analytics_events").insert({ event: data.event });
    return { ok: true };
  });

export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { body: string; page?: string }) =>
    z.object({ body: z.string().min(1).max(4000), page: z.string().max(200).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const c = serverClient();
    await c.from("feedback").insert({ body: data.body, page: data.page ?? null });
    return { ok: true };
  });