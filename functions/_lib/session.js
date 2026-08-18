// ابزار مشترک برای ساخت و بررسی کوکی ورود (session).
// از HMAC-SHA256 برای امضای امن استفاده می‌کند تا کاربر نتواند
// کوکی جعلی بسازد، حتی اگر منبع سایت را ببیند.
 
function toBase64Url(bytes) {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(new Uint8Array(sig));
}

const SESSION_HOURS = 12; // مدت اعتبار ورود: ۱۲ ساعت

// یک کوکی امضاشده می‌سازد: base64(ایمیل کاربر + زمان انقضا) + امضا
export async function createSession(username, secret) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = JSON.stringify({ u: username, e: expires });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

// کوکی را می‌خواند، امضا و تاریخ انقضا را بررسی می‌کند
export async function verifySession(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sig] = token.split(".");
  const expectedSig = await hmac(secret, payloadB64);
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (!payload.e || Date.now() > payload.e) return null;
    return payload.u || null;
  } catch (e) {
    return null;
  }
}

export function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}
