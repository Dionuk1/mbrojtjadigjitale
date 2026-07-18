// Web Crypto helpers for password/passphrase/hash/encrypt tools.
// All operations happen locally in the browser.

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?/~";
const AMBIGUOUS = "O0oIl1|`'\"{}[]()/\\";
const READABLE_REMOVE = "O0oIl1S5B8Z2";

export interface PasswordOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  excludeDuplicates: boolean;
  easyToRead: boolean;
}

function secureRandomInt(max: number): number {
  // Uniform in [0, max)
  const arr = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / max) * max;
  while (true) {
    crypto.getRandomValues(arr);
    if (arr[0] < limit) return arr[0] % max;
  }
}

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  if (opts.upper) pool += UPPER;
  if (opts.lower) pool += LOWER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (!pool) return "";
  let chars = Array.from(new Set(pool.split("")));
  if (opts.excludeAmbiguous) chars = chars.filter((c) => !AMBIGUOUS.includes(c));
  if (opts.easyToRead) chars = chars.filter((c) => !READABLE_REMOVE.includes(c));
  if (chars.length === 0) return "";

  const out: string[] = [];
  const used = new Set<string>();
  for (let i = 0; i < opts.length; i++) {
    let candidate = chars[secureRandomInt(chars.length)];
    if (opts.excludeDuplicates && chars.length >= opts.length) {
      let tries = 0;
      while (used.has(candidate) && tries < 20) {
        candidate = chars[secureRandomInt(chars.length)];
        tries++;
      }
      used.add(candidate);
    }
    out.push(candidate);
  }
  return out.join("");
}

export function estimateEntropy(password: string): number {
  if (!password) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 32;
  return Math.round(password.length * Math.log2(Math.max(pool, 2)));
}

const COMMON_PASSWORDS = [
  "password", "123456", "123456789", "qwerty", "abc123", "111111", "letmein",
  "admin", "welcome", "monkey", "dragon", "iloveyou", "password1", "12345678",
  "qwerty123", "sunshine", "princess", "football", "master", "hello",
];
const KEYBOARD_PATTERNS = ["qwerty", "asdf", "zxcv", "1234", "0987", "qazwsx", "qwertyuiop"];

export interface StrengthResult {
  score: number; // 0-100
  label: "Very Weak" | "Weak" | "Medium" | "Strong" | "Very Strong";
  entropy: number;
  checks: { key: string; label: string; pass: boolean }[];
  issues: string[];
  suggestions: string[];
  crackTime: string;
}

export function analyzePassword(pw: string): StrengthResult {
  const checks = [
    { key: "len8", label: "At least 8 characters", pass: pw.length >= 8 },
    { key: "len16", label: "At least 16 characters", pass: pw.length >= 16 },
    { key: "upper", label: "Uppercase letters", pass: /[A-Z]/.test(pw) },
    { key: "lower", label: "Lowercase letters", pass: /[a-z]/.test(pw) },
    { key: "digit", label: "Numbers", pass: /[0-9]/.test(pw) },
    { key: "sym", label: "Symbols", pass: /[^A-Za-z0-9]/.test(pw) },
  ];
  const issues: string[] = [];
  const lower = pw.toLowerCase();
  if (/(.)\1{2,}/.test(pw)) issues.push("Contains repeated characters");
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef)/i.test(pw))
    issues.push("Contains sequential characters");
  if (KEYBOARD_PATTERNS.some((p) => lower.includes(p)))
    issues.push("Contains a keyboard pattern");
  if (COMMON_PASSWORDS.some((c) => lower === c || lower.includes(c)))
    issues.push("Matches a very common password");

  const entropy = estimateEntropy(pw);
  let score = Math.min(100, Math.round((entropy / 128) * 100));
  score -= issues.length * 15;
  if (pw.length < 8) score = Math.min(score, 20);
  score = Math.max(0, Math.min(100, score));

  let label: StrengthResult["label"] = "Very Weak";
  if (score >= 85) label = "Very Strong";
  else if (score >= 65) label = "Strong";
  else if (score >= 45) label = "Medium";
  else if (score >= 25) label = "Weak";

  const suggestions: string[] = [];
  if (!checks[1].pass) suggestions.push("Use at least 16 characters");
  if (!checks[2].pass) suggestions.push("Add uppercase letters");
  if (!checks[3].pass) suggestions.push("Add lowercase letters");
  if (!checks[4].pass) suggestions.push("Add numbers");
  if (!checks[5].pass) suggestions.push("Add symbols");
  if (issues.length) suggestions.push("Avoid common words, sequences and repeats");

  // Rough crack time at 10^10 guesses/sec
  const seconds = Math.pow(2, entropy) / 1e10;
  const crackTime = humanTime(seconds);

  return { score, label, entropy, checks, issues, suggestions, crackTime };
}

