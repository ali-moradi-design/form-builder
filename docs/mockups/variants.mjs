// Hosted (public) form in Persian: chosen design is "focus mode" (one question per
// screen, variant B) with the palette-strip color picker from variant C.

export function makeVariants({ i, fa, P, LOGO, CREDIT_FA }) {
  const sel = [P.teal, P.orange, P.plum];
  const palette = [P.teal, P.orange, P.amber, P.plum, P.carmine, "#2f6f73", "#141a1c", "#f3eee6", "#7aa6a1", "#f2c18d"];
  const stack = `<b class="stack">${sel.map((c) => `<span style="background:${c}"></span>`).join("")}</b>`;
  const steps = ["تجربه", "رضایت", "پیشنهاد", "رنگ‌ها", "ارتباط"];

  const npsQ = `
      <span class="v2-k">پرسش ${fa(3)} از ${fa(5)}</span>
      <h1>چقدر احتمال دارد ما را به دوستانتان پیشنهاد کنید؟</h1>
      <p class="muted" style="font-size:16px">عدد را بزنید یا با کلیدهای صفحه‌کلید انتخاب کنید.</p>
      <div class="big-nps">${[...Array(11).keys()].map((n) => `<span class="${n === 9 ? "on" : ""}"><b>${fa(n)}</b></span>`).join("")}</div>
      <div class="nps-ends" style="font-size:13.5px"><span>${i("frown", "icon-sm")} اصلاً</span><span>حتماً ${i("laugh", "icon-sm")}</span></div>`;

  const colorQ = (mobile = false) => `
      <span class="v2-k">پرسش ${fa(4)} از ${fa(5)}</span>
      <h1>کدام رنگ‌ها را برای پوستهٔ تازه دوست دارید؟</h1>
      <p class="muted" style="font-size:${mobile ? 14 : 16}px">تا ${fa(4)} رنگ انتخاب کنید؛ ترتیب انتخاب مهم است.</p>
      <div class="strip ${mobile ? "strip-m" : ""}" style="margin-top:${mobile ? 18 : 28}px">${sel.map((c, k) => `<div style="background:${c}"><span class="mono" dir="ltr">${mobile ? fa(k + 1) : c}</span><b>${i("x", "icon-sm")}</b></div>`).join("")}<div class="slot">${i("plus", "icon-sm")}${mobile ? "" : "<span>رنگ چهارم</span>"}</div></div>
      <div class="mini-sw" style="margin-top:14px">${palette.map((c) => `<span class="${sel.includes(c) ? "used" : ""}" style="background:${c}"></span>`).join("")}<span class="pip">${i("pipette", "icon-sm")}</span></div>`;

  // Repeater: one card per row, numbered; remove on each card, add below.
  const people = [
    ["سارا احمدی", fa(34), "بزرگسال"],
    ["نیما احمدی", fa(9), "کودک"],
  ];
  const card = ([name, age, kind], k) => `
      <div class="rep-card">
        <div class="rep-head"><span class="rep-n">${fa(k + 1)}</span><b>همسفر ${["اول", "دوم"][k]}</b><div class="grow"></div>
          <button class="btn ghost square" aria-label="بالا">${i("arrow-up", "icon-sm")}</button><button class="btn ghost square" aria-label="پایین">${i("arrow-down", "icon-sm")}</button><button class="btn ghost square" aria-label="حذف">${i("trash-2", "icon-sm")}</button></div>
        <div class="rep-grid">
          <div><span class="label">نام</span><div class="input">${name}</div></div>
          <div><span class="label">سن</span><div class="input">${age}</div></div>
          <div><span class="label">گروه</span><div class="row" style="gap:6px"><span class="pchip ${kind === "بزرگسال" ? "on" : ""}">بزرگسال</span><span class="pchip ${kind === "کودک" ? "on" : ""}">کودک</span></div></div>
        </div>
      </div>`;
  const repeaterQ = `
      <span class="v2-k">پرسش ${fa(2)} از ${fa(5)}</span>
      <h1>چه کسانی با شما سفر می‌کنند؟</h1>
      <p class="muted" style="font-size:16px">برای هر همسفر یک ردیف بسازید؛ حداکثر ${fa(4)} نفر.</p>
      <div class="rep">${people.map(card).join("")}
        <button class="rep-add">${i("plus", "icon-sm")} افزودن همسفر <span class="faint">(${fa(2)} از ${fa(4)})</span></button>
      </div>`;

  const focus = (q, cur, answers) => `
<div class="pub v2">
  <div class="v2-progress"><span style="width:${cur * 20 + 10}%"></span></div>
  <header class="pub-top" style="background:transparent;border:0"><span class="logo">${LOGO}</span><b style="font-weight:600">نظرسنجی محصول</b><div class="grow"></div>
    <div class="row prev-ans">${answers}</div>
    <button class="btn">${i("languages", "icon-sm")}English</button></header>
  <div class="v2-body">
    <nav class="v2-steps">${steps.map((t, k) => `<span class="${k < cur ? "done" : k === cur ? "cur" : ""}"><i></i>${t}</span>`).join("")}</nav>
    <div class="v2-q">${q}
      <div class="row" style="margin-top:34px;gap:14px"><button class="btn primary lg">تأیید ${i("check", "icon-sm")}</button><span class="faint">یا <span class="kbd">Enter ↵</span> بزنید</span></div>
    </div>
  </div>
  <div class="v2-foot">${CREDIT_FA()}</div>
  <div class="v2-nav"><button class="btn square">${i("arrow-right")}</button><button class="btn square">${i("arrow-left")}</button></div>
</div>`;

  const pa = (label, value) => `<span class="pa">${label} <b>${value}</b></span>`;
  const npsPage = focus(npsQ, 2, pa("رضایت", `${i("smile", "icon-sm")} خوب`));
  const repeaterPage = focus(repeaterQ, 1, pa("مقصد", "شیراز"));
  const colorPage = focus(colorQ(), 3, pa("رضایت", `${i("smile", "icon-sm")} خوب`) + pa("پیشنهاد", fa(9)));

  const mobile = `
<div class="pub v2">
  <div class="v2-progress"><span style="width:70%"></span></div>
  <header class="pub-top" style="background:transparent;border:0;padding-inline:18px;height:58px"><span class="logo">${LOGO}</span><b style="font-weight:600">نظرسنجی محصول</b><div class="grow"></div><span class="faint">${fa(4)} از ${fa(5)}</span></header>
  <div class="row" style="padding:0 18px;gap:8px">${pa("رضایت", "خوب")}${pa("پیشنهاد", fa(9))}</div>
  <div class="v2-q m" style="padding:26px 18px 0;flex:1">${colorQ(true)}</div>
  <div class="foot-actions" style="gap:10px;padding:12px 18px 24px;border:0"><button class="btn lg square" style="width:48px;height:48px">${i("arrow-right")}</button><button class="btn primary lg" style="flex:1;height:48px">تأیید ${i("check", "icon-sm")}</button></div>
  <div style="padding:0 0 18px">${CREDIT_FA()}</div>
</div>`;

  return [
    { name: "06-hosted-form", title: "Hosted form", body: npsPage, lang: "fa", height: 900 },
    { name: "06b-hosted-form-colors", title: "Hosted form colors", body: colorPage, lang: "fa", height: 900 },
    { name: "06c-hosted-form-repeater", title: "Hosted form repeater", body: repeaterPage, lang: "fa", height: 900 },
    { name: "07-hosted-form-mobile-dark", title: "Hosted form mobile", body: mobile, lang: "fa", theme: "dark", width: 390, height: 844 },
  ];
}
