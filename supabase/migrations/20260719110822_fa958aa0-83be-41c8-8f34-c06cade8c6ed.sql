
-- Admins
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  iterations INT NOT NULL DEFAULT 210000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT,
  user_agent TEXT,
  revoked BOOLEAN NOT NULL DEFAULT false
);
GRANT ALL ON public.admin_sessions TO service_role;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  username TEXT,
  success BOOLEAN NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_login_attempts TO service_role;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_login_attempts_ip_at_idx ON public.admin_login_attempts(ip, at DESC);

-- Analytics
CREATE TABLE public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can insert analytics" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE INDEX analytics_events_event_at_idx ON public.analytics_events(event, at DESC);
CREATE INDEX analytics_events_at_idx ON public.analytics_events(at DESC);

-- Feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  page TEXT,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can insert feedback" ON public.feedback
  FOR INSERT TO anon, authenticated WITH CHECK (length(body) BETWEEN 1 AND 4000);

-- Tools
CREATE TABLE public.tool_config (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tool_config TO anon, authenticated;
GRANT ALL ON public.tool_config TO service_role;
ALTER TABLE public.tool_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads tool config" ON public.tool_config
  FOR SELECT TO anon, authenticated USING (true);

-- Alerts
CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.security_alerts TO anon, authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active alerts" ON public.security_alerts
  FOR SELECT TO anon, authenticated USING (active = true);

-- Daily tips
CREATE TABLE public.daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  order_idx INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_tips TO anon, authenticated;
GRANT ALL ON public.daily_tips TO service_role;
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads active tips" ON public.daily_tips
  FOR SELECT TO anon, authenticated USING (active = true);

-- Weak patterns
CREATE TABLE public.weak_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weak_patterns TO anon, authenticated;
GRANT ALL ON public.weak_patterns TO service_role;
ALTER TABLE public.weak_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads weak patterns" ON public.weak_patterns
  FOR SELECT TO anon, authenticated USING (true);

-- Site settings
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads site settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Seed data
INSERT INTO public.admin_users (username, password_hash, salt) VALUES
  ('admin', '5a98dfee4b2632e90fb16438f54de6433efeeff9e913935193aafc6bdd863dfa', '278eec85b3bc443917b7a081895c9f22');

INSERT INTO public.tool_config (slug, label) VALUES
  ('password-generator','Password Generator'),
  ('strength-checker','Strength Checker'),
  ('passphrase-generator','Passphrase Generator'),
  ('file-hash-checker','File Hash Checker'),
  ('text-encryption','Text Encryption'),
  ('secure-qr-generator','Secure QR Generator'),
  ('account-emergency','Account Emergency'),
  ('security-checklist','Security Checklist'),
  ('security-tips','Security Tips');

INSERT INTO public.daily_tips (body, order_idx) VALUES
  ('Use a unique password for every important account.', 1),
  ('Enable two-factor authentication wherever possible.', 2),
  ('Prefer authenticator apps or hardware keys over SMS codes.', 3),
  ('Verify the real domain before entering your password.', 4),
  ('Keep your operating system and browser up to date.', 5),
  ('Back up important files regularly and test restores.', 6),
  ('Never share one-time authentication codes with anyone.', 7),
  ('Use a trusted password manager to store credentials.', 8),
  ('Lock your phone and computer with a strong screen lock.', 9),
  ('Review active login sessions on important accounts monthly.', 10),
  ('Download software only from official sources.', 11),
  ('Encrypt sensitive files before sharing them.', 12),
  ('Do not reuse old or leaked passwords.', 13),
  ('Avoid opening unexpected attachments and links.', 14),
  ('Enable device encryption on all your devices.', 15);

INSERT INTO public.weak_patterns (pattern) VALUES
  ('password'),('123456'),('qwerty'),('letmein'),('admin'),('welcome'),('iloveyou'),('monkey'),('dragon'),('football'),('abc123'),('111111'),('000000');

INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"Mbrojtja Digjitale"'::jsonb),
  ('maintenance_banner', '""'::jsonb);