function humanTime(s: number): string {
  if (!isFinite(s) || s < 1) return "less than a second";
  const units: [number, string][] = [
    [60, "seconds"], [60, "minutes"], [24, "hours"],
    [365, "days"], [1000, "years"], [1000, "thousand years"],
    [1000, "million years"], [1000, "billion years"],
  ];
  let val = s;
  let unit = "seconds";
  for (const [f, u] of units) {
    if (val < f) { unit = u; break; }
    val = val / f;
    unit = u;
  }
  return `${val < 10 ? val.toFixed(1) : Math.round(val)} ${unit}`;
}

// Passphrase word list (compact but reasonable variety)
export const WORDLIST = [
  "river","laptop","mango","cloud","tiger","forest","planet","copper","harbor","meadow",
  "signal","canyon","ember","garnet","hazel","island","jaguar","kettle","lantern","mosaic",
  "nectar","oasis","piano","quartz","raven","summit","thistle","umbra","velvet","willow",
  "xenon","yodel","zephyr","anchor","breeze","citrus","diesel","echo","falcon","glacier",
  "hollow","indigo","jungle","kernel","lemon","marble","noble","orbit","pepper","quill",
  "ranger","silver","topaz","urban","vivid","whisper","yonder","zebra","apple","bridge",
  "candle","dolphin","ember","feather","garden","honey","iron","jasper","kayak","ladder",
  "monsoon","nimbus","onyx","pearl","quiet","rocket","satin","tundra","unity","vector",
  "walnut","yellow","zenith","almond","basalt","cedar","dune","eagle","fable","granite",
  "hazard","ivory","jolly","koala","lucid","meteor","nectar","opal","pebble","quokka",
];

export interface PassphraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  addNumber: boolean;
  addSymbol: boolean;
  numberPosition: "start" | "end";
}

export function generatePassphrase(opts: PassphraseOptions): string {
  const chosen: string[] = [];
  for (let i = 0; i < opts.words; i++) {
    let w = WORDLIST[secureRandomInt(WORDLIST.length)];
    if (opts.capitalize) w = w[0].toUpperCase() + w.slice(1);
    chosen.push(w);
  }
  let out = chosen.join(opts.separator);
  if (opts.addNumber) {
    const n = String(secureRandomInt(90) + 10);
    out = opts.numberPosition === "start" ? `${n}${opts.separator}${out}` : `${out}${opts.separator}${n}`;
  }
  if (opts.addSymbol) {
    const sym = SYMBOLS[secureRandomInt(SYMBOLS.length)];
    out = `${out}${sym}`;
  }
  return out;
}

