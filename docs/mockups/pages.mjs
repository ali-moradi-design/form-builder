// Mockup pages. Static HTML only; no app code.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const i = (name, cls = "") =>
  readFileSync(`${root}node_modules/lucide-static/icons/${name}.svg`, "utf8")
    .replace(/<!--.*?-->/gs, "")
    .replace("<svg", `<svg class="icon ${cls}"`);
const fa = (v) => String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

/* ---------------- Shared pieces ---------------- */

const brand = `<div class="brand"><span class="brand-mark">${i("braces", "icon-sm")}</span>form-builder</div>`;

const builderTopbar = (form, status = `<span class="badge draft">Draft</span>`) => `
<header class="topbar">
  ${brand}
  <div class="crumb"><span>/</span><span>Forms</span><span>/</span><strong>${form}</strong>${status}</div>
  <div class="grow"></div>
  <nav class="tabs"><span class="tab on">Build</span><span class="tab">Preview</span><span class="tab">Responses</span><span class="tab">Summary</span></nav>
  <div class="grow"></div>
  <span class="saved">${i("check", "icon-sm")}Saved 12s ago</span>
  <button class="btn ghost icon-only" title="Undo">${i("undo-2")}</button>
  <button class="btn ghost icon-only" title="Redo">${i("redo-2")}</button>
  <button class="btn">${i("languages")}EN</button>
  <button class="btn primary">${i("send")}Publish</button>
</header>`;

const paletteGroups = [
  ["Text", [["type", "Short text"], ["align-left", "Long text"], ["mail", "Email"], ["phone", "Phone"], ["link", "URL"], ["lock", "Password"]]],
  ["Numbers", [["hash", "Number"], ["sliders-horizontal", "Slider"], ["star", "Rating"], ["gauge", "NPS 0–10"]]],
  ["Choice", [["chevron-down", "Select"], ["circle-dot", "Radio group"], ["square-check", "Checkboxes"], ["tags", "Tags"], ["list-ordered", "Ranking"], ["grid-3x3", "Matrix"]]],
  ["Color", [["palette", "Color"], ["swatch-book", "Color set"]]],
  ["Date and time", [["calendar", "Date"], ["calendar-range", "Date range", "dragging"], ["clock", "Time"], ["calendar-clock", "Date-time"]]],
  ["Files", [["upload", "File upload"], ["image", "Image"], ["pen-line", "Signature"]]],
  ["Structure", [["group", "Group"], ["repeat", "Repeater"], ["layers", "Step"], ["heading", "Heading"]]],
];
const palette = `
<aside class="pane start">
  <div class="pane-head"><h2>Fields</h2><div class="grow"></div><span class="kbd">/</span></div>
  <div class="search">${i("search", "icon-sm")}Search 42 field types</div>
  <div class="palette">
    ${paletteGroups
      .map(
        ([g, items]) => `<div class="group-name">${g}</div><div class="chips">${items
          .map(([ic, n, st = ""]) => `<div class="chip ${st}">${i(ic, "icon-sm")}${n}</div>`)
          .join("")}</div>`,
      )
      .join("")}
  </div>
</aside>`;

