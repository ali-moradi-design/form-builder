// Mockup pages. Static HTML only; no app code.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { makeVariants } from "./variants.mjs";

const root = fileURLToPath(new URL(".", import.meta.url));
const i = (name, cls = "") =>
  readFileSync(`${root}node_modules/lucide-static/icons/${name}.svg`, "utf8")
    .replace(/<!--.*?-->/gs, "")
    .replace("<svg", `<svg class="icon ${cls}"`);
const fa = (v) => String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
export const LOGO = `<svg class="mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="formweave"><g transform="translate(0 0) scale(1)">
  <rect width="64" height="64" rx="16" fill="#5f0f40"/>
  <path d="M22 50.5 V27 Q22 18.5 30.5 18.5 H47.5" fill="none" stroke-linecap="round" stroke="#fb8b24" stroke-width="9.5"/>
  <path d="M13.5 35 H39" fill="none" stroke-linecap="round" stroke="#5f0f40" stroke-width="16"/>
  <path d="M13.5 35 H39" fill="none" stroke-linecap="round" stroke="#fff4e8" stroke-width="9.5"/>
  <circle cx="45.5" cy="47" r="5" fill="#e36414"/>
</g></svg>`;
const heart = () => i("heart", "icon-sm heart");
export const CREDIT_EN = () => `<div class="credit">Made with ${heart()} by Ali Moradi</div>`;
export const CREDIT_FA = () => `<div class="credit">ساخته‌شده با ${heart()} توسط علی مرادی</div>`;
const P = { plum: "#5f0f40", carmine: "#9a031e", amber: "#fb8b24", orange: "#e36414", teal: "#0f4c5c" };

/* ---------------- Illustration (paper checklist + pencil), drawn for the hero banner ---------------- */
const art = `
<svg class="hero-art" viewBox="0 0 300 170" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <g fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.5"><circle cx="58" cy="44" r="26"/><circle cx="58" cy="44" r="38" stroke-dasharray="3 6"/></g>
  <text x="58" y="52" text-anchor="middle" font-family="Geist Mono" font-size="22" font-weight="500" fill="#fff" fill-opacity=".9">{ }</text>
  <g transform="rotate(-7 190 90)">
    <path d="M122 16 H262 a7 7 0 0 1 7 7 V150 H134 q-16 0 -16 -16 V20 a4 4 0 0 1 4 -4z" fill="#fff" stroke="#141a1c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M118 132 q0 18 16 18 q-9 -4 -7 -18 z" fill="#e7e8e6" stroke="#141a1c" stroke-width="2.5" stroke-linejoin="round"/>
    <g stroke="${P.teal}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M137 40 l5 5 l9 -10"/><path d="M137 64 l5 5 l9 -10"/><path d="M137 112 l5 5 l9 -10"/>
    </g>
    <rect x="160" y="36" width="84" height="7" rx="3.5" fill="#e3e5e2"/>
    <rect x="160" y="60" width="64" height="7" rx="3.5" fill="#e3e5e2"/>
    <rect x="136" y="84" width="14" height="14" rx="4" fill="none" stroke="#c9ccc8" stroke-width="2"/>
    <rect x="160" y="84" width="16" height="14" rx="4" fill="${P.teal}"/><rect x="180" y="84" width="16" height="14" rx="4" fill="${P.orange}"/><rect x="200" y="84" width="16" height="14" rx="4" fill="${P.amber}"/>
    <rect x="160" y="108" width="76" height="7" rx="3.5" fill="#e3e5e2"/>
  </g>
  <g transform="translate(236 104) rotate(-40)">
    <rect x="-6" y="-46" width="16" height="76" rx="2" fill="${P.amber}" stroke="#141a1c" stroke-width="2.5"/>
    <rect x="-6" y="-58" width="16" height="13" rx="3" fill="${P.carmine}" stroke="#141a1c" stroke-width="2.5"/>
    <path d="M-6 30 L2 48 L10 30 z" fill="#f6e3c8" stroke="#141a1c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M-1 41 L2 48 L5 41 z" fill="#141a1c"/>
    <line x1="2" y1="-44" x2="2" y2="28" stroke="#141a1c" stroke-opacity=".25" stroke-width="2"/>
  </g>
  <g fill="${P.amber}"><path d="M92 120 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z"/><circle cx="282" cy="30" r="4"/><circle cx="104" cy="22" r="2.5" fill="#fff" fill-opacity=".6"/></g>
</svg>`;

