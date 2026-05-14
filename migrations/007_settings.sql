-- Settings table for site configuration
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default hero image if not exists
INSERT OR IGNORE INTO settings (key, value) VALUES ('hero_image_url', '/uploads/tarta.jpg');