const jobCanvas = `
<main class="canvas">
  <div class="paper">
    <div class="steps">
      <div class="step on"><div class="bar"></div><span>About you</span></div>
      <div class="step"><div class="bar"></div><span>Experience</span></div>
      <div class="step"><div class="bar"></div><span>Documents</span></div>
    </div>
    <h1>Apply for Senior Frontend Engineer</h1>
    <p class="lede">Takes about 6 minutes. You can save and come back later.</p>
    <div class="grid-2">
      <div class="field"><label>Full name<span class="req">*</span></label><div class="input">Jane Doe</div></div>
      <div class="field"><label>Email<span class="req">*</span></label><div class="input">${i("mail", "icon-sm")}you@example.com</div></div>
    </div>
    <div class="field"><label>Phone</label><div class="input"><span class="muted">+44</span>${i("chevron-down", "icon-sm")}<span>7700 900000</span></div></div>
    <div class="field"><span class="label">Employment type<span class="req">*</span></span>
      <div class="choices">
        <span class="choice"><span class="radio"></span>Full-time</span>
        <span class="choice"><span class="radio"></span>Part-time</span>
        <span class="choice on"><span class="radio"></span>Contract</span>
      </div>
    </div>
    <div class="field selected">
      <span class="field-tag">${i("calendar-range", "icon-sm")}available_dates</span>
      <span class="label">Available dates<span class="req">*</span><span class="cond">${i("git-branch", "icon-sm")}Shown for Contract</span></span>
      <div class="grid-2" style="gap:0 10px">
        <div class="input">${i("calendar", "icon-sm")}Start date</div>
        <div class="input">${i("calendar", "icon-sm")}End date</div>
      </div>
      <p class="hint">Earliest start is two weeks from today.</p>
    </div>
    <div class="drop-line"></div>
    <div class="field"><label>Portfolio</label><div class="input">${i("link", "icon-sm")}https://</div></div>
    <div class="paper-foot"><span class="faint">Step 1 of 3</span><button class="btn primary">Continue</button></div>
  </div>
</main>`;

const settingsPanel = `
<aside class="pane end">
  <div class="pane-head"><span class="row">${i("calendar-range")}<h2>Date range</h2></span><div class="grow"></div>
    <button class="btn ghost icon-only">${i("copy", "icon-sm")}</button><button class="btn ghost icon-only">${i("trash-2", "icon-sm")}</button></div>
  <div class="settings">
    <div class="seg"><span class="on">Field</span><span>Validation</span><span>Logic</span><span>Style</span></div>
    <div class="set-field"><div class="label">Label <span class="lang-tag">EN</span></div><div class="input filled">Available dates</div></div>
    <div class="set-field"><div class="label">Label <span class="lang-tag">FA</span></div><div class="input filled" dir="rtl" style="font-family:'IBM Plex Sans Arabic'">تاریخ‌های در دسترس</div></div>
    <div class="set-field"><div class="label">Key</div><div class="input filled mono">available_dates</div></div>
    <div class="set-field"><div class="label">Help text <span class="lang-tag">EN</span></div><div class="input filled">Earliest start is two weeks from today.</div></div>
    <div class="switch-row"><span>Required</span><span class="switch on"></span></div>
    <div class="switch-row"><span>Half width</span><span class="switch"></span></div>
    <div class="divider"></div>
    <div class="set-field"><div class="label">Visible when</div>
      <div class="rule">
        <div class="rule-line"><span class="token k">employment_type</span><span class="op">is</span><span class="token">Contract</span></div>
        <div class="rule-line faint">${i("plus", "icon-sm")}Add condition</div>
      </div>
    </div>
    <div class="set-field"><div class="label">Earliest start</div><div class="input filled">Today + 14 days</div></div>
  </div>
</aside>`;

