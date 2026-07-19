// Server-only admin authentication helpers.
// Uses PBKDF2-SHA256 via Web Crypto (Cloudflare Workers-safe).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const COOKIE_NAME = "md_admin_sid";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours absolute
const INACTIVITY_MS = 15 * 60 * 1000;

function hex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}
function fromHex(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

export async function hashPassword(password: string, saltHex?: string, iterations = 210000) {
  const saltBytes = saltHex
    ? fromHex(saltHex)
    : crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const salt = new Uint8Array(saltBytes) as unknown as BufferSource;
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, base, 256);
  return { hash: hex(bits), salt: saltHex ?? hex(saltBytes.buffer as ArrayBuffer), iterations };
}

export async function verifyPassword(password: string, saltHex: string, expectedHex: string, iterations: number) {
  const { hash } = await hashPassword(password, saltHex, iterations);
  if (hash.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return diff === 0;
}

export function randomSessionId(): string {
  const b = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)));
  return hex(b.buffer as ArrayBuffer);
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_SESSION_TTL_MS = SESSION_TTL_MS;
export const ADMIN_INACTIVITY_MS = INACTIVITY_MS;

export async function loadSessionUser(sid: string | null | undefined) {
  if (!sid) return null;
  const { data: s } = await supabaseAdmin
    .from("admin_sessions")
    .select("id,user_id,expires_at,last_seen,revoked")
    .eq("id", sid)
    .maybeSingle();
  if (!s || s.revoked) return null;
  const now = Date.now();
  if (new Date(s.expires_at).getTime() < now) return null;
  if (now - new Date(s.last_seen).getTime() > INACTIVITY_MS) return null;
  await supabaseAdmin
    .from("admin_sessions")
    .update({ last_seen: new Date().toISOString() })
    .eq("id", sid);
  const { data: u } = await supabaseAdmin
    .from("admin_users")
    .select("id,username")
    .eq("id", s.user_id)
    .maybeSingle();
  return u ?? null;
}

export async function recordAudit(userId: string | null, action: string, meta: Record<string, unknown> = {}, ip?: string) {
  await supabaseAdmin.from("admin_audit_log").insert({ user_id: userId, action, meta: meta as never, ip: ip ?? null });
}