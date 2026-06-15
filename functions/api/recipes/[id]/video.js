// Recipe Video API — Protected YouTube embed URL + Admin set/remove
// Route: /api/recipes/:id/video
import { jsonResponse } from '../../../utils.js';

function extractYouTubeId(url) {
  if (!url) return null;
  // Direct ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  // Various URL formats
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// GET — Return YouTube embed URL only if user purchased the recipe
export async function onRequestGet(context) {
  const { env, data, params } = context;
  const id = params.id;

  if (!data.session) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const recipe = await env.DB.prepare(
      'SELECT video_url FROM recipes WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();

    if (!recipe || !recipe.video_url) {
      return jsonResponse({ error: 'Video no encontrado' }, 404);
    }

    // Verify purchase
    const purchase = await env.DB.prepare(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.recipe_id = ? AND o.status = 'paid' AND o.deleted_at IS NULL
      LIMIT 1
    `).bind(data.session.userId, id).first();

    if (!purchase) {
      return jsonResponse({ error: 'No compraste esta receta' }, 403);
    }

    const videoId = extractYouTubeId(recipe.video_url);
    if (!videoId) {
      return jsonResponse({ error: 'Video URL inválido' }, 500);
    }

    return jsonResponse({
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      videoId
    });
  } catch (err) {
    console.error('[VIDEO] Error:', err);
    return jsonResponse({ error: 'Error al obtener video' }, 500);
  }
}

// POST — Admin sets YouTube URL for a recipe
export async function onRequestPost(context) {
  const { env, data, params, request } = context;
  const id = params.id;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await request.json();
    const youtubeUrl = body.youtubeUrl || body.video_url;

    if (!youtubeUrl) {
      return jsonResponse({ error: 'Se requiere la URL de YouTube' }, 400);
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return jsonResponse({ error: 'URL de YouTube no válida. Usá: https://youtu.be/xxxx o https://youtube.com/watch?v=xxxx' }, 400);
    }

    await env.DB.prepare(
      'UPDATE recipes SET video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(youtubeUrl, id).run();

    return jsonResponse({ success: true, videoId, video_url: youtubeUrl });
  } catch (err) {
    console.error('[VIDEO] Error:', err);
    return jsonResponse({ error: 'Error al guardar video' }, 500);
  }
}

// DELETE — Admin removes video
export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const id = params.id;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    await env.DB.prepare(
      'UPDATE recipes SET video_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[VIDEO] Delete error:', err);
    return jsonResponse({ error: 'Error al eliminar video' }, 500);
  }
}
