# Agus Reynoso — Recetas de Autora

## Architecture

- **Frontend:** Static HTML in `public/` with React 18 + Babel CDN (no build step)
- **Backend:** Cloudflare Pages Functions in `functions/api/`
- **Database:** Cloudflare D1 (SQLite), migrations in `migrations/`
- **Sessions:** Cloudflare KV namespace `SESSIONS`
- **Payments:** Mercado Pago Checkout Pro
- **Auth:** Google OAuth 2.0 with PKCE + HttpOnly cookies

## Developer Commands

```bash
npm run dev          # Local dev (wrangler pages dev public --port 8788)
npm run deploy       # Deploy to Cloudflare Pages
npm run db:create    # Create D1 database
npm run db:migrate   # Apply migrations to Cloudflare D1
npm run db:migrate:local  # Apply migrations locally
```

## Critical Gotchas

- **Do not change CDN script URLs in HTML without updating SRI `integrity` hashes** — scripts won't load otherwise
- **Do not add Webpack/Vite/etc** — keep static HTML + inline JSX
- **Mercado Pago webhooks must return HTTP 200** even on errors to prevent retry storms
- **First registered user gets `is_admin = 1`** automatically (`functions/api/auth/callback.js`)
- **Admin routes check `data.session.isAdmin`** — middleware attaches session to `context.data` (`functions/api/_middleware.js`)
- **API base URL is `''` (empty string)** — same-origin deployment assumed
- **D1 row size limit is ~1MB** — `pdf_base64` is validated to max 900KB (base64) = ~675KB original PDF. Larger PDFs will be rejected at upload
- **Admin recipe list does NOT include `pdf_base64`** — it uses `has_pdf` (0/1) to avoid transferring all PDF data in list views
- **Email logic is in `functions/utils.js` → `sendRecipeEmail()`** — webhook and admin resend both use this shared function
- **Recipe PUT only updates `pdf_base64` if explicitly sent** — omitting the field preserves the existing PDF in DB

## Setup (manual, not automated)

1. `wrangler d1 create agusreyncakes_db` → copy ID to `wrangler.toml`
2. `wrangler kv:namespace create SESSIONS` → copy ID to `wrangler.toml`
3. Set secrets via `wrangler secret put`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth)
   - `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` (Mercado Pago)
   - `RESEND_API_KEY` (email con PDFs)
   - `RESEND_FROM_EMAIL` (ej: `Agustina Reynoso <noreply@tudominio.com>`)
4. Apply migrations: `npm run db:migrate` (local: `npm run db:migrate:local`)
5. Configure Google OAuth redirect URI to match deployed domain
6. Configure Mercado Pago webhook URL to `/api/payments/webhook`

## PDF Recipe Delivery

When a Mercado Pago payment is approved, the system automatically emails the customer:
1. Webhook receives `payment.approved` from Mercado Pago
2. Order status updated to `paid`
3. System fetches all purchased recipes with their `pdf_base64` data
4. Sends HTML email with PDF attachment(s) via Resend API (one attachment per recipe)
5. Marks `email_sent_at` on the order

**Manual resend**: Admin can re-send from the orders panel via the "Ver" → "Reenviar recetas" button.

**Admin PDF upload**: In the recipes panel, click "Editar" on any recipe → upload PDF at the bottom of the form. The PDF is stored as base64 in the `recipes.pdf_base64` column.

**Email flow**:
- `/api/orders/send-recipe` - POST endpoint for sending recipe emails
- `/api/orders/:id/items` - GET endpoint to see recipe details + PDF status per order
- `/api/recipes/:id/pdf` - PATCH/DELETE for admin to upload/remove PDF files

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Main storefront (React app) |
| `public/admin.html` | Admin dashboard (protected) |
| `functions/api/_middleware.js` | CORS + session attach on every API route |
| `functions/utils.js` | Session helpers (KV), cookie parser, `sendRecipeEmail()`, `validatePdfBase64()` |
| `functions/api/payments/create.js` | Creates MP preference + DB order |
| `functions/api/payments/webhook.js` | Receives MP payment notifications + triggers email |
| `functions/api/orders/send-recipe.js` | Sends recipe emails with PDF attachments |
| `functions/api/orders/:id/items.js` | Gets order items with PDF status |
| `functions/api/admin/recipes.js` | Admin: list all recipes (including unpublished) |
| `functions/api/recipes/:id/pdf.js` | Upload/remove PDF for a recipe |
| `migrations/003_recipe_pdf.sql` | D1: pdf_base64 + email_sent_at columns |
| `wrangler.toml` | Cloudflare config (DB/KV bindings, env vars) |

## Scope Notes

- `notas sobre pedido.md` — client wishlist
- `agusreyncakes (1).zip` — prior delivery (read-only reference)
- Images go in `public/uploads/` (client provides)
- No test suite — verify manually via `npm run dev` at `http://localhost:8788`
