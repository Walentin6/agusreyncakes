// Recipes API - List and Create
import { jsonResponse, validatePdfBase64 } from '../../utils.js';

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

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get('category');
  
  try {
    let query = "SELECT id, title, category, tag, time, level, price, description, image_url, label, photo_tone, images FROM recipes WHERE published = 1 AND deleted_at IS NULL AND category != 'Sin categoría'";
    let bindings = [];
    
    if (category && category !== 'Todas') {
      query += ' AND category = ?';
      bindings.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = env.DB.prepare(query);
    const recipesRaw = bindings.length > 0
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    const recipes = (recipesRaw.results || []).map(r => {
      if (r.images) {
        try { r.images = JSON.parse(r.images); } catch { r.images = []; }
      } else {
        r.images = [];
      }
      return r;
    });

    return jsonResponse({ recipes });
  } catch (err) {
    console.error('Error fetching recipes:', err);
    return jsonResponse({ error: 'Failed to fetch recipes' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data } = context;
  
  // Check admin
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }
  
  try {
    const body = await context.request.json();

    let pdfBase64 = null;
    if (body.pdf_base64) {
      const validation = validatePdfBase64(body.pdf_base64, !!env.PDF_BUCKET);
      if (!validation.valid) {
        return jsonResponse({ error: validation.error }, 400);
      }
      pdfBase64 = validation.clean;
    }

    const pdfSize = pdfBase64 ? pdfBase64.length * 0.75 : 0;
    const imagesSize = Array.isArray(body.images)
      ? body.images.reduce((sum, img) => sum + (img.base64 ? img.base64.length * 0.75 : 0), 0)
      : 0;
    const storageCheck = await checkStorageLimit(env, pdfSize + imagesSize);
    if (!storageCheck.allowed) {
      return jsonResponse({ error: storageCheck.error }, 400);
    }
    
    const initialPdfBase64 = env.PDF_BUCKET && pdfBase64 ? 'R2_STORED' : pdfBase64;

    const result = await env.DB.prepare(
      `INSERT INTO recipes (title, category, tag, time, level, price, description, content, image_url, label, photo_tone, pdf_base64)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.title,
      body.category,
      body.tag || 'nuevo',
      body.time || '1h',
      body.level || 'fácil',
      body.price,
      body.description || '',
      JSON.stringify(body.content || {}),
      body.image_url || '',
      body.label || '',
      body.photo_tone || 'pink',
      initialPdfBase64
    ).run();

    const newId = result.meta.last_row_id;

    // Save to R2 if bucket exists and PDF was provided
    if (env.PDF_BUCKET && pdfBase64) {
      await env.PDF_BUCKET.put(`recipe_pdfs/${newId}.txt`, pdfBase64);
    }

    // Handle images sent as base64 in the payload (for new recipes)
    const imageUrls = [];
    if (Array.isArray(body.images) && body.images.length > 0 && env.IMAGES) {
      const baseUrl = env.SITE_URL || 'https://agusreyncakes.com';
      const MAX_IMAGES = 5;
      const MAX_FILE_SIZE = 25 * 1024 * 1024;
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

      for (let i = 0; i < Math.min(body.images.length, MAX_IMAGES); i++) {
        const img = body.images[i];
        if (!img.base64 || !img.name || !img.type) continue;
        if (!ALLOWED_TYPES.includes(img.type)) continue;

        const buffer = Uint8Array.from(atob(img.base64), c => c.charCodeAt(0));
        if (buffer.length > MAX_FILE_SIZE) continue;

        const ext = img.name.split('.').pop() || 'jpg';
        const key = `r${newId}_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}.${ext}`;

        await env.IMAGES.put(key, buffer, {
          httpMetadata: {
            contentType: img.type,
            cacheControl: 'public, max-age=31536000'
          }
        });

        imageUrls.push(`${baseUrl}/api/images/${key}`);
      }
    }

    // Save image URLs to the recipe if any were uploaded
    if (imageUrls.length > 0) {
      await env.DB.prepare('UPDATE recipes SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(JSON.stringify(imageUrls), newId).run();
    }
    
    return jsonResponse({ id: newId, success: true, images: imageUrls }, 201);
  } catch (err) {
    console.error('Error creating recipe:', err);
    return jsonResponse({ error: 'Failed to create recipe' }, 500);
  }
}