const json = [
  ["{", 0], [`"<k>schemaVersion</k>": <n>1</n>,`, 1], [`"<k>id</k>": "<s>job-application</s>",`, 1], [`"<k>steps</k>": [`, 1], ["{", 2],
  [`"<k>key</k>": "<s>about</s>",`, 3], [`"<k>title</k>": { "<k>en</k>": "<s>About you</s>", "<k>fa</k>": "<s>درباره شما</s>" },`, 3], [`"<k>fields</k>": [`, 3],
  [`{ "<k>type</k>": "<s>shortText</s>", "<k>key</k>": "<s>full_name</s>", "<k>required</k>": <n>true</n> },`, 4],
  [`{ "<k>type</k>": "<s>email</s>", "<k>key</k>": "<s>email</s>", "<k>required</k>": <n>true</n> },`, 4],
  [`{ "<k>type</k>": "<s>phone</s>", "<k>key</k>": "<s>phone</s>", "<k>defaultCountry</k>": "<s>GB</s>" },`, 4],
  [`{ "<k>type</k>": "<s>radio</s>", "<k>key</k>": "<s>employment_type</s>", <c>…</c> },`, 4],
  ["{", 4, 1], [`"<k>type</k>": "<s>dateRange</s>",`, 5, 1], [`"<k>key</k>": "<s>available_dates</s>",`, 5, 1],
  [`"<k>label</k>": { "<k>en</k>": "<s>Available dates</s>", "<k>fa</k>": "<s>تاریخ‌های در دسترس</s>" },`, 5, 1],
  [`"<k>required</k>": <n>true</n>,`, 5, 1], [`"<k>minStart</k>": { "<k>fromToday</k>": { "<k>days</k>": <n>14</n> } },`, 5, 1],
  [`"<k>visibleWhen</k>": {`, 5, 1], [`"<k>field</k>": "<s>employment_type</s>", "<k>op</k>": "<s>eq</s>", "<k>value</k>": "<s>contract</s>"`, 6, 1],
  ["}", 5, 1], ["},", 4, 1], [`{ "<k>type</k>": "<s>url</s>", "<k>key</k>": "<s>portfolio</s>" }`, 4], ["]", 3], ["},", 2],
  [`{ "<k>key</k>": "<s>experience</s>", <c>…</c> },`, 2], [`{ "<k>key</k>": "<s>documents</s>", <c>…</c> }`, 2], ["]", 1], ["}", 0],
];
const jsonPane = `
<aside class="pane end">
  <div class="pane-head">${i("file-json")}<h2>Schema JSON</h2><div class="grow"></div><span class="badge">Two-way</span><button class="btn ghost icon-only">${i("copy", "icon-sm")}</button></div>
  <div class="code">${json
    .map(([t, d, hl], n) => {
      const body = t
        .replace(/<k>(.*?)<\/k>/g, '<span class="c-key">$1</span>')
        .replace(/<s>(.*?)<\/s>/g, '<span class="c-str">$1</span>')
        .replace(/<n>(.*?)<\/n>/g, '<span class="c-num">$1</span>')
        .replace(/<c>(.*?)<\/c>/g, '<span class="c-pun">$1</span>');
      return `<div class="l ${hl ? "hl" : ""}"><span class="ln">${n + 1}</span>${"  ".repeat(d)}${body}</div>`;
    })
    .join("")}</div>
  <div class="statusbar"><span class="ok">${i("check", "icon-sm")}Valid schema</span><span>Synced with canvas</span><div class="grow"></div><span>Ln 14, Col 9</span></div>
</aside>`;

/* ---------------- 1. Builder ---------------- */
const builder = `<div class="app">${builderTopbar("Job application")}<div class="builder">${palette}${jobCanvas}${settingsPanel}</div></div>`;

/* ---------------- 2. Builder + JSON, dark ---------------- */
const builderJson = `<div class="app">${builderTopbar("Job application")}<div class="builder with-json">${palette}${jobCanvas}${jsonPane}</div></div>`;

/* ---------------- 3. Publish and share ---------------- */
const share = `
<div class="app">${builderTopbar("Job application", `<span class="badge live">Live, version 3</span>`)}<div class="builder">${palette}${jobCanvas}${settingsPanel}</div></div>
<div class="scrim"><div class="dialog">
  <div class="dialog-head row"><h2>Version 3 is live</h2><div class="grow"></div><button class="btn ghost icon-only">${i("x")}</button></div>
  <div class="dialog-body">
    <p class="muted">Choose how people reach the form. All three use the same published version.</p>
    <div class="share-opt"><h3>${i("globe")}Hosted link</h3>
      <div class="copybox"><span class="grow">https://form-builder.ali-moradi-develop.com/f/senior-frontend</span><button class="btn">${i("copy", "icon-sm")}Copy</button></div></div>
    <div class="share-opt"><h3>${i("code")}Embed on a website</h3>
      <div class="copybox"><span class="grow">&lt;script src="https://form-builder.ali-moradi-develop.com/embed.js"
  data-form="senior-frontend" data-lang="en" async&gt;&lt;/script&gt;</span><button class="btn">${i("copy", "icon-sm")}Copy</button></div></div>
    <div class="share-opt"><h3>${i("package")}React package</h3>
      <div class="copybox"><span class="grow">&lt;Form formId="senior-frontend" onSubmitted={…} /&gt;</span><button class="btn">${i("copy", "icon-sm")}Copy</button></div>
      <p>Or render the schema JSON yourself, without the API.</p></div>
    <div class="version-note">${i("history")}<span>Responses keep the version they were filled in. Editing the form now starts a draft of version 4; version 3 stays live until you publish again.</span></div>
  </div>
</div></div>`;

