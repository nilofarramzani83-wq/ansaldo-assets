import { assets } from "../_data/assets.js";

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pageShell(bodyHtml, title) {
  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function renderLogo() {
  return `<div class="logo">
    <span class="ansaldo">ansaldo</span>
    <span class="divider"></span>
    <span class="energia">energia</span>
  </div>`;
}

function renderFound(code, asset) {
  const rows = [];
  rows.push(["نام کالا", asset.name]);
  if (asset.model) rows.push(["مدل", asset.model]);
  rows.push(["بخش / محل استقرار", asset.location]);
  if (asset.role) rows.push(["مسئول فعلی", asset.role]);
  rows.push(["کد اموال", code, "code"]);
  if (asset.status) rows.push(["وضعیت", asset.status, "status"]);

  const rowsHtml = rows
    .map(
      ([label, value, cls]) => `
      <div class="field-row">
        <div class="field-value${cls ? " " + cls : ""}">${escapeHtml(value)}</div>
        <div class="field-label">${escapeHtml(label)}</div>
      </div>`
    )
    .join("");

  const body = `
${renderLogo()}
<div class="plate">
  <div class="plate-title">
    <h1>اطلاعات اموال</h1>
    <p>مشخصات دارایی سازمانی</p>
  </div>
  <div class="code-pill-row">
    <span class="code-pill">${escapeHtml(code)}</span>
  </div>
  <div class="fields">${rowsHtml}</div>
</div>
<p class="footnote">این صفحه به‌صورت خودکار برای کد <bdi>${escapeHtml(
    code
  )}</bdi> نمایش داده شده است.</p>`;

  return pageShell(body, `${asset.name} · ${code}`);
}

function renderNotFound(code) {
  const body = `
${renderLogo()}
<div class="plate not-found">
  <div class="plate-title">
    <h1>کد نامعتبر</h1>
    <p>این کد در فهرست اموال ثبت نشده</p>
  </div>
  <div class="code-pill-row">
    <span class="code-pill">${escapeHtml(code)}</span>
  </div>
  <div class="nf-body">
    <p>این برچسب هنوز در سامانه تعریف نشده است.<br>
    لطفاً با واحد اداری تماس بگیرید یا کد را به فایل اموال اضافه کنید.</p>
  </div>
</div>`;

  return pageShell(body, `کد نامعتبر · ${code}`);
}

export async function onRequestGet(context) {
  const rawCode = context.params.code || "";
  const code = decodeURIComponent(rawCode).trim();
  const asset = assets[code];

  if (!asset) {
    return new Response(renderNotFound(code), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(renderFound(code, asset), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
