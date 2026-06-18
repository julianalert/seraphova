-- ─── Enable extensions ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ─── orders ───────────────────────────────────────────────────────────────────
CREATE TABLE orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  first_name                text NOT NULL,
  email                     text NOT NULL,

  -- Birth data
  birth_date                date NOT NULL,
  birth_time                time,
  birth_city                text NOT NULL,
  birth_lat                 numeric(9,6),
  birth_lng                 numeric(9,6),

  -- Natal chart (computed once, stored as JSON)
  natal_chart               jsonb,

  -- Preferences
  focus_areas               text[]  DEFAULT '{}',
  delivery_time             text    DEFAULT '7am',
  free_context              text,

  -- Payment
  stripe_payment_intent_id  text UNIQUE,
  stripe_charge_id          text,
  amount_paid               integer,
  currency                  text DEFAULT 'usd',
  paid_at                   timestamptz,
  status                    text DEFAULT 'pending',

  -- Delivery tracking
  access_start              date,
  access_end                date,
  total_sent                integer DEFAULT 0,
  last_sent_at              timestamptz,
  renewal_email_sent        boolean DEFAULT false,
  expiry_email_sent         boolean DEFAULT false,

  -- Metadata
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX idx_orders_email      ON orders(email);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_orders_access_end ON orders(access_end);

-- ─── daily_readings ───────────────────────────────────────────────────────────
CREATE TABLE daily_readings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid REFERENCES orders(id) ON DELETE CASCADE,

  reading_date      date NOT NULL,

  raw_prompt        text,
  raw_response      text,
  parsed_reading    jsonb,

  sent_at           timestamptz,
  resend_message_id text,
  open_tracked      boolean DEFAULT false,

  created_at        timestamptz DEFAULT now(),

  UNIQUE(order_id, reading_date)
);

CREATE INDEX idx_readings_order_date ON daily_readings(order_id, reading_date);

-- ─── transit_cache ────────────────────────────────────────────────────────────
-- Transits are identical for all users on a given day — compute once, reuse.
CREATE TABLE transit_cache (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transit_date date UNIQUE NOT NULL,
  transits     jsonb NOT NULL,
  computed_at  timestamptz DEFAULT now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── pg_cron jobs (run after enabling the extension in Supabase dashboard) ────
-- Daily send — 05:30 UTC
SELECT cron.schedule(
  'seraphova-daily-send',
  '30 5 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.base_url') || '/api/cron/daily-send',
      headers := ('{"Authorization":"Bearer ' || current_setting('app.cron_secret') || '"}')::jsonb
    );
  $$
);

-- Renewal check — 06:00 UTC
SELECT cron.schedule(
  'seraphova-renewal-check',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url     := current_setting('app.base_url') || '/api/cron/renewal-check',
      headers := ('{"Authorization":"Bearer ' || current_setting('app.cron_secret') || '"}')::jsonb
    );
  $$
);
