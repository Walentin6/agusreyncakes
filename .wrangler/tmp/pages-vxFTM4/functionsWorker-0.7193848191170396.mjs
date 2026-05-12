var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../.wrangler/tmp/bundle-T22kzB/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  "../.wrangler/tmp/bundle-T22kzB/checked-fetch.js"() {
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// ../.wrangler/tmp/bundle-T22kzB/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  "../.wrangler/tmp/bundle-T22kzB/strip-cf-connecting-ip-header.js"() {
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// utils.js
async function createSession(env, userId, email, name, picture, isAdmin) {
  const sessionId = crypto.randomUUID();
  const sessionData = JSON.stringify({
    userId,
    email,
    name,
    picture,
    isAdmin,
    createdAt: Date.now()
  });
  await env.SESSIONS.put(sessionId, sessionData, { expirationTtl: SESSION_TTL });
  return sessionId;
}
async function getSession(env, request) {
  const cookie = getCookie(request, COOKIE_NAME);
  if (!cookie)
    return null;
  const sessionData = await env.SESSIONS.get(cookie);
  if (!sessionData)
    return null;
  return JSON.parse(sessionData);
}
async function destroySession(env, request) {
  const cookie = getCookie(request, COOKIE_NAME);
  if (cookie) {
    await env.SESSIONS.delete(cookie);
  }
}
function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader)
    return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}
