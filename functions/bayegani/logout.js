import { sessionCookieHeader } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const url = new URL("/bayegani/login.html", context.request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      "Set-Cookie": sessionCookieHeader("", { clear: true }),
    },
  });
}
