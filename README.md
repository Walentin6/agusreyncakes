# Agus Reynoso — Recetas de Autora

Tienda de recetas digitales con carrito, pagos online, login con Google y panel de admin.

## Stack Tecnológico

- **Frontend:** React 18 (CDN) + HTML estático
- **Backend:** Cloudflare Pages Functions (serverless)
- **Base de datos:** Cloudflare D1 (SQLite)
- **Sesiones:** Cloudflare KV
- **Pagos:** Mercado Pago Checkout Pro
- **Auth:** Google OAuth 2.0
- **Email:** Cloudflare Email Routing (configurar cuando tengas dominio)
- **Hosting:** Cloudflare Pages

## Estructura del Proyecto

```
├── public/                    # Archivos estáticos (frontend)
│   ├── index.html            # Landing / tienda
│   ├── admin.html            # Panel de administración
│   ├── checkout/
│   │   ├── success.html      # Pago exitoso
│   │   ├── pending.html      # Pago pendiente
│   │   └── failure.html      # Pago fallido
│   └── uploads/              # Imágenes de recetas
├── functions/                 # Backend API (Cloudflare Pages Functions)
│   ├── api/
│   │   ├── auth/             # Google OAuth
│   │   │   ├── google.js     # Iniciar login
│   │   │   ├── callback.js   # Callback OAuth
│   │   │   ├── logout.js     # Cerrar sesión
│   │   │   └── me.js         # Usuario actual
│   │   ├── recipes/          # CRUD recetas
│   │   │   ├── index.js      # Listar / Crear
│   │   │   └── [id].js       # Ver / Editar / Eliminar
│   │   ├── cart/             # Carrito
│   │   │   └── index.js
│   │   ├── orders/           # Órdenes
│   │   │   ├── index.js
│   │   │   └── [id].js
│   │   ├── payments/         # Pagos
│   │   │   ├── create.js     # Crear preferencia MP
│   │   │   └── webhook.js    # Webhook MP
│   │   └── admin/            # Admin API
│   │       ├── stats.js      # Estadísticas
│   │       ├── orders.js     # Todos los pedidos
│   │       └── users.js      # Todos los usuarios
│   ├── utils.js              # Utilidades (auth, cookies, etc)
│   └── api/_middleware.js    # CORS + auth middleware
├── migrations/               # Migraciones D1
│   └── 001_initial.sql      # Schema inicial + recetas de ejemplo
├── package.json
└── wrangler.toml             # Configuración Cloudflare
```

## Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear base de datos D1 en Cloudflare

```bash
npx wrangler d1 create agusreyncakes_db
```

Copiar el `database_id` que te devuelve y pegarlo en `wrangler.toml`.

### 3. Crear KV Namespace para sesiones

```bash
npx wrangler kv:namespace create SESSIONS
```

Copiar el `id` y pegarlo en `wrangler.toml`.

### 4. Aplicar migraciones de base de datos

```bash
npx wrangler d1 migrations apply DB
```

### 5. Configurar variables de entorno

Las siguientes variables se configuran en el **Cloudflare Dashboard** (Pages > Settings > Environment Variables) o via Wrangler:

| Variable | Descripción | Dónde obtener |
|----------|-------------|---------------|
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google OAuth | Google Cloud Console |
| `MP_ACCESS_TOKEN` | Access Token de Mercado Pago | Dashboard de Mercado Pago |
| `MP_PUBLIC_KEY` | Public Key de Mercado Pago | Dashboard de Mercado Pago |
| `ADMIN_EMAIL` | Email del admin (opcional) | - |
| `SITE_URL` | URL del sitio | Tu dominio o pages.dev |

#### Google OAuth Setup

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un proyecto
3. Habilitar la API de Google+ o People API
4. Ir a "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Tipo: Web application
6. Authorized redirect URIs: `https://tu-dominio.com/api/auth/callback`
7. Copiar Client ID y Client Secret

#### Mercado Pago Setup

1. Ir al [Dashboard de Mercado Pago](https://www.mercadopago.com.ar/developers)
2. Crear una aplicación
3. Obtener Access Token y Public Key
4. Configurar webhooks: `https://tu-dominio.com/api/payments/webhook`

### 6. Desplegar

```bash
npm run deploy
```

O para desarrollo local:

```bash
npm run dev
```

## Flujo de Funcionalidades

### Carrito
- Los items se guardan en `localStorage` para visitantes
- Al iniciar sesión, el carrito se sincroniza con la base de datos
- El drawer del carrito se abre desde el navbar

### Login con Google
- Botón "Iniciar sesión" en el navbar
- Redirige a Google OAuth
- Al volver, se crea sesión en KV con cookie HttpOnly
- El primer usuario en registrarse se convierte automáticamente en admin

### Compra
1. Agregar recetas al carrito
2. Click en "Finalizar compra"
3. Si no está logueado, pide iniciar sesión
4. Se crea una orden en estado "pending"
5. Se crea una preferencia de pago en Mercado Pago
6. Redirige al checkout de Mercado Pago
7. El usuario paga
8. Mercado Pago envía webhook a nuestro backend
9. Se marca la orden como "paid"
10. Se envía email con las recetas (cuando esté configurado el dominio)

### Panel de Admin
- URL: `/admin`
- Accesible solo para usuarios con `is_admin = 1`
- Incluye:
  - Dashboard con métricas
  - CRUD de recetas (agregar, editar, eliminar)
  - Listado de pedidos con filtros
  - Listado de usuarios

## Configuración de Email (cuando tengas dominio)

1. Configurar Cloudflare Email Routing en el dashboard
2. Agregar `RESEND_API_KEY` como variable de entorno (opcional, si querés usar Resend)
3. Descomentar y configurar el envío de emails en `functions/api/payments/webhook.js`

## Notas Importantes

- **No modificar los hashes SRI** de los scripts CDN en `index.html` sin actualizarlos
- Las imágenes de recetas deben ir en `public/uploads/`
- El primer usuario que se registra se convierte en admin automáticamente
- En desarrollo local, OAuth de Google requiere que `localhost:8788` esté configurado como URI autorizado

## Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Desplegar a producción
npm run deploy

# Crear base de datos
npm run db:create

# Aplicar migraciones
npm run db:migrate

# Aplicar migraciones localmente
npm run db:migrate:local
```
