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

function categoryClass(code) {
  const m = code.match(/AEI-([A-Z]+)-/);
  return m ? `cat-${m[1]}` : "";
}

function renderFound(code, asset) {
  const rows = [];
  rows.push(["نام کالا", asset.name]);
  if (asset.brand) rows.push(["برند", asset.brand]);
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
    <span class="code-pill ${categoryClass(code)}">${escapeHtml(code)}</span>
    <button class="copy-btn" id="copy-code-btn" type="button" aria-label="کپی کد">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
    </button>
    <span class="copy-toast" id="copy-toast">کپی شد ✓</span>
  </div>
  <div class="fields">${rowsHtml}</div>
</div>
<p class="footnote">این صفحه به‌صورت خودکار برای کد <bdi>${escapeHtml(
    code
  )}</bdi> نمایش داده شده است.</p>
<script>
  var copyBtn = document.getElementById('copy-code-btn');
  var copyToast = document.getElementById('copy-toast');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = ${JSON.stringify(code)};
      var done = function () {
        copyToast.classList.add('show');
        setTimeout(function () { copyToast.classList.remove('show'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  }
</script>`;

  return pageShell(body, `${asset.name} · ${code}`);
}

function renderNotFound(code) {
  const body = `
${renderLogo()}
<div class="plate not-found">
  <div class="plate-title">
    <svg class="nf-icon" viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9.5 9a2.5 2.5 0 0 1 4.7-1.2c.5.9.3 1.6-.4 2.3-.7.6-1.3 1-1.3 2.4"/>
      <circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>
    </svg>
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

// برچسب‌های چاپ‌شده ممکن است با پسوند "-TEH" باشند، در حالی که کلیدهای
// دیتای اموال بدون این پسوند ذخیره شده‌اند. این تابع هر دو حالت را
// امتحان می‌کند تا کدهای قدیمی و جدید هر دو کار کنند.
function lookupAsset(code) {
  if (assets[code]) return assets[code];

  const upper = code.toUpperCase();
  const withoutTeh = upper.replace(/-TEH$/, "");
  if (assets[withoutTeh]) return assets[withoutTeh];

  const withTeh = upper.endsWith("-TEH") ? upper : `${upper}-TEH`;
  if (assets[withTeh]) return assets[withTeh];

  // تطبیق بدون حساسیت به بزرگ/کوچک بودن حروف، برای اطمینان بیشتر
  const target = withoutTeh;
  for (const key of Object.keys(assets)) {
    if (key.toUpperCase() === target) return assets[key];
  }

  return null;
}

export async function onRequestGet(context) {
  const rawCode = context.params.code || "";
  const code = decodeURIComponent(rawCode).trim();
  const asset = lookupAsset(code);

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
