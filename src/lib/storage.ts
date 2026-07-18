// Local storage helpers. All data stays on the user's device.

const LS = typeof window !== "undefined" ? window.localStorage : null;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    if (!LS) return fallback;
    const raw = LS.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    LS?.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function removeKey(key: string) {
  LS?.removeItem(key);
}

export const KEYS = {
  settings: "st.settings",
  checklist: "st.checklist",
  recent: "st.recent",
  analytics: "st.analytics",
  toolsEnabled: "st.toolsEnabled",
  tips: "st.tips",
  weakPatterns: "st.weakPatterns",
  feedback: "st.feedback",
} as const;

export type AnalyticsEvent =
  | "password_generator_opened"
  | "password_generated"
  | "strength_checker_opened"
  | "passphrase_generated"
  | "file_hash_generated"
  | "text_encryption_opened"
  | "checklist_completed";

export function trackEvent(event: AnalyticsEvent) {
  const data = readJSON<Record<string, { count: number; history: string[] }>>(KEYS.analytics, {});
  const bucket = data[event] ?? { count: 0, history: [] };
  bucket.count += 1;
  bucket.history.push(new Date().toISOString());
  if (bucket.history.length > 500) bucket.history = bucket.history.slice(-500);
  data[event] = bucket;
  writeJSON(KEYS.analytics, data);
}

export function addRecent(path: string, name: string) {
  const items = readJSON<{ path: string; name: string; at: number }[]>(KEYS.recent, []);
  const filtered = items.filter((i) => i.path !== path);
  filtered.unshift({ path, name, at: Date.now() });
  writeJSON(KEYS.recent, filtered.slice(0, 8));
}