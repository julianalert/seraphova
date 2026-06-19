-- ─── Abandoned cart email tracking ───────────────────────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS abandoned_emails_sent integer[] DEFAULT '{}';

-- Extend the status constraint to include 'abandoned'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'expired', 'bounced', 'unsubscribed', 'abandoned'));
