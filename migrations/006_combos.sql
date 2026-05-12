-- Migration: Combos de Temporada
-- Created: 2026-05-12

CREATE TABLE IF NOT EXISTS combos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  eyebrow TEXT DEFAULT 'combo de temporada',
  features TEXT DEFAULT '[]',
  original_price INTEGER NOT NULL DEFAULT 0,
  final_price INTEGER NOT NULL DEFAULT 0,
  discount_percent INTEGER DEFAULT 0,
  recipes TEXT NOT NULL DEFAULT '[]',
  published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);