function setCookie(name, value, options = {}) {
  const defaults = {
    Path: "/",
    HttpOnly: true,
    Secure: true,
    SameSite: "Lax",
    MaxAge: SESSION_TTL
  };
  const opts = { ...defaults, ...options };
  let cookie = `${name}=${value}`;
  if (opts.rememberMe) {
    opts.MaxAge = REMEMBER_ME_TTL;
    delete opts.rememberMe;
  }
  for (const [key, val] of Object.entries(opts)) {
    if (val === true) {
      cookie += `; ${key}`;
    } else if (val !== false && val !== void 0) {
      cookie += `; ${key}=${val}`;
    }
  }
  return cookie;
}
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true"
    }
  });
}
function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400"
    }
  });
}
function validatePdfBase64(base64, hasR2 = false) {
  if (!base64)
    return { valid: false, error: "pdf_base64 es requerido" };
  let clean = base64;
  if (clean.startsWith("data:")) {
    clean = clean.replace(/^data:[^;]+;base64,/, "");
  }
  const limit = hasR2 ? MAX_PDF_SIZE_R2 : MAX_PDF_SIZE_BASE64;
  if (clean.length > limit) {
    return { valid: false, error: `El PDF supera el l\xEDmite de tama\xF1o (m\xE1ximo ~${Math.round(limit * 0.75 / 1024 / 1024)}MB originales). Consider\xE1 comprimir el PDF.`, clean };
  }
  return { valid: true, clean };
}
function buildRecipeEmailHtml(order, recipesWithPdf, recipesWithoutPdf) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Georgia, serif; background: #FAF5EF; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; }
    .brand { font-family: Georgia, serif; font-style: italic; font-size: 32px; color: #3D2E2A; }
    .brand span { color: #C97B7B; }
    h1 { font-family: Georgia, serif; font-weight: 300; font-size: 28px; color: #3D2E2A; margin: 0 0 8px; }
    p { color: #6B5953; line-height: 1.6; }
    .recipes { margin: 28px 0; }
    .recipe-item { padding: 16px; background: #FAF5EF; border-radius: 8px; margin-bottom: 12px; }
    .recipe-item .name { font-size: 16px; font-weight: 600; color: #3D2E2A; }
    .recipe-item .pdf-badge { display: inline-block; margin-top: 6px; font-size: 11px; color: #2E7D32; background: #E8F5E9; padding: 3px 8px; border-radius: 4px; }
    .warning { background: #FFF3E0; padding: 14px; border-radius: 8px; color: #EF6C00; font-size: 13px; margin-top: 16px; }
    .footer { text-align: center; margin-top: 32px; color: #9A8880; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">agustina<span>.</span></div>
    </div>
    <h1>\xA1Gracias por tu compra! \u273F</h1>
    <p>Hola ${order.user_name || "all\xED"},</p>
    <p>Tu pedido #${order.id} fue confirmado. Encontr\xE1s tus recetas adjuntas en este email.</p>

    ${recipesWithPdf.length > 0 ? `
    <div class="recipes">
      <p style="font-weight: 600; color: #3D2E2A; margin-bottom: 12px;">Recetas adjuntas (PDF):</p>
      ${recipesWithPdf.map((item) => `
        <div class="recipe-item">
          <div class="name">\u{1F4C4} ${item.recipe_title || "Receta"}</div>
          <div class="pdf-badge">\u2713 PDF adjunto en este email</div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    ${recipesWithoutPdf.length > 0 ? `
    <div class="warning">
      \u26A0\uFE0F Las siguientes recetas no tienen PDF adjunto. Contact\xE1 a Agustina para recibir tu receta.
      <br/><strong>${recipesWithoutPdf.join(", ")}</strong>
    </div>
    ` : ""}

    <p style="margin-top: 24px;">\xBFDudas? Respond\xE9 este email o escribile a @agustina.reynoso en Instagram \u273F</p>

    <div class="footer">
      agustina reynoso \xB7 recetas de autora<br/>
      Hecho con harina & amor en Justiniano Posse
    </div>
  </div>
</body>
</html>
  `.trim();
}
async function sendRecipeEmail(env, orderId) {
  const order = await env.DB.prepare(
    "SELECT o.*, u.email as user_email, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = ?"
  ).bind(orderId).first();
  if (!order || !order.user_email) {
    return { sent: false, error: "Sin email para el pedido" };
  }
  const orderItems = await env.DB.prepare(
    `SELECT oi.*, r.pdf_base64, r.title as recipe_title
     FROM order_items oi
     LEFT JOIN recipes r ON oi.recipe_id = r.id
     WHERE oi.order_id = ?`
  ).bind(orderId).all();
  const items = orderItems.results || [];
  const attachments = [];
  const recipesWithPdf = [];
  const recipesWithoutPdf = [];
  for (const i of items) {
    let pdfData = null;
    if (env.PDF_BUCKET) {
      try {
        const r2Object = await env.PDF_BUCKET.get(`recipe_pdfs/${i.recipe_id}.txt`);
        if (r2Object) {
          pdfData = await r2Object.text();
        }
      } catch (err) {
        console.error(`[SEND-RECIPE] Error fetching PDF for recipe ${i.recipe_id} from R2:`, err);
      }
    }
    if (!pdfData && i.pdf_base64 && i.pdf_base64 !== "R2_STORED") {
      pdfData = i.pdf_base64;
    }
    if (pdfData) {
      recipesWithPdf.push(i);
      attachments.push({
        filename: `${(i.recipe_title || "receta").replace(/[^a-zA-Z0-9._-]/g, "_")}.pdf`,
        content: pdfData,
        content_type: "application/pdf",
        contentType: "application/pdf"
      });
    } else {
      recipesWithoutPdf.push(i.recipe_title || "Receta");
    }
  }
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return { sent: false, error: "RESEND_API_KEY no configurada" };
  }
  const fromEmail = env.RESEND_FROM_EMAIL || "Agustina Reynoso <noreply@agusreyncakes.com>";
  const htmlBody = buildRecipeEmailHtml(order, recipesWithPdf, recipesWithoutPdf);
  const payload = {
    from: fromEmail,
    to: [order.user_email],
    subject: `Tu pedido #${order.id} est\xE1 listo \u273F agustina reynoso`,
    html: htmlBody,
    ...attachments.length > 0 ? { attachments } : {}
  };
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const emailResult = await emailRes.json().catch(() => ({}));
  if (!emailRes.ok) {
    console.error("[SEND-RECIPE] Resend error:", emailResult);
    return { sent: false, error: emailResult.message || "Error al enviar email" };
  }
  await env.DB.prepare(
    "UPDATE orders SET email_sent_at = ? WHERE id = ?"
  ).bind((/* @__PURE__ */ new Date()).toISOString(), orderId).run();
  console.log(`[SEND-RECIPE] Email sent for order ${orderId} to ${order.user_email}, attachments: ${attachments.length}`);
  return { sent: true, messageId: emailResult.id, attachmentsSent: attachments.length, recipesWithoutPdf: recipesWithoutPdf.length };
}
var COOKIE_NAME, SESSION_TTL, REMEMBER_ME_TTL, MAX_PDF_SIZE_BASE64, MAX_PDF_SIZE_R2;
var init_utils = __esm({
  "utils.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    COOKIE_NAME = "session_id";
    SESSION_TTL = 60 * 60 * 24 * 7;
    REMEMBER_ME_TTL = 60 * 60 * 24 * 30;
    __name(createSession, "createSession");
    __name(getSession, "getSession");
    __name(destroySession, "destroySession");
    __name(getCookie, "getCookie");
    __name(setCookie, "setCookie");
    __name(jsonResponse, "jsonResponse");
    __name(corsPreflight, "corsPreflight");
    MAX_PDF_SIZE_BASE64 = 9e5;
    MAX_PDF_SIZE_R2 = 25 * 1024 * 1024;
    __name(validatePdfBase64, "validatePdfBase64");
    __name(buildRecipeEmailHtml, "buildRecipeEmailHtml");
    __name(sendRecipeEmail, "sendRecipeEmail");
  }
});

// api/recipes/[id]/images/[index].js
async function onRequestDelete(context) {
  const { env, data, params } = context;
  const id = params.id;
  const index = parseInt(params.index);
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  if (isNaN(index) || index < 0) {
    return jsonResponse({ error: "\xCDndice inv\xE1lido" }, 400);
  }
  try {
    const recipe = await env.DB.prepare("SELECT images FROM recipes WHERE id = ?").bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: "Receta no encontrada" }, 404);
    }
    const images = (() => {
      try {
        return JSON.parse(recipe.images || "[]");
      } catch {
        return [];
      }
    })();
    if (index >= images.length) {
      return jsonResponse({ error: "\xCDndice fuera de rango" }, 400);
    }
    const deletedUrl = images[index];
    const updatedImages = images.filter((_, i) => i !== index);
    const filename = deletedUrl.split("/images/")[1];
    if (filename) {
      try {
        await env.IMAGES.delete(filename);
      } catch (e) {
        console.warn("[RECIPE-IMAGES-DELETE] Could not delete from R2:", e.message);
      }
    }
    await env.DB.prepare("UPDATE recipes SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(JSON.stringify(updatedImages), id).run();
    return jsonResponse({ success: true, images: updatedImages });
  } catch (err) {
    console.error("[RECIPE-IMAGES-DELETE] Error:", err);
    return jsonResponse({ error: "Error al eliminar imagen" }, 500);
  }
}
var init_index = __esm({
  "api/recipes/[id]/images/[index].js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestDelete, "onRequestDelete");
  }
});

// api/orders/[id]/items.js
async function onRequestGet(context) {
  const { env, data, params } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const orderId = params.id;
    const items = await env.DB.prepare(
      `SELECT oi.id, oi.order_id, oi.recipe_id, oi.recipe_title, oi.price,
              r.title as recipe_title,
              CASE WHEN r.pdf_base64 IS NOT NULL THEN 1 ELSE 0 END as has_pdf
       FROM order_items oi
       LEFT JOIN recipes r ON oi.recipe_id = r.id
       WHERE oi.order_id = ?`
    ).bind(orderId).all();
    return jsonResponse({ items: items.results || [] });
  } catch (err) {
    console.error("Error fetching order items:", err);
    return jsonResponse({ error: "Failed to fetch order items" }, 500);
  }
}
var init_items = __esm({
  "api/orders/[id]/items.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet, "onRequestGet");
  }
});

// api/recipes/[id]/images/index.js
async function onRequestPost(context) {
  const { env, data, params, request } = context;
  const id = params.id;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!file || !(file instanceof File)) {
      return jsonResponse({ error: "No se encontr\xF3 archivo en el request" }, 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonResponse({ error: `Tipo de archivo no permitido. Us\xE1: JPG, PNG, WEBP, MP4 o WEBM` }, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return jsonResponse({ error: `El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). M\xE1ximo: 25MB.` }, 400);
    }
    const recipe = await env.DB.prepare("SELECT images FROM recipes WHERE id = ?").bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: "Receta no encontrada" }, 404);
    }
    const currentImages = (() => {
      try {
        return JSON.parse(recipe.images || "[]");
      } catch {
        return [];
      }
    })();
    if (currentImages.length >= MAX_IMAGES) {
      return jsonResponse({ error: `M\xE1ximo ${MAX_IMAGES} im\xE1genes por receta. Elimin\xE1 una antes de agregar otra.` }, 400);
    }
    const ext = file.name.split(".").pop() || "jpg";
    const key = `r${id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000"
      }
    });
    const baseUrl = env.SITE_URL || "https://agusreyncakes.com";
    const imageUrl = `${baseUrl}/api/images/${key}`;
    const updatedImages = [...currentImages, imageUrl];
    await env.DB.prepare("UPDATE recipes SET images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(JSON.stringify(updatedImages), id).run();
    return jsonResponse({ success: true, url: imageUrl, images: updatedImages });
  } catch (err) {
    console.error("[RECIPE-IMAGES] Error:", err);
    return jsonResponse({ error: "Error al subir imagen: " + err.message }, 500);
  }
}
async function onRequestGet2(context) {
  const { env, params } = context;
  const id = params.id;
  try {
    const recipe = await env.DB.prepare("SELECT images FROM recipes WHERE id = ?").bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: "Receta no encontrada" }, 404);
    }
    const images = (() => {
      try {
        return JSON.parse(recipe.images || "[]");
      } catch {
        return [];
      }
    })();
    return jsonResponse({ images });
  } catch (err) {
    console.error("[RECIPE-IMAGES] Error:", err);
    return jsonResponse({ error: "Error al obtener im\xE1genes" }, 500);
  }
}
var MAX_IMAGES, MAX_FILE_SIZE, ALLOWED_TYPES;
var init_images = __esm({
  "api/recipes/[id]/images/index.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    MAX_IMAGES = 5;
    MAX_FILE_SIZE = 25 * 1024 * 1024;
    ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
      "video/quicktime"
    ];
    __name(onRequestPost, "onRequestPost");
    __name(onRequestGet2, "onRequestGet");
  }
});

// api/admin/orders.js
async function onRequestGet3(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const url = new URL(context.request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    let query = `
      SELECT o.*, u.name as user_name, u.email as user_email,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    let bindings = [];
    if (status) {
      query += " WHERE o.status = ?";
      bindings.push(status);
    }
    query += " GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?";
    bindings.push(limit, offset);
    const orders = await env.DB.prepare(query).bind(...bindings).all();
    return jsonResponse({ orders: orders.results || [] });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return jsonResponse({ error: "Failed to fetch orders" }, 500);
  }
}
var init_orders = __esm({
  "api/admin/orders.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet3, "onRequestGet");
  }
});

