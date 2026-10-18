// Four alternative designs for the hosted (public) form, in Persian.
// Each shows the satisfaction, recommend (NPS) and color questions plus an answers summary.

export function makeVariants({ i, fa, P, art }) {
  const sel = [P.teal, P.orange, P.plum];
  const palette = [P.teal, P.orange, P.amber, P.plum, P.carmine, "#2f6f73", "#141a1c", "#f3eee6", "#7aa6a1", "#f2c18d"];
  const top = (right = "") => `
<header class="pub-top"><span class="logo">${i("braces")}</span><b style="font-weight:600;font-size:15px">نظرسنجی محصول</b><div class="grow"></div>
  ${right}<button class="btn ghost">${i("bookmark", "icon-sm")}ذخیره برای بعد</button><button class="btn">${i("languages", "icon-sm")}English</button></header>`;

  /* ---------- V1: question cards + side summary with progress ring ---------- */
  const faces = [["angry", "خیلی بد"], ["frown", "بد"], ["meh", "معمولی"], ["smile", "خوب"], ["laugh", "عالی"]];
  const ring = (pct, size = 64) => {
    const r = size / 2 - 6, c = 2 * Math.PI * r;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="7"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${P.orange}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * pct) / 100} ${c}"/></svg>`;
  };
  const npsZone = (n) => (n <= 6 ? "z-bad" : n <= 8 ? "z-mid" : "z-good");
  const v1 = `
<div class="pub v-bg">
  ${top()}
  <div class="pub-main" style="grid-template-columns:1fr 360px">
    <div style="display:grid;gap:14px;align-content:start">
      <div class="row" style="gap:14px"><div class="track2 grow"><span class="f" style="width:34%"></span><span class="c" style="width:22%"></span><span class="r"></span></div><span class="faint">مرحلهٔ ${fa(2)} از ${fa(3)}</span></div>
      <section class="qcard"><div class="qhead"><span class="qnum">${fa(1)}</span><div><h3>از نسخهٔ جدید چقدر راضی هستید؟<span class="req">*</span></h3><p>یکی را انتخاب کنید.</p></div></div>
        <div class="faces">${faces.map(([ic, t], k) => `<div class="face ${k === 3 ? "on" : ""}">${i(ic, "icon-lg")}<span>${t}</span></div>`).join("")}</div></section>
      <section class="qcard"><div class="qhead"><span class="qnum">${fa(2)}</span><div><h3>چقدر احتمال دارد ما را به دوستانتان پیشنهاد کنید؟<span class="req">*</span></h3><p>${fa(0)} یعنی اصلاً، ${fa(10)} یعنی حتماً.</p></div></div>
        <div class="seg-nps">${[...Array(11).keys()].map((n) => `<span class="${npsZone(n)} ${n === 9 ? "on" : ""}">${fa(n)}</span>`).join("")}</div>
        <div class="zones"><span style="flex:7">منتقد</span><span style="flex:2">بی‌طرف</span><span style="flex:2">طرفدار</span></div></section>
      <section class="qcard"><div class="qhead"><span class="qnum">${fa(3)}</span><div><h3>رنگ‌های دلخواه برای پوستهٔ تازه</h3><p>تا ${fa(4)} رنگ؛ ترتیب انتخاب مهم است.</p></div><div class="grow"></div><span class="pill draft">${fa(3)} از ${fa(4)}</span></div>
        <div class="dots">${palette.map((c) => { const k = sel.indexOf(c); return `<span class="dot-sw ${k >= 0 ? "on" : ""}" style="--c:${c}">${k >= 0 ? `<b>${fa(k + 1)}</b>` : ""}</span>`; }).join("")}
          <span class="hexbox">${i("pipette", "icon-sm")}<span class="mono" dir="ltr">#</span><span class="faint">رنگ دلخواه</span></span></div></section>
      <div class="row"><button class="btn lg">قبلی</button><div class="grow"></div><span class="faint" style="font-size:12.5px">${i("corner-down-left", "icon-sm")} اینتر برای ادامه</span><button class="btn primary lg">مرحلهٔ بعد</button></div>
    </div>
    <aside class="card sum1">
      <div class="row" style="gap:14px;padding:18px 20px;border-bottom:1px solid var(--line)"><div style="position:relative;width:64px;height:64px">${ring(56)}<b class="ring-v">${fa(56)}٪</b></div><div><h2 style="font-size:16px;font-weight:600">پاسخ‌های شما</h2><p class="muted" style="font-size:12.5px">${fa(5)} از ${fa(9)} پرسش پاسخ داده شده</p></div></div>
      <div class="ans-list">
        <div class="ans done"><span class="tile t">${i("check", "icon-sm")}</span><div><p>تجربهٔ شما</p><b>بیش از یک سال، استفادهٔ روزانه</b></div>${i("pencil", "icon-sm faint")}</div>
        <div class="ans"><span class="tile o">${i("smile", "icon-sm")}</span><div><p>رضایت</p><b>خوب</b></div>${i("pencil", "icon-sm faint")}</div>
        <div class="ans"><span class="tile t">${i("gauge", "icon-sm")}</span><div><p>پیشنهاد به دیگران</p><b>${fa(9)}، طرفدار</b></div>${i("pencil", "icon-sm faint")}</div>
        <div class="ans"><span class="tile p">${i("palette", "icon-sm")}</span><div><p>رنگ‌ها</p><b class="stack">${sel.map((c) => `<span style="background:${c}"></span>`).join("")}</b></div>${i("pencil", "icon-sm faint")}</div>
        <div class="ans todo"><span class="tile">${i("mail", "icon-sm")}</span><div><p>راه ارتباط</p><b class="faint">مرحلهٔ بعد</b></div></div>
      </div>
    </aside>
  </div>
</div>`;

  /* ---------- V2: one question per screen (focus mode) ---------- */
  const v2 = `
<div class="pub v2">
  <div class="v2-progress"><span style="width:56%"></span></div>
  <header class="pub-top" style="background:transparent;border:0"><span class="logo">${i("braces")}</span><b style="font-weight:600">نظرسنجی محصول</b><div class="grow"></div>
    <div class="row prev-ans"><span class="pa">رضایت <b>${i("smile", "icon-sm")} خوب</b></span><span class="pa">رنگ‌ها <b class="stack">${sel.map((c) => `<span style="background:${c}"></span>`).join("")}</b></span></div>
    <button class="btn">${i("languages", "icon-sm")}English</button></header>
  <div class="v2-body">
    <nav class="v2-steps">${["تجربه", "رضایت", "پیشنهاد", "رنگ‌ها", "ارتباط"].map((t, k) => `<span class="${k < 2 ? "done" : k === 2 ? "cur" : ""}"><i></i>${t}</span>`).join("")}</nav>
    <div class="v2-q">
      <span class="v2-k">پرسش ${fa(3)} از ${fa(5)}</span>
      <h1>چقدر احتمال دارد ما را به دوستانتان پیشنهاد کنید؟</h1>
      <p class="muted" style="font-size:16px">عدد را بزنید یا با کلیدهای صفحه‌کلید انتخاب کنید.</p>
      <div class="big-nps">${[...Array(11).keys()].map((n) => `<span class="${n === 9 ? "on" : ""}"><b>${fa(n)}</b></span>`).join("")}</div>
      <div class="nps-ends" style="font-size:13.5px"><span>${i("frown", "icon-sm")} اصلاً</span><span>حتماً ${i("laugh", "icon-sm")}</span></div>
      <div class="row" style="margin-top:34px;gap:14px"><button class="btn primary lg">تأیید ${i("check", "icon-sm")}</button><span class="faint">یا <span class="kbd">Enter ↵</span> بزنید</span></div>
    </div>
  </div>
  <div class="v2-nav"><button class="btn square">${i("arrow-right")}</button><button class="btn square">${i("arrow-left")}</button></div>
</div>`;

  /* ---------- V3: split screen; brand panel holds the answers timeline ---------- */
  const v3 = `
<div class="v3">
  <aside class="v3-side">
    <div class="row" style="gap:10px"><span class="logo" style="background:#fff;color:${P.plum}">${i("braces")}</span><b style="font-weight:600;font-size:15px">نظرسنجی محصول</b></div>
    <div class="v3-art">${art}</div>
    <h2>پوستهٔ تازه را با هم بسازیم</h2>
    <p>نظر شما مستقیم روی رنگ‌ها و چیدمان نسخهٔ بعدی اثر می‌گذارد.</p>
    <ol class="tl">
      <li class="done"><i>${i("check", "icon-sm")}</i><div><b>تجربهٔ شما</b><span>بیش از یک سال، استفادهٔ روزانه</span></div></li>
      <li class="cur"><i>${fa(2)}</i><div><b>سلیقهٔ شما</b><span class="row" style="gap:8px">${i("star", "icon-sm")} ${fa(4)} از ${fa(5)}  <span class="stack">${sel.map((c) => `<span style="background:${c}"></span>`).join("")}</span></span></div></li>
      <li><i>${fa(3)}</i><div><b>راه ارتباط</b><span>ایمیل برای پیگیری</span></div></li>
    </ol>
  </aside>
  <main class="v3-main">
    <div class="row"><span class="faint">مرحلهٔ ${fa(2)} از ${fa(3)}</span><div class="grow"></div><button class="btn ghost">${i("bookmark", "icon-sm")}ذخیره برای بعد</button><button class="btn">English</button></div>
    <h1 class="v3-h">سلیقهٔ شما</h1>
    <div class="v3-f"><span class="label">از نسخهٔ جدید چقدر راضی هستید؟<span class="req">*</span></span>
      <div class="star-pill">${[1, 2, 3, 4, 5].map((k) => i("star", k <= 4 ? "st on" : "st")).join("")}<span class="sp-v">خوب</span></div></div>
    <div class="v3-f"><span class="label">چقدر احتمال دارد ما را به دوستانتان پیشنهاد کنید؟<span class="req">*</span></span>
      <div class="range"><div class="range-track"></div><div class="range-thumb" style="inset-inline-start:90%"><span class="bubble">${fa(9)}</span></div></div>
      <div class="ticks">${[...Array(11).keys()].map((n) => `<span class="${n === 9 ? "on" : ""}">${fa(n)}</span>`).join("")}</div></div>
    <div class="v3-f"><span class="label">رنگ‌های دلخواه برای پوستهٔ تازه</span>
      <div class="strip">${sel.map((c) => `<div style="background:${c}"><span class="mono" dir="ltr">${c}</span><b>${i("x", "icon-sm")}</b></div>`).join("")}<div class="slot">${i("plus", "icon-sm")}<span>رنگ چهارم</span></div></div>
      <div class="mini-sw">${palette.map((c) => `<span class="${sel.includes(c) ? "used" : ""}" style="background:${c}"></span>`).join("")}<span class="pip">${i("pipette", "icon-sm")}</span></div></div>
    <div class="row" style="margin-top:auto;gap:10px"><button class="btn lg">قبلی</button><div class="grow"></div><button class="btn primary lg">مرحلهٔ بعد ${i("arrow-left", "icon-sm")}</button></div>
  </main>
</div>`;

  /* ---------- V4: bento grid + sticky answers bar ---------- */
  const R = 92, cx = 120, cy = 112;
  const arc = (a0, a1) => { const p = (a) => [cx + R * Math.cos(Math.PI * (1 - a)), cy - R * Math.sin(Math.PI * (1 - a))]; const [x0, y0] = p(a0); const [x1, y1] = p(a1); return `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`; };
  const needle = 9 / 10;
  const nx = cx + (R - 26) * Math.cos(Math.PI * (1 - needle)), ny = cy - (R - 26) * Math.sin(Math.PI * (1 - needle));
  const gauge = `<svg viewBox="0 0 240 130" style="width:100%;max-width:300px;display:block;margin-inline:auto;transform:scaleX(-1)">
    <path d="${arc(0, 0.62)}" stroke="${P.carmine}" stroke-width="16" fill="none" stroke-linecap="round" opacity=".9"/>
    <path d="${arc(0.66, 0.8)}" stroke="${P.amber}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="${arc(0.84, 1)}" stroke="${P.teal}" stroke-width="16" fill="none" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="var(--ink)"/>
  </svg>`;
  const v4 = `
<div class="pub v4">
  ${top()}
  <div class="v4-wrap">
    <div class="row" style="align-items:flex-end"><div><span class="faint">مرحلهٔ ${fa(2)} از ${fa(3)}</span><h1 style="font-size:26px;font-weight:700;letter-spacing:-0.01em">سلیقهٔ شما</h1></div></div>
    <div class="bento">
      <section class="card b-a"><span class="label">از نسخهٔ جدید چقدر راضی هستید؟<span class="req">*</span></span>
        <div class="seg5">${["خیلی بد", "بد", "معمولی", "خوب", "عالی"].map((t, k) => `<span class="${k === 3 ? "on" : ""}"><b>${fa(k + 1)}</b>${t}</span>`).join("")}</div></section>
      <section class="card b-b"><span class="label">چقدر احتمال دارد ما را به دوستانتان پیشنهاد کنید؟<span class="req">*</span></span>
        <div style="position:relative">${gauge}<div class="g-val"><b>${fa(9)}</b><span>طرفدار</span></div></div>
        <div class="nps-mini">${[...Array(11).keys()].map((n) => `<span class="${n === 9 ? "on" : ""}">${fa(n)}</span>`).join("")}</div></section>
      <section class="card b-c"><span class="label">رنگ‌های دلخواه برای پوستهٔ تازه <span class="faint" style="font-weight:400">(حداکثر ${fa(4)})</span></span>
        <div class="picker">
          <div class="sv" style="--h:${P.orange}"><span class="sv-dot" style="inset-inline-start:72%;inset-block-start:16%"></span></div>
          <div style="display:grid;gap:10px;align-content:start">
            <div class="hue"><span style="inset-inline-start:91%"></span></div>
            <div class="row"><span class="sw-big" style="background:${P.orange}"></span><div class="input sm grow mono" dir="ltr">#E36414</div><button class="btn square">${i("pipette", "icon-sm")}</button></div>
            <button class="btn primary">${i("plus", "icon-sm")}افزودن این رنگ</button>
            <div class="picked">${sel.map((c) => `<span class="pk"><span class="sw" style="background:${c}"></span><span class="mono" dir="ltr">${c}</span>${i("x", "icon-sm faint")}</span>`).join("")}</div>
          </div>
        </div></section>
      <section class="card b-d"><span class="label">ایمیل برای پیگیری</span>
        <div class="row" style="gap:12px;align-items:flex-start"><div class="grow"><div class="input error" dir="ltr" style="justify-content:flex-end">sara@example</div>
        <p class="err">${i("circle-alert", "icon-sm")}نشانی ایمیل کامل نیست؛ مثلاً sara@example.com</p></div>
        <span class="pill" style="height:42px;padding-inline:14px">${i("lock", "icon-sm")}فقط برای پاسخ به شما</span></div></section>
    </div>
  </div>
  <div class="v4-bar">
    <div class="row" style="gap:18px"><span class="vb">رضایت <b>خوب</b></span><span class="vb">پیشنهاد <b>${fa(9)}</b></span><span class="vb">رنگ‌ها <b class="stack">${sel.map((c) => `<span style="background:${c}"></span>`).join("")}</b></span></div>
    <div class="grow"></div><div class="v4-prog"><span style="width:56%"></span></div><span>${fa(56)}٪</span>
    <button class="btn">قبلی</button><button class="btn accent">مرحلهٔ بعد ${i("arrow-left", "icon-sm")}</button>
  </div>
</div>`;

  return [
    { name: "06a-hosted-form-cards", title: "Hosted form A", body: v1, lang: "fa", height: 1000 },
    { name: "06b-hosted-form-focus", title: "Hosted form B", body: v2, lang: "fa", height: 900 },
    { name: "06c-hosted-form-split", title: "Hosted form C", body: v3, lang: "fa", height: 900 },
    { name: "06d-hosted-form-bento", title: "Hosted form D", body: v4, lang: "fa", height: 960 },
  ];
}