/* ---------------- Shell ---------------- */
const sidebar = (on, dark = false) => {
  const nav = (ic, t, extra = "", key = t) => `<div class="nav ${on === key ? "on" : ""}">${i(ic)}${t}${extra}</div>`;
  const sub = (t, extra = "") => `<div class="nav ${on === t ? "on" : ""}">${t}${extra}</div>`;
  return `
<aside class="sb">
  <div class="sb-brand"><span class="logo">${LOGO}</span>formweave<div class="grow"></div><span class="faint">${i("panel-left")}</span></div>
  <div class="sb-search">${i("search", "icon-sm")}Search<div class="grow"></div><span class="kbd">⌘ K</span></div>
  <div class="sb-label">Main menu</div>
  ${nav("layout-dashboard", "Dashboard")}
  ${nav("file-text", "Forms", `<span class="chev">${i("chevron-down", "icon-sm")}</span>`, "Forms")}
  <div class="sub">${sub("All forms")}${sub("Drafts", `<span class="grow"></span><span class="count">2</span>`)}${sub("Templates")}</div>
  ${nav("inbox", "Responses", `<span class="grow"></span><span class="count hot">12</span>`)}
  ${nav("chart-column", "Analytics")}
  ${nav("plug", "Integrations", `<span class="chev">${i("chevron-down", "icon-sm")}</span>`)}
  <div class="sb-label">Support</div>
  ${nav("book-open", "Docs")}
  ${nav("users", "Team & roles")}
  ${nav("life-buoy", "Help & support")}
  <div class="promo">
    <div class="promo-top"><span class="promo-ico">${i("sparkles")}</span></div>
    <div class="promo-body"><b>Demo workspace</b><span>Data resets every night. Create an account to keep your forms.</span>
      <button class="btn">${i("user-plus", "icon-sm")}Create account</button></div>
  </div>
  <div class="sb-foot">
    ${nav("settings", "Settings")}
    <div class="nav">${i("moon")}Dark mode<div class="grow"></div><span class="toggle ${dark ? "on" : ""}"></span></div>
    ${CREDIT_EN()}
  </div>
</aside>`;
};
const topbar = (crumbs) => `
<div class="tb">
  <div class="crumbs">${crumbs.map((c, k) => (k === crumbs.length - 1 ? `<span class="here">${c}</span>` : `<span>${c}</span><span class="faint">/</span>`)).join("")}</div>
  <div class="grow"></div>
  <button class="btn square">${i("circle-help")}</button>
  <button class="btn square">${i("bell")}<span class="dot"></span></button>
  <button class="btn square"><span class="av" style="background:${P.plum};width:24px;height:24px;font-size:10px">AM</span></button>
</div>`;
const shell = (on, crumbs, body, dark = false) =>
  `<div class="shell">${sidebar(on, dark)}<main class="content">${topbar(crumbs)}${body}</main></div>`;

/* ---------------- 01 Dashboard ---------------- */
const statCard = (tile, ic, label, val, delta, cls) => `
<div class="card stat s3"><div class="stat-top"><span class="tile ${tile}">${i(ic)}</span>${label}<div class="grow"></div>${i("ellipsis", "icon-sm")}</div>
  <div class="stat-val"><b>${val}</b><span class="pill ${cls}">${delta}</span></div></div>`;