// api/admin/recipes.js
async function onRequestGet4(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const recipes = await env.DB.prepare(
      `SELECT id, title, category, tag, time, level, price, description, content,
              image_url, label, photo_tone, published, images, created_at, updated_at,
              CASE WHEN pdf_base64 IS NOT NULL THEN 1 ELSE 0 END as has_pdf,
              CASE WHEN images IS NOT NULL AND images != '[]' AND images != '' THEN json_array_length(images) ELSE 0 END as images_count
       FROM recipes WHERE deleted_at IS NULL ORDER BY created_at DESC`
    ).all();
    const results = (recipes.results || []).map((r) => {
      if (r.content) {
        try {
          r.content = JSON.parse(r.content);
        } catch (e) {
          r.content = {};
        }
      }
      if (r.images) {
        try {
          r.images = JSON.parse(r.images);
        } catch (e) {
          r.images = [];
        }
      }
      return r;
    });
    return jsonResponse({ recipes: results });
  } catch (err) {
    console.error("Error fetching admin recipes:", err);
    return jsonResponse({ error: "Failed to fetch recipes" }, 500);
  }
}
var init_recipes = __esm({
  "api/admin/recipes.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet4, "onRequestGet");
  }
});

// api/admin/stats.js
async function onRequestGet5(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const recipesCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM recipes WHERE deleted_at IS NULL"
    ).first();
    const trashCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM recipes WHERE deleted_at IS NOT NULL"
    ).first();
    const usersCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM users"
    ).first();
    const ordersCount = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM orders"
    ).first();
    const revenue = await env.DB.prepare(
      'SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status = "paid"'
    ).first();
    const recentOrders = await env.DB.prepare(
      `SELECT o.*, u.name as user_name, u.email as user_email,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    ).all();
    const ordersByStatus = await env.DB.prepare(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    ).all();
    return jsonResponse({
      stats: {
        recipes: recipesCount.count,
        trash: trashCount.count,
        users: usersCount.count,
        orders: ordersCount.count,
        revenue: revenue.total
      },
      recentOrders: recentOrders.results || [],
      ordersByStatus: ordersByStatus.results || []
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return jsonResponse({ error: "Failed to fetch stats" }, 500);
  }
}
var init_stats = __esm({
  "api/admin/stats.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet5, "onRequestGet");
  }
});

// api/admin/trash.js
async function onRequestGet6(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const recipes = await env.DB.prepare(
      `SELECT id, title, category, tag, time, level, price, description, content,
              image_url, label, photo_tone, published, images, created_at, updated_at, deleted_at,
              CASE WHEN pdf_base64 IS NOT NULL THEN 1 ELSE 0 END as has_pdf,
              CASE WHEN images IS NOT NULL AND images != '[]' AND images != '' THEN json_array_length(images) ELSE 0 END as images_count
       FROM recipes WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`
    ).all();
    const results = (recipes.results || []).map((r) => {
      if (r.content) {
        try {
          r.content = JSON.parse(r.content);
        } catch {
          r.content = {};
        }
      }
      if (r.images) {
        try {
          r.images = JSON.parse(r.images);
        } catch {
          r.images = [];
        }
      }
      return r;
    });
    return jsonResponse({ recipes: results });
  } catch (err) {
    console.error("Error fetching trashed recipes:", err);
    return jsonResponse({ error: "Failed to fetch trashed recipes" }, 500);
  }
}
var init_trash = __esm({
  "api/admin/trash.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet6, "onRequestGet");
  }
});

// api/admin/users.js
async function onRequestGet7(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    const users = await env.DB.prepare(
      `SELECT id, email, name, picture, is_admin, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();
    return jsonResponse({ users: users.results || [] });
  } catch (err) {
    console.error("Error fetching admin users:", err);
    return jsonResponse({ error: "Failed to fetch users" }, 500);
  }
}
var init_users = __esm({
  "api/admin/users.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet7, "onRequestGet");
  }
});

