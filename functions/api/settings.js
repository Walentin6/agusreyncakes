import { jsonResponse } from '../utils.js';

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const settings = await env.DB.prepare('SELECT * FROM settings').all();
    const result = {};
    settings.results?.forEach(s => {
      result[s.key] = s.value;
    });
    return jsonResponse({ settings: result });
  } catch (err) {
    console.error('[SETTINGS] Error:', err);
    return jsonResponse({ settings: {} }, 500);
  }
}