const forms = [
  ["file-text", "t", "Product feedback", "5 fields, 3 steps", "<span class='pill live'>Live, v3</span>", "1,284", 87],
  ["file-pen-line", "o", "Senior Frontend Engineer", "Draft of v4, edited 5 min ago", "<span class='pill draft'>Draft</span>", "212", 64],
  ["layout-dashboard", "p", "Chart widget settings", "Served by API to the dashboard demo", "<span class='pill live'>Live, v7</span>", "—", 0],
  ["users", "r", "Customer onboarding", "Shareholder repeater, 2 languages", "<span class='pill live'>Live, v2</span>", "58", 71],
  ["calendar-days", "t", "Spring meetup registration", "Closed Sep 30", "<span class='pill'>Closed</span>", "340", 92],
];
const week = [120, 164, 141, 198, 176, 230, 255];
const weekBars = `<svg viewBox="0 0 280 150" style="width:100%;height:auto">
  ${week.map((v, k) => { const h = (v / 260) * 112; const x = 8 + k * 39; return `<rect x="${x}" y="${120 - h}" width="26" height="${h}" rx="6" fill="${k === 6 ? P.orange : "var(--c1)"}" ${k === 6 ? "" : 'opacity=".85"'}/><text x="${x + 13}" y="142" text-anchor="middle" font-size="11" fill="var(--ink-3)" font-family="Geist Sans">${"MTWTFSS"[k]}</text>`; }).join("")}
  <line x1="0" x2="280" y1="120.5" y2="120.5" stroke="var(--line)"/>
</svg>`;
const dashboard = shell("Dashboard", ["Dashboard"], `
<div class="ph-head"><div><h1>Dashboard</h1><p>How your forms did in the last 7 days.</p></div><div class="grow"></div>
  <button class="btn">${i("calendar-days", "icon-sm")}Last 7 days${i("chevron-down", "icon-sm")}</button><button class="btn primary">${i("plus", "icon-sm")}New form</button></div>
<div class="grid12">
  ${statCard("t", "inbox", "Responses", "1,284", "+12%", "up")}
  ${statCard("o", "circle-check-big", "Completion rate", "87%", "+3%", "up")}
  ${statCard("p", "file-text", "Live forms", "6", "2 drafts", "")}
  ${statCard("r", "timer", "Median time to finish", "2m 41s", "−8s", "up")}
  <div class="hero s8"><div><h2>Turn a sample record into a form</h2>
    <p>Paste one JSON record. Dates, colors, groups and repeaters are detected for you, then you fine-tune in the builder.</p>
    <div class="row"><button class="btn">${i("braces", "icon-sm")}Start from JSON</button><button class="btn ghost-w">Browse templates</button></div></div>${art}</div>
  <div class="card s4"><div class="card-head"><h2>Latest responses</h2><div class="grow"></div><span class="sub-t">Live</span></div>
    <div class="feed">
      ${[["SA", P.teal, "sara@example.com", "Product feedback, NPS 10", "2m"], ["MR", P.orange, "m.rahimi@studio.io", "Senior Frontend Engineer", "18m"], ["JD", P.plum, "jane@acme.co", "Customer onboarding", "1h"]]
        .map(([a, c, n, f, t]) => `<div class="fi"><span class="av" style="background:${c}">${a}</span><div><b>${n}</b><p>${f}</p></div><time>${t}</time></div>`).join("")}
    </div></div>
  <div class="card s8"><div class="card-head"><h2>Your forms</h2><span class="sub-t">6 forms</span><div class="grow"></div><span class="chip-f">${i("filter", "icon-sm")}All statuses</span></div>
    <table style="margin-top:8px"><thead><tr><th style="padding-inline-start:20px">Form</th><th>Status</th><th>Responses</th><th>Completion</th><th></th></tr></thead><tbody>
    ${forms.map(([ic, t, n, s, st, r, c]) => `<tr><td style="padding-inline-start:20px"><div class="row" style="gap:12px"><span class="tile ${t}">${i(ic)}</span><div><div style="font-weight:500">${n}</div><div class="faint" style="font-size:12px">${s}</div></div></div></td><td>${st}</td><td class="num">${r}</td>
      <td>${c ? `<div class="row"><span class="bar" style="width:90px"><i style="width:${c}%;background:${c > 80 ? "var(--c1)" : P.amber}"></i></span><span class="num faint">${c}%</span></div>` : `<span class="faint">API only</span>`}</td><td>${i("ellipsis", "icon-sm")}</td></tr>`).join("")}
    </tbody></table></div>
  <div class="card s4"><div class="card-head"><h2>Responses by day</h2><div class="grow"></div><span class="pill up">${i("trending-up", "icon-sm")}+12%</span></div>
    <div style="padding:14px 20px 16px">${weekBars}</div></div>
</div>`);