/* ---------------- 4/5. Hosted form in Persian ---------------- */
const colors = [["#1f6f68", 1], ["#e0b43c", 1], ["#d0533d", 0], ["#2c3e8f", 1], ["#8a5cc2", 0], ["#3f8f4f", 0], ["#222831", 0], ["#f2efe8", 0]];
const ratingStars = (n) => [1, 2, 3, 4, 5].map((k) => i("star", k <= n ? "" : "off")).join("");
const feedbackFields = (mobile) => `
  <div class="field"><span class="label">از نسخهٔ جدید چقدر راضی هستید؟<span class="req">*</span></span>
    <div class="rating">${ratingStars(4)}</div></div>
  <div class="field"><span class="label">چقدر احتمال دارد ما را به دوستتان پیشنهاد کنید؟<span class="req">*</span></span>
    <div class="nps">${[...Array(11).keys()].map((n) => `<span class="${n === 9 ? "on" : ""}">${fa(n)}</span>`).join("")}</div>
    <div class="nps-ends"><span>اصلاً</span><span>حتماً</span></div></div>
  <div class="field color-field"><span class="label">رنگ‌های دلخواه برای پوستهٔ تازه</span>
    <div class="swatch-grid">${colors
      .map(([c, on]) => `<span class="swatch ${on ? "on" : ""}" style="background:${c}">${on ? i("check", "icon-sm") : ""}</span>`)
      .join("")}<span class="swatch add">${i("plus", "icon-sm")}</span></div>
    <p class="hint">${fa(3)} رنگ انتخاب شده؛ حداکثر ${fa(4)} رنگ.</p></div>
  ${mobile ? "" : `<div class="field"><label>نام تیم</label><div class="input filled">طراحی محصول</div></div>`}
  <div class="field"><label>ایمیل برای پیگیری</label><div class="input filled error" dir="ltr" style="justify-content:flex-end">sara@example</div>
    <p class="err">${i("circle-alert", "icon-sm")}نشانی ایمیل کامل نیست؛ مثلاً sara@example.com</p></div>`;

const publicFa = `
<div class="public">
  <div class="paper">
    <div class="steps">
      <div class="step on"><div class="bar"></div><span>تجربه</span></div>
      <div class="step on"><div class="bar"></div><span>سلیقه</span></div>
      <div class="step"><div class="bar"></div><span>پایان</span></div>
    </div>
    <h1>نظرتان دربارهٔ نسخهٔ جدید</h1>
    <p class="lede">پاسخ‌ها فقط برای بهتر کردن محصول استفاده می‌شوند.</p>
    ${feedbackFields(false)}
    <div class="paper-foot"><button class="btn">قبلی</button><span class="faint">مرحلهٔ ${fa(2)} از ${fa(3)}</span><button class="btn primary">ادامه</button></div>
  </div>
  <div class="public-foot">${i("braces", "icon-sm")}ساخته‌شده با form-builder</div>
</div>`;

const mobileFa = `
<div style="display:flex;flex-direction:column;height:100vh">
  <div class="m-head"><strong>نظرتان دربارهٔ نسخهٔ جدید</strong><div class="grow"></div><span class="faint">${fa(2)} / ${fa(3)}</span></div>
  <div class="steps" style="padding:12px 18px 0;margin:0;background:var(--surface)">
    <div class="step on"><div class="bar"></div></div><div class="step on"><div class="bar"></div></div><div class="step"><div class="bar"></div></div>
  </div>
  <div class="m-body">${feedbackFields(true)}</div>
  <div class="m-foot"><button class="btn">قبلی</button><button class="btn primary">ادامه</button></div>
</div>`;

