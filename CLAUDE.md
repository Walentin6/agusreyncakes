# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                  # Local dev at http://localhost:8788 (wrangler pages dev)
npm run deploy               # Deploy to Cloudflare Pages
npm run db:migrate           # Apply D1 migrations to Cloudflare (remote)
npm run db:migrate:local     # Apply D1 migrations locally
```

No test suite — verify manually via `npm run dev`.

## Architecture

- **Frontend:** Static HTML in `public/` using React 18 + Babel via CDN (no build step, no Webpack/Vite)
- **Backend:** Cloudflare Pages Functions in `functions/api/` — each file exports `onRequest*` handlers
- **Database:** Cloudflare D1 (SQLite), bound as `env.DB`, migrations in `migrations/`
- **Sessions:** Cloudflare KV bound as `env.SESSIONS` — HttpOnly cookie `session_id` → JSON blob
- **Storage:** Cloudflare R2 — `env.IMAGES` (recipe images + videos), `env.PDF_BUCKET` (PDFs stored as base64 text at `recipe_pdfs/{id}.txt`)
- **Payments:** Mercado Pago Checkout Pro (`env.MP_ACCESS_TOKEN`)
- **Auth:** Google OAuth 2.0 + email/password (bcrypt via `functions/utils/password.js`)
- **Email:** Resend API (`env.RESEND_API_KEY`) for recipe PDF delivery

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Main storefront (React app) |
| `public/admin.html` | Admin dashboard (protected) |
| `functions/api/_middleware.js` | CORS preflight + attaches session to `context.data` on every API route |
| `functions/utils.js` | Session helpers, cookie parser, `sendRecipeEmail()`, `validatePdfBase64()` |
| `functions/utils/password.js` | bcrypt password hashing |
| `functions/api/payments/create.js` | Creates Mercado Pago preference + DB order |
| `functions/api/payments/webhook.js` | Receives MP payment notifications, triggers email delivery |
| `functions/api/orders/send-recipe.js` | Manual recipe email resend (admin) |
| `functions/api/admin/trash.js` | Soft-delete management (list/restore/permanent delete) |
| `functions/api/recipes/[id]/video.js` | Protected video streaming (GET) + admin upload (POST/DELETE) |
| `functions/api/auth/callback.js` | Google OAuth callback — first registered user gets `is_admin = 1` |

## Critical Gotchas

- **Do not change CDN script URLs in HTML without updating SRI `integrity` hashes** — scripts won't load otherwise
- **Mercado Pago webhook always returns HTTP 200** even on errors, to prevent MP retry storms (`functions/api/payments/webhook.js`)
- **First registered user gets `is_admin = 1` automatically** (`functions/api/auth/callback.js`)
- **Admin routes check `data.session.isAdmin`** — middleware attaches session to `context.data`
- **Recipes use soft deletes** — `deleted_at IS NULL` filter on all recipe queries; trash restored via `/api/admin/trash`
- **PDF storage is R2-first** — `env.PDF_BUCKET.get('recipe_pdfs/{id}.txt')` checked before falling back to D1 `pdf_base64` column
- **Admin recipe list does NOT include `pdf_base64`** — uses computed `has_pdf` (0/1) to avoid transferring all PDF data over the wire
- **Recipe PUT only updates `pdf_base64` if explicitly sent** — omitting the field preserves the existing PDF
- **Videos are stored in the `IMAGES` R2 bucket** (not a separate bucket), with key prefix `recipe_videos/{recipe_id}_{timestamp}.mp4`
- **Video streaming requires purchase verification** — endpoint checks `orders.status = 'paid'` before serving the R2 object; supports Range headers (206 Partial Content) for seeking
- **Video keys are blocked from `/api/images/[key]`** — keys starting with `recipe_videos/` return 403; videos must go through the protected `/api/recipes/:id/video` endpoint
- **Max video upload size is 200MB** per file (admin endpoint)
- **API base URL is `''` (empty string)** — same-origin deployment assumed throughout the frontend

## Database Schema Summary

| Migration | Purpose |
|-----------|---------|
| `001_initial.sql` | users, recipes, orders, order_items, carts |
| `002_password_auth.sql` | `password_hash` + `password_salt` on users |
| `003_recipe_pdf.sql` | `pdf_base64` on recipes, `email_sent_at` on orders |
| `004_recipe_images.sql` | `images` JSON column on recipes |
| `005_trash.sql` | `deleted_at` soft-delete on recipes |
| `006_combos.sql` | combos + combo_items tables |
| `007_settings.sql` | settings table (key/value site config) |
| `008_categories.sql` | categories table |
| `009_videos.sql` | `video_url` column on recipes |

## PDF Recipe Delivery Flow

1. Mercado Pago webhook receives `payment.approved`
2. Order status updated to `paid` in D1
3. `sendRecipeEmail()` (in `functions/utils.js`) fetches purchased recipes — checks R2 `PDF_BUCKET` first, falls back to D1 `pdf_base64`
4. Sends HTML email with PDF attachments via Resend API
5. Marks `email_sent_at` on the order

Manual resend: Admin orders panel → "Ver" → "Reenviar recetas" → `/api/orders/send-recipe`

## Scope Notes

- `notas sobre pedido.md` — client wishlist (not code)
- `Agus Recetas.html` — standalone reference file, not part of the app
- `debug-test.js` — local debugging script, not part of the app
- `agusreyncakes (1).zip` — prior delivery, read-only reference
