-- Migration: Add deleted_at for soft-delete / trash
-- Created: 2026-05-12

ALTER TABLE recipes ADD COLUMN deleted_at TEXT;