// api/auth/callback.js
async function onRequestGet8(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    return Response.redirect(`${env.SITE_URL}/?error=${error}`, 302);
  }
  if (!code || !state) {
    return Response.redirect(`${env.SITE_URL}/?error=invalid_request`, 302);
  }
  const stateValid = await env.SESSIONS.get(`oauth_state:${state}`);
  if (!stateValid) {
    return Response.redirect(`${env.SITE_URL}/?error=invalid_state`, 302);
  }
  await env.SESSIONS.delete(`oauth_state:${state}`);
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${env.SITE_URL}/api/auth/callback`;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return Response.redirect(`${env.SITE_URL}/?error=token_exchange_failed`, 302);
    }
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    if (!userResponse.ok || !userData.email) {
      console.error("User info fetch failed:", userData);
      return Response.redirect(`${env.SITE_URL}/?error=user_info_failed`, 302);
    }
    const existingUser = await env.DB.prepare(
      "SELECT id, is_admin FROM users WHERE email = ?"
    ).bind(userData.email).first();
    let userId;
    let isAdmin = 0;
    if (existingUser) {
      userId = existingUser.id;
      isAdmin = existingUser.is_admin;
      await env.DB.prepare(
        "UPDATE users SET google_id = ?, picture = ?, name = ? WHERE id = ?"
      ).bind(userData.id, userData.picture, userData.name, userId).run();
    } else {
      const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
      isAdmin = userCount.count === 0 ? 1 : 0;
      const result = await env.DB.prepare(
        "INSERT INTO users (email, name, picture, google_id, is_admin) VALUES (?, ?, ?, ?, ?)"
      ).bind(userData.email, userData.name, userData.picture, userData.id, isAdmin).run();
      userId = result.meta.last_row_id;
    }
    const sessionId = await createSession(env, userId, userData.email, userData.name, userData.picture, isAdmin);
    const headers = new Headers();
    headers.append("Set-Cookie", setCookie("session_id", sessionId));
    headers.append("Location", `${env.SITE_URL}/`);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("OAuth callback error:", err);
    return Response.redirect(`${env.SITE_URL}/?error=auth_failed`, 302);
  }
}
var init_callback = __esm({
  "api/auth/callback.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet8, "onRequestGet");
  }
});

// api/auth/forgot-password.js
async function onRequestPost2(context) {
  const { env, request } = context;
  try {
    const { email } = await request.json();
    if (!email) {
      return jsonResponse({ error: "Email es requerido" }, 400);
    }
    const user = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ? AND password_hash IS NOT NULL"
    ).bind(email.toLowerCase().trim()).first();
    if (!user) {
      return jsonResponse({ received: true });
    }
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1e3).toISOString();
    await env.DB.prepare(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)"
    ).bind(user.id, token, expiresAt).run();
    const resetUrl = `${env.SITE_URL}/reset-password.html?token=${token}`;
    console.log(`[PASSWORD RESET] Token generated for ${email}`);
    console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);
    console.log(`[PASSWORD RESET] Token expires at: ${expiresAt}`);
    return jsonResponse({ received: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return jsonResponse({ received: true });
  }
}
var init_forgot_password = __esm({
  "api/auth/forgot-password.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestPost2, "onRequestPost");
  }
});

// api/auth/google.js
async function onRequestGet9(context) {
  const { env } = context;
  const clientId = env.GOOGLE_CLIENT_ID;
  const redirectUri = `${env.SITE_URL}/api/auth/callback`;
  const state = crypto.randomUUID();
  await env.SESSIONS.put(`oauth_state:${state}`, "1", { expirationTtl: 300 });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent"
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return Response.redirect(authUrl, 302);
}
var init_google = __esm({
  "api/auth/google.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet9, "onRequestGet");
  }
});

// ../node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "../node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt4 = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return __require("crypto")["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      __name(random, "random");
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt4.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt4.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt4.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt4.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt4.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt4.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt4.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt4.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      __name(safeStringCompare, "safeStringCompare");
      bcrypt4.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt4.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt4.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, false));
            return;
          }
          bcrypt4.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        __name(_async, "_async");
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt4.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt4.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length)
            return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      __name(stringToBytes, "stringToBytes");
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off < len) {
          c1 = b[off++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      __name(base64_encode, "base64_encode");
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off < slen - 1 && olen < len) {
          code = s.charCodeAt(off++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      __name(base64_decode, "base64_decode");
      var utfx = function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = /* @__PURE__ */ __name(function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          }, "fail");
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else
              throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null)
            dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = /* @__PURE__ */ __name(function() {
              return null;
            }, "src");
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      }();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
      }
      __name(_encipher, "_encipher");
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      __name(_streamtoword, "_streamtoword");
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_key, "_key");
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      __name(_ekskey, "_ekskey");
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick(next);
        }
        __name(next, "next");
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      __name(_crypt, "_crypt");
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        __name(finish, "finish");
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      __name(_hash, "_hash");
      bcrypt4.encodeBase64 = base64_encode;
      bcrypt4.decodeBase64 = base64_decode;
      return bcrypt4;
    });
  }
});

// api/auth/login-email.js
async function onRequestPost3(context) {
  const { env, request } = context;
  try {
    const { email, password, rememberMe } = await request.json();
    if (!email || !password) {
      return jsonResponse({ error: "Email y contrase\xF1a son requeridos" }, 400);
    }
    const user = await env.DB.prepare(
      "SELECT id, email, name, picture, password_hash, is_admin FROM users WHERE email = ?"
    ).bind(email.toLowerCase().trim()).first();
    if (!user) {
      return jsonResponse({ error: "Credenciales inv\xE1lidas" }, 401);
    }
    if (!user.password_hash) {
      return jsonResponse({ error: "Esta cuenta no tiene contrase\xF1a. Inici\xE1 sesi\xF3n con Google." }, 401);
    }
    const passwordValid = import_bcryptjs.default.compareSync(password, user.password_hash);
    if (!passwordValid) {
      return jsonResponse({ error: "Credenciales inv\xE1lidas" }, 401);
    }
    const sessionId = await createSession(env, user.id, user.email, user.name || user.email, user.picture, user.is_admin);
    const headers = new Headers();
    headers.append("Set-Cookie", setCookie("session_id", sessionId, { rememberMe: !!rememberMe }));
    headers.append("Content-Type", "application/json");
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Login error:", err);
    return jsonResponse({ error: "Error al iniciar sesi\xF3n" }, 500);
  }
}
var import_bcryptjs;
var init_login_email = __esm({
  "api/auth/login-email.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    import_bcryptjs = __toESM(require_bcrypt());
    __name(onRequestPost3, "onRequestPost");
  }
});

// api/auth/logout.js
async function onRequestPost4(context) {
  const { env, request } = context;
  await destroySession(env, request);
  const headers = new Headers();
  headers.append("Set-Cookie", setCookie("session_id", "", { MaxAge: 0 }));
  headers.append("Content-Type", "application/json");
  return new Response(JSON.stringify({ success: true }), { headers });
}
async function onRequestGet10(context) {
  return onRequestPost4(context);
}
var init_logout = __esm({
  "api/auth/logout.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestPost4, "onRequestPost");
    __name(onRequestGet10, "onRequestGet");
  }
});

// api/auth/me.js
async function onRequestGet11(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ user: null }, 401);
  }
  try {
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT oi.recipe_id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.status = 'paid'
    `).bind(data.session.userId).all();
    const purchasedRecipeIds = results.map((row) => row.recipe_id);
    return jsonResponse({
      user: {
        id: data.session.userId,
        email: data.session.email,
        name: data.session.name,
        picture: data.session.picture,
        isAdmin: data.session.isAdmin === 1 || data.session.isAdmin === true,
        purchasedRecipes: purchasedRecipeIds
      }
    });
  } catch (err) {
    console.error("Error fetching user data:", err);
    return jsonResponse({ error: "Failed to fetch user data" }, 500);
  }
}
var init_me = __esm({
  "api/auth/me.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet11, "onRequestGet");
  }
});