/* ---------------- 6. Responses ---------------- */
const sideNav = (on) => `
<nav class="sidenav">
  <div class="nav-item">${i("layout-template")}All forms</div>
  <div class="nav-label">Product feedback</div>
  ${[["pen-line", "Build"], ["list", "Responses"], ["gauge", "Summary"], ["globe", "Share"], ["send", "Webhooks"]]
    .map(([ic, n]) => `<div class="nav-item ${n === on ? "on" : ""}">${i(ic)}${n}</div>`)
    .join("")}
  <div class="grow"></div>
  <div class="nav-item">${i("lock")}API keys</div>
</nav>`;
const pageTopbar = (theme) => `
<header class="topbar">${brand}<div class="grow"></div>
  <button class="btn ghost icon-only">${i(theme === "dark" ? "moon" : "sun")}</button>
  <button class="btn">${i("languages")}EN</button>
  <span class="brand-mark" style="background:var(--surface-2);color:var(--ink);border-radius:50%;font-size:12px;font-weight:600">AM</span>
</header>`;

const rows = [
  ["Oct 18, 14:02", 3, 5, 10, ["#1f6f68", "#e0b43c"], "Team", "Export to Excel saved my week."],
  ["Oct 18, 11:47", 3, 4, 9, ["#2c3e8f"], "Pro", "Dark mode on the builder please."],
  ["Oct 17, 22:15", 3, 5, 9, ["#1f6f68", "#3f8f4f", "#222831"], "Team", "The JSON editor is the best part."],
  ["Oct 17, 09:30", 2, 3, 10, ["#d0533d"], "Free", "Persian labels look right now."],
  ["Oct 16, 18:04", 2, 4, 9, ["#8a5cc2", "#e0b43c"], "Pro", "—"],
  ["Oct 16, 10:51", 2, 5, 10, ["#1f6f68"], "Team", "Logic editor took a minute to find."],
  ["Oct 15, 16:20", 2, 4, 9, ["#2c3e8f", "#f2efe8"], "Free", "Would pay for webhooks retries."],
  ["Oct 14, 08:12", 1, 5, 10, ["#222831"], "Pro", "Repeater export as rows is great."],
];
const stars = (n) => `<span class="stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
const responses = `
<div class="app">${pageTopbar("light")}
<div class="page">${sideNav("Responses")}
<section class="main" style="position:relative">
  <div class="main-head"><div><h1>Responses</h1><p>1,284 responses across 3 versions. 86 match your filters.</p></div><div class="grow"></div>
    <button class="btn">${i("eye")}Columns</button><button class="btn primary">${i("download")}Export</button></div>
  <div class="filters">
    <span class="filter set">${i("calendar", "icon-sm")}Last 30 days${i("x", "icon-sm")}</span>
    <span class="filter">${i("history", "icon-sm")}All versions${i("chevron-down", "icon-sm")}</span>
    <span class="filter set">NPS is 9 or more${i("x", "icon-sm")}</span>
    <span class="filter">${i("plus", "icon-sm")}Add filter</span>
  </div>
  <div class="table-wrap"><table>
    <thead><tr><th><span class="check"></span></th><th>Submitted</th><th>Version</th><th>Satisfaction</th><th>NPS</th><th>Favourite colors</th><th>Plan</th><th>Comment</th></tr></thead>
    <tbody>${rows
      .map(
        ([d, v, s, n, cs, p, c], k) => `<tr class="${k === 1 ? "sel" : ""}"><td><span class="check ${k === 1 ? "on" : ""}">${k === 1 ? i("check", "icon-sm") : ""}</span></td><td class="num">${d}</td><td><span class="badge">v${v}</span></td><td>${stars(s)}</td><td class="num">${n}</td><td><span class="swatches">${cs
          .map((x) => `<span class="sw" style="background:${x}"></span>`)
          .join("")}</span></td><td>${p}</td><td class="muted">${c}</td></tr>`,
      )
      .join("")}</tbody></table>
    <div class="pager"><span>1–8 of 86</span><span class="row"><button class="btn">Previous</button><button class="btn">Next</button></span></div>
  </div>
  <div class="dialog" style="position:absolute;inset-block-start:76px;inset-inline-end:32px;width:330px;border-radius:12px">
    <div class="dialog-body" style="padding:16px;gap:12px">
      <strong>Export 86 responses</strong>
      <div class="choices" style="display:grid;grid-template-columns:repeat(3,1fr)">
        <span class="choice on" style="justify-content:center">CSV</span><span class="choice" style="justify-content:center">Excel</span><span class="choice" style="justify-content:center">JSON</span></div>
      <div><div class="label" style="font-size:12.5px;color:var(--ink-2);margin-block-end:6px">Repeaters</div>
        <div class="choices" style="display:grid;gap:6px">
          <span class="choice on"><span class="radio"></span>One JSON column per repeater</span>
          <span class="choice"><span class="radio"></span>One extra row per repeater item</span></div></div>
      <div class="switch-row" style="padding:0"><span>Only current filters</span><span class="switch on"></span></div>
      <button class="btn primary" style="justify-content:center">${i("download", "icon-sm")}Download CSV</button>
    </div>
  </div>
