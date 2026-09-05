-- 1. analytics_events: validate public inserts
DROP POLICY IF EXISTS "public can insert analytics" ON public.analytics_events;
CREATE POLICY "public can insert validated analytics"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(event) BETWEEN 1 AND 64
  AND event ~ '^[a-zA-Z0-9._:-]+$'
  AND jsonb_typeof(meta) = 'object'
  AND length(meta::text) <= 1024
);

-- 2. feedback: explicitly deny reads to public roles
REVOKE SELECT, UPDATE, DELETE ON public.feedback FROM anon, authenticated;
GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT ALL ON public.feedback TO service_role;

-- 3. site_settings: remove blanket public read
DROP POLICY IF EXISTS "public reads site settings" ON public.site_settings;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.site_settings FROM anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;