// api/auth/register-email.js
async function onRequestPost5(context) {
  const { env, request } = context;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonResponse({ error: "Email y contrase\xF1a son requeridos" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "La contrase\xF1a debe tener al menos 8 caracteres" }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonResponse({ error: "Email inv\xE1lido" }, 400);
    }
    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email.toLowerCase().trim()).first();
    if (existingUser) {
      return jsonResponse({ error: "Ya existe una cuenta con este email" }, 409);
    }
    const passwordHash = import_bcryptjs2.default.hashSync(password, BCRYPT_ROUNDS);
    const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const isAdmin = userCount.count === 0 ? 1 : 0;
    const result = await env.DB.prepare(
      "INSERT INTO users (email, name, password_hash, is_admin) VALUES (?, ?, ?, ?)"
    ).bind(email.toLowerCase().trim(), email.split("@")[0], passwordHash, isAdmin).run();
    const userId = result.meta.last_row_id;
    const sessionId = await createSession(env, userId, email, email.split("@")[0], null, isAdmin);
    const headers = new Headers();
    headers.append("Set-Cookie", setCookie("session_id", sessionId));
    headers.append("Content-Type", "application/json");
    return new Response(JSON.stringify({ success: true, userId }), { status: 201, headers });
  } catch (err) {
    console.error("Register error:", err);
    console.error("Register error stack:", err.stack);
    return jsonResponse({ error: "Error al crear la cuenta", details: err.message }, 500);
  }
}
var import_bcryptjs2, BCRYPT_ROUNDS;
var init_register_email = __esm({
  "api/auth/register-email.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    import_bcryptjs2 = __toESM(require_bcrypt());
    BCRYPT_ROUNDS = 10;
    __name(onRequestPost5, "onRequestPost");
  }
});

// api/auth/reset-password.js
async function onRequestPost6(context) {
  const { env, request } = context;
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return jsonResponse({ error: "Token y nueva contrase\xF1a son requeridos" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "La contrase\xF1a debe tener al menos 8 caracteres" }, 400);
    }
    const resetEntry = await env.DB.prepare(
      "SELECT id, user_id FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?"
    ).bind(token, (/* @__PURE__ */ new Date()).toISOString()).first();
    if (!resetEntry) {
      return jsonResponse({ error: "Token inv\xE1lido o expirado" }, 400);
    }
    const passwordHash = import_bcryptjs3.default.hashSync(password, BCRYPT_ROUNDS2);
    await env.DB.prepare(
      "UPDATE users SET password_hash = ? WHERE id = ?"
    ).bind(passwordHash, resetEntry.user_id).run();
    await env.DB.prepare(
      "UPDATE password_reset_tokens SET used = 1 WHERE id = ?"
    ).bind(resetEntry.id).run();
    console.log(`[PASSWORD RESET] Password updated for user ${resetEntry.user_id}`);
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return jsonResponse({ error: "Error al resetear la contrase\xF1a" }, 500);
  }
}
var import_bcryptjs3, BCRYPT_ROUNDS2;
var init_reset_password = __esm({
  "api/auth/reset-password.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    import_bcryptjs3 = __toESM(require_bcrypt());
    BCRYPT_ROUNDS2 = 10;
    __name(onRequestPost6, "onRequestPost");
  }
});

// api/orders/send-recipe.js
async function onRequestPost7(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const body = await context.request.json();
    const orderId = body.orderId;
    if (!orderId) {
      return jsonResponse({ error: "orderId es requerido" }, 400);
    }
    const result = await sendRecipeEmail(env, orderId);
    if (!result.sent) {
      return jsonResponse({ error: result.error }, 400);
    }
    return jsonResponse(result);
  } catch (err) {
    console.error("[SEND-RECIPE] Error:", err);
    return jsonResponse({ error: "Error al procesar: " + err.message }, 500);
  }
}
var init_send_recipe = __esm({
  "api/orders/send-recipe.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestPost7, "onRequestPost");
  }
});

// api/payments/create.js
async function onRequestPost8(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const body = await context.request.json();
    const items = body.items || [];
    if (items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }
    const { results } = await env.DB.prepare(`
      SELECT DISTINCT oi.recipe_id 
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.user_id = ? AND o.status = 'paid'
    `).bind(data.session.userId).all();
    const purchasedIds = results.map((r) => Number(r.recipe_id));
    const alreadyPurchased = items.filter((item) => purchasedIds.includes(Number(item.id)));
    if (alreadyPurchased.length > 0) {
      return jsonResponse({
        error: "Ya compraste algunas de estas recetas",
        alreadyPurchased: alreadyPurchased.map((i) => i.id)
      }, 400);
    }
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const orderResult = await env.DB.prepare(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)"
    ).bind(data.session.userId, total, "pending").run();
    const orderId = orderResult.meta.last_row_id;
    for (const item of items) {
      await env.DB.prepare(
        "INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)"
      ).bind(orderId, item.id, item.title, item.price).run();
    }
    const mpItems = items.map((item) => ({
      title: item.title,
      description: `Receta: ${item.title}`,
      quantity: item.quantity || 1,
      currency_id: "ARS",
      unit_price: item.price
    }));
    const preferenceData = {
      items: mpItems,
      payer: {
        email: data.session.email,
        name: data.session.name
      },
      external_reference: String(orderId),
      back_urls: {
        success: `${env.SITE_URL}/checkout/success`,
        failure: `${env.SITE_URL}/checkout/failure`,
        pending: `${env.SITE_URL}/checkout/pending`
      },
      auto_return: "approved",
      notification_url: `${env.SITE_URL}/api/payments/webhook`
    };
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preferenceData)
    });
    const mpData = await mpResponse.json();
    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpData);
      return jsonResponse({ error: "Payment provider error" }, 500);
    }
    await env.DB.prepare(
      "UPDATE orders SET preference_id = ? WHERE id = ?"
    ).bind(mpData.id, orderId).run();
    await env.DB.prepare(
      "DELETE FROM carts WHERE user_id = ?"
    ).bind(data.session.userId).run();
    return jsonResponse({
      orderId,
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
      // URL para redirigir al usuario
      sandboxInitPoint: mpData.sandbox_init_point
    });
  } catch (err) {
    console.error("Error creating payment:", err);
    return jsonResponse({ error: "Failed to create payment" }, 500);
  }
}
var init_create = __esm({
  "api/payments/create.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestPost8, "onRequestPost");
  }
});