</section></div></div>`;

/* ---------------- 7. Summary, dark ---------------- */
const npsDist = [4, 2, 3, 5, 6, 9, 14, 38, 96, 188, 251];
const maxN = Math.max(...npsDist);
const npsBars = `<svg viewBox="0 0 440 150" style="width:100%;height:auto">
  ${npsDist
    .map((v, k) => {
      const h = Math.max(2, (v / maxN) * 120);
      const x = k * 40 + 4;
      const col = k >= 9 ? "var(--chart-1)" : k >= 7 ? "var(--chart-2)" : "var(--chart-3)";
      return `<rect x="${x}" y="${128 - h}" width="32" height="${h}" rx="3" fill="${col}"/><text x="${x + 16}" y="146" text-anchor="middle" font-size="11" fill="var(--ink-3)">${k}</text>`;
    })
    .join("")}</svg>`;
const hbars = (items) =>
  items.map(([n, v, p]) => `<div class="hbar"><span>${n}</span><span class="track"><span class="fill" style="display:block;width:${p}%"></span></span><span class="v">${v}</span></div>`).join("");
const summary = `
<div class="app">${pageTopbar("dark")}
<div class="page">${sideNav("Summary")}
<section class="main">
  <div class="main-head"><div><h1>Summary</h1><p>Product feedback, all versions, last 30 days.</p></div><div class="grow"></div>
    <span class="filter">${i("history", "icon-sm")}All versions${i("chevron-down", "icon-sm")}</span><span class="filter set">${i("calendar", "icon-sm")}Last 30 days</span></div>
  <div class="cards">
    <div class="card span-12"><div class="stat-row">
      <div class="stat"><b>1,284</b><span>Responses</span></div>
      <div class="stat"><b>87%</b><span>Finish after starting</span></div>
      <div class="stat"><b>2m 41s</b><span>Median time to finish</span></div>
      <div class="stat"><b>3</b><span>Published versions</span></div>
      <div class="stat"><b>+58</b><span>NPS score</span></div>
    </div></div>
    <div class="card span-7"><div class="row"><h3>How likely to recommend us</h3><div class="grow"></div><span class="meta">NPS 0–10, 616 answers</span></div>${npsBars}
      <div class="row meta"><span class="sw" style="background:var(--chart-3)"></span>Detractors 0–6, 7%<span class="sw" style="background:var(--chart-2);margin-inline-start:10px"></span>Passives 7–8, 22%<span class="sw" style="background:var(--chart-1);margin-inline-start:10px"></span>Promoters 9–10, 71%</div></div>
    <div class="card span-5"><div class="row"><h3>Plan</h3><div class="grow"></div><span class="meta">Single choice</span></div>
      ${hbars([["Team", "512, 40%", 40], ["Pro", "398, 31%", 31], ["Free", "301, 23%", 23], ["Enterprise", "73, 6%", 6]])}
      <div class="divider"></div>
      <div class="row"><h3>Satisfaction</h3><div class="grow"></div><span class="meta">Rating 1–5</span></div>
      <div class="stat-row"><div class="stat"><b>4.3</b><span>Average</span></div><div class="stat"><b>1</b><span>Lowest</span></div><div class="stat"><b>5</b><span>Highest</span></div><div class="stat"><b>62%</b><span>Gave 5 stars</span></div></div></div>
    <div class="card span-12"><div class="row"><h3>Favourite colors for the new theme</h3><div class="grow"></div><span class="meta">Color set, 2.4 colors per answer</span></div>
      <div class="color-freq">${[["#1f6f68", 641, "50%"], ["#2c3e8f", 455, "35%"], ["#e0b43c", 402, "31%"], ["#222831", 380, "30%"], ["#8a5cc2", 214, "17%"], ["#d0533d", 177, "14%"]]
        .map(([c, n, p]) => `<div class="cf"><span class="blk" style="background:${c}"></span><span><b>${n}</b> ${p}</span><span class="mono">${c}</span></div>`)
        .join("")}</div></div>
  </div>
