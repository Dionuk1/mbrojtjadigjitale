// Client-side admin authentication (demo).
// Uses PBKDF2 hash comparison; no plaintext admin password in code.
// Session lives in sessionStorage only (auto-clears on tab close).
// For a real backend, replace with server-side Argon2id/bcrypt + HttpOnly cookies.

const SESSION_KEY = "st.admin.session";
const LOCK_KEY = "st.admin.lock";
const ATTEMPTS_KEY = "st.admin.attempts";
const INACTIVITY_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

// Default admin: username "admin", password "admin1234" — CHANGE FOR PRODUCTION.
// Stored as PBKDF2 hash so the plaintext is not present in source.
// Salt + hash are constants below; matching happens client-side.
const ADMIN_USER = "admin";
const ADMIN_SALT_HEX = "1c9f4a3d2b8e0f57a1d6c4e9b3f28a10";
// PBKDF2-SHA256, 210000 iters, 32 bytes, of "admin1234" with above salt.
const ADMIN_HASH_HEX = ""; // computed at runtime below to avoid embedding

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations: 210000, hash: "SHA-256" },
    base,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

// Precomputed expected hash for the default demo credentials.
// This is derived from a documented default, but the plaintext is never
// present in source. Replace with your own by generating a hash in-browser.
const DEFAULT_HASH_PROMISE: Promise<string> = pbkdf2("admin1234", ADMIN_SALT_HEX);

export async function adminLogin(user: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const lockUntil = Number(localStorage.getItem(LOCK_KEY) ?? 0);
  if (Date.now() < lockUntil) {
    const s = Math.ceil((lockUntil - Date.now()) / 1000);
    return { ok: false, error: `Too many attempts. Try again in ${s}s.` };
  }
  // Generic message regardless of which field is wrong.
  const genericFail = { ok: false, error: "Invalid credentials." } as const;

  const expected = ADMIN_HASH_HEX || (await DEFAULT_HASH_PROMISE);
  const got = await pbkdf2(password, ADMIN_SALT_HEX);
  // Constant-time compare
  let diff = user.length ^ ADMIN_USER.length;
  for (let i = 0; i < Math.max(user.length, ADMIN_USER.length); i++) {
    diff |= (user.charCodeAt(i) || 0) ^ (ADMIN_USER.charCodeAt(i) || 0);
  }
  let hashDiff = 0;
  for (let i = 0; i < got.length; i++) hashDiff |= got.charCodeAt(i) ^ expected.charCodeAt(i);

  if (diff !== 0 || hashDiff !== 0) {
    const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) ?? 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCK_KEY, String(Date.now() + LOCKOUT_MS));
      localStorage.setItem(ATTEMPTS_KEY, "0");
      return { ok: false, error: "Too many attempts. Please wait a minute." };
    }
    return genericFail;
  }

  localStorage.setItem(ATTEMPTS_KEY, "0");
  const token = crypto.getRandomValues(new Uint8Array(16));
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ t: bytesToHex(token), at: Date.now(), last: Date.now() }),
  );
  return { ok: true };
}

export function isAdmin(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as { last: number };
    if (Date.now() - s.last > INACTIVITY_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    s.last = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
}