/* ---------------- Builder pieces ---------------- */
const palGroups = [
  ["Text", "t", [["type", "Short text"], ["align-left", "Long text"], ["mail", "Email"], ["phone", "Phone"], ["link", "URL"], ["lock", "Password"]]],
  ["Numbers", "o", [["hash", "Number"], ["banknote", "Currency"], ["star", "Rating"], ["gauge", "NPS 0–10"]]],
  ["Choice", "p", [["chevron-down", "Select"], ["circle-dot", "Radio"], ["square-check", "Checkboxes"], ["list-ordered", "Ranking"]]],
  ["Color", "r", [["palette", "Color"], ["swatch-book", "Color set"]]],
  ["Date and time", "t", [["calendar", "Date"], ["calendar-range", "Date range", "ghost"], ["clock", "Time"], ["calendar-clock", "Date-time"]]],
  ["Files", "o", [["upload", "File upload"], ["pen-line", "Signature"]]],
  ["Structure", "p", [["group", "Group"], ["repeat", "Repeater"]]],
];
const palette = `
<section class="panel">
  <div class="panel-head"><h2>Fields</h2><span class="faint" style="font-size:12px">42 types</span><div class="grow"></div><span class="kbd">/</span></div>
  <div style="padding:0 12px"><div class="sb-search" style="margin:0">${i("search", "icon-sm")}Search fields</div></div>
  <div class="pal">${palGroups.map(([g, t, items]) => `<div class="pal-g">${g}</div><div class="pal-chips">${items.map(([ic, n, st = ""]) => `<div class="pchip ${st}"><span class="ti ${t}">${i(ic)}</span>${n}</div>`).join("")}</div>`).join("")}</div>
</section>`;
const builderBar = (status) => `
<header class="btop">
  <span class="logo">${LOGO}</span>
  <div class="crumbs"><span>Forms</span><span class="faint">/</span><span class="here">Job application</span>${status}</div>
  <div class="grow"></div>
  <div class="seg"><span class="on">${i("pen-line", "icon-sm")}Build</span><span>${i("git-branch", "icon-sm")}Logic</span><span>${i("eye", "icon-sm")}Preview</span><span>${i("inbox", "icon-sm")}Responses</span></div>
  <div class="grow"></div>
  <span class="faint row" style="font-size:12.5px">${i("check", "icon-sm")}Saved</span>
  <button class="btn square">${i("undo-2")}</button><button class="btn square">${i("redo-2")}</button>
  <button class="btn">${i("languages", "icon-sm")}EN</button>
  <button class="btn primary">${i("send", "icon-sm")}Publish</button>
</header>`;
const jobSheet = `
<div class="canvas-wrap">
  <div class="pchip dragged" style="inset-block-start:488px;inset-inline-start:250px"><span class="ti t">${i("calendar-range")}</span>Date range</div>
  <div class="sheet">
    <div class="nstep" style="margin-bottom:10px"><span class="ns cur"><b>1</b>About you</span><span class="ns"><b>2</b>Experience</span><span class="ns"><b>3</b>Documents</span></div>
    <div class="track2" style="margin-bottom:18px"><span class="c" style="width:33%"></span><span class="r"></span></div>
    <h1>Apply for Senior Frontend Engineer</h1>
    <p class="lede">Takes about 6 minutes. You can save and come back later.</p>
    <div class="grid2">
      <div class="fld"><span class="label">Full name<span class="req">*</span></span><div class="input ph">Jane Doe</div></div>
      <div class="fld"><span class="label">Email<span class="req">*</span></span><div class="input ph">${i("mail", "icon-sm")}you@example.com</div></div>
    </div>
    <div class="fld"><span class="label">Employment type<span class="req">*</span></span>
      <div class="choices"><span class="choice"><span class="radio"></span>Full-time</span><span class="choice"><span class="radio"></span>Part-time</span><span class="choice on"><span class="radio on"></span>Contract</span></div></div>
    <div class="fld sel"><span class="ftag">${i("calendar-range", "icon-sm")}available_dates</span>
      <span class="label">Available dates<span class="req">*</span><span class="cond">${i("git-branch", "icon-sm")}Only for Contract</span></span>
      <div class="grid2" style="gap:0 10px"><div class="input ph">${i("calendar", "icon-sm")}Start date</div><div class="input ph">${i("calendar", "icon-sm")}End date</div></div>
      <p class="hint">Earliest start is two weeks from today.</p></div>
    <div class="dropline"></div>
    <div class="fld"><span class="label">Day rate</span><div class="input">650<span class="unit">GBP / day</span></div></div>
    <div class="sheet-foot"><button class="btn">Back</button><button class="btn primary">Continue</button></div>
  </div>
</div>`;
const settings = `
<section class="panel">
  <div class="panel-head"><span class="tile t" style="width:28px;height:28px">${i("calendar-range", "icon-sm")}</span><h2>Date range</h2><div class="grow"></div>
    <button class="btn ghost square">${i("copy", "icon-sm")}</button><button class="btn ghost square">${i("trash-2", "icon-sm")}</button></div>
  <div class="tabs-u"><span class="on">Field</span><span>Validation</span><span>Logic</span><span>Style</span></div>
  <div class="setp">
    <div><div class="label">Label <span class="lang">EN</span></div><div class="input sm">Available dates</div></div>
    <div><div class="label">Label <span class="lang">FA</span></div><div class="input sm" dir="rtl" style="font-family:Vazirmatn">تاریخ‌هایی که در دسترس هستید</div></div>
    <div><div class="label">Key</div><div class="input sm mono">available_dates</div></div>
    <div class="nest" style="padding:4px 14px"><div class="nest-head" style="height:38px">Required<span class="toggle on"></span></div><div class="nest-head" style="height:38px;border-top:1px solid var(--line)">Half width<span class="toggle"></span></div></div>
    <div><div class="label">Visible when</div><div class="rule"><div class="rule-l"><span class="tok k">employment_type</span><span class="faint">is</span><span class="tok">Contract</span></div><div class="rule-l faint">${i("plus", "icon-sm")}Add condition</div></div></div>
    <div><div class="label">Earliest start</div><div class="input sm">14<span class="unit">days from today</span></div></div>
  </div>
</section>`;
const jsonLines = [
  ["{", 0], [`<k>"schemaVersion"</k>: <n>1</n>,`, 1], [`<k>"id"</k>: <s>"job-application"</s>,`, 1], [`<k>"steps"</k>: [{`, 1],
  [`<k>"key"</k>: <s>"about"</s>,`, 2], [`<k>"title"</k>: { <k>"en"</k>: <s>"About you"</s>, <k>"fa"</k>: <s>"دربارهٔ شما"</s> },`, 2], [`<k>"fields"</k>: [`, 2],
  [`{ <k>"type"</k>: <s>"shortText"</s>, <k>"key"</k>: <s>"full_name"</s>, <k>"required"</k>: <n>true</n> },`, 3],
  [`{ <k>"type"</k>: <s>"email"</s>, <k>"key"</k>: <s>"email"</s>, <k>"required"</k>: <n>true</n> },`, 3],
  [`{ <k>"type"</k>: <s>"radio"</s>, <k>"key"</k>: <s>"employment_type"</s>, <c>…</c> },`, 3],
  ["{", 3, 1], [`<k>"type"</k>: <s>"dateRange"</s>,`, 4, 1], [`<k>"key"</k>: <s>"available_dates"</s>,`, 4, 1], [`<k>"label"</k>: { <k>"en"</k>: <s>"Available dates"</s>, <k>"fa"</k>: <c>…</c> },`, 4, 1],
  [`<k>"required"</k>: <n>true</n>,`, 4, 1], [`<k>"minStart"</k>: { <k>"fromToday"</k>: { <k>"days"</k>: <n>14</n> } },`, 4, 1],
  [`<k>"visibleWhen"</k>: {`, 4, 1], [`<k>"field"</k>: <s>"employment_type"</s>, <k>"op"</k>: <s>"eq"</s>, <k>"value"</k>: <s>"contract"</s>`, 5, 1], ["}", 4, 1], ["},", 3, 1],
  [`{ <k>"type"</k>: <s>"currency"</s>, <k>"key"</k>: <s>"day_rate"</s>, <k>"currency"</k>: <s>"GBP"</s> }`, 3], ["]", 2], ["}, <c>…</c>]", 1], ["}", 0],
];
const color = (t) => t.replace(/<k>(.*?)<\/k>/g, '<span class="ck">$1</span>').replace(/<s>(.*?)<\/s>/g, '<span class="cs">$1</span>').replace(/<n>(.*?)<\/n>/g, '<span class="cn">$1</span>').replace(/<c>(.*?)<\/c>/g, '<span class="cp">$1</span>');
const jsonPanel = `
<section class="panel">
  <div class="panel-head"><span class="tile o" style="width:28px;height:28px">${i("braces", "icon-sm")}</span><h2>Schema JSON</h2><span class="pill">Two-way sync</span><div class="grow"></div><button class="btn ghost square">${i("copy", "icon-sm")}</button></div>
  <div class="code" style="margin:0 12px;flex:1;border-radius:10px">${jsonLines.map(([t, d, h], n) => `<span class="${h ? "hl" : ""}"><span class="ln">${n + 1}</span>${"  ".repeat(d)}${color(t)}</span>${h ? "" : "\n"}`).join("")}</div>
  <div class="statusbar" style="margin-top:10px"><span class="ok">${i("check", "icon-sm")}Valid schema</span><span>Synced with canvas</span><div class="grow"></div><span>Ln 12, Col 9</span></div>
</section>`;
const builder = (right, cls = "", status = `<span class="pill draft">Draft</span>`) => `<div class="bshell">${builderBar(status)}<div class="bgrid ${cls}">${palette}${jobSheet}${right}</div></div>`;