// api/payments/webhook.js
async function onRequestPost9(context) {
  const { env, request } = context;
  try {
    const body = await request.json();
    if (body.type === "payment" || body.topic === "payment") {
      const paymentId = body.data?.id || body.id;
      if (!paymentId) {
        return jsonResponse({ received: true });
      }
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}`
        }
      });
      const paymentData = await mpResponse.json();
      if (!mpResponse.ok) {
        console.error("MP verification failed:", paymentData);
        return jsonResponse({ error: "Verification failed" }, 500);
      }
      const orderId = paymentData.external_reference;
      const status = paymentData.status;
      if (orderId) {
        let orderStatus = "pending";
        if (status === "approved")
          orderStatus = "paid";
        else if (status === "rejected" || status === "cancelled")
          orderStatus = "failed";
        await env.DB.prepare(
          "UPDATE orders SET status = ?, payment_id = ?, paid_at = ? WHERE id = ?"
        ).bind(
          orderStatus,
          String(paymentId),
          status === "approved" ? (/* @__PURE__ */ new Date()).toISOString() : null,
          orderId
        ).run();
        if (status === "approved") {
          await sendRecipeEmail(env, orderId);
        }
      }
    }
    return jsonResponse({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return jsonResponse({ received: true });
  }
}
async function onRequestGet12(context) {
  return jsonResponse({ status: "ok" });
}
var init_webhook = __esm({
  "api/payments/webhook.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestPost9, "onRequestPost");
    __name(onRequestGet12, "onRequestGet");
  }
});

// api/images/[key].js
async function onRequestGet13(context) {
  const { env, params } = context;
  const key = params.key;
  if (!key) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const object = await env.IMAGES.get(key);
    if (!object) {
      return new Response("Image not found", { status: 404 });
    }
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("ETag", object.httpEtag);
    const contentType = object.httpMetadata?.contentType;
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    return new Response(object.body, { headers });
  } catch (err) {
    console.error("[IMAGES] Error serving image:", err);
    return new Response("Error loading image", { status: 500 });
  }
}
var init_key = __esm({
  "api/images/[key].js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    __name(onRequestGet13, "onRequestGet");
  }
});

// api/orders/[id].js
async function onRequestGet14(context) {
  const { env, data } = context;
  const id = context.params.id;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const order = await env.DB.prepare(
      "SELECT * FROM orders WHERE id = ? AND user_id = ?"
    ).bind(id, data.session.userId).first();
    if (!order) {
      return jsonResponse({ error: "Order not found" }, 404);
    }
    const items = await env.DB.prepare(
      "SELECT * FROM order_items WHERE order_id = ?"
    ).bind(id).all();
    return jsonResponse({
      order: {
        ...order,
        items: items.results || []
      }
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    return jsonResponse({ error: "Failed to fetch order" }, 500);
  }
}
var init_id = __esm({
  "api/orders/[id].js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet14, "onRequestGet");
  }
});

// api/recipes/[id].js
async function onRequestGet15(context) {
  const { env } = context;
  const id = context.params.id;
  try {
    const recipe = await env.DB.prepare(
      "SELECT * FROM recipes WHERE id = ? AND published = 1 AND deleted_at IS NULL"
    ).bind(id).first();
    if (!recipe) {
      return jsonResponse({ error: "Recipe not found" }, 404);
    }
    if (recipe.content) {
      try {
        recipe.content = JSON.parse(recipe.content);
      } catch (e) {
        recipe.content = {};
      }
    }
    if (recipe.images) {
      try {
        recipe.images = JSON.parse(recipe.images);
      } catch (e) {
        recipe.images = [];
      }
    } else {
      recipe.images = [];
    }
    return jsonResponse({ recipe });
  } catch (err) {
    console.error("Error fetching recipe:", err);
    return jsonResponse({ error: "Failed to fetch recipe" }, 500);
  }
}
async function onRequestPut(context) {
  const { env, data } = context;
  const id = context.params.id;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const body = await context.request.json();
    let pdfBase64;
    if (body.pdf_base64 !== void 0) {
      if (body.pdf_base64 === null || body.pdf_base64 === "") {
        pdfBase64 = null;
      } else {
        const validation = validatePdfBase64(body.pdf_base64, !!env.PDF_BUCKET);
        if (!validation.valid) {
          return jsonResponse({ error: validation.error }, 400);
        }
        pdfBase64 = validation.clean;
      }
    }
    const sets = [
      "title = ?",
      "category = ?",
      "tag = ?",
      "time = ?",
      "level = ?",
      "price = ?",
      "description = ?",
      "content = ?",
      "image_url = ?",
      "label = ?",
      "photo_tone = ?",
      "updated_at = CURRENT_TIMESTAMP"
    ];
    const values = [
      body.title,
      body.category,
      body.tag,
      body.time,
      body.level,
      body.price,
      body.description,
      JSON.stringify(body.content || {}),
      body.image_url,
      body.label,
      body.photo_tone
    ];
    if (pdfBase64 !== void 0) {
      if (env.PDF_BUCKET) {
        if (pdfBase64 === null) {
          await env.PDF_BUCKET.delete(`recipe_pdfs/${id}.txt`);
          sets.push("pdf_base64 = ?");
          values.push(null);
        } else {
          await env.PDF_BUCKET.put(`recipe_pdfs/${id}.txt`, pdfBase64);
          sets.push("pdf_base64 = ?");
          values.push("R2_STORED");
        }
      } else {
        sets.push("pdf_base64 = ?");
        values.push(pdfBase64);
      }
    }
    values.push(id);
    await env.DB.prepare(
      `UPDATE recipes SET ${sets.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Error updating recipe:", err);
    return jsonResponse({ error: "Failed to update recipe" }, 500);
  }
}
async function onRequestPatch(context) {
  const { env, data } = context;
  const id = context.params.id;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const body = await context.request.json();
    if (body.action === "restore") {
      await env.DB.prepare(
        "UPDATE recipes SET deleted_at = NULL, published = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(id).run();
      return jsonResponse({ success: true });
    }
    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("Error restoring recipe:", err);
    return jsonResponse({ error: "Failed to restore recipe" }, 500);
  }
}
async function onRequestDelete2(context) {
  const { env, data } = context;
  const id = context.params.id;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const url = new URL(context.request.url);
    const permanent = url.searchParams.get("permanent") === "true";
    if (permanent) {
      await env.DB.prepare("DELETE FROM recipes WHERE id = ?").bind(id).run();
      return jsonResponse({ success: true });
    }
    await env.DB.prepare(
      "UPDATE recipes SET published = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(id).run();
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Error deleting recipe:", err);
    return jsonResponse({ error: "Failed to delete recipe" }, 500);
  }
}
var init_id2 = __esm({
  "api/recipes/[id].js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet15, "onRequestGet");
    __name(onRequestPut, "onRequestPut");
    __name(onRequestPatch, "onRequestPatch");
    __name(onRequestDelete2, "onRequestDelete");
  }
});

