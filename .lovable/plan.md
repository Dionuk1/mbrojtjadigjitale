# Audit findings

Current state vs. the earlier spec:

- Public app works: password gen, strength, passphrase, file hash, text encryption, checklist, tips, settings.
- **Missing public tools**: `/secure-qr-generator`, `/account-emergency`.
- **Public sidebar**: single AppShell nav only — no collapsed/expanded persistence, no grouped structure.
- **Admin area**: single dashboard page only. No sidebar, no top bar, no 14 sub-routes.
- **Admin auth**: entirely client-side PBKDF2. No server, no HttpOnly cookie, no rate limiting server-side, no audit log.
- **Analytics/logs**: only `localStorage`. No DB-backed events/logs.
- **Tool management, alerts, feedback, tips CRUD**: only local JSON blobs, not real "manage" screens.

# Plan

## 1. Enable Lovable Cloud
Required for DB-backed admin analytics, logs, alerts, tool management, feedback, and secure admin auth (HttpOnly session cookie + hashed password in DB).

## 2. Server-side admin auth
- Migration: `admin_users(id, username, password_hash, created_at)`, `admin_sessions(id, user_id, expires_at, ip, user_agent)`, `admin_audit_log(id, user_id, action, meta, at)`.
- Seed one admin: `admin` / `sigurohugjithmone69` (scrypt hash via Web Crypto, since Argon2/bcrypt native modules don't run on Cloudflare Workers).
- Server routes under `src/routes/api/admin/`: `login`, `logout`, `me`. HttpOnly, Secure, SameSite=Lax cookie holding a random 32-byte session id. 15-min inactivity + 8h absolute expiry, server-side rate limit (5 fails / 15 min per IP).
- `requireAdmin` helper for all admin server functions/routes.

## 3. DB-backed analytics + logs + tools
Tables:
- `analytics_events(id, event, meta, at)` — insertable by anon (RLS: insert-only public).
- `tool_config(slug, enabled, updated_at)` — admin-only writes.
- `security_alerts(id, title, body, severity, active, created_at)` — public read of active, admin write.
- `daily_tips(id, body, active, order_idx)` — public read active, admin write.
- `weak_patterns(id, pattern, updated_at)` — used by strength checker (public read), admin write.
- `feedback(id, body, at, page)` — anon insert, admin read.
- `admin_audit_log` — admin actions.

All secured with GRANTs + RLS.

## 4. Public app improvements
- **New `PublicShell`** replacing AppShell: grouped sidebar (Tools / Learn / Account), collapsed/expanded state persisted in `localStorage`, mobile drawer, smooth transitions (respect `prefers-reduced-motion` + settings.animations).
- **New route `/secure-qr-generator`**: local QR code generation (text/URL/Wi-Fi/vCard). Uses `qrcode` npm package, all client-side, download PNG.
- **New route `/account-emergency`**: interactive step-by-step checklist for compromised-account response, printable, local-only progress.
- Dashboard: pull daily tip, security alerts (from DB), checklist %, quick actions.
- Public analytics: `trackEvent` posts to `/api/public/track` (fire-and-forget, no PII, respects `Do Not Track`).

## 5. Redesigned admin (14 routes) under `_authenticated` gate via `beforeLoad` calling `/api/admin/me`
Layout: dedicated `AdminShell` with own sidebar + top bar (breadcrumb, user menu, logout).

Routes:
1. `/admin` — Overview cards (users today, events, alerts, feedback).
2. `/admin/analytics` — event totals, daily/weekly charts (recharts).
3. `/admin/tools` — enable/disable each tool.
4. `/admin/alerts` — CRUD security alerts.
5. `/admin/tips` — CRUD daily tips.
6. `/admin/weak-patterns` — CRUD weak-password patterns.
7. `/admin/feedback` — read/delete feedback.
8. `/admin/logs` — DB audit log with filters.
9. `/admin/sessions` — active admin sessions with revoke.
10. `/admin/settings` — global site settings (site name, maintenance banner).
11. `/admin/users` — admin users list + add + reset password.
12. `/admin/appearance` — light/dark default, accent color.
13. `/admin/exports` — one-click JSON export of analytics/feedback/logs.
14. `/admin/about` — build info, version, docs.

## 6. Responsive + animations
- Framer-motion-style transitions via existing Tailwind animations (`animate-fade-in`, `animate-scale-in`), respecting `prefers-reduced-motion`.
- Sidebar collapse animation, page-enter fade, card hover-scale.
- Verified at 360px, 768px, 1280px.

## 7. Verification
- Playwright screenshots at mobile + desktop for: public dashboard, secure-qr, account-emergency, admin login, admin overview, one admin CRUD route.
- Server function smoke test for admin login/me/logout.

# Technical notes
- Session cookie: `md_admin_sid`, HttpOnly, Secure, SameSite=Lax, Path=/.
- Password hashing: scrypt (Web Crypto `crypto.subtle.deriveBits` unavailable for scrypt in Workers; use `@noble/hashes/scrypt` — pure JS, Worker-safe). Params N=2^15, r=8, p=1.
- `qrcode` npm package (pure JS, works in Workers/browsers).
- Recharts already in stack.
- Route files use flat dot naming: `admin.analytics.tsx`, etc. All admin routes live under `_authenticated_admin` gate implemented as a small `beforeLoad` calling `/api/admin/me`.