/* ---------------- 04 Publish ---------------- */
const publish = `${builder(settings, "", `<span class="pill live">Live, v3</span>`)}
<div class="scrim"><div class="dialog" style="width:760px">
  <div class="row" style="padding:22px 24px 6px;gap:12px"><span class="tile t" style="width:40px;height:40px">${i("rocket")}</span><div><h2 style="font-size:18px;font-weight:600;letter-spacing:-0.01em">Version 3 is live</h2><p class="muted">Pick how people reach the form. Every option serves this version.</p></div><div class="grow"></div><button class="btn ghost square">${i("x")}</button></div>
  <div style="padding:16px 24px;display:grid;gap:14px">
    <div class="share">
      <div class="share-c on"><span class="tile t">${i("globe")}</span><b>Hosted link</b><span>A page on our domain. Share it anywhere.</span></div>
      <div class="share-c"><span class="tile o">${i("code")}</span><b>Embed</b><span>One script tag on any website.</span></div>
      <div class="share-c"><span class="tile p">${i("package")}</span><b>React package</b><span>&lt;Form formId /&gt; in your own app.</span></div>
    </div>
    <div class="copy"><span class="grow">https://form-builder.ali-moradi-develop.com/f/senior-frontend</span><button class="btn">${i("copy", "icon-sm")}Copy link</button></div>
    <div class="nest row" style="gap:12px;background:var(--brand-soft);border-color:transparent"><span class="tile p" style="background:var(--surface)">${i("history")}</span><span style="font-size:13px">Responses keep the version they were filled in. Edits from now on go into a draft of version 4.</span></div>
  </div>
  <div class="foot-actions"><button class="btn">${i("external-link", "icon-sm")}Open form</button><button class="btn primary">Done</button></div>
</div></div>`;