// Hashing
export async function hashFile(
  file: File,
  algo: "SHA-256" | "SHA-512",
  onProgress?: (pct: number) => void,
): Promise<string> {
  // For very small files, digest directly
  if (file.size <= 8 * 1024 * 1024) {
    const buf = await file.arrayBuffer();
    const h = await crypto.subtle.digest(algo, buf);
    onProgress?.(100);
    return toHex(h);
  }
  // Stream via reader; Web Crypto doesn't support incremental digest,
  // so we still concatenate — but we chunk reading to keep UI responsive.
  const chunkSize = 4 * 1024 * 1024;
  const chunks: Uint8Array[] = [];
  let offset = 0;
  while (offset < file.size) {
    const slice = file.slice(offset, offset + chunkSize);
    const buf = new Uint8Array(await slice.arrayBuffer());
    chunks.push(buf);
    offset += chunkSize;
    onProgress?.(Math.min(99, Math.round((offset / file.size) * 100)));
    await new Promise((r) => setTimeout(r, 0));
  }
  const total = new Uint8Array(file.size);
  let p = 0;
  for (const c of chunks) { total.set(c, p); p += c.length; }
  const h = await crypto.subtle.digest(algo, total);
  onProgress?.(100);
  return toHex(h);
}

// MD5 implementation (pure JS — legacy comparison only, not secure)
export async function md5File(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  return md5(buf);
}

