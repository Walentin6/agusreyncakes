# Agus Reynoso — Recetas de Autora

## Architecture

- **Frontend:** Static HTML in `public/` with React 18 + Babel CDN (no build step)
- **Backend:** Cloudflare Pages Functions in `functions/api/`
- **Database:** Cloudflare D1 (SQLite), migrations in `migrations/`
- **Sessions:** Cloudflare KV namespace `SESSIONS`
- **Storage:** Cloudflare R2 — `IMAGES` (recipe images), `PDF_BUCKET` (recipe PDFs stored as base64 text files at `recipe_pdfs/{id}.txt`)
- **Payments:** Mercado Pago Checkout Pro
- **Auth:** Google OAuth 2.0 + email/password with bcrypt
- **Email:** Resend API for recipe delivery

## Developer Commands

```bash
npm run dev          # Local dev (wrangler pages dev public --port 8788)
npm run deploy       # Deploy to Cloudflare Pages
npm run db:create    # Create D1 database
npm run db:migrate   # Apply migrations to Cloudflare D1
npm run db:migrate:local  # Apply migrations locally
```

No test suite — verify manually via `npm run dev` at `http://localhost:8788`.

## Critical Gotchas

- **Do not change CDN script URLs in HTML without updating SRI `integrity` hashes** — scripts won't load otherwise
- **Do not add Webpack/Vite/etc** — keep static HTML + inline JSX
- **Mercado Pago webhooks always return HTTP 200** — even on errors, to prevent MP retry storms (`functions/api/payments/webhook.js:57`)
- **First registered user gets `is_admin = 1`** automatically (`functions/api/auth/callback.js:88`)
- **Admin routes check `data.session.isAdmin`** — middleware attaches session to `context.data` (`functions/api/_middleware.js`)
- **API base URL is `''` (empty string)** — same-origin deployment assumed
- **Recipes use soft deletes** — `deleted_at IS NULL` filter on all recipe queries; trash restored via `/api/admin/trash`
- **PDF storage is R2-first** — `env.PDF_BUCKET.get(\`recipe_pdfs/${id}.txt\`)` is checked before falling back to D1 `pdf_base64` column (`functions/utils.js:213-226`)
- **Admin recipe list does NOT include `pdf_base64`** — uses `has_pdf` (0/1) to avoid transferring all PDF data
- **Email logic is in `functions/utils.js` → `sendRecipeEmail()`** — webhook and admin resend both use this shared function
- **Recipe PUT only updates `pdf_base64` if explicitly sent** — omitting the field preserves existing PDF
- **Videos are stored in R2 `IMAGES` bucket** (not a separate bucket), with key prefix `recipe_videos/{recipe_id}_{timestamp}.mp4`
- **Video streaming requires purchase verification** — `/api/recipes/{id}/video` checks `orders.status = 'paid'` before serving the R2 object
- **Video endpoint supports Range headers** (206 Partial Content) for browser seeking — parsed from `request.headers.get('Range')`
- **MP4 direct streaming = 1 R2 read per view** — 80 videos at ~40MB each fits within 10GB free tier; reads scale linearly with views
- **Max video upload size is 200MB** per file (admin endpoint); videos over 100MB may hit Pages Functions body limit in practice
- **Video keys are blocked from `/api/images/[key]`** — direct R2 access via images endpoint returns 403 for keys starting with `recipe_videos/`. Videos must be served through the protected `/api/recipes/:id/video` endpoint

## Setup (manual, not automated)

1. `wrangler d1 create agusreyncakes_db` → copy ID to `wrangler.toml`
2. `wrangler kv:namespace create SESSIONS` → copy ID to `wrangler.toml`
3. Create R2 buckets: `agusreyncakes-images` and `agusreyncakes-pdfs`
4. Set secrets via `wrangler secret put`:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Google OAuth)
   - `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` (Mercado Pago)
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (email with PDFs)
5. Apply migrations: `npm run db:migrate` (local: `npm run db:migrate:local`)
6. Configure Google OAuth redirect URI to match deployed domain
7. Configure Mercado Pago webhook URL to `/api/payments/webhook`

## Migrations (001–008)

| Migration | Purpose |
|-----------|---------|
| `001_initial.sql` | users, recipes, orders, order_items, carts + sample recipes |
| `002_password_auth.sql` | password_hash + password_salt on users table |
| `003_recipe_pdf.sql` | pdf_base64 on recipes, email_sent_at on orders |
| `004_recipe_images.sql` | images JSON column on recipes |
| `005_trash.sql` | deleted_at soft-delete on recipes |
| `006_combos.sql` | combos table + combo_items |
| `007_settings.sql` | settings table (key/value site config) |
| `008_categories.sql` | categories table |
| `009_videos.sql` | video_url column on recipes |

## Key Files

| File | Purpose |
|------|---------|
| `public/index.html` | Main storefront (React app) |
| `public/admin.html` | Admin dashboard (protected) |
| `functions/api/_middleware.js` | CORS preflight + session attach on every API route |
| `functions/utils.js` | Session helpers (KV), cookie parser, `sendRecipeEmail()`, `validatePdfBase64()` |
| `functions/utils/password.js` | bcrypt password hashing utilities |
| `functions/api/payments/create.js` | Creates MP preference + DB order |
| `functions/api/payments/webhook.js` | Receives MP payment notifications + triggers email |
| `functions/api/orders/send-recipe.js` | Manual recipe email resend (admin) |
| `functions/api/orders/:id/items.js` | Gets order items with PDF status |
| `functions/api/admin/recipes.js` | Admin: list all recipes (including unpublished, excludes deleted) |
| `functions/api/admin/trash.js` | Soft-delete management (list/restore/permanent delete) |
| `functions/api/admin/combos.js` | Admin combo CRUD |
| `functions/api/admin/settings.js` | Site settings CRUD |
| `functions/api/recipes/[id]/video.js` | Protected video streaming (GET) + admin upload (POST/DELETE) |
| `functions/api/auth/google.js` | Google OAuth initiate |
| `functions/api/auth/callback.js` | Google OAuth callback (first user → admin) |
| `functions/api/auth/login-email.js` | Email/password login |
| `functions/api/auth/register-email.js` | Email/password registration |
| `functions/api/auth/forgot-password.js` | Password reset request |
| `functions/api/auth/reset-password.js` | Password reset completion |
| `functions/api/recipes/[id]/images/` | Recipe image upload/manage (R2) |
| `functions/api/images/[key].js` | Serve images from R2 |
| `functions/api/combos/index.js` | Public combo listing |
| `functions/api/categories/index.js` | Category CRUD |
| `wrangler.toml` | Cloudflare config (D1/KV/R2 bindings, env vars) |

## PDF Recipe Delivery Flow

1. Mercado Pago webhook receives `payment.approved`
2. Order status updated to `paid`
3. System fetches purchased recipes — checks R2 `PDF_BUCKET` first, falls back to D1 `pdf_base64`
4. Sends HTML email with PDF attachments via Resend API (one per recipe)
5. Marks `email_sent_at` on the order

**Manual resend**: Admin orders panel → "Ver" → "Reenviar recetas" → calls `/api/orders/send-recipe`

## Scope Notes

- `notas sobre pedido.md` — client wishlist
- `agusreyncakes (1).zip` — prior delivery (read-only reference)
- Recipe images go in R2 `IMAGES` bucket (served via `/api/images/[key]`)
- `Agus Recetas.html` — standalone reference file (not part of app)
- `debug-test.js` — local debugging script (not part of app)