/* ---------------- 05 Create form wizard (reference 1) ---------------- */
const detected = [
  ["name", "type", "t", "Short text"], ["email", "mail", "t", "Email"], ["joined", "calendar", "t", "Date"], ["brandColor", "palette", "r", "Color"],
  ["seats", "hash", "o", "Number"], ["newsletter", "toggle-left", "p", "Switch"], ["address", "group", "p", "Group, 4 fields"], ["shareholders", "repeat", "o", "Repeater, 2 fields"],
];
const wizard = shell("All forms", ["Forms", "Create new form"], `
<div class="ph-head"><div><h1>Create form</h1><p>Set up a new form in 3 quick steps.</p></div><div class="grow"></div><button class="btn">${i("circle-help", "icon-sm")}Need help?</button></div>
<div class="card stepper">
  <div class="stp done"><span class="stp-ico">${i("clipboard-list", "icon-sm")}</span><span class="bar"><i></i></span><span class="stp-name">Starting point <small>Sample JSON</small></span></div>
  <div class="stp cur"><span class="stp-ico">${i("list-checks", "icon-sm")}</span><span class="bar"><i></i></span><span class="stp-name">Review fields</span></div>
  <div class="stp todo"><span class="stp-ico">${i("rocket", "icon-sm")}</span><span class="bar"></span><span class="stp-name">Name and languages</span></div>
</div>
<div class="grid12" style="flex:1">
  <div class="card s8" style="display:flex;flex-direction:column">
    <div class="card-pad" style="display:grid;gap:16px;flex:1">
      <div><h2 style="font-size:18px;font-weight:600;letter-spacing:-0.01em">Review detected fields</h2><p class="muted">We read your sample record. Change any type before the form is created.</p></div>
      <div style="display:grid;grid-template-columns:1fr 1.15fr;gap:16px">
        <div><span class="label">Sample record</span><div class="code" style="line-height:1.62">{
  <span class="ck">"name"</span>: <span class="cs">"Sara Ahmadi"</span>,
  <span class="ck">"email"</span>: <span class="cs">"sara@example.com"</span>,
  <span class="ck">"joined"</span>: <span class="cs">"2026-03-14"</span>,
  <span class="ck">"brandColor"</span>: <span class="cs">"#0f4c5c"</span>,
  <span class="ck">"seats"</span>: <span class="cn">12</span>,
  <span class="ck">"newsletter"</span>: <span class="cn">true</span>,
  <span class="ck">"address"</span>: { <span class="ck">"city"</span>: <span class="cs">"Tehran"</span> <span class="cp">…</span> },
  <span class="ck">"shareholders"</span>: [
    { <span class="ck">"name"</span>: <span class="cs">"Ali"</span>, <span class="ck">"share"</span>: <span class="cn">60</span> },
    { <span class="ck">"name"</span>: <span class="cs">"Mina"</span>, <span class="ck">"share"</span>: <span class="cn">40</span> }
  ]
}</div></div>
        <div><span class="label">Detected fields</span>
          <div style="border:1px solid var(--line);border-radius:10px;overflow:hidden">${detected.map(([k, ic, t, n], idx) => `<div class="row" style="padding:7px 10px;${idx ? "border-top:1px solid var(--line)" : ""}"><span class="mono" style="width:104px">${k}</span><div class="input sm" style="flex:1;height:32px"><span class="ti ${t}" style="width:20px;height:20px;border-radius:6px;display:grid;place-items:center">${i(ic, "icon-sm")}</span>${n}<span style="margin-inline-start:auto" class="faint">${i("chevron-down", "icon-sm")}</span></div></div>`).join("")}</div></div>
      </div>
      <div class="nest"><div class="nest-head">Ask in two languages?<span class="toggle on"></span></div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px">
          <div><span class="label">Default language</span><div class="input sm">English<span class="unit">LTR</span></div></div>
          <div><span class="label">Second language</span><div class="input sm">Persian<span class="unit">RTL</span></div></div>
          <div><span class="label">Digits in Persian</span><div class="input sm">Persian digits${i("chevron-down", "icon-sm")}</div></div>
        </div></div>
    </div>
    <div class="foot-actions"><button class="btn lg">Cancel</button><button class="btn primary lg">Next step</button></div>
  </div>
  <div class="s4" style="display:grid;gap:14px;align-content:start">
    <div class="card"><div class="sum"><h2>Form summary</h2><div class="cap">Detected from sample</div>
      <div class="kv"><span>Source</span><b>Sample JSON</b></div><div class="kv"><span>Fields</span><b>8</b></div><div class="kv"><span>Groups</span><b>1 (address)</b></div>
      <div class="kv"><span>Repeaters</span><b>1 (shareholders)</b></div><div class="kv"><span>Languages</span><b>English, Persian</b></div></div>
      <div class="total"><span>Ready to create</span><b>8 fields</b></div></div>
    <div class="card card-pad row" style="gap:12px;align-items:flex-start"><span class="tile o">${i("sparkles")}</span><div><b style="font-weight:600">Types you might want</b><p class="muted" style="font-size:12.5px;margin-top:2px">“seats” could be a slider; “brandColor” could allow several colors.</p></div></div>
  </div>
</div>`);

