// Admin Storage API - Check R2 usage and enforce limits
import { jsonResponse } from '../../utils.js';

const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024; // 10GB in bytes

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function getBucketUsage(bucket) {
  if (!bucket) return { count: 0, bytes: 0 };

  let count = 0;
  let bytes = 0;
  let cursor = undefined;

  do {
    const listed = await bucket.list({ cursor, include: ['httpMetadata'] });
    for (const obj of listed.objects) {
      count++;
      bytes += obj.size || 0;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return { count, bytes };
}

export async function onRequestGet(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const [imagesUsage, pdfsUsage] = await Promise.all([
      getBucketUsage(env.IMAGES),
      getBucketUsage(env.PDF_BUCKET)
    ]);

    const totalBytes = imagesUsage.bytes + pdfsUsage.bytes;
    const usagePercent = (totalBytes / STORAGE_LIMIT) * 100;

    return jsonResponse({
      images: {
        count: imagesUsage.count,
        bytes: imagesUsage.bytes,
        human: formatBytes(imagesUsage.bytes)
      },
      pdfs: {
        count: pdfsUsage.count,
        bytes: pdfsUsage.bytes,
        human: formatBytes(pdfsUsage.bytes)
      },
      total: {
        bytes: totalBytes,
        human: formatBytes(totalBytes),
        limit: STORAGE_LIMIT,
        limitHuman: formatBytes(STORAGE_LIMIT),
        usagePercent: Math.min(usagePercent, 100),
        remaining: STORAGE_LIMIT - totalBytes,
        remainingHuman: formatBytes(Math.max(STORAGE_LIMIT - totalBytes, 0))
      }
    });
  } catch (err) {
    console.error('[STORAGE] Error fetching usage:', err);
    return jsonResponse({ error: 'Error al obtener uso de almacenamiento' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data, request } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const additionalBytes = body.additionalBytes || 0;

    const [imagesUsage, pdfsUsage] = await Promise.all([
      getBucketUsage(env.IMAGES),
      getBucketUsage(env.PDF_BUCKET)
    ]);

    const totalBytes = imagesUsage.bytes + pdfsUsage.bytes + additionalBytes;

    if (totalBytes > STORAGE_LIMIT) {
      return jsonResponse({
        allowed: false,
        error: `Límite de almacenamiento alcanzado (${formatBytes(imagesUsage.bytes + pdfsUsage.bytes)} / ${formatBytes(STORAGE_LIMIT)}). Eliminá archivos antes de subir más.`,
        current: imagesUsage.bytes + pdfsUsage.bytes,
        limit: STORAGE_LIMIT,
        wouldBe: totalBytes
      }, 400);
    }

    return jsonResponse({
      allowed: true,
      current: imagesUsage.bytes + pdfsUsage.bytes,
      limit: STORAGE_LIMIT,
      remaining: STORAGE_LIMIT - (imagesUsage.bytes + pdfsUsage.bytes)
    });
  } catch (err) {
    console.error('[STORAGE] Error checking limit:', err);
    return jsonResponse({ error: 'Error al verificar almacenamiento' }, 500);
  }
}
