// Categories API - List and Create
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const categories = await env.DB.prepare(
      'SELECT id, name, display_order, is_default FROM categories ORDER BY display_order ASC, name ASC'
    ).all();

    return jsonResponse({ categories: categories.results || [] });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return jsonResponse({ error: 'Failed to fetch categories' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data, request } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return jsonResponse({ error: 'Category name is required' }, 400);
    }

    const name = body.name.trim();

    const existing = await env.DB.prepare('SELECT id FROM categories WHERE name = ?').bind(name).first();
    if (existing) {
      return jsonResponse({ error: 'Category already exists' }, 400);
    }

    const maxOrder = await env.DB.prepare('SELECT MAX(display_order) as max_order FROM categories').first();
    const newOrder = (maxOrder?.max_order || 0) + 1;

    const result = await env.DB.prepare(
      'INSERT INTO categories (name, display_order) VALUES (?, ?)'
    ).bind(name, newOrder).run();

    const newCategory = await env.DB.prepare(
      'SELECT id, name, display_order, is_default FROM categories WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return jsonResponse({ category: newCategory }, 201);
  } catch (err) {
    console.error('Error creating category:', err);
    return jsonResponse({ error: 'Failed to create category' }, 500);
  }
}