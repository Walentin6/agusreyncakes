// Categories API - Update and Delete
import { jsonResponse } from '../../utils.js';

export async function onRequestPut(context) {
  const { env, data, request } = context;
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return jsonResponse({ error: 'Category name is required' }, 400);
    }

    const name = body.name.trim();

    const existing = await env.DB.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').bind(name, id).first();
    if (existing) {
      return jsonResponse({ error: 'Category name already exists' }, 400);
    }

    const category = await env.DB.prepare('SELECT is_default FROM categories WHERE id = ?').bind(id).first();
    if (!category) {
      return jsonResponse({ error: 'Category not found' }, 404);
    }

    if (category.is_default) {
      return jsonResponse({ error: 'Cannot rename default category' }, 400);
    }

    await env.DB.prepare('UPDATE categories SET name = ? WHERE id = ? AND is_default = 0').bind(name, id).run();

    const updated = await env.DB.prepare('SELECT id, name, display_order, is_default FROM categories WHERE id = ?').bind(id).first();

    return jsonResponse({ category: updated });
  } catch (err) {
    console.error('Error updating category:', err);
    return jsonResponse({ error: 'Failed to update category' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, data, request } = context;
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const category = await env.DB.prepare('SELECT is_default FROM categories WHERE id = ?').bind(id).first();
    if (!category) {
      return jsonResponse({ error: 'Category not found' }, 404);
    }

    if (category.is_default) {
      return jsonResponse({ error: 'Cannot delete default category' }, 400);
    }

    const recipesWithCategory = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM recipes WHERE category = (SELECT name FROM categories WHERE id = ?)'
    ).bind(id).first();

    if (recipesWithCategory.count > 0) {
      return jsonResponse({ error: 'Cannot delete category: it has associated recipes' }, 400);
    }

    await env.DB.prepare('DELETE FROM categories WHERE id = ? AND is_default = 0').bind(id).run();

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    return jsonResponse({ error: 'Failed to delete category' }, 500);
  }
}