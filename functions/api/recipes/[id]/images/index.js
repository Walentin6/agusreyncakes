// Upload/manage images for a recipe via Cloudflare R2
import { jsonResponse } from '../../../../utils.js';

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime'
];

export async function onRequestPost(context) {
  const { env, data, params, request } = context;
  const id = params.id;

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
      return jsonResponse({ error: `Tipo de archivo no permitido. Usá: JPG, PNG, WEBP, MP4 o WEBM` }, 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: `El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 25MB.` }, 400);
    }

    const recipe = await env.DB.prepare('SELECT images FROM recipes WHERE id = ?').bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: 'Receta no encontrada' }, 404);
    }

    const currentImages = (() => {
      try { return JSON.parse(recipe.images || '[]'); }
      catch { return []; }
    })();

    if (currentImages.length >= MAX_IMAGES) {
      return jsonResponse({ error: `Máximo ${MAX_IMAGES} imágenes por receta. Eliminá una antes de agregar otra.` }, 400);
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `r${id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });

    const baseUrl = env.SITE_URL || 'https://agusreyncakes.com';
    const imageUrl = `${baseUrl}/api/images/${key}`;

    const updatedImages = [...currentImages, imageUrl];
    await env.DB.prepare('UPDATE recipes SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(JSON.stringify(updatedImages), id).run();

    return jsonResponse({ success: true, url: imageUrl, images: updatedImages });
  } catch (err) {
    console.error('[RECIPE-IMAGES] Error:', err);
    return jsonResponse({ error: 'Error al subir imagen: ' + err.message }, 500);
  }
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  try {
    const recipe = await env.DB.prepare('SELECT images FROM recipes WHERE id = ?').bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: 'Receta no encontrada' }, 404);
    }

    const images = (() => {
      try { return JSON.parse(recipe.images || '[]'); }
      catch { return []; }
    })();

    return jsonResponse({ images });
  } catch (err) {
    console.error('[RECIPE-IMAGES] Error:', err);
    return jsonResponse({ error: 'Error al obtener imágenes' }, 500);
  }
}