</section></div></div>`;

/* ---------------- 8. Forms list ---------------- */
const spark = (pts) => {
  const max = Math.max(...pts);
  const d = pts.map((v, k) => `${(k / (pts.length - 1)) * 120},${26 - (v / max) * 24}`).join(" ");
  return `<svg class="spark" viewBox="0 0 120 28"><polyline points="${d}" fill="none" stroke="var(--chart-1)" stroke-width="1.75" stroke-linejoin="round"/></svg>`;
};
const forms = [
  ["Product feedback", "Edited 2 hours ago", `<span class="badge live">Live, v3</span>`, "1,284", [3, 5, 4, 8, 7, 9, 12, 10, 14, 13]],
  ["Senior Frontend Engineer", "Edited 5 minutes ago", `<span class="badge draft">Draft of v4</span>`, "212", [1, 2, 4, 3, 6, 5, 7, 6, 9, 8]],
  ["Chart widget settings", "Used by the dashboard demo", `<span class="badge live">Live, v7</span>`, "0", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  ["Customer onboarding", "Edited yesterday", `<span class="badge live">Live, v2</span>`, "58", [2, 1, 3, 2, 2, 4, 3, 5, 4, 6]],
  ["Spring meetup registration", "Closed Sep 30", `<span class="badge">Closed</span>`, "340", [9, 12, 15, 11, 8, 6, 3, 1, 0, 0]],
];
const formsPage = `
<div class="app">${pageTopbar("light")}
<div class="page">
<nav class="sidenav">
  <div class="nav-item on">${i("layout-template")}Forms</div>
  <div class="nav-item">${i("layers")}Templates</div>
  <div class="nav-item">${i("lock")}API keys</div>
  <div class="nav-item">${i("send")}Webhooks</div>
  <div class="grow"></div>
  <div class="nav-item">${i("info")}Demo data resets nightly</div>
</nav>
<section class="main">
  <div class="main-head"><div><h1>Forms</h1><p>Build a form, publish it, and use it anywhere.</p></div></div>
  <div class="new-menu">
    <div class="new-opt"><span class="ico">${i("plus")}</span><div><b>Blank form</b><span>Start with an empty canvas.</span></div></div>
    <div class="new-opt"><span class="ico">${i("layout-template")}</span><div><b>From a template</b><span>Job application, onboarding, feedback and more.</span></div></div>
    <div class="new-opt"><span class="ico">${i("braces")}</span><div><b>From sample JSON</b><span>Paste data; we guess the fields, you adjust.</span></div></div>
  </div>
  <div class="section-title">Your forms <span class="faint" style="font-weight:400;font-size:13px">5</span></div>
  <div class="form-rows">${forms
    .map(
      ([t, s, b, n, pts]) => `<div class="form-row"><div><div class="t">${t}</div><div class="s">${s}</div></div><div>${b}</div><div class="num">${n}<div class="s">responses</div></div>${
        n === "0" ? `<span class="s">Schema served by API</span>` : spark(pts)
      }<button class="btn ghost icon-only">${i("ellipsis")}</button></div>`,
    )
    .join("")}</div>
