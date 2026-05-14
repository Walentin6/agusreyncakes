import { jsonResponse } from '../../utils.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for hero image

export async function onRequestGet(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const settings = await env.DB.prepare('SELECT * FROM settings').all();
    const result = {};
    settings.results?.forEach(s => {
      result[s.key] = s.value;
    });
    return jsonResponse({ settings: result });
  } catch (err) {
    console.error('[ADMIN-SETTINGS] Error:', err);
    return jsonResponse({ error: 'Error al obtener settings' }, 500);
  }
}

export async function onRequestPut(context) {
  const { env, data, request } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await request.json();
    const updates = body.settings || {};

    for (const [key, value] of Object.entries(updates)) {
      await env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(key, value, value).run();
    }

    const settings = await env.DB.prepare('SELECT * FROM settings').all();
    const result = {};
    settings.results?.forEach(s => {
      result[s.key] = s.value;
    });

    return jsonResponse({ success: true, settings: result });
  } catch (err) {
    console.error('[ADMIN-SETTINGS] Error:', err);
    return jsonResponse({ error: 'Error al actualizar settings: ' + err.message }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data, request } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: 'No se encontró archivo en el request' }, 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse({ error: 'Tipo no permitido. Usá JPG, PNG o WebP' }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: `Archivo muy grande. Máximo 5MB.` }, 400);
    }

    const key = `hero_${Date.now()}_${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });

    const baseUrl = env.SITE_URL || 'https://agusreyncakes.com';
    const imageUrl = `${baseUrl}/api/images/${key}`;

    await env.DB.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
    `).bind('hero_image_url', imageUrl, imageUrl).run();

    return jsonResponse({ success: true, url: imageUrl });
  } catch (err) {
    console.error('[ADMIN-SETTINGS-UPLOAD] Error:', err);
    return jsonResponse({ error: 'Error al subir imagen: ' + err.message }, 500);
  }
}