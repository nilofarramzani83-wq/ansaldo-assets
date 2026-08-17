import { verifyUserPassword, createSessionToken, sessionCookieHeader } from "../_lib/auth.js";
import { HR_USERS } from "../_data/hr-users.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = env.SESSION_SECRET;
  if (!secret) {
    return new Response(
      "پیکربندی سرور ناقص است: SESSION_SECRET تنظیم نشده.",
      { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const form = await request.formData();
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");

  const ok = username && password && (await verifyUserPassword(username, password, HR_USERS));

  if (!ok) {
    const url = new URL("/bayegani/login.html?error=1", request.url);
    return Response.redirect(url.toString(), 302);
  }

  const token = await createSessionToken(username, secret);
  const url = new URL("/bayegani/", request.url);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": sessionCookieHeader(token),
    },
  });
}
