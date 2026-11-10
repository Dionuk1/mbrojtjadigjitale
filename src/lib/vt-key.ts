// VirusTotal API key storage: sessionStorage by default, localStorage only if the
// user opts into "Remember on this device". Never sent to our database or analytics.
const K = "md.vt.apikey";

export function loadVtKey(): { key: string; remembered: boolean } {
  if (typeof window === "undefined") return { key: "", remembered: false };
  try {
    const l = localStorage.getItem(K);
    if (l) return { key: l, remembered: true };
    return { key: sessionStorage.getItem(K) ?? "", remembered: false };
  } catch {
    return { key: "", remembered: false };
  }
}

export function saveVtKey(key: string, remember: boolean) {
  clearVtKey();
  try {
    (remember ? localStorage : sessionStorage).setItem(K, key);
  } catch {
    /* ignore */
  }
}

export function clearVtKey() {
  try {
    localStorage.removeItem(K);
    sessionStorage.removeItem(K);
  } catch {
    /* ignore */
  }
}

export function maskKey(k: string) {
  if (!k) return "";
  return k.length <= 8 ? "••••••••" : `${k.slice(0, 4)}••••••••${k.slice(-4)}`;
}
