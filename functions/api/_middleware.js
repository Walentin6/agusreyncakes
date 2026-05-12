// API middleware - CORS and auth helpers
import { corsPreflight, getSession } from '../utils.js';

export async function onRequest(context) {
  const { request } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return corsPreflight();
  }
  
  // Attach session to context for downstream handlers
  context.data = context.data || {};
  context.data.session = await getSession(context.env, request);
  
  return context.next();
}
