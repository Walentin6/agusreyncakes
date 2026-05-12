// Combos API - Get published combos for frontend
import { jsonResponse } from '../../utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM combos WHERE published = 1 ORDER BY created_at DESC'
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
      recipes: JSON.parse(c.recipes || '[]')
    }));

    return jsonResponse({ combos });
  } catch (err) {
    console.error('Error fetching combos:', err);
    return jsonResponse({ error: 'Failed to fetch combos' }, 500);
  }
}