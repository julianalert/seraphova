-- Sprint 7: Add bounced/unsubscribed status support and index for bounce lookups

-- Add check constraint for valid statuses (non-destructive ALTER)
-- (Older rows already have valid statuses; new webhook sets bounced / unsubscribed)
ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'expired', 'bounced', 'unsubscribed'));

-- Index to quickly look up orders by email for bounce handling
CREATE INDEX IF NOT EXISTS orders_email_idx ON orders (email);