// api/cart/index.js
async function onRequestGet16(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const cart = await env.DB.prepare(
      "SELECT items FROM carts WHERE user_id = ?"
    ).bind(data.session.userId).first();
    return jsonResponse({
      items: cart ? JSON.parse(cart.items) : []
    });
  } catch (err) {
    console.error("Error fetching cart:", err);
    return jsonResponse({ error: "Failed to fetch cart" }, 500);
  }
}
async function onRequestPost10(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const body = await context.request.json();
    let items = body.items || [];
    if (items.length > 0) {
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT oi.recipe_id 
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND o.status = 'paid'
      `).bind(data.session.userId).all();
      const purchasedIds = results.map((r) => Number(r.recipe_id));
      items = items.filter((item) => !purchasedIds.includes(Number(item.id)));
    }
    await env.DB.prepare(
      `INSERT INTO carts (user_id, items, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET items = excluded.items, updated_at = CURRENT_TIMESTAMP`
    ).bind(data.session.userId, JSON.stringify(items)).run();
    return jsonResponse({ success: true, items });
  } catch (err) {
    console.error("Error updating cart:", err);
    return jsonResponse({ error: "Failed to update cart" }, 500);
  }
}
async function onRequestDelete3(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    await env.DB.prepare(
      "DELETE FROM carts WHERE user_id = ?"
    ).bind(data.session.userId).run();
    return jsonResponse({ success: true });
  } catch (err) {
    console.error("Error clearing cart:", err);
    return jsonResponse({ error: "Failed to clear cart" }, 500);
  }
}
var init_cart = __esm({
  "api/cart/index.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet16, "onRequestGet");
    __name(onRequestPost10, "onRequestPost");
    __name(onRequestDelete3, "onRequestDelete");
  }
});

// api/orders/index.js
async function onRequestGet17(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const orders = await env.DB.prepare(
      `SELECT o.*, COUNT(oi.id) as item_count 
       FROM orders o 
       LEFT JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = ? 
       GROUP BY o.id 
       ORDER BY o.created_at DESC`
    ).bind(data.session.userId).all();
    return jsonResponse({ orders: orders.results || [] });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return jsonResponse({ error: "Failed to fetch orders" }, 500);
  }
}
async function onRequestPost11(context) {
  const { env, data } = context;
  if (!data.session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  try {
    const body = await context.request.json();
    const items = body.items || [];
    if (items.length === 0) {
      return jsonResponse({ error: "Cart is empty" }, 400);
    }
    const total = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const orderResult = await env.DB.prepare(
      "INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)"
    ).bind(data.session.userId, total, "pending").run();
    const orderId = orderResult.meta.last_row_id;
    for (const item of items) {
      await env.DB.prepare(
        "INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)"
      ).bind(orderId, item.id, item.title, item.price).run();
    }
    await env.DB.prepare(
      "DELETE FROM carts WHERE user_id = ?"
    ).bind(data.session.userId).run();
    return jsonResponse({ orderId, total, status: "pending" }, 201);
  } catch (err) {
    console.error("Error creating order:", err);
    return jsonResponse({ error: "Failed to create order" }, 500);
  }
}
var init_orders2 = __esm({
  "api/orders/index.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet17, "onRequestGet");
    __name(onRequestPost11, "onRequestPost");
  }
});

// api/recipes/index.js
async function onRequestGet18(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  try {
    let query = "SELECT id, title, category, tag, time, level, price, description, image_url, label, photo_tone, images FROM recipes WHERE published = 1 AND deleted_at IS NULL";
    let bindings = [];
    if (category && category !== "Todas") {
      query += " AND category = ?";
      bindings.push(category);
    }
    query += " ORDER BY created_at DESC";
    const stmt = env.DB.prepare(query);
    const recipesRaw = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
    const recipes = (recipesRaw.results || []).map((r) => {
      if (r.images) {
        try {
          r.images = JSON.parse(r.images);
        } catch {
          r.images = [];
        }
      } else {
        r.images = [];
      }
      return r;
    });
    return jsonResponse({ recipes });
  } catch (err) {
    console.error("Error fetching recipes:", err);
    return jsonResponse({ error: "Failed to fetch recipes" }, 500);
  }
}
async function onRequestPost12(context) {
  const { env, data } = context;
  if (!data.session || !data.session.isAdmin) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }
  try {
    const body = await context.request.json();
    let pdfBase64 = null;
    if (body.pdf_base64) {
      const validation = validatePdfBase64(body.pdf_base64, !!env.PDF_BUCKET);
      if (!validation.valid) {
        return jsonResponse({ error: validation.error }, 400);
      }
      pdfBase64 = validation.clean;
    }
    const initialPdfBase64 = env.PDF_BUCKET && pdfBase64 ? "R2_STORED" : pdfBase64;
    const result = await env.DB.prepare(
      `INSERT INTO recipes (title, category, tag, time, level, price, description, content, image_url, label, photo_tone, pdf_base64)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.title,
      body.category,
      body.tag || "nuevo",
      body.time || "1h",
      body.level || "f\xE1cil",
      body.price,
      body.description || "",
      JSON.stringify(body.content || {}),
      body.image_url || "",
      body.label || "",
      body.photo_tone || "pink",
      initialPdfBase64
    ).run();
    const newId = result.meta.last_row_id;
    if (env.PDF_BUCKET && pdfBase64) {
      await env.PDF_BUCKET.put(`recipe_pdfs/${newId}.txt`, pdfBase64);
    }
    return jsonResponse({ id: newId, success: true }, 201);
  } catch (err) {
    console.error("Error creating recipe:", err);
    return jsonResponse({ error: "Failed to create recipe" }, 500);
  }
}
var init_recipes2 = __esm({
  "api/recipes/index.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet18, "onRequestGet");
    __name(onRequestPost12, "onRequestPost");
  }
});

