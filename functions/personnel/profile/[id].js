import { personnel } from "../../_data/personnel.js";
 
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

function findPerson(id) {
  for (const [department, people] of Object.entries(personnel)) {
    const found = people.find((p) => p.id === id);
    if (found) return { ...found, department };
  }
  return null;
}

function renderFound(person) {
  const rows = [
    ["نام و نام خانوادگی", person.name],
    ["بخش", person.department],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
      <div class="field-row">
        <div class="field-value">${escapeHtml(value)}</div>
        <div class="field-label">${escapeHtml(label)}</div>
      </div>`
    )
    .join("");

  const body = `
${renderLogo()}
<div class="plate">
  <div class="plate-title">
    <h1>پرونده پرسنلی</h1>
    <p>بایگانی داخلی — دسترسی محدود</p>
  </div>
  <div class="fields">${rowsHtml}</div>
</div>
<p class="footnote">
  اطلاعات تکمیلی (سمت، تلفن، تاریخ استخدام، مدارک و ...) بعداً به این
  پرونده اضافه می‌شود.<br>
  <a href="/personnel/">‹ بازگشت به بایگانی پرسنل</a>
</p>`;

  return pageShell(body, `${person.name} · پرونده پرسنلی`);
}

function renderNotFound() {
  const body = `
${renderLogo()}
<div class="plate not-found">
  <div class="plate-title">
    <h1>پرونده پیدا نشد</h1>
    <p>این شناسه در سامانه ثبت نشده است.</p>
  </div>
</div>
<p class="footnote"><a href="/personnel/">‹ بازگشت به بایگانی پرسنل</a></p>`;

  return pageShell(body, "پرونده پیدا نشد");
}

// این مسیر هم زیرِ /personnel/* است، پس از طریق
// functions/personnel/_middleware.js محافظت می‌شود.
export async function onRequestGet(context) {
  const id = decodeURIComponent(context.params.id || "").trim();
  const person = findPerson(id);

  if (!person) {
    return new Response(renderNotFound(), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return new Response(renderFound(person), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
