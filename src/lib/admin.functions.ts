import { createServerFn } from "@tanstack/react-start";
import { getRequest, getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const AUTH_ERR = "Unauthorized";

async function requireAdmin() {
  const [{ loadSessionUser, ADMIN_COOKIE }] = await Promise.all([
    import("@/lib/admin-auth.server"),
  ]);
  const sid = getCookie(ADMIN_COOKIE);
  const user = await loadSessionUser(sid);
  if (!user) throw new Error(AUTH_ERR);
  return user;
}

function clientIp(): string {
  try {
    const req = getRequest();
    return (
      req?.headers.get("cf-connecting-ip") ??
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req?.headers.get("x-real-ip") ??
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyPassword, randomSessionId, ADMIN_COOKIE, ADMIN_SESSION_TTL_MS, recordAudit } =
      await import("@/lib/admin-auth.server");
    const ip = clientIp();

    // Rate-limit: max 5 failed attempts per IP in 15 minutes
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("at", since);
    if ((count ?? 0) >= 5) {
      return { ok: false as const, error: "Too many attempts. Try again later." };
    }

    const { data: user } = await supabaseAdmin
      .from("admin_users")
      .select("id,username,password_hash,salt,iterations")
      .eq("username", data.username)
      .maybeSingle();
    const ok = user
      ? await verifyPassword(data.password, user.salt, user.password_hash, user.iterations)
      : false;

    await supabaseAdmin
      .from("admin_login_attempts")
      .insert({ ip, username: data.username, success: ok });

    if (!ok || !user) {
      return { ok: false as const, error: "Invalid credentials." };
    }

    const sid = randomSessionId();
    const req = getRequest();
    const ua = req?.headers.get("user-agent") ?? null;
    const expires = new Date(Date.now() + ADMIN_SESSION_TTL_MS);
    await supabaseAdmin.from("admin_sessions").insert({
      id: sid,
      user_id: user.id,
      expires_at: expires.toISOString(),
      ip,
      user_agent: ua,
    });
    await recordAudit(user.id, "login", { ip }, ip);
    setCookie(ADMIN_COOKIE, sid, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(ADMIN_SESSION_TTL_MS / 1000),
    });
    return { ok: true as const, user: { id: user.id, username: user.username } };
  });

export const adminMe = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const user = await requireAdmin();
    return { user };
  } catch {
    return { user: null };
  }
});

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { ADMIN_COOKIE, recordAudit } = await import("@/lib/admin-auth.server");
  const sid = getCookie(ADMIN_COOKIE);
  if (sid) {
    const { data: s } = await supabaseAdmin
      .from("admin_sessions")
      .select("user_id")
      .eq("id", sid)
      .maybeSingle();
    await supabaseAdmin.from("admin_sessions").update({ revoked: true }).eq("id", sid);
    if (s?.user_id) await recordAudit(s.user_id, "logout", {}, clientIp());
  }
  deleteCookie(ADMIN_COOKIE, { path: "/" });
  return { ok: true };
});

// --- Admin data endpoints ---

export const adminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [ev24, ev7, alerts, feedback, tools] = await Promise.all([
    supabaseAdmin.from("analytics_events").select("id", { count: "exact", head: true }).gte("at", dayAgo),
    supabaseAdmin.from("analytics_events").select("id", { count: "exact", head: true }).gte("at", weekAgo),
    supabaseAdmin.from("security_alerts").select("id", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("feedback").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("tool_config").select("slug,enabled"),
  ]);
  return {
    events24h: ev24.count ?? 0,
    events7d: ev7.count ?? 0,
    activeAlerts: alerts.count ?? 0,
    feedbackTotal: feedback.count ?? 0,
    toolsEnabled: (tools.data ?? []).filter((t) => t.enabled).length,
    toolsTotal: (tools.data ?? []).length,
  };
});

export const adminAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("analytics_events")
    .select("event,at")
    .gte("at", weekAgo)
    .order("at", { ascending: false })
    .limit(5000);
  const rows = data ?? [];
  const totals: Record<string, number> = {};
  const byDay: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    totals[r.event] = (totals[r.event] ?? 0) + 1;
    const day = r.at.slice(0, 10);
    byDay[day] ??= {};
    byDay[day][r.event] = (byDay[day][r.event] ?? 0) + 1;
  }
  return { totals, byDay };
});

export const adminListTools = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("tool_config").select("*").order("label");
  return data ?? [];
});

export const adminSetTool = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; enabled: boolean }) =>
    z.object({ slug: z.string().min(1), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin
      .from("tool_config")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("slug", data.slug);
    await recordAudit(u.id, "tool_toggle", { slug: data.slug, enabled: data.enabled });
    return { ok: true };
  });

// Alerts
export const adminListAlerts = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("security_alerts").select("*").order("created_at", { ascending: false });
  return data ?? [];
});
export const adminUpsertAlert = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string; title: string; body: string; severity: string; active: boolean }) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(2000),
      severity: z.enum(["info", "warning", "critical"]),
      active: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    if (data.id) {
      await supabaseAdmin.from("security_alerts").update({
        title: data.title, body: data.body, severity: data.severity, active: data.active,
      }).eq("id", data.id);
    } else {
      await supabaseAdmin.from("security_alerts").insert({
        title: data.title, body: data.body, severity: data.severity, active: data.active,
      });
    }
    await recordAudit(u.id, "alert_save", { id: data.id ?? null, title: data.title });
    return { ok: true };
  });
