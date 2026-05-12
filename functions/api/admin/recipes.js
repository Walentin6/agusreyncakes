// Admin Recipes API - List all (including unpublished)
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const recipes = await env.DB.prepare(
      `SELECT id, title, category, tag, time, level, price, description, content,
              image_url, label, photo_tone, published, images, created_at, updated_at,
              CASE WHEN pdf_base64 IS NOT NULL THEN 1 ELSE 0 END as has_pdf,
              CASE WHEN images IS NOT NULL AND images != '[]' AND images != '' THEN json_array_length(images) ELSE 0 END as images_count
       FROM recipes WHERE deleted_at IS NULL ORDER BY created_at DESC`
    ).all();

    const results = (recipes.results || []).map(r => {
      if (r.content) {
        try { r.content = JSON.parse(r.content); } catch (e) { r.content = {}; }
      }
      if (r.images) {
        try { r.images = JSON.parse(r.images); } catch (e) { r.images = []; }
      }
      return r;
    });

    return jsonResponse({ recipes: results });
  } catch (err) {
    console.error('Error fetching admin recipes:', err);
    return jsonResponse({ error: 'Failed to fetch recipes' }, 500);
  }
}