/* ---------------- 08 Responses ---------------- */
const rows = [
  ["SA", P.teal, "sara@example.com", "Oct 18, 14:02", 3, 5, 10, [P.teal, P.amber], "Team"],
  ["MR", P.orange, "m.rahimi@studio.io", "Oct 18, 11:47", 3, 4, 9, [P.plum], "Pro"],
  ["JD", P.plum, "jane@acme.co", "Oct 17, 22:15", 3, 5, 9, [P.teal, "#2f6f73", "#141a1c"], "Team"],
  ["NK", P.carmine, "nima.k@mail.com", "Oct 17, 09:30", 2, 3, 10, [P.carmine], "Free"],
  ["LB", P.teal, "lea@bureau.fr", "Oct 16, 18:04", 2, 4, 9, [P.orange, P.amber], "Pro"],
  ["OT", P.orange, "omid@tavana.ir", "Oct 16, 10:51", 2, 5, 10, [P.teal], "Team"],
  ["RH", P.plum, "r.hale@north.dev", "Oct 15, 16:20", 2, 4, 9, [P.plum, "#f3eee6"], "Free"],
  ["AM", P.carmine, "ana.m@pixel.es", "Oct 14, 08:12", 1, 5, 10, ["#141a1c"], "Pro"],
];
const st = (n) => `<span class="stars">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
const responses = shell("Responses", ["Product feedback", "Responses"], `
<div class="ph-head"><div><h1>Responses</h1><p>1,284 responses across 3 versions. 86 match your filters.</p></div><div class="grow"></div>
  <button class="btn">${i("eye", "icon-sm")}Columns</button><button class="btn primary">${i("download", "icon-sm")}Export</button></div>
<div class="row" style="flex-wrap:wrap">
  <span class="chip-f set">${i("calendar-days", "icon-sm")}Last 30 days${i("x", "icon-sm")}</span><span class="chip-f">${i("history", "icon-sm")}All versions${i("chevron-down", "icon-sm")}</span>
  <span class="chip-f set o">NPS is 9 or more${i("x", "icon-sm")}</span><span class="chip-f">${i("plus", "icon-sm")}Add filter</span><div class="grow"></div>
  <div class="sb-search" style="margin:0;width:240px">${i("search", "icon-sm")}Search answers</div></div>
<div class="card" style="position:relative;overflow:visible"><table>
  <thead><tr><th style="padding-inline-start:18px"><span class="check"></span></th><th>Respondent</th><th>Submitted</th><th>Version</th><th>Satisfaction</th><th>NPS</th><th>Favourite colors</th><th>Plan</th><th></th></tr></thead>
  <tbody>${rows.map(([a, c, e, d, v, s, n, cs, p], k) => `<tr class="${k === 1 ? "sel" : ""}"><td style="padding-inline-start:18px"><span class="check ${k === 1 ? "on" : ""}">${k === 1 ? i("check", "icon-sm") : ""}</span></td>
    <td><div class="row" style="gap:10px"><span class="av" style="background:${c}">${a}</span>${e}</div></td><td class="num muted">${d}</td><td><span class="pill">v${v}</span></td><td>${st(s)}</td>
    <td><span class="pill ${n === 10 ? "up" : ""} num">${n}</span></td><td><span class="row" style="gap:3px">${cs.map((x) => `<span class="sw" style="background:${x}"></span>`).join("")}</span></td><td>${p}</td><td class="faint">${i("ellipsis", "icon-sm")}</td></tr>`).join("")}</tbody></table>
  <div class="foot-actions" style="padding:12px 18px"><span class="muted" style="font-size:12.5px">1–8 of 86</span><span class="row"><button class="btn">Previous</button><button class="btn">Next</button></span></div>
  <div class="dialog" style="position:absolute;inset-block-start:-58px;inset-inline-end:0;width:340px;border-radius:14px">
    <div style="padding:16px;display:grid;gap:14px">
      <div class="row"><span class="tile t">${i("download", "icon-sm")}</span><b style="font-weight:600">Export 86 responses</b></div>
      <div class="opts" style="gap:8px">${["CSV", "Excel", "JSON"].map((f, k) => `<div class="opt ${k ? "" : "on"}" style="justify-content:center;padding:9px"><b>${f}</b></div>`).join("")}</div>
      <div><span class="label" style="font-size:12.5px;color:var(--ink-2)">Repeaters</span>
        <div style="display:grid;gap:8px"><span class="choice on"><span class="radio on"></span>One JSON column per repeater</span><span class="choice"><span class="radio"></span>One extra row per item</span></div></div>
      <div class="nest-head" style="font-size:13px">Only current filters<span class="toggle on"></span></div>
      <button class="btn primary" style="width:100%">${i("download", "icon-sm")}Download CSV</button>
    </div></div>