export const adminDeleteAlert = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("security_alerts").delete().eq("id", data.id);
    await recordAudit(u.id, "alert_delete", { id: data.id });
    return { ok: true };
  });

// Tips
export const adminListTips = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("daily_tips").select("*").order("order_idx");
  return data ?? [];
});
export const adminUpsertTip = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string; body: string; active: boolean; order_idx: number }) =>
    z.object({
      id: z.string().uuid().optional(),
      body: z.string().min(1).max(500),
      active: z.boolean(),
      order_idx: z.number().int(),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    if (data.id) {
      await supabaseAdmin.from("daily_tips").update({
        body: data.body, active: data.active, order_idx: data.order_idx,
      }).eq("id", data.id);
    } else {
      await supabaseAdmin.from("daily_tips").insert({ body: data.body, active: data.active, order_idx: data.order_idx });
    }
    await recordAudit(u.id, "tip_save", { id: data.id ?? null });
    return { ok: true };
  });
export const adminDeleteTip = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("daily_tips").delete().eq("id", data.id);
    await recordAudit(u.id, "tip_delete", { id: data.id });
    return { ok: true };
  });

// Weak patterns
export const adminListPatterns = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("weak_patterns").select("*").order("pattern");
  return data ?? [];
});
export const adminAddPattern = createServerFn({ method: "POST" })
  .inputValidator((d: { pattern: string }) => z.object({ pattern: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("weak_patterns").insert({ pattern: data.pattern.toLowerCase() });
    await recordAudit(u.id, "pattern_add", { pattern: data.pattern });
    return { ok: true };
  });
export const adminDeletePattern = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("weak_patterns").delete().eq("id", data.id);
    await recordAudit(u.id, "pattern_delete", { id: data.id });
    return { ok: true };
  });

// Feedback
export const adminListFeedback = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("feedback").select("*").order("at", { ascending: false }).limit(500);
  return data ?? [];
});
export const adminDeleteFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("feedback").delete().eq("id", data.id);
    await recordAudit(u.id, "feedback_delete", { id: data.id });
    return { ok: true };
  });

// Logs
export const adminListLogs = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("admin_audit_log").select("*").order("at", { ascending: false }).limit(500);
  return data ?? [];
});

// Sessions
export const adminListSessions = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_sessions")
    .select("id,user_id,created_at,last_seen,expires_at,ip,user_agent,revoked")
    .order("last_seen", { ascending: false })
    .limit(200);
  return data ?? [];
});
export const adminRevokeSession = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("admin_sessions").update({ revoked: true }).eq("id", data.id);
    await recordAudit(u.id, "session_revoke", { id: data.id });
    return { ok: true };
  });

// Site settings
export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_settings").select("*");
  const out = (data ?? []).map((r) => ({
    key: r.key,
    value: JSON.stringify(r.value),
    updated_at: r.updated_at,
  }));
  return out;
});
export const adminSetSetting = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; value: unknown }) =>
    z.object({ key: z.string().min(1).max(120), value: z.unknown() }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: data.key, value: data.value as never, updated_at: new Date().toISOString() });
    await recordAudit(u.id, "settings_save", { key: data.key });
    return { ok: true };
  });

// Users
export const adminListUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("admin_users").select("id,username,created_at,updated_at").order("username");
  return data ?? [];
});
export const adminCreateUser = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().min(2).max(64), password: z.string().min(10).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashPassword, recordAudit } = await import("@/lib/admin-auth.server");
    const { hash, salt, iterations } = await hashPassword(data.password);
    const { error } = await supabaseAdmin.from("admin_users").insert({
      username: data.username, password_hash: hash, salt, iterations,
    });
    if (error) return { ok: false as const, error: error.message };
    await recordAudit(u.id, "user_create", { username: data.username });
    return { ok: true as const };
  });
export const adminResetPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; password: string }) =>
    z.object({ id: z.string().uuid(), password: z.string().min(10).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { hashPassword, recordAudit } = await import("@/lib/admin-auth.server");
    const { hash, salt, iterations } = await hashPassword(data.password);
    await supabaseAdmin.from("admin_users").update({
      password_hash: hash, salt, iterations, updated_at: new Date().toISOString(),
    }).eq("id", data.id);
    await recordAudit(u.id, "user_password_reset", { id: data.id });
    return { ok: true };
  });
export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    if (u.id === data.id) return { ok: false as const, error: "Cannot delete yourself." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { recordAudit } = await import("@/lib/admin-auth.server");
    await supabaseAdmin.from("admin_users").delete().eq("id", data.id);
    await recordAudit(u.id, "user_delete", { id: data.id });
    return { ok: true as const };
  });

// Export bundle
export const adminExport = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [analytics, feedback, logs] = await Promise.all([
    supabaseAdmin.from("analytics_events").select("*").order("at", { ascending: false }).limit(10000),
    supabaseAdmin.from("feedback").select("*").order("at", { ascending: false }),
    supabaseAdmin.from("admin_audit_log").select("*").order("at", { ascending: false }),
  ]);
  return {
    exported_at: new Date().toISOString(),
    analytics: analytics.data ?? [],
    feedback: feedback.data ?? [],
    audit_log: logs.data ?? [],
  };
});