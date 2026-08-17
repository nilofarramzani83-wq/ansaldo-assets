// توابع کمکی احراز هویت — فقط سمت سرور (Cloudflare Pages Functions) اجرا می‌شوند
// و هرگز برای مرورگر ارسال نمی‌شوند.

const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_SECONDS = 60 * 60 * 8; // ۸ ساعت

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// مقایسه با زمان ثابت، برای جلوگیری از حملات timing attack
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = hexToBytes(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

export async function verifyUserPassword(username, password, users) {
  const user = users.find((u) => u.username === username);
  if (!user) {
    // برای برابر بودن زمان پاسخ در حالت «کاربر یافت نشد»، یک هش الکی محاسبه می‌کنیم
    await hashPassword(password, "00".repeat(16));
    return false;
  }
  const computed = await hashPassword(password, user.salt);
  return timingSafeEqual(computed, user.hash);
}

async function hmacSign(data, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return bytesToHex(new Uint8Array(sig));
}

export async function createSessionToken(username, secret) {
  const expiry = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = `${username}.${expiry}`;
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [username, expiryStr, sig] = parts;
  const expiry = Number(expiryStr);
  if (!expiry || Date.now() > expiry) return null;
  const expectedSig = await hmacSign(`${username}.${expiryStr}`, secret);
  if (!timingSafeEqual(sig, expectedSig)) return null;
  return username;
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    cookies[k] = decodeURIComponent(v);
  });
  return cookies;
}

export function sessionCookieHeader(token, { clear = false } = {}) {
  const maxAge = clear ? 0 : SESSION_TTL_SECONDS;
  const value = clear ? "" : token;
  return `session=${value}; Path=/bayegani; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