function toHex(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

// Compact MD5 (public domain adaptation)
function md5(bytes: Uint8Array): string {
  function rh(n: number) { let s = "", j; for (j = 0; j <= 3; j++) s += ((n >> (j*8+4)) & 0x0f).toString(16) + ((n >> (j*8)) & 0x0f).toString(16); return s; }
  function ad(x: number, y: number) { const l=(x&0xffff)+(y&0xffff); return (((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xffff); }
  function rl(n: number,c: number){return (n<<c)|(n>>>(32-c));}
  function cm(q:number,a:number,b:number,x:number,s:number,t:number){return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
  function ff(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm((b&c)|((~b)&d),a,b,x,s,t);}
  function gg(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm((b&d)|(c&(~d)),a,b,x,s,t);}
  function hh(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm(b^c^d,a,b,x,s,t);}
  function ii(a:number,b:number,c:number,d:number,x:number,s:number,t:number){return cm(c^(b|(~d)),a,b,x,s,t);}
  const n=bytes.length;
  const nblk=((n+8)>>6)+1;
  const blks=new Array(nblk*16).fill(0);
  for(let i=0;i<n;i++) blks[i>>2]|=bytes[i]<<((i%4)*8);
  blks[n>>2]|=0x80<<((n%4)*8);
  blks[nblk*16-2]=n*8;
  let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
  for(let i=0;i<blks.length;i+=16){
    const oa=a,ob=b,oc=c,od=d;
    a=ff(a,b,c,d,blks[i+0],7,-680876936);d=ff(d,a,b,c,blks[i+1],12,-389564586);c=ff(c,d,a,b,blks[i+2],17,606105819);b=ff(b,c,d,a,blks[i+3],22,-1044525330);
    a=ff(a,b,c,d,blks[i+4],7,-176418897);d=ff(d,a,b,c,blks[i+5],12,1200080426);c=ff(c,d,a,b,blks[i+6],17,-1473231341);b=ff(b,c,d,a,blks[i+7],22,-45705983);
    a=ff(a,b,c,d,blks[i+8],7,1770035416);d=ff(d,a,b,c,blks[i+9],12,-1958414417);c=ff(c,d,a,b,blks[i+10],17,-42063);b=ff(b,c,d,a,blks[i+11],22,-1990404162);
    a=ff(a,b,c,d,blks[i+12],7,1804603682);d=ff(d,a,b,c,blks[i+13],12,-40341101);c=ff(c,d,a,b,blks[i+14],17,-1502002290);b=ff(b,c,d,a,blks[i+15],22,1236535329);
    a=gg(a,b,c,d,blks[i+1],5,-165796510);d=gg(d,a,b,c,blks[i+6],9,-1069501632);c=gg(c,d,a,b,blks[i+11],14,643717713);b=gg(b,c,d,a,blks[i+0],20,-373897302);
    a=gg(a,b,c,d,blks[i+5],5,-701558691);d=gg(d,a,b,c,blks[i+10],9,38016083);c=gg(c,d,a,b,blks[i+15],14,-660478335);b=gg(b,c,d,a,blks[i+4],20,-405537848);
    a=gg(a,b,c,d,blks[i+9],5,568446438);d=gg(d,a,b,c,blks[i+14],9,-1019803690);c=gg(c,d,a,b,blks[i+3],14,-187363961);b=gg(b,c,d,a,blks[i+8],20,1163531501);
    a=gg(a,b,c,d,blks[i+13],5,-1444681467);d=gg(d,a,b,c,blks[i+2],9,-51403784);c=gg(c,d,a,b,blks[i+7],14,1735328473);b=gg(b,c,d,a,blks[i+12],20,-1926607734);
    a=hh(a,b,c,d,blks[i+5],4,-378558);d=hh(d,a,b,c,blks[i+8],11,-2022574463);c=hh(c,d,a,b,blks[i+11],16,1839030562);b=hh(b,c,d,a,blks[i+14],23,-35309556);
    a=hh(a,b,c,d,blks[i+1],4,-1530992060);d=hh(d,a,b,c,blks[i+4],11,1272893353);c=hh(c,d,a,b,blks[i+7],16,-155497632);b=hh(b,c,d,a,blks[i+10],23,-1094730640);
    a=hh(a,b,c,d,blks[i+13],4,681279174);d=hh(d,a,b,c,blks[i+0],11,-358537222);c=hh(c,d,a,b,blks[i+3],16,-722521979);b=hh(b,c,d,a,blks[i+6],23,76029189);
    a=hh(a,b,c,d,blks[i+9],4,-640364487);d=hh(d,a,b,c,blks[i+12],11,-421815835);c=hh(c,d,a,b,blks[i+15],16,530742520);b=hh(b,c,d,a,blks[i+2],23,-995338651);
    a=ii(a,b,c,d,blks[i+0],6,-198630844);d=ii(d,a,b,c,blks[i+7],10,1126891415);c=ii(c,d,a,b,blks[i+14],15,-1416354905);b=ii(b,c,d,a,blks[i+5],21,-57434055);
    a=ii(a,b,c,d,blks[i+12],6,1700485571);d=ii(d,a,b,c,blks[i+3],10,-1894986606);c=ii(c,d,a,b,blks[i+10],15,-1051523);b=ii(b,c,d,a,blks[i+1],21,-2054922799);
    a=ii(a,b,c,d,blks[i+8],6,1873313359);d=ii(d,a,b,c,blks[i+15],10,-30611744);c=ii(c,d,a,b,blks[i+6],15,-1560198380);b=ii(b,c,d,a,blks[i+13],21,1309151649);
    a=ii(a,b,c,d,blks[i+4],6,-145523070);d=ii(d,a,b,c,blks[i+11],10,-1120210379);c=ii(c,d,a,b,blks[i+2],15,718787259);b=ii(b,c,d,a,blks[i+9],21,-343485551);
    a=ad(a,oa);b=ad(b,ob);c=ad(c,oc);d=ad(d,od);
  }
  return rh(a)+rh(b)+rh(c)+rh(d);
}

// AES-GCM Encryption
const ENC_VERSION = "STK1";

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(str: string): Uint8Array<ArrayBuffer> {
  const s = atob(str);
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export async function encryptText(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const payload = { v: ENC_VERSION, s: b64encode(salt), i: b64encode(iv), c: b64encode(new Uint8Array(ct)) };
  return b64encode(new TextEncoder().encode(JSON.stringify(payload)));
}

export async function decryptText(payload: string, password: string): Promise<string> {
  let parsed: { v: string; s: string; i: string; c: string };
  try {
    parsed = JSON.parse(new TextDecoder().decode(b64decode(payload.trim())));
  } catch {
    throw new Error("Invalid encrypted payload");
  }
  if (parsed.v !== ENC_VERSION) throw new Error("Unsupported format");
  const key = await deriveKey(password, b64decode(parsed.s));
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64decode(parsed.i) },
      key,
      b64decode(parsed.c),
    );
    return new TextDecoder().decode(pt);
  } catch {
    throw new Error("Decryption failed. Wrong password or corrupted data.");
  }
}