// api/test-email.js
async function onRequestGet19(context) {
  const { env, request } = context;
  const resendApiKey = env.RESEND_API_KEY;
  if (!resendApiKey) {
    return jsonResponse({ error: "RESEND_API_KEY no configurada" }, 500);
  }
  try {
    const recipe = await env.DB.prepare(
      "SELECT id, title, price FROM recipes WHERE pdf_base64 IS NOT NULL ORDER BY id DESC LIMIT 1"
    ).first();
    if (!recipe) {
      return jsonResponse({ error: "No hay ninguna receta con PDF subido para probar." }, 400);
    }
    const url = new URL(request.url);
    const targetEmail = url.searchParams.get("email") || "valentinfernandez2006@gmail.com";
    let user = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(targetEmail).first();
    let userId;
    if (!user) {
      const userRes = await env.DB.prepare(
        "INSERT INTO users (email, name, provider) VALUES (?, ?, ?)"
      ).bind(targetEmail, "Usuario de Prueba", "test").run();
      userId = userRes.meta.last_row_id;
    } else {
      userId = user.id;
    }
    const orderRes = await env.DB.prepare(
      "INSERT INTO orders (user_id, total, status, paid_at) VALUES (?, ?, ?, ?)"
    ).bind(userId, recipe.price, "paid", (/* @__PURE__ */ new Date()).toISOString()).run();
    const orderId = orderRes.meta.last_row_id;
    await env.DB.prepare(
      "INSERT INTO order_items (order_id, recipe_id, recipe_title, price) VALUES (?, ?, ?, ?)"
    ).bind(orderId, recipe.id, recipe.title, recipe.price).run();
    const result = await sendRecipeEmail(env, orderId);
    if (result.sent) {
      return jsonResponse({
        success: true,
        message: `Email enviado a ${targetEmail} simulando la compra de "${recipe.title}".`,
        details: result
      });
    } else {
      return jsonResponse({
        success: false,
        error: "Fall\xF3 el env\xEDo del email",
        details: result
      }, 500);
    }
  } catch (err) {
    console.error("[TEST-EMAIL] Error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
}
var init_test_email = __esm({
  "api/test-email.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequestGet19, "onRequestGet");
  }
});

// api/_middleware.js
async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return corsPreflight();
  }
  context.data = context.data || {};
  context.data.session = await getSession(context.env, request);
  return context.next();
}
var init_middleware = __esm({
  "api/_middleware.js"() {
    init_functionsRoutes_0_9568238928069174();
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_utils();
    __name(onRequest, "onRequest");
  }
});

// ../.wrangler/tmp/pages-vxFTM4/functionsRoutes-0.9568238928069174.mjs
var routes;
var init_functionsRoutes_0_9568238928069174 = __esm({
  "../.wrangler/tmp/pages-vxFTM4/functionsRoutes-0.9568238928069174.mjs"() {
    init_index();
    init_items();
    init_images();
    init_images();
    init_orders();
    init_recipes();
    init_stats();
    init_trash();
    init_users();
    init_callback();
    init_forgot_password();
    init_google();
    init_login_email();
    init_logout();
    init_logout();
    init_me();
    init_register_email();
    init_reset_password();
    init_send_recipe();
    init_create();
    init_webhook();
    init_webhook();
    init_key();
    init_id();
    init_id2();
    init_id2();
    init_id2();
    init_id2();
    init_cart();
    init_cart();
    init_cart();
    init_orders2();
    init_orders2();
    init_recipes2();
    init_recipes2();
    init_test_email();
    init_middleware();
    routes = [
      {
        routePath: "/api/recipes/:id/images/:index",
        mountPath: "/api/recipes/:id/images",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/orders/:id/items",
        mountPath: "/api/orders/:id",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/recipes/:id/images",
        mountPath: "/api/recipes/:id/images",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/recipes/:id/images",
        mountPath: "/api/recipes/:id/images",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/admin/orders",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet3]
      },
      {
        routePath: "/api/admin/recipes",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet4]
      },
      {
        routePath: "/api/admin/stats",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet5]
      },
      {
        routePath: "/api/admin/trash",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet6]
      },
      {
        routePath: "/api/admin/users",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet7]
      },
      {
        routePath: "/api/auth/callback",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet8]
      },
      {
        routePath: "/api/auth/forgot-password",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/auth/google",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet9]
      },
      {
        routePath: "/api/auth/login-email",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/auth/logout",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet10]
      },
      {
        routePath: "/api/auth/logout",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/auth/me",
        mountPath: "/api/auth",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet11]
      },
      {
        routePath: "/api/auth/register-email",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/auth/reset-password",
        mountPath: "/api/auth",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/orders/send-recipe",
        mountPath: "/api/orders",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/api/payments/create",
        mountPath: "/api/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      },
      {
        routePath: "/api/payments/webhook",
        mountPath: "/api/payments",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet12]
      },
      {
        routePath: "/api/payments/webhook",
        mountPath: "/api/payments",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost9]
      },
      {
        routePath: "/api/images/:key",
        mountPath: "/api/images",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet13]
      },
      {
        routePath: "/api/orders/:id",
        mountPath: "/api/orders",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet14]
      },
      {
        routePath: "/api/recipes/:id",
        mountPath: "/api/recipes",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete2]
      },
      {
        routePath: "/api/recipes/:id",
        mountPath: "/api/recipes",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet15]
      },
      {
        routePath: "/api/recipes/:id",
        mountPath: "/api/recipes",
        method: "PATCH",
        middlewares: [],
        modules: [onRequestPatch]
      },
      {
        routePath: "/api/recipes/:id",
        mountPath: "/api/recipes",
        method: "PUT",
        middlewares: [],
        modules: [onRequestPut]
      },
      {
        routePath: "/api/cart",
        mountPath: "/api/cart",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete3]
      },
      {
        routePath: "/api/cart",
        mountPath: "/api/cart",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet16]
      },
      {
        routePath: "/api/cart",
        mountPath: "/api/cart",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost10]
      },
      {
        routePath: "/api/orders",
        mountPath: "/api/orders",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet17]
      },
      {
        routePath: "/api/orders",
        mountPath: "/api/orders",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost11]
      },
      {
        routePath: "/api/recipes",
        mountPath: "/api/recipes",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet18]
      },
      {
        routePath: "/api/recipes",
        mountPath: "/api/recipes",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost12]
      },
      {
        routePath: "/api/test-email",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet19]
      },
      {
        routePath: "/api",
        mountPath: "/api",
        method: "",
        middlewares: [onRequest],
        modules: []
      }
    ];
  }
});

// ../.wrangler/tmp/bundle-T22kzB/middleware-loader.entry.ts
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();

// ../.wrangler/tmp/bundle-T22kzB/middleware-insertion-facade.js
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();

// ../node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();

// ../node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-T22kzB/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
init_functionsRoutes_0_9568238928069174();
init_checked_fetch();
init_strip_cf_connecting_ip_header();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-T22kzB/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)
*/
//# sourceMappingURL=functionsWorker-0.7193848191170396.mjs.map