</div>`);

/* ---------------- 09 Summary, dark ---------------- */
const npsDist = [4, 2, 3, 5, 6, 9, 14, 38, 96, 188, 251];
const npsSvg = `<svg viewBox="0 0 470 170" style="width:100%;height:auto">
  ${[0, 1, 2, 3].map((g) => `<line x1="0" x2="470" y1="${20 + g * 36.5}" y2="${20 + g * 36.5}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join("")}
  ${npsDist.map((v, k) => { const h = Math.max(3, (v / 260) * 128); const x = 6 + k * 42.4; const c = k >= 9 ? "var(--c1)" : k >= 7 ? P.amber : P.carmine; return `<rect x="${x}" y="${148 - h}" width="32" height="${h}" rx="6" fill="${c}"/><text x="${x + 16}" y="166" text-anchor="middle" font-size="11" fill="var(--ink-3)" font-family="Geist Sans">${k}</text>`; }).join("")}
</svg>`;
const hbar = (n, v, p, c) => `<div class="hbar"><span>${n}</span><span class="tr"><i style="width:${p}%;background:${c}"></i></span><span class="v">${v}</span></div>`;
const summary = shell("Analytics", ["Product feedback", "Analytics"], `
<div class="ph-head"><div><h1>Analytics</h1><p>Product feedback, all versions, last 30 days.</p></div><div class="grow"></div>
  <span class="chip-f">${i("history", "icon-sm")}All versions${i("chevron-down", "icon-sm")}</span><span class="chip-f set">${i("calendar-days", "icon-sm")}Last 30 days</span></div>
<div class="grid12">
  ${statCard("t", "inbox", "Responses", "1,284", "+12%", "up")}
  ${statCard("o", "circle-check-big", "Finish after starting", "87%", "+3%", "up")}
  ${statCard("p", "gauge", "NPS score", "+58", "+6", "up")}
  ${statCard("r", "star", "Average satisfaction", "4.3", "−0.1", "down")}
  <div class="card s7"><div class="card-head"><h2>How likely to recommend us</h2><div class="grow"></div><span class="sub-t">616 answers</span></div>
    <div style="padding:12px 20px 16px;display:grid;gap:10px">${npsSvg}
      <div class="legend"><span><i class="sw" style="background:${P.carmine}"></i>Detractors 0–6, 7%</span><span><i class="sw" style="background:${P.amber}"></i>Passives 7–8, 22%</span><span><i class="sw" style="background:var(--c1)"></i>Promoters 9–10, 71%</span></div></div></div>
  <div class="card s5"><div class="card-head"><h2>Plan</h2><div class="grow"></div><span class="sub-t">Single choice</span></div>
    <div style="padding:16px 20px;display:grid;gap:14px">
      ${hbar("Team", "512, 40%", 40, "var(--c1)")}${hbar("Pro", "398, 31%", 31, P.orange)}${hbar("Free", "301, 23%", 23, P.amber)}${hbar("Enterprise", "73, 6%", 6, P.plum)}
      <div style="border-top:1px dashed var(--line-strong);padding-top:14px" class="row"><span class="tile o">${i("star", "icon-sm")}</span><div><b style="font-weight:600">62% gave 5 stars</b><p class="muted" style="font-size:12.5px">Lowest 1, highest 5, 1,190 answers</p></div></div>
    </div></div>
  <div class="card s12"><div class="card-head"><h2>Favourite colors for the new theme</h2><div class="grow"></div><span class="sub-t">Color set, 2.4 colors per answer</span></div>
    <div style="padding:14px 20px 18px;display:grid;grid-template-columns:repeat(6,1fr);gap:12px">
      ${[[P.teal, 641, 50], [P.orange, 455, 35], [P.plum, 402, 31], ["#141a1c", 380, 30], [P.amber, 214, 17], [P.carmine, 177, 14]].map(([c, n, p]) => `<div style="display:grid;gap:7px"><span style="height:46px;border-radius:10px;background:${c};box-shadow:inset 0 0 0 1px rgb(255 255 255 / .14)"></span><span class="row" style="justify-content:space-between"><b class="num" style="font-weight:600">${n}</b><span class="faint num">${p}%</span></span><span class="mono faint">${c}</span></div>`).join("")}
    </div></div>
</div>`, true);

export const pages = [
  { name: "01-dashboard", title: "Dashboard", body: dashboard, height: 960 },
  { name: "02-builder", title: "Builder", body: builder(settings) },
  { name: "03-builder-json-dark", title: "Builder JSON", body: builder(jsonPanel, "json"), theme: "dark" },
  { name: "04-publish", title: "Publish", body: publish },
  { name: "05-create-form-wizard", title: "Create form", body: wizard, height: 1010 },
  ...makeVariants({ i, fa, P, LOGO, CREDIT_FA }),
  { name: "08-responses", title: "Responses", body: responses },
  { name: "09-analytics-dark", title: "Analytics", body: summary, theme: "dark" },
];
