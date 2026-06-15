-- Migration: Orders Soft Delete
-- Created: 2026-06-15

ALTER TABLE orders ADD COLUMN deleted_at DATETIME DEFAULT NULL;
