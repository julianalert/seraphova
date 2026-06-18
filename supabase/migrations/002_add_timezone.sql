-- Add timezone column to orders for per-user delivery scheduling
ALTER TABLE orders ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC+0';
