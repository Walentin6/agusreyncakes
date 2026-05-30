// Recipe Video API — Protected streaming + Admin upload
// Route: /api/recipes/:id/video
import { jsonResponse } from '../../../utils.js';

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const ALLOWED_TYPES = ['video/mp4', 'video/webm'];
const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB

async function getBucketUsage(bucket) {
  if (!bucket) return 0;
  let bytes = 0;
  let cursor = undefined;
  do {
    const listed = await bucket.list({ cursor });
    for (const obj of listed.objects) bytes += obj.size || 0;
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return bytes;
}

async function checkStorageLimit(env, additionalBytes) {
  try {
    const [imagesBytes, pdfsBytes] = await Promise.all([
      getBucketUsage(env.IMAGES),
      getBucketUsage(env.PDF_BUCKET)
    ]);
    const total = imagesBytes + pdfsBytes + additionalBytes;
    if (total > STORAGE_LIMIT) {
      const used = imagesBytes + pdfsBytes;
      const formatBytes = (b) => {
        if (b === 0) return '0 B';
        const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };
      return { allowed: false, error: `Límite de almacenamiento alcanzado (${formatBytes(used)} / ${formatBytes(STORAGE_LIMIT)}). Eliminá archivos antes de subir más.` };
    }
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

// GET — Stream video only if user purchased the recipe
export async function onRequestGet(context) {
  const { env, data, request, params } = context;
  const id = params.id;

  // Auth required
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
      WHERE o.user_id = ? AND oi.recipe_id = ? AND o.status = 'paid'
      LIMIT 1
    `).bind(data.session.userId, id).first();

    if (!purchase) {
      return jsonResponse({ error: 'No compraste esta receta' }, 403);
    }

    // Serve video from R2
    const key = recipe.video_url;
    const rangeHeader = request.headers.get('Range');

    let object;
    if (rangeHeader) {
      const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : undefined;
        const end = match[2] ? parseInt(match[2], 10) : undefined;
        const rangeOpts = {};
        if (start !== undefined) rangeOpts.offset = start;
        if (end !== undefined) rangeOpts.length = end - start + 1;
        object = await env.IMAGES.get(key, { range: rangeOpts });
      } else {
        object = await env.IMAGES.get(key);
      }
    } else {
      object = await env.IMAGES.get(key);
    }

    if (!object) {
      return jsonResponse({ error: 'Video no encontrado en almacenamiento' }, 404);
    }

    const headers = new Headers();
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'private, max-age=86400');

    const contentType = object.httpMetadata?.contentType;
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    if (object.range) {
      headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.range.size}`);
      headers.set('Content-Length', String(object.range.length));
      return new Response(object.body, { status: 206, headers });
    }

    headers.set('Content-Length', String(object.size));
    return new Response(object.body, { headers });
  } catch (err) {
    console.error('[VIDEO] Error serving video:', err);
    return jsonResponse({ error: 'Error al servir video' }, 500);
  }
}

// POST — Admin uploads video for a recipe
export async function onRequestPost(context) {
  const { env, data, params, request } = context;
  const id = params.id;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('video');

    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'No se encontró archivo en el request' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse({ error: `Tipo de archivo no permitido. Usá: MP4 o WEBM` }, 400);
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return jsonResponse({ error: `El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 200MB.` }, 400);
    }

    const storageCheck = await checkStorageLimit(env, file.size);
    if (!storageCheck.allowed) {
      return jsonResponse({ error: storageCheck.error }, 400);
    }

    // Delete existing video if present
    const existing = await env.DB.prepare(
      'SELECT video_url FROM recipes WHERE id = ?'
    ).bind(id).first();

    if (existing && existing.video_url) {
      try { await env.IMAGES.delete(existing.video_url); } catch (e) { /* ignore */ }
    }

    // Upload new video
    const ext = file.name.split('.').pop() || 'mp4';
    const key = `recipe_videos/${id}_${Date.now()}.${ext}`;

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'private, max-age=86400'
      }
    });

    await env.DB.prepare(
      'UPDATE recipes SET video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(key, id).run();

    return jsonResponse({ success: true, video_url: key });
  } catch (err) {
    console.error('[VIDEO] Upload error:', err);
    return jsonResponse({ error: 'Error al subir video: ' + err.message }, 500);
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
    const recipe = await env.DB.prepare(
      'SELECT video_url FROM recipes WHERE id = ?'
    ).bind(id).first();

    if (recipe && recipe.video_url) {
      try { await env.IMAGES.delete(recipe.video_url); } catch (e) { /* ignore */ }
    }

    await env.DB.prepare(
      'UPDATE recipes SET video_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[VIDEO] Delete error:', err);
    return jsonResponse({ error: 'Error al eliminar video' }, 500);
  }
}
