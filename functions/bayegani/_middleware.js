import { parseCookies, verifySessionToken } from "../_lib/auth.js";

// مسیرهایی که بدون لاگین هم باید در دسترس باشند
const PUBLIC_PATHS = new Set(["/bayegani/login.html", "/bayegani/login"]);

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  const secret = env.SESSION_SECRET;
  if (!secret) {
    return new Response(
      "پیکربندی سرور ناقص است: SESSION_SECRET تنظیم نشده. به تنظیمات پروژه در Cloudflare Pages مراجعه کنید.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const cookies = parseCookies(request);
  const username = await verifySessionToken(cookies.session, secret);

  if (!username) {
    const redirectUrl = new URL("/bayegani/login.html", request.url);
    return Response.redirect(redirectUrl.toString(), 302);
  }

  context.data = { ...(context.data || {}), username };

  return next();
}
