-- Migration: Add Categories Table
-- Created: 2026-05-20

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Populate with existing unique categories from recipes
INSERT INTO categories (name, display_order, is_default)
SELECT DISTINCT category,
  CASE category
    WHEN 'Tortas' THEN 1
    WHEN 'Tartas' THEN 2
    WHEN 'Macarons' THEN 3
    WHEN 'Petit fours' THEN 4
    WHEN 'Cupcakes' THEN 5
    WHEN 'Panadería' THEN 6
    ELSE 99
  END,
  0
FROM recipes
WHERE category IS NOT NULL AND category != '';

-- Insert default category (not shown in catalog)
INSERT INTO categories (name, display_order, is_default)
VALUES ('Sin categoría', 0, 1);