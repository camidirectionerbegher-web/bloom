/**
 * bloom-config.js — Credenciales de BLOOM
 * ─────────────────────────────────────────
 * IMPORTANTE: agregar este archivo a .gitignore
 * para que nunca se suba a un repositorio público.
 *
 * Instrucciones:
 * 1. Subir este archivo al mismo servidor/carpeta que tu .html.
 * 2. Agregar al .gitignore: bloom-config.js
 * 3. En Supabase → Authentication → URL Configuration:
 *    - Agregar en "Allowed origins": https://camidirectionerbegher-web.github.io
 * 4. Las políticas RLS ya están configuradas en el SQL del HTML.
 */

window.BLOOM_CONFIG = {

  // ── Supabase ──────────────────────────────────────────────
  SUPABASE_URL: "https://zpwwbpsylfmkqqwngvor.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd3dicHN5bGZta3Fxd25ndm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTY1NjMsImV4cCI6MjA5NDY5MjU2M30.5jenu4rWNpa7y6yxzRt52d-rNKa-CHAo3H-sVOLBnsk",

  // ── EmailJS ───────────────────────────────────────────────
  EMAILJS_SERVICE_ID:  "service_4zzzmxq",
  EMAILJS_TEMPLATE_ID: "template_dcih8ug",
  EMAILJS_PUBLIC_KEY:  "CVGoVob0thCSOHpGk",
  OWNER_EMAIL:         "nicopanno3@gmail.com",

};
