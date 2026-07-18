import { KEYS, readJSON } from "./storage";

export const DEFAULT_DAILY_TIPS = [
  "Use a unique password for every important account.",
  "Enable two-factor authentication wherever possible.",
  "Prefer authenticator apps or hardware keys over SMS codes.",
  "Verify the real domain before entering your password.",
  "Keep your operating system and browser up to date.",
  "Back up important files regularly and test restores.",
  "Never share one-time authentication codes with anyone.",
  "Use a trusted password manager to store credentials.",
  "Lock your phone and computer with a strong screen lock.",
  "Review active login sessions on important accounts monthly.",
  "Download software only from official sources.",
  "Encrypt sensitive files before sharing them.",
  "Do not reuse old or leaked passwords.",
  "Avoid opening unexpected attachments and links.",
  "Enable device encryption on all your devices.",
];

export const DAILY_TIPS: string[] = (() => {
  const custom = readJSON<string[] | null>(KEYS.tips, null);
  return custom && custom.length ? custom : DEFAULT_DAILY_TIPS;
})();