// Admin Combos API - CRUD operations for combos
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM combos ORDER BY created_at DESC'
    ).all();

    const combos = results.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      eyebrow: c.eyebrow,
      features: JSON.parse(c.features || '[]'),
      original_price: c.original_price,
      final_price: c.final_price,
      discount_percent: c.discount_percent,
      recipes: JSON.parse(c.recipes || '[]'),
      published: c.published,
      created_at: c.created_at,
      updated_at: c.updated_at
    }));

    return jsonResponse({ combos });
  } catch (err) {
    console.error('Error fetching admin combos:', err);
    return jsonResponse({ error: 'Failed to fetch combos' }, 500);
  }
}

export async function onRequestPost(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await context.request.json();

    const {
      title,
      description = '',
      eyebrow = 'combo de temporada',
      features = [],
      original_price = 0,
      final_price = 0,
      discount_percent = 0,
      recipes = [],
      published = 1
    } = body;

    if (!title) {
      return jsonResponse({ error: 'Title is required' }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO combos (title, description, eyebrow, features, original_price, final_price, discount_percent, recipes, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      title,
      description,
      eyebrow,
      JSON.stringify(features),
      original_price,
      final_price,
      discount_percent,
      JSON.stringify(recipes),
      published
    ).run();

    const comboId = result.meta.last_row_id;

    const combo = await env.DB.prepare('SELECT * FROM combos WHERE id = ?').bind(comboId).first();

    return jsonResponse({
      success: true,
      combo: {
        id: combo.id,
        title: combo.title,
        description: combo.description,
        eyebrow: combo.eyebrow,
        features: JSON.parse(combo.features || '[]'),
        original_price: combo.original_price,
        final_price: combo.final_price,
        discount_percent: combo.discount_percent,
        recipes: JSON.parse(combo.recipes || '[]'),
        published: combo.published,
        created_at: combo.created_at
      }
    }, 201);
  } catch (err) {
    console.error('Error creating combo:', err);
    return jsonResponse({ error: 'Failed to create combo' }, 500);
  }
}

export async function onRequestPut(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const body = await context.request.json();
    const { id, ...fields } = body;

    if (!id) {
      return jsonResponse({ error: 'Combo ID is required' }, 400);
    }

    const allowedFields = ['title', 'description', 'eyebrow', 'features', 'original_price', 'final_price', 'discount_percent', 'recipes', 'published'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        if (key === 'features' || key === 'recipes') {
          updates.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }
    }

    if (updates.length === 0) {
      return jsonResponse({ error: 'No valid fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await env.DB.prepare(
      `UPDATE combos SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const combo = await env.DB.prepare('SELECT * FROM combos WHERE id = ?').bind(id).first();

    return jsonResponse({
      success: true,
      combo: {
        id: combo.id,
        title: combo.title,
        description: combo.description,
        eyebrow: combo.eyebrow,
        features: JSON.parse(combo.features || '[]'),
        original_price: combo.original_price,
        final_price: combo.final_price,
        discount_percent: combo.discount_percent,
        recipes: JSON.parse(combo.recipes || '[]'),
        published: combo.published,
        updated_at: combo.updated_at
      }
    });
  } catch (err) {
    console.error('Error updating combo:', err);
    return jsonResponse({ error: 'Failed to update combo' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, data } = context;

  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return jsonResponse({ error: 'Combo ID is required' }, 400);
    }

    await env.DB.prepare('DELETE FROM combos WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('Error deleting combo:', err);
    return jsonResponse({ error: 'Failed to delete combo' }, 500);
  }
}