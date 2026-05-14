// Single Recipe API - Get, Update, Delete
import { jsonResponse, validatePdfBase64 } from '../../utils.js';

const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;

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

export async function onRequestGet(context) {
  const { env } = context;
  const id = context.params.id;
  
  try {
    const recipe = await env.DB.prepare(
      "SELECT * FROM recipes WHERE id = ? AND published = 1 AND deleted_at IS NULL"
    ).bind(id).first();
    
    if (!recipe) {
      return jsonResponse({ error: 'Recipe not found' }, 404);
    }
    
    // Parse content JSON
    if (recipe.content) {
      try {
        recipe.content = JSON.parse(recipe.content);
      } catch (e) {
        recipe.content = {};
      }
    }
    if (recipe.images) {
      try { recipe.images = JSON.parse(recipe.images); }
      catch (e) { recipe.images = []; }
    } else { recipe.images = []; }
    
    return jsonResponse({ recipe });
  } catch (err) {
    console.error('Error fetching recipe:', err);
    return jsonResponse({ error: 'Failed to fetch recipe' }, 500);
  }
}

export async function onRequestPut(context) {
  const { env, data } = context;
  const id = context.params.id;
  
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    const body = await context.request.json();

    let pdfBase64;
    if (body.pdf_base64 !== undefined) {
      if (body.pdf_base64 === null || body.pdf_base64 === '') {
        pdfBase64 = null;
      } else {
        const validation = validatePdfBase64(body.pdf_base64, !!env.PDF_BUCKET);
        if (!validation.valid) {
          return jsonResponse({ error: validation.error }, 400);
        }
        pdfBase64 = validation.clean;
      }
    }

    if (pdfBase64) {
      const storageCheck = await checkStorageLimit(env, pdfBase64.length * 0.75);
      if (!storageCheck.allowed) {
        return jsonResponse({ error: storageCheck.error }, 400);
      }
    }

    const sets = [
      'title = ?', 'category = ?', 'tag = ?', 'time = ?', 'level = ?',
      'price = ?', 'description = ?', 'content = ?', 'image_url = ?',
      'label = ?', 'photo_tone = ?', 'updated_at = CURRENT_TIMESTAMP'
    ];
    const values = [
      body.title, body.category, body.tag, body.time, body.level,
      body.price, body.description, JSON.stringify(body.content || {}),
      body.image_url, body.label, body.photo_tone
    ];

    if (pdfBase64 !== undefined) {
      if (env.PDF_BUCKET) {
        if (pdfBase64 === null) {
          await env.PDF_BUCKET.delete(`recipe_pdfs/${id}.txt`);
          sets.push('pdf_base64 = ?');
          values.push(null);
        } else {
          await env.PDF_BUCKET.put(`recipe_pdfs/${id}.txt`, pdfBase64);
          // Set to a tiny string so has_pdf check (length > 0) in D1 works
          sets.push('pdf_base64 = ?');
          values.push('R2_STORED');
        }
      } else {
        sets.push('pdf_base64 = ?');
        values.push(pdfBase64);
      }
    }

    values.push(id);

    await env.DB.prepare(
      `UPDATE recipes SET ${sets.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Error updating recipe:', err);
    return jsonResponse({ error: 'Failed to update recipe' }, 500);
  }
}

export async function onRequestPatch(context) {
  const { env, data } = context;
  const id = context.params.id;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await context.request.json();

    if (body.action === 'restore') {
      await env.DB.prepare(
        'UPDATE recipes SET deleted_at = NULL, published = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(id).run();
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: 'Invalid action' }, 400);
  } catch (err) {
    console.error('Error restoring recipe:', err);
    return jsonResponse({ error: 'Failed to restore recipe' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, data } = context;
  const id = context.params.id;
  
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    const url = new URL(context.request.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    if (permanent) {
      const recipe = await env.DB.prepare('SELECT * FROM recipes WHERE id = ?').bind(id).first();
      
      if (recipe) {
        if (recipe.images) {
          try {
            const images = JSON.parse(recipe.images);
            for (const imgUrl of images) {
              if (imgUrl && imgUrl.includes('/images/')) {
                const filename = imgUrl.split('/images/')[1];
                try { await env.IMAGES.delete(filename); } catch (e) { /* ignore */ }
              }
            }
          } catch (e) { /* ignore parse error */ }
        }

        if (env.PDF_BUCKET && recipe.pdf_base64 === 'R2_STORED') {
          try { await env.PDF_BUCKET.delete(`recipe_pdfs/${id}.txt`); } catch (e) { /* ignore */ }
        }
      }

      await env.DB.prepare('DELETE FROM recipes WHERE id = ?').bind(id).run();
      return jsonResponse({ success: true });
    }

    // Soft delete -> move to trash
    await env.DB.prepare(
      'UPDATE recipes SET published = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();
    
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    return jsonResponse({ error: 'Failed to delete recipe' }, 500);
  }
}
