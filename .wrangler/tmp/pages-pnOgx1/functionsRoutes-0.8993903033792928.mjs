import { onRequestDelete as __api_recipes__id__images__index__js_onRequestDelete } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id]\\images\\[index].js"
import { onRequestGet as __api_orders__id__items_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\orders\\[id]\\items.js"
import { onRequestGet as __api_recipes__id__images_index_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id]\\images\\index.js"
import { onRequestPost as __api_recipes__id__images_index_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id]\\images\\index.js"
import { onRequestGet as __api_admin_orders_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\admin\\orders.js"
import { onRequestGet as __api_admin_recipes_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\admin\\recipes.js"
import { onRequestGet as __api_admin_stats_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\admin\\stats.js"
import { onRequestGet as __api_admin_users_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\admin\\users.js"
import { onRequestGet as __api_auth_callback_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\callback.js"
import { onRequestPost as __api_auth_forgot_password_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\forgot-password.js"
import { onRequestGet as __api_auth_google_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\google.js"
import { onRequestPost as __api_auth_login_email_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\login-email.js"
import { onRequestGet as __api_auth_logout_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\logout.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\me.js"
import { onRequestPost as __api_auth_register_email_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\register-email.js"
import { onRequestPost as __api_auth_reset_password_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\auth\\reset-password.js"
import { onRequestPost as __api_orders_send_recipe_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\orders\\send-recipe.js"
import { onRequestPost as __api_payments_create_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\payments\\create.js"
import { onRequestGet as __api_payments_webhook_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\payments\\webhook.js"
import { onRequestPost as __api_payments_webhook_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\payments\\webhook.js"
import { onRequestGet as __api_images__key__js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\images\\[key].js"
import { onRequestGet as __api_orders__id__js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\orders\\[id].js"
import { onRequestDelete as __api_recipes__id__js_onRequestDelete } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id].js"
import { onRequestGet as __api_recipes__id__js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id].js"
import { onRequestPut as __api_recipes__id__js_onRequestPut } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\[id].js"
import { onRequestDelete as __api_cart_index_js_onRequestDelete } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\cart\\index.js"
import { onRequestGet as __api_cart_index_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\cart\\index.js"
import { onRequestPost as __api_cart_index_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\cart\\index.js"
import { onRequestGet as __api_orders_index_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\orders\\index.js"
import { onRequestPost as __api_orders_index_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\orders\\index.js"
import { onRequestGet as __api_recipes_index_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\index.js"
import { onRequestPost as __api_recipes_index_js_onRequestPost } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\recipes\\index.js"
import { onRequestGet as __api_test_email_js_onRequestGet } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\test-email.js"
import { onRequest as __api__middleware_js_onRequest } from "C:\\Users\\vlen0\\Desktop\\CLIENTES\\agusreyncakes\\functions\\api\\_middleware.js"

export const routes = [
    {
      routePath: "/api/recipes/:id/images/:index",
      mountPath: "/api/recipes/:id/images",
      method: "DELETE",
      middlewares: [],
      modules: [__api_recipes__id__images__index__js_onRequestDelete],
    },
  {
      routePath: "/api/orders/:id/items",
      mountPath: "/api/orders/:id",
      method: "GET",
      middlewares: [],
      modules: [__api_orders__id__items_js_onRequestGet],
    },
  {
      routePath: "/api/recipes/:id/images",
      mountPath: "/api/recipes/:id/images",
      method: "GET",
      middlewares: [],
      modules: [__api_recipes__id__images_index_js_onRequestGet],
    },
  {
      routePath: "/api/recipes/:id/images",
      mountPath: "/api/recipes/:id/images",
      method: "POST",
      middlewares: [],
      modules: [__api_recipes__id__images_index_js_onRequestPost],
    },
  {
      routePath: "/api/admin/orders",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_orders_js_onRequestGet],
    },
  {
      routePath: "/api/admin/recipes",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_recipes_js_onRequestGet],
    },
  {
      routePath: "/api/admin/stats",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_stats_js_onRequestGet],
    },
  {
      routePath: "/api/admin/users",
      mountPath: "/api/admin",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_users_js_onRequestGet],
    },
  {
      routePath: "/api/auth/callback",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_callback_js_onRequestGet],
    },
  {
      routePath: "/api/auth/forgot-password",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_forgot_password_js_onRequestPost],
    },
  {
      routePath: "/api/auth/google",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_google_js_onRequestGet],
    },
  {
      routePath: "/api/auth/login-email",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_email_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestGet],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/register-email",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_email_js_onRequestPost],
    },
  {
      routePath: "/api/auth/reset-password",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_reset_password_js_onRequestPost],
    },
  {
      routePath: "/api/orders/send-recipe",
      mountPath: "/api/orders",
      method: "POST",
      middlewares: [],
      modules: [__api_orders_send_recipe_js_onRequestPost],
    },
  {
      routePath: "/api/payments/create",
      mountPath: "/api/payments",
      method: "POST",
      middlewares: [],
      modules: [__api_payments_create_js_onRequestPost],
    },
  {
      routePath: "/api/payments/webhook",
      mountPath: "/api/payments",
      method: "GET",
      middlewares: [],
      modules: [__api_payments_webhook_js_onRequestGet],
    },
  {
      routePath: "/api/payments/webhook",
      mountPath: "/api/payments",
      method: "POST",
      middlewares: [],
      modules: [__api_payments_webhook_js_onRequestPost],
    },
  {
      routePath: "/api/images/:key",
      mountPath: "/api/images",
      method: "GET",
      middlewares: [],
      modules: [__api_images__key__js_onRequestGet],
    },
  {
      routePath: "/api/orders/:id",
      mountPath: "/api/orders",
      method: "GET",
      middlewares: [],
      modules: [__api_orders__id__js_onRequestGet],
    },
  {
      routePath: "/api/recipes/:id",
      mountPath: "/api/recipes",
      method: "DELETE",
      middlewares: [],
      modules: [__api_recipes__id__js_onRequestDelete],
    },
  {
      routePath: "/api/recipes/:id",
      mountPath: "/api/recipes",
      method: "GET",
      middlewares: [],
      modules: [__api_recipes__id__js_onRequestGet],
    },
  {
      routePath: "/api/recipes/:id",
      mountPath: "/api/recipes",
      method: "PUT",
      middlewares: [],
      modules: [__api_recipes__id__js_onRequestPut],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api/cart",
      method: "DELETE",
      middlewares: [],
      modules: [__api_cart_index_js_onRequestDelete],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api/cart",
      method: "GET",
      middlewares: [],
      modules: [__api_cart_index_js_onRequestGet],
    },
  {
      routePath: "/api/cart",
      mountPath: "/api/cart",
      method: "POST",
      middlewares: [],
      modules: [__api_cart_index_js_onRequestPost],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api/orders",
      method: "GET",
      middlewares: [],
      modules: [__api_orders_index_js_onRequestGet],
    },
  {
      routePath: "/api/orders",
      mountPath: "/api/orders",
      method: "POST",
      middlewares: [],
      modules: [__api_orders_index_js_onRequestPost],
    },
  {
      routePath: "/api/recipes",
      mountPath: "/api/recipes",
      method: "GET",
      middlewares: [],
      modules: [__api_recipes_index_js_onRequestGet],
    },
  {
      routePath: "/api/recipes",
      mountPath: "/api/recipes",
      method: "POST",
      middlewares: [],
      modules: [__api_recipes_index_js_onRequestPost],
    },
  {
      routePath: "/api/test-email",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_test_email_js_onRequestGet],
    },
  {
      routePath: "/api",
      mountPath: "/api",
      method: "",
      middlewares: [__api__middleware_js_onRequest],
      modules: [],
    },
  ]