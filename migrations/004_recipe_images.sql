-- Migration: Add images support to recipes
-- Created: 2026-05-12
-- Stores array of R2 URLs as JSON

ALTER TABLE recipes ADD COLUMN images TEXT DEFAULT '[]';