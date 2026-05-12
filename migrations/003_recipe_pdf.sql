-- Migration: Add PDF support to recipes
-- Created: 2026-05-11

ALTER TABLE recipes ADD COLUMN pdf_base64 TEXT;

-- Migration: Add email tracking to orders
-- Created: 2026-05-11
ALTER TABLE orders ADD COLUMN email_sent_at TEXT;