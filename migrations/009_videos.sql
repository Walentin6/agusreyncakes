-- Migration: Add video support to recipes
-- Videos are stored in R2 IMAGES bucket; video_url stores the R2 key

ALTER TABLE recipes ADD COLUMN video_url TEXT;
