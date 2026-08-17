import { createSession } from "../_lib/session.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "درخواست نامعتبر است." }, 400);
  }

  const username = (body.username || "").trim().toLowerCase();
  const password = body.password || "";

  if (!username || !password) {
    return json({ ok: false, error: "ایمیل و رمز عبور را وارد کنید." }, 400);
  }

  if (!env.PERSONNEL_USERS || !env.SESSION_SECRET) {
    return json(
      { ok: false, error: "سامانه ورود هنوز پیکربندی نشده است. با مدیر سایت تماس بگیرید." },
      500
    );
  }

  let users;
  try {
    users = JSON.parse(env.PERSONNEL_USERS);
  } catch (e) {
    return json({ ok: false, error: "پیکربندی کاربران نامعتبر است." }, 500);
  }

  const expected = users[username];

  if (!expected || expected !== password) {
    // یک تأخیر کوچک برای کاهش سرعت حدس زدن رمز
    await new Promise((r) => setTimeout(r, 400));
    return json({ ok: false, error: "ایمیل یا رمز عبور اشتباه است." }, 401);
  }

  const token = await createSession(username, env.SESSION_SECRET);

  const headers = new Headers({ "content-type": "application/json; charset=utf-8" });
  headers.append(
    "Set-Cookie",
    `pa_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`
  );

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}

