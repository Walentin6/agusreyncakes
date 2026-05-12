// Delete a specific image from a recipe by index
import { jsonResponse } from '../../../../utils.js';

export async function onRequestDelete(context) {
  const { env, data, params } = context;
  const id = params.id;
  const index = parseInt(params.index);

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  if (isNaN(index) || index < 0) {
    return jsonResponse({ error: 'Índice inválido' }, 400);
  }

  try {
    const recipe = await env.DB.prepare('SELECT images FROM recipes WHERE id = ?').bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: 'Receta no encontrada' }, 404);
    }

    const images = (() => {
      try { return JSON.parse(recipe.images || '[]'); }
      catch { return []; }
    })();

    if (index >= images.length) {
      return jsonResponse({ error: 'Índice fuera de rango' }, 400);
    }

    const deletedUrl = images[index];
    const updatedImages = images.filter((_, i) => i !== index);

    const filename = deletedUrl.split('/images/')[1];
    if (filename) {
      try {
        await env.IMAGES.delete(filename);
      } catch (e) {
        console.warn('[RECIPE-IMAGES-DELETE] Could not delete from R2:', e.message);
      }
    }

    await env.DB.prepare('UPDATE recipes SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind(JSON.stringify(updatedImages), id).run();

    return jsonResponse({ success: true, images: updatedImages });
  } catch (err) {
    console.error('[RECIPE-IMAGES-DELETE] Error:', err);
    return jsonResponse({ error: 'Error al eliminar imagen' }, 500);
  }
}