</section></div></div>`;

/* ---------------- 9. Infer from sample JSON ---------------- */
const inferRows = [
  ["name", '"Sara Ahmadi"', "type", "Short text"],
  ["email", '"sara@example.com"', "mail", "Email"],
  ["joined", '"2026-03-14"', "calendar", "Date"],
  ["brandColor", '"#1f6f68"', "palette", "Color"],
  ["seats", "12", "hash", "Number"],
  ["newsletter", "true", "toggle-left", "Switch"],
  ["address", "{ … }", "group", "Group, 4 fields"],
  ["shareholders", "[ { … }, { … } ]", "repeat", "Repeater, 3 fields"],
];
const infer = `
${formsPage}
<div class="scrim"><div class="dialog" style="width:860px">
  <div class="dialog-head row"><h2>New form from sample JSON</h2><div class="grow"></div><button class="btn ghost icon-only">${i("x")}</button></div>
  <div class="dialog-body" style="grid-template-columns:1fr 1fr;gap:18px">
    <div style="display:grid;gap:8px;align-content:start"><span class="muted" style="font-size:13px">Paste one record</span>
      <div class="copybox" style="display:block;white-space:pre;line-height:1.7;padding:12px">{
  <span class="c-key">"name"</span>: <span class="c-str">"Sara Ahmadi"</span>,
  <span class="c-key">"email"</span>: <span class="c-str">"sara@example.com"</span>,
  <span class="c-key">"joined"</span>: <span class="c-str">"2026-03-14"</span>,
  <span class="c-key">"brandColor"</span>: <span class="c-str">"#1f6f68"</span>,
  <span class="c-key">"seats"</span>: <span class="c-num">12</span>,
  <span class="c-key">"newsletter"</span>: <span class="c-num">true</span>,
  <span class="c-key">"address"</span>: { <span class="c-key">"city"</span>: <span class="c-str">"Tehran"</span>, <span class="c-pun">…</span> },
  <span class="c-key">"shareholders"</span>: [
    { <span class="c-key">"name"</span>: <span class="c-str">"Ali"</span>, <span class="c-key">"share"</span>: <span class="c-num">60</span> },
    { <span class="c-key">"name"</span>: <span class="c-str">"Mina"</span>, <span class="c-key">"share"</span>: <span class="c-num">40</span> }
  ]
}</div></div>
    <div style="display:grid;gap:8px;align-content:start"><span class="muted" style="font-size:13px">Detected fields, change any type before creating</span>
      <div class="table-wrap"><table><tbody>${inferRows
        .map(([k, v, ic, t]) => `<tr><td class="mono">${k}</td><td><span class="filter" style="height:28px">${i(ic, "icon-sm")}${t}${i("chevron-down", "icon-sm")}</span></td></tr>`)
        .join("")}</tbody></table></div></div>
  </div>
  <div class="paper-foot" style="margin:0;padding:14px 24px;justify-content:flex-end;gap:8px"><button class="btn">Cancel</button><button class="btn primary">Create form with 8 fields</button></div>
</div></div>`;

export const pages = [
  { name: "01-forms-list", title: "Forms", body: formsPage },
  { name: "02-builder", title: "Builder", body: builder },
  { name: "03-builder-json-dark", title: "Builder JSON", body: builderJson, theme: "dark" },
  { name: "04-publish-share", title: "Publish", body: share },
  { name: "05-infer-from-json", title: "Infer from JSON", body: infer },
  { name: "06-hosted-form-fa", title: "Hosted form", body: publicFa, lang: "fa" },
  { name: "07-hosted-form-fa-mobile-dark", title: "Hosted form mobile", body: mobileFa, lang: "fa", theme: "dark", width: 390, height: 844 },
  { name: "08-responses", title: "Responses", body: responses },
  { name: "09-summary-dark", title: "Summary", body: summary, theme: "dark" },
];
