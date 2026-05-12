-- Migration: Initial Schema
-- Created: 2026-05-09

-- Users table (Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  google_id TEXT UNIQUE,
  is_admin INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  tag TEXT DEFAULT 'nuevo',
  time TEXT DEFAULT '1h',
  level TEXT DEFAULT 'fácil',
  price INTEGER NOT NULL,
  description TEXT,
  content TEXT, -- JSON with ingredients, steps, tips
  image_url TEXT,
  label TEXT,
  photo_tone TEXT DEFAULT 'pink',
  published INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, failed, cancelled
  payment_id TEXT,
  payment_provider TEXT DEFAULT 'mercadopago',
  preference_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  recipe_id INTEGER NOT NULL,
  recipe_title TEXT NOT NULL,
  price INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Cart table (for logged-in users)
CREATE TABLE IF NOT EXISTS carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  items TEXT NOT NULL DEFAULT '[]', -- JSON array
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample recipes (example data)
INSERT INTO recipes (title, category, tag, time, level, price, description, label, photo_tone, content) VALUES
('Petit fours perfectos', 'Petit fours', 'nuevo', '2h', 'intermedio', 4200, 'Mini pastelitos franceses con glaseado real', 'petit fours · 12 unid.', 'pink', '{"ingredients":["Harina 0000","Azúcar impalpable","Claras de huevo","Colorantes"],"steps":["Preparar la masa","Hornear","Glasear"],"tips":"Temperatura ambiente es clave"}'),
('Tarta de manzana', 'Tartas', 'popular', '1h 30', 'fácil', 3200, 'Tarta clásica con manzanas caramelizadas', 'tarta · 8 porciones', 'beige', '{"ingredients":["Manzanas verdes","Masa quebrada","Canela","Azúcar"],"steps":["Preparar la masa","Pelar manzanas","Hornear"],"tips":"Usar manzanas ácidas"}'),
('Macarons de frambuesa', 'Macarons', 'técnica', '3h', 'avanzado', 5400, 'Macarons franceses con ganache de frambuesa', 'macarons · 24 unid.', 'rose', '{"ingredients":["Harina de almendras","Claras","Azúcar","Frambuesas"],"steps":["Macaronage","Reposo","Horneo"],"tips":"Humedad relativa ideal: 40-50%"}'),
('Medialunas de manteca', 'Panadería', 'clásico', '12h', 'intermedio', 4800, 'Medialunas argentinas con alta cantidad de manteca', 'medialunas · 18 unid.', 'cream', '{"ingredients":["Harina","Manteca","Leche","Levadura","Miel"],"steps":["Pre fermento","Laminado","Reposo","Horneo"],"tips":"No apretar al enrollar"}'),
('Torta de limón y flores', 'Tortas', 'nuevo', '2h 30', 'intermedio', 4600, 'Torta esponjosa con curd de limón y decoración floral', 'torta · 10 porciones', 'cream', '{"ingredients":["Harina","Huevos","Limones","Manteca","Azúcar"],"steps":["Bizcochuelo","Curd de limón","Decorar"],"tips":"Ralladura de limón orgánico"}'),
('Cupcakes con frutos rojos', 'Cupcakes', 'rápido', '1h', 'fácil', 2800, 'Cupcakes húmedos con buttercream y frutos rojos', 'cupcakes · 12 unid.', 'pink', '{"ingredients":["Harina","Huevos","Frutos rojos","Queso crema"],"steps":["Masa","Horneo","Frosting"],"tips":"No sobrebatir"}');
