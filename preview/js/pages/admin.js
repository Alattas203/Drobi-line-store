/* Admin dashboard (admin/index.html), in page order:
   constants → small helpers → sign-in → data loading → navigation → overview
   → orders → order panel → products → product form → repair & trade-in.
   Needs supabase-js, js/supabase.js ($sb) and js/lib/helpers.js first.
   Every permission is enforced by Supabase RLS; this page never holds a secret key. */

/* ---------- constants ---------- */
const TZ = "Asia/Riyadh";
const DAY = 864e5;
const BUCKET = "product-images";
const REFRESH_MS = 60000;
const CAT = {
  iphone: "آيفون",
  samsung: "سامسونج",
  other: "جوالات أخرى",
  acc: "إكسسوارات",
  used: "مستعمل مضمون",
};
const STATUS = {
  new: ["جديد", "s-new"],
  prep: ["قيد التجهيز", "s-prep"],
  ship: ["في الطريق", "s-ship"],
  done: ["تم التوصيل", "s-done"],
  cancel: ["ملغي", "s-cancel"],
};
const OFFLINE = "ما فيه اتصال بالإنترنت، تأكد من الشبكة وجرّب مرة ثانية.";

/* ---------- small helpers ---------- */
let tt;
function toast(m, bad = false) {
  $("#toastTxt").textContent = m;
  $("#toast").classList.toggle("bad", bad);
  $("#toast").classList.add("show");
  clearTimeout(tt);
  tt = setTimeout(() => $("#toast").classList.remove("show"), bad ? 4000 : 2600);
}
/* Calendar day in Saudi time, e.g. "2026-09-27". */
const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dayKey = (d) => dayFmt.format(d);
const keyDate = (k) => new Date(`${k}T12:00:00+03:00`);
const lastDays = (n) =>
  Array.from({ length: n }, (_, i) => dayKey(new Date(Date.now() - (n - 1 - i) * DAY)));
function fmtTime(iso) {
  const d = new Date(iso),
    k = dayKey(d),
    t = d.toLocaleTimeString("ar-SA-u-nu-latn", {
      timeZone: TZ,
      hour: "numeric",
      minute: "2-digit",
    });
  if (k === dayKey(new Date())) return `اليوم ${t}`;
  if (k === dayKey(new Date(Date.now() - DAY))) return `أمس ${t}`;
  return d.toLocaleDateString("ar-SA-u-nu-latn-ca-gregory", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  });
}
const pill = (st) =>
  `<span class="pill ${STATUS[st][1]}"><span class="d"></span>${STATUS[st][0]}</span>`;
const artColor = (p) => (HEX.test(p.color) ? p.color : "#8C8A85");
const thumbOf = (p) =>
  !p
    ? ""
    : p.image_url
      ? `<img src="${esc(p.image_url)}" alt="" loading="lazy">`
      : art(p.art, artColor(p));
const isOffline = (e) =>
  !navigator.onLine ||
  e?.name === "AuthRetryableFetchError" ||
  e?.status === 0 ||
  /failed to fetch|networkerror|load failed|network request failed/i.test(
    e?.message || "",
  );
const errMsg = (e) => (isOffline(e) ? OFFLINE : e?.message || "صار خطأ غير متوقع.");
/* Loading placeholders and a retry box, per section. */
const skLines = (n, h = 12) =>
  Array.from(
    { length: n },
    (_, i) =>
      `<span class="sk sk-line" style="height:${h}px;width:${[92, 70, 84, 60, 76][i % 5]}%"></span>`,
  ).join("");
const skTable = (cols, rows = 6) =>
  `<tbody>${Array.from({ length: rows }, () => `<tr><td colspan="${cols}"><span class="sk" style="height:22px"></span></td></tr>`).join("")}</tbody>`;
const errBox = (what, retry, e) =>
  `<div class="load-err"><b>ما قدرنا نحمّل ${what}</b>${esc(errMsg(e))}<br><button class="btn btn-line btn-sm" data-retry="${retry}">حاول مرة ثانية</button></div>`;
/* Supabase returns no error when RLS silently matches zero rows — treat that as a failure. */
function mustChange(res) {
  if (res.error) throw res.error;
  if (!res.data?.length) throw new Error("ما عندك صلاحية لهذا التعديل، سجّل دخول من جديد.");
  return res.data;
}

/* ---------- sign in / out ---------- */
let me = null;
function showView(v) {
  $("#bootView").hidden = v !== "boot";
  $("#loginView").hidden = v !== "login";
  $("#appView").hidden = v !== "app";
}
async function isAdmin(user) {
  const { data, error } = await sb
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
function loginError(m) {
  $("#lErr").textContent = m;
  $("#lErr").hidden = !m;
}
function authMsg(e) {
  if (isOffline(e)) return OFFLINE;
  const m = e?.message || "";
  if (e?.code === "invalid_credentials" || /invalid login credentials/i.test(m))
    return "الإيميل أو كلمة المرور غلط.";
  if (e?.code === "email_not_confirmed" || /email not confirmed/i.test(m))
    return "الإيميل ما تأكد للحين.";
  if (e?.status === 429 || /rate limit|too many/i.test(m))
    return "محاولات كثيرة، انتظر شوي وجرّب مرة ثانية.";
  return "ما قدرنا نسجّل الدخول، جرّب مرة ثانية.";
}
function showLogin(msg = "") {
  showView("login");
  loginError(msg);
  $("#lPass").value = "";
  setTimeout(() => ($("#lEmail").value ? $("#lPass") : $("#lEmail")).focus(), 30);
}
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#lEmail").value.trim(),
    password = $("#lPass").value;
  if (!email || !password) return loginError("اكتب الإيميل وكلمة المرور.");
  const b = $("#lSubmit");
  b.disabled = true;
  b.textContent = "جاري الدخول…";
  loginError("");
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!(await isAdmin(data.user))) {
      await sb.auth.signOut();
      loginError("هذا الحساب ما عنده صلاحية الدخول للوحة");
      return;
    }
    startApp(data.user);
  } catch (err) {
    loginError(authMsg(err));
  } finally {
    b.disabled = false;
    b.textContent = "دخول";
  }
});
$("#logout").addEventListener("click", async () => {
  stopApp();
  try {
    await sb.auth.signOut();
  } catch (e) {}
  showLogin();
});
sb.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT" && me) {
    stopApp();
    showLogin("انتهت الجلسة، سجّل دخول من جديد.");
  }
});
async function boot() {
  showView("boot");
  let session = null;
  try {
    ({
      data: { session },
    } = await sb.auth.getSession());
  } catch (e) {}
  if (!session) return showLogin();
  try {
    if (await isAdmin(session.user)) return startApp(session.user);
    await sb.auth.signOut();
    showLogin("هذا الحساب ما عنده صلاحية الدخول للوحة");
  } catch (e) {
    showLogin(isOffline(e) ? OFFLINE : "ما قدرنا نتأكد من حسابك، سجّل دخول من جديد.");
  }
}

/* ---------- data loading ---------- */
let products = [],
  productsState = "loading",
  productsErr = null;
let orders = [], // latest orders (orders page, recent list)
  orders14 = [], // last 14 days (overview numbers)
  ordersState = "loading",
  ordersErr = null,
  newCount = 0,
  waitingCount = 0,
  lastOrderId = null;
let timer = null;
const num = (o, ...keys) => keys.forEach((k) => (o[k] = o[k] == null ? null : +o[k]));

async function loadProducts() {
  try {
    const { data, error } = await sb.from("products").select("*").order("sort").order("name");
    if (error) throw error;
    data.forEach((p) => num(p, "price", "was"));
    products = data;
    productsState = "ready";
  } catch (e) {
    console.error("loadProducts", e);
    productsErr = e;
    if (productsState !== "ready") productsState = "failed";
  }
}
async function loadOrders() {
  const since = new Date(`${lastDays(14)[0]}T00:00:00+03:00`).toISOString();
  const withItems = "*, order_items(id, product_id, name, price, qty)";
  try {
    const [list, recent, cNew, cWait] = await Promise.all([
      sb.from("orders").select(withItems).order("id", { ascending: false }).limit(300),
      sb.from("orders").select(withItems).gte("created_at", since).order("id", { ascending: false }),
      sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
      sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["new", "prep"]),
    ]);
    for (const r of [list, recent, cNew, cWait]) if (r.error) throw r.error;
    const fix = (o) => {
      num(o, "subtotal", "delivery", "total");
      o.order_items.forEach((i) => num(i, "price"));
      return o;
    };
    orders = list.data.map(fix);
    orders14 = recent.data.map(fix);
    newCount = cNew.count || 0;
    waitingCount = cWait.count || 0;
    // new-order toast (not on the first load)
    const top = orders[0]?.id ?? 0;
    if (lastOrderId !== null && top > lastOrderId) {
      const fresh = orders.filter((o) => o.id > lastOrderId).length;
      toast(`طلب جديد #${top}${fresh > 1 ? ` (+${fresh - 1})` : ""}`);
    }
    lastOrderId = Math.max(lastOrderId ?? 0, top);
    ordersState = "ready";
  } catch (e) {
    console.error("loadOrders", e);
    ordersErr = e;
    if (ordersState !== "ready") ordersState = "failed";
    throw e;
  }
}
async function refresh({ quiet = false } = {}) {
  const btns = $$("[data-refresh]");
  btns.forEach((b) => (b.disabled = true));
  const res = await Promise.allSettled([loadOrders(), loadProducts()]);
  btns.forEach((b) => (b.disabled = false));
  updateNavCount();
  // don't redraw under an open status menu or the product form
  const busy = document.activeElement?.matches?.("[data-status], #pForm *");
  if (!busy) render();
  if (!quiet && res.some((r) => r.status === "rejected"))
    toast("ما قدرنا نحدّث الطلبات. " + errMsg(ordersErr), true);
}
function startApp(user) {
  me = user;
  const email = user.email || "";
  $("#meEmail").textContent = email;
  $("#meAvatar").textContent = email.charAt(0) || "م";
  showView("app");
  go(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : "overview");
  refresh({ quiet: true });
  loadRepair();
  clearInterval(timer);
  timer = setInterval(() => refresh({ quiet: true }), REFRESH_MS);
}
function stopApp() {
  me = null;
  clearInterval(timer);
  closeOrder();
  closeProduct();
  products = [];
  orders = orders14 = [];
  productsState = ordersState = repairState = "loading";
  lastOrderId = null;
}
document.addEventListener("click", (e) => {
  const r = e.target.closest("[data-retry]");
  if (!r) return;
  if (r.dataset.retry === "repair") return loadRepair();
  if (r.dataset.retry === "products") productsState = "loading";
  else ordersState = "loading";
  render();
  refresh();
});
$$("[data-refresh]").forEach((b) => b.addEventListener("click", () => refresh()));

/* ---------- navigation ---------- */
const views = ["overview", "orders", "products", "repair"];
let view = "overview";
function go(v) {
  view = v;
  $$("[data-page]").forEach((s) => (s.hidden = s.dataset.page !== v));
  $$(".nav button").forEach((b) =>
    b.setAttribute("aria-current", b.dataset.view === v ? "page" : "false"),
  );
  history.replaceState(null, "", "#" + v);
  render();
  window.scrollTo(0, 0);
}
function render() {
  if (!me) return;
  ({
    overview: renderOverview,
    orders: renderOrders,
    products: renderProducts,
    repair: renderRepair,
  })[view]();
}
$$(".nav button").forEach((b) => b.addEventListener("click", () => go(b.dataset.view)));
$$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));
function updateNavCount() {
  $("#navNew").textContent = newCount;
  $("#navNew").hidden = !newCount;
}

/* ---------- overview ---------- */
function delta(a, b) {
  if (!b) return `<div class="delta flat">— مقارنة بأمس</div>`;
  const pct = Math.round(((a - b) / b) * 100);
  const cls = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return `<div class="delta ${cls} num">${pct > 0 ? "▲" : pct < 0 ? "▼" : "•"} ${Math.abs(pct)}% مقارنة بأمس</div>`;
}
function renderOverview() {
  $("#todayLbl").textContent = new Date().toLocaleDateString(
    "ar-SA-u-nu-latn-ca-gregory",
    { timeZone: TZ, weekday: "long", day: "numeric", month: "long" },
  );
  renderLowStock();
  if (ordersState === "loading") {
    $("#kpis").innerHTML = Array(4)
      .fill(`<div class="card kpi">${skLines(1)}<span class="sk" style="height:28px;width:60%"></span>${skLines(1, 10)}</div>`)
      .join("");
    $("#salesChart").innerHTML = `<span class="sk" style="height:240px"></span>`;
    $("#topProducts").innerHTML = skLines(5, 16);
    $("#recentTbl").innerHTML = skTable(4, 6);
    return;
  }
  if (ordersState === "failed") {
    const box = errBox("الطلبات", "orders", ordersErr);
    $("#kpis").innerHTML = `<div class="card" style="grid-column:1/-1">${box}</div>`;
    $("#salesChart").innerHTML = box;
    $("#topProducts").innerHTML = box;
    $("#recentTbl").innerHTML = `<tbody><tr><td>${box}</td></tr></tbody>`;
    return;
  }
  // per-day totals, Saudi calendar days, cancelled orders left out
  const keys = lastDays(14),
    days = Object.fromEntries(keys.map((k) => [k, { sales: 0, count: 0 }]));
  const active = orders14.filter((o) => o.status !== "cancel");
  active.forEach((o) => {
    const d = days[dayKey(new Date(o.created_at))];
    if (d) {
      d.sales += o.total;
      d.count++;
    }
  });
  const t = days[keys[13]],
    y = days[keys[12]],
    avg = active.reduce((s, o) => s + o.total, 0) / (active.length || 1);
  $("#kpis").innerHTML = [
    `<div class="card kpi"><div class="lbl">مبيعات اليوم</div><div class="val">${sar(t.sales)}</div>${delta(t.sales, y.sales)}</div>`,
    `<div class="card kpi"><div class="lbl">طلبات اليوم</div><div class="val num">${t.count}</div>${delta(t.count, y.count)}</div>`,
    `<div class="card kpi"><div class="lbl">تحتاج تجهيز</div><div class="val num">${waitingCount}</div><div class="delta flat">جديد + قيد التجهيز</div></div>`,
    `<div class="card kpi"><div class="lbl">متوسط قيمة الطلب</div><div class="val">${sar(avg)}</div><div class="delta flat">آخر 14 يوم</div></div>`,
  ].join("");
  drawSales(keys.map((k, i) => ({ k, off: 13 - i, ...days[k] })));
  // best sellers by pieces
  const sold = {};
  active.forEach((o) =>
    o.order_items.forEach((it) => {
      const key = it.product_id || "name:" + it.name;
      sold[key] ||= { qty: 0, name: it.name, id: it.product_id };
      sold[key].qty += it.qty;
    }),
  );
  const top = Object.values(sold)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const max = top[0]?.qty || 1;
  $("#topProducts").innerHTML = top.length
    ? top
        .map((s) => {
          const name = products.find((p) => p.id === s.id)?.name || s.name;
          return `<div class="hb-row"><span class="name">${esc(name)}</span><span class="v num">${s.qty} قطعة</span><div class="hb-track"><div class="hb-fill" style="width:${(s.qty / max) * 100}%"></div></div></div>`;
        })
        .join("")
    : `<div class="empty">ما فيه مبيعات في آخر 14 يوم.</div>`;
  // latest orders
  const recent = orders.slice(0, 6);
  $("#recentTbl").innerHTML = recent.length
    ? `<thead><tr><th>الطلب</th><th>العميل</th><th>الحالة</th><th class="end">الإجمالي</th></tr></thead><tbody>${recent
        .map(
          (o) =>
            `<tr class="click" data-order="${o.id}"><td class="num">#${o.id}<div class="when">${fmtTime(o.created_at)}</div></td><td>${esc(o.customer_name)}</td><td>${pill(o.status)}</td><td class="end">${sar(o.total)}</td></tr>`,
        )
        .join("")}</tbody>`
    : `<tbody><tr><td><div class="empty">ما فيه طلبات للحين.</div></td></tr></tbody>`;
}
function renderLowStock() {
  const box = $("#lowStock");
  if (productsState === "loading") return (box.innerHTML = skLines(4, 30));
  if (productsState === "failed")
    return (box.innerHTML = errBox("المنتجات", "products", productsErr));
  const low = products.filter((p) => p.stock < 3).sort((a, b) => a.stock - b.stock);
  box.innerHTML = low.length
    ? low
        .map(
          (p) =>
            `<div class="li"><span class="thumb">${thumbOf(p)}</span><div class="grow"><b>${esc(p.name)}</b><span>${CAT[p.cat] || ""}${p.visible ? "" : " · مخفي"}</span></div><span class="stock-low num">${p.stock ? `باقي ${p.stock}` : "نفد"}</span><button class="btn btn-line btn-sm" data-edit="${esc(p.id)}">تعديل</button></div>`,
        )
        .join("")
    : `<div class="empty">كل المنتجات مخزونها كافي.</div>`;
}
function niceStep(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1))),
    n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
let salesData = [];
function drawSales(data = salesData) {
  salesData = data;
  const box = $("#salesChart");
  if (!data.length || !box.clientWidth) return;
  const W = Math.max(box.clientWidth, 280),
    H = 240,
    pl = 8,
    pr = 52,
    pt = 12,
    pb = 28;
  const maxV = Math.max(...data.map((x) => x.sales)),
    step = niceStep(Math.max(maxV, 400) / 4),
    top = Math.ceil(maxV / step) * step || step * 4;
  const iw = W - pl - pr,
    ih = H - pt - pb,
    bw = iw / data.length;
  const y = (v) => pt + ih - (v / top) * ih;
  // RTL: oldest day on the right, today at the left end
  const x = (i) => W - pr - (i + 1) * bw;
  let g = "";
  for (let v = 0; v <= top; v += step)
    g += `<line class="gl" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${W - pr + 8}" y="${y(v) + 4}" text-anchor="start">${v >= 1000 ? (v / 1000).toLocaleString("en-US") + "k" : v}</text>`;
  const bars = data
    .map((p, i) => {
      const h = Math.max(0, y(0) - y(p.sales)),
        bx = x(i) + bw * 0.18,
        w = bw * 0.64,
        r = Math.min(4, w / 2, h);
      const path =
        h > 0
          ? `M${bx},${y(0)} V${y(p.sales) + r} Q${bx},${y(p.sales)} ${bx + r},${y(p.sales)} H${bx + w - r} Q${bx + w},${y(p.sales)} ${bx + w},${y(p.sales) + r} V${y(0)} Z`
          : "";
      return `<path class="bar${p.off === 0 ? " today" : ""}" data-i="${i}" d="${path}"/><rect class="hit" data-i="${i}" x="${x(i)}" y="${pt}" width="${bw}" height="${ih}"/>`;
    })
    .join("");
  const labels = data
    .map((p, i) =>
      i % 2 === (data.length - 1) % 2
        ? `<text class="ax" x="${x(i) + bw / 2}" y="${H - 8}" text-anchor="middle">${p.off === 0 ? "اليوم" : `${+p.k.slice(8)}/${+p.k.slice(5, 7)}`}</text>`
        : "",
    )
    .join("");
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="مبيعات آخر 14 يوم">${g}${bars}${labels}</svg><div class="tip" hidden></div>`;
  const tip = box.querySelector(".tip");
  const show = (i) => {
    const p = data[i];
    box.classList.add("hover");
    box.querySelectorAll(".bar").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
    const when =
      p.off === 0
        ? "اليوم"
        : keyDate(p.k).toLocaleDateString("ar-SA-u-nu-latn-ca-gregory", {
            timeZone: TZ,
            weekday: "short",
            day: "numeric",
            month: "short",
          });
    tip.innerHTML = `<b>${sar(p.sales)}</b>${p.count} طلب · ${when}`;
    tip.hidden = false;
    const sc = box.clientWidth / W,
      left = (x(i) + bw / 2) * sc - tip.offsetWidth / 2;
    tip.style.left = Math.max(0, Math.min(box.clientWidth - tip.offsetWidth, left)) + "px";
    tip.style.top = y(p.sales) * sc - 8 + "px";
  };
  const hide = () => {
    box.classList.remove("hover");
    tip.hidden = true;
  };
  box.querySelectorAll(".hit").forEach((r) => {
    r.addEventListener("mouseenter", () => show(+r.dataset.i));
    r.addEventListener("click", () => show(+r.dataset.i)); // touch
    r.addEventListener("mouseleave", hide);
  });
}
let rz;
addEventListener("resize", () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (view === "overview" && ordersState === "ready") drawSales();
  }, 150);
});

/* ---------- orders ---------- */
let oFilter = "all",
  oQuery = "";
const findOrder = (id) => orders.find((o) => o.id === id) || orders14.find((o) => o.id === id);
const itemsCount = (o) => o.order_items.reduce((s, it) => s + it.qty, 0);
function statusSelect(o) {
  return `<select class="status-sel ${STATUS[o.status][1]}" data-status="${o.id}" aria-label="حالة الطلب ${o.id}">${Object.entries(
    STATUS,
  )
    .map(([k, v]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${v[0]}</option>`)
    .join("")}</select>`;
}
function renderOrders() {
  const tabs = [["all", "الكل"], ...Object.entries(STATUS).map(([k, v]) => [k, v[0]])];
  const counts = { all: orders.length };
  Object.keys(STATUS).forEach((k) => (counts[k] = orders.filter((o) => o.status === k).length));
  $("#oTabs").innerHTML = tabs
    .map(
      ([k, l]) =>
        `<button class="tab" aria-pressed="${oFilter === k}" data-k="${k}">${l}${ordersState === "ready" ? `<span class="c num">${counts[k]}</span>` : ""}</button>`,
    )
    .join("");
  if (ordersState === "loading") return ($("#ordersTbl").innerHTML = skTable(7));
  if (ordersState === "failed")
    return ($("#ordersTbl").innerHTML = `<tbody><tr><td>${errBox("الطلبات", "orders", ordersErr)}</td></tr></tbody>`);
  const q = oQuery.trim().replace(/^#/, "").toLowerCase();
  const list = orders.filter(
    (o) =>
      (oFilter === "all" || o.status === oFilter) &&
      (!q || String(o.id).includes(q) || o.customer_name.toLowerCase().includes(q)),
  );
  $("#ordersTbl").innerHTML = `<thead><tr><th>الطلب</th><th>العميل</th><th>الحي</th><th>القطع</th><th>الدفع</th><th>الإجمالي</th><th>الحالة</th></tr></thead><tbody>${
    list.length
      ? list
          .map(
            (o) =>
              `<tr class="click${o.status === "cancel" ? " off" : ""}" data-order="${o.id}"><td class="num"><b>#${o.id}</b><div class="when">${fmtTime(o.created_at)}</div></td><td>${esc(o.customer_name)}</td><td>${esc(o.area)}</td><td class="num">${itemsCount(o)}</td><td>${esc(o.pay_method)}</td><td>${sar(o.total)}</td><td>${statusSelect(o)}</td></tr>`,
          )
          .join("")
      : `<tr><td colspan="7"><div class="empty">${orders.length ? "ما فيه طلبات مطابقة." : "ما فيه طلبات للحين."}</div></td></tr>`
  }</tbody>`;
}
$("#oTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  oFilter = b.dataset.k;
  renderOrders();
});
$("#oSearch").addEventListener("input", (e) => {
  oQuery = e.target.value;
  renderOrders();
});
/* Status change. Stock moves inside the database (trigger), never from here. */
document.addEventListener("change", async (e) => {
  const s = e.target.closest("[data-status]");
  if (!s) return;
  const id = +s.dataset.status,
    o = findOrder(id),
    next = s.value;
  if (!o || next === o.status) return;
  $$(`[data-status="${id}"]`).forEach((x) => (x.disabled = true));
  try {
    mustChange(await sb.from("orders").update({ status: next }).eq("id", id).select("id"));
    [orders, orders14].forEach((l) => l.forEach((x) => x.id === id && (x.status = next)));
    toast(`الطلب #${id} صار: ${STATUS[next][0]}`);
    refresh({ quiet: true }); // counts + stock changed on the server
  } catch (err) {
    toast("ما تغيّرت الحالة. " + errMsg(err), true);
  }
  render();
  if ($("#orderPanel").classList.contains("open")) openOrder(id);
});
document.addEventListener("click", (e) => {
  if (e.target.closest("select, [data-status]")) return;
  const r = e.target.closest("[data-order]");
  if (r) return openOrder(+r.dataset.order);
  const ed = e.target.closest("[data-edit]");
  if (ed) {
    go("products");
    openProduct(ed.dataset.edit);
  }
});

/* ---------- order panel ---------- */
/* Saudi numbers for wa.me: 05xxxxxxxx / 5xxxxxxxx / 00966… → 9665xxxxxxxx */
function waPhone(p) {
  let d = String(p).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return d;
}
function openOrder(id) {
  const o = findOrder(id);
  if (!o) return;
  const g = o.subtotal,
    del = o.delivery;
  $("#opTitle").textContent = `طلب #${o.id}`;
  $("#opBody").innerHTML = `
    <div>${statusSelect(o)}</div>
    <dl class="kv"><dt>العميل</dt><dd>${esc(o.customer_name)}</dd>${o.customer_phone ? `<dt>الجوال</dt><dd class="num" dir="ltr" style="text-align:right">${esc(o.customer_phone)}</dd>` : ""}<dt>الحي</dt><dd>${esc(o.area) || "—"}</dd><dt>العنوان</dt><dd>${esc(o.address) || "—"}</dd><dt>الدفع</dt><dd>${esc(o.pay_method) || "—"}</dd><dt>الوقت</dt><dd>${fmtTime(o.created_at)}</dd></dl>
    <div class="list">${o.order_items
      .map((it) => {
        const p = products.find((x) => x.id === it.product_id);
        return `<div class="li"><span class="thumb">${thumbOf(p)}</span><div class="grow"><b>${esc(it.name)}</b><span class="num">${it.qty} × ${fmtN(it.price)}</span></div>${sar(it.price * it.qty)}</div>`;
      })
      .join("")}</div>
    <dl class="kv"><dt>المجموع</dt><dd>${sar(g)}</dd><dt>منها ضريبة 15%</dt><dd>${sar(g - g / 1.15)}</dd><dt>التوصيل</dt><dd>${del ? sar(del) : "مجاني"}</dd><dt>الإجمالي</dt><dd class="big">${sar(o.total)}</dd></dl>`;
  const msg = `السلام عليكم ${o.customer_name}، معك دروبي لاين بخصوص طلبك #${o.id}: حالته الحين "${STATUS[o.status][0]}".`;
  $("#opFoot").innerHTML =
    (o.customer_phone
      ? `<a class="btn btn-wa" target="_blank" rel="noopener" href="https://wa.me/${waPhone(o.customer_phone)}?text=${encodeURIComponent(msg)}"><svg class="i"><use href="#i-wa"/></svg>راسل العميل</a>`
      : "") + `<button class="btn btn-line" id="opClose2">إغلاق</button>`;
  $("#opClose2").onclick = closeOrder;
  $("#orderPanel").classList.add("open");
  $("#scrim").classList.add("open");
  $("#orderPanel").setAttribute("aria-hidden", "false");
}
function closeOrder() {
  $("#orderPanel").classList.remove("open");
  if (!$("#pModal").classList.contains("open")) $("#scrim").classList.remove("open");
  $("#orderPanel").setAttribute("aria-hidden", "true");
}
$("#opClose").onclick = closeOrder;
$("#scrim").onclick = () => {
  closeOrder();
  closeProduct();
};

/* ---------- products ---------- */
let pFilter = "all",
  pQuery = "",
  pendingDelete = null;
const pById = (id) => products.find((p) => p.id === id);
function renderProducts() {
  const counts = { all: products.length };
  Object.keys(CAT).forEach((k) => (counts[k] = products.filter((p) => p.cat === k).length));
  const ready = productsState === "ready";
  $("#pTabs").innerHTML = [["all", "الكل"], ...Object.entries(CAT)]
    .map(
      ([k, l]) =>
        `<button class="tab" aria-pressed="${pFilter === k}" data-k="${k}">${l}${ready ? `<span class="c num">${counts[k]}</span>` : ""}</button>`,
    )
    .join("");
  $("#pSub").textContent = ready
    ? `${products.length} منتج · ${products.filter((p) => p.visible).length} ظاهر في المتجر`
    : "";
  if (productsState === "loading") return ($("#productsTbl").innerHTML = skTable(7));
  if (productsState === "failed")
    return ($("#productsTbl").innerHTML = `<tbody><tr><td>${errBox("المنتجات", "products", productsErr)}</td></tr></tbody>`);
  const q = pQuery.trim().toLowerCase();
  const list = products.filter(
    (p) =>
      (pFilter === "all" || p.cat === pFilter) &&
      (!q || `${p.name} ${p.brand} ${p.spec}`.toLowerCase().includes(q)),
  );
  $("#productsTbl").innerHTML = `<thead><tr><th>المنتج</th><th>القسم</th><th>السعر</th><th>قبل الخصم</th><th>المخزون</th><th>ظاهر</th><th></th></tr></thead><tbody>${
    list.length
      ? list
          .map((p) => {
            const id = esc(p.id),
              low = p.stock < 3;
            return `<tr>
    <td><div class="pcell"><span class="thumb">${thumbOf(p)}</span><div><b>${esc(p.name)}${p.is_new ? ` <span class="pill s-cancel">وصل حديثاً</span>` : ""}</b><span>${esc(p.spec)}</span></div></div></td>
    <td>${CAT[p.cat] || esc(p.cat)}</td><td>${sar(p.price)}</td><td style="color:var(--muted)" class="num">${p.was ? fmtN(p.was) : "—"}</td>
    <td class="num ${low ? "stock-low" : ""}">${p.stock}${low ? ` <svg class="i"><use href="#i-alert"/></svg>` : ""}</td>
    <td><button class="switch" role="switch" aria-checked="${p.visible}" aria-label="إظهار ${esc(p.name)} في المتجر" data-vis="${id}"></button></td>
    <td class="end">${
      pendingDelete === p.id
        ? `<span class="confirm"><span>متأكد؟</span><button class="btn btn-danger btn-sm" data-del-yes="${id}">حذف</button><button class="btn btn-line btn-sm" data-del-no>لا</button></span>`
        : `<button class="icon-btn" data-edit-p="${id}" aria-label="تعديل ${esc(p.name)}"><svg class="i"><use href="#i-edit"/></svg></button><button class="icon-btn" data-del="${id}" aria-label="حذف ${esc(p.name)}"><svg class="i"><use href="#i-trash"/></svg></button>`
    }</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="7"><div class="empty">${products.length ? "ما فيه منتجات مطابقة." : "ما فيه منتجات للحين."}</div></td></tr>`
  }</tbody>`;
}
$("#pTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  pFilter = b.dataset.k;
  renderProducts();
});
$("#pSearch").addEventListener("input", (e) => {
  pQuery = e.target.value;
  renderProducts();
});
/* Storage path of one of our public image URLs, e.g. "ip17pm/1727400000.webp". */
function storagePath(url) {
  const m = String(url || "").match(new RegExp(`/object/public/${BUCKET}/(.+)$`));
  return m ? decodeURIComponent(m[1]) : null;
}
const removeImage = (url) => {
  const path = storagePath(url);
  if (path) sb.storage.from(BUCKET).remove([path]).catch(() => {});
};
$("#productsTbl").addEventListener("click", async (e) => {
  const v = e.target.closest("[data-vis]");
  if (v) {
    const p = pById(v.dataset.vis),
      next = !p.visible;
    v.disabled = true;
    try {
      mustChange(await sb.from("products").update({ visible: next }).eq("id", p.id).select("id"));
      p.visible = next;
      toast(next ? "صار ظاهر في المتجر" : "انخفى من المتجر");
    } catch (err) {
      toast("ما تغيّر. " + errMsg(err), true);
    }
    return renderProducts();
  }
  const ed = e.target.closest("[data-edit-p]");
  if (ed) return openProduct(ed.dataset.editP);
  const d = e.target.closest("[data-del]");
  if (d) {
    pendingDelete = d.dataset.del;
    return renderProducts();
  }
  const y = e.target.closest("[data-del-yes]");
  if (y) {
    const p = pById(y.dataset.delYes);
    y.disabled = true;
    try {
      mustChange(await sb.from("products").delete().eq("id", p.id).select("id"));
      products = products.filter((x) => x !== p);
      removeImage(p.image_url);
      toast(`انحذف ${p.name}`);
    } catch (err) {
      toast("ما انحذف المنتج. " + errMsg(err), true);
    }
    pendingDelete = null;
    return renderProducts();
  }
  if (e.target.closest("[data-del-no]")) {
    pendingDelete = null;
    renderProducts();
  }
});

/* ---------- product form (add / edit) ---------- */
let editing = null,
  newImg = null, // { blob, url } — resized, not uploaded yet
  dropImg = false; // remove the current photo on save
const artFor = (cat) =>
  editing?.art || (cat === "acc" ? "charger" : cat === "samsung" ? "galaxy" : "iphone");
function thumbPreview() {
  const cur = editing?.image_url && !dropImg ? editing.image_url : null;
  $("#fThumb").innerHTML = newImg
    ? `<img src="${newImg.url}" alt="">`
    : cur
      ? `<img src="${esc(cur)}" alt="">`
      : art(artFor($("#fCat").value), HEX.test($("#fColor").value) ? $("#fColor").value : "#6E7F99");
  $("#fImgRemove").hidden = !newImg && !cur;
}
function clearNewImg() {
  if (newImg) URL.revokeObjectURL(newImg.url);
  newImg = null;
}
function openProduct(id) {
  editing = id ? pById(id) : null;
  if (id && !editing) return;
  clearNewImg();
  dropImg = false;
  $("#pmTitle").textContent = editing ? "تعديل منتج" : "إضافة منتج";
  const p = editing || {
    name: "",
    brand: "",
    cat: "iphone",
    spec: "",
    price: "",
    was: "",
    stock: 1,
    color: "#6E7F99",
    is_new: true,
    visible: true,
  };
  $("#fName").value = p.name;
  $("#fBrand").value = p.brand;
  $("#fCat").value = p.cat;
  $("#fSpec").value = p.spec;
  $("#fPrice").value = p.price ?? "";
  $("#fWas").value = p.was ?? "";
  $("#fStock").value = p.stock;
  $("#fColor").value = HEX.test(p.color) ? p.color : "#6E7F99";
  $("#fNew").checked = !!p.is_new;
  $("#fVisible").checked = p.visible !== false;
  $("#fImg").value = "";
  $("#fErr").hidden = true;
  $$("#pForm .bad").forEach((x) => x.classList.remove("bad"));
  thumbPreview();
  $("#pModal").classList.add("open");
  $("#scrim").classList.add("open");
  setTimeout(() => $("#fName").focus(), 50);
}
function closeProduct() {
  if (!$("#pModal").classList.contains("open")) return;
  $("#pModal").classList.remove("open");
  if (!$("#orderPanel").classList.contains("open")) $("#scrim").classList.remove("open");
  clearNewImg();
}
$("#addProduct").onclick = () => openProduct(null);
$("#pmClose").onclick = closeProduct;
$("#pmCancel").onclick = closeProduct;
$("#pModal").addEventListener("click", (e) => {
  if (e.target.id === "pModal") closeProduct();
});
["#fCat", "#fColor"].forEach((s) => $(s).addEventListener("input", thumbPreview));
/* Shrink to at most 1200px and encode as WEBP (JPEG where the browser can't). */
async function shrinkImage(file) {
  const src = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    const s = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = (type) => new Promise((r) => c.toBlob(r, type, 0.85));
    let out = await blob("image/webp");
    if (!out || out.type !== "image/webp") out = await blob("image/jpeg");
    if (!out) throw new Error("encode");
    return out;
  } finally {
    URL.revokeObjectURL(src);
  }
}
$("#fImg").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  $("#fErr").hidden = true;
  if (!/^image\//.test(f.type)) return formError("اختر ملف صورة (JPG أو PNG أو WEBP).");
  try {
    const blob = await shrinkImage(f);
    clearNewImg();
    newImg = { blob, url: URL.createObjectURL(blob) };
    thumbPreview();
  } catch (err) {
    formError("ما قدرنا نقرأ الصورة، جرّب صورة ثانية.");
    $("#fImg").value = "";
  }
});
$("#fImgRemove").addEventListener("click", () => {
  clearNewImg();
  dropImg = true;
  $("#fImg").value = "";
  thumbPreview();
});
function formError(m, field) {
  $("#fErr").textContent = m;
  $("#fErr").hidden = false;
  if (field) {
    $(field).classList.add("bad");
    $(field).focus();
  }
}
$$("#pForm .inp").forEach((i) => i.addEventListener("input", () => i.classList.remove("bad")));
/* New product id: English slug of the name + 4 random characters. */
function newId(name) {
  const slug =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "") || "product";
  const abc = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rnd = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => abc[b % 36]).join("");
  return `${slug}-${rnd}`;
}
$("#pForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $$("#pForm .bad").forEach((x) => x.classList.remove("bad"));
  const name = $("#fName").value.trim(),
    price = parseFloat($("#fPrice").value),
    wasRaw = $("#fWas").value.trim(),
    was = wasRaw === "" ? null : parseFloat(wasRaw),
    stockRaw = $("#fStock").value.trim(),
    stock = Number(stockRaw);
  if (!name) return formError("اكتب اسم المنتج.", "#fName");
  if (!(price > 0)) return formError("اكتب السعر.", "#fPrice");
  if (was !== null && !(was > price))
    return formError("السعر قبل الخصم لازم يكون أعلى من السعر الحالي.", "#fWas");
  if (stockRaw === "" || !Number.isInteger(stock) || stock < 0)
    return formError("الكمية لازم تكون 0 أو أكثر.", "#fStock");
  const b = $("#pmSave");
  b.disabled = true;
  b.textContent = "جاري الحفظ…";
  $("#fErr").hidden = true;
  const id = editing ? editing.id : newId(name),
    oldUrl = editing?.image_url || null;
  let image_url = dropImg ? null : oldUrl,
    uploaded = null;
  try {
    if (newImg) {
      const ext = newImg.blob.type === "image/webp" ? "webp" : "jpg";
      uploaded = `${id}/${Date.now()}.${ext}`;
      const up = await sb.storage
        .from(BUCKET)
        .upload(uploaded, newImg.blob, { contentType: newImg.blob.type, upsert: false });
      if (up.error) throw up.error;
      image_url = sb.storage.from(BUCKET).getPublicUrl(uploaded).data.publicUrl;
    }
    const row = {
      name,
      brand: $("#fBrand").value.trim(),
      cat: $("#fCat").value,
      spec: $("#fSpec").value.trim(),
      price,
      was,
      stock,
      color: $("#fColor").value,
      is_new: $("#fNew").checked,
      visible: $("#fVisible").checked,
      image_url,
    };
    let saved;
    if (editing) {
      [saved] = mustChange(await sb.from("products").update(row).eq("id", id).select());
    } else {
      const sort = Math.min(1, ...products.map((p) => p.sort)) - 1; // newest first
      [saved] = mustChange(
        await sb.from("products").insert({ id, art: artFor(row.cat), sort, ...row }).select(),
      );
    }
    num(saved, "price", "was");
    if (oldUrl && oldUrl !== image_url) removeImage(oldUrl);
    const wasEditing = !!editing;
    products = editing
      ? products.map((p) => (p.id === id ? saved : p))
      : [saved, ...products];
    closeProduct();
    toast(wasEditing ? "انحفظت التعديلات" : "انضاف المنتج");
    render();
  } catch (err) {
    if (uploaded) sb.storage.from(BUCKET).remove([uploaded]).catch(() => {});
    formError("ما قدرنا نحفظ المنتج. " + errMsg(err));
  } finally {
    b.disabled = false;
    b.textContent = "حفظ المنتج";
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeProduct();
    closeOrder();
  }
});

/* ---------- repair prices & trade-in values ---------- */
let repairRows = [], // { id?, brand, model, screen, battery, back, sort }
  tradeRows = [], // { id?, model, value, sort }
  goneRepair = [],
  goneTrade = [],
  savedRepair = {}, // id → JSON of the row as stored, to send only changes
  savedTrade = {},
  repairState = "loading",
  repairErr = null,
  rBrand = null,
  dirty = false;
const REP_KEYS = ["screen", "battery", "back"];
const snap = (r, keys) => JSON.stringify(keys.map((k) => r[k]));
const repSnap = (r) => snap(r, ["brand", "model", ...REP_KEYS, "sort"]);
const tradeSnap = (r) => snap(r, ["model", "value", "sort"]);
async function loadRepair() {
  repairState = "loading";
  if (view === "repair") renderRepair();
  try {
    const [rp, tv] = await Promise.all([
      sb.from("repair_prices").select("id,brand,model,screen,battery,back,sort").order("sort"),
      sb.from("trade_values").select("id,model,value,sort").order("sort"),
    ]);
    if (rp.error) throw rp.error;
    if (tv.error) throw tv.error;
    repairRows = rp.data.map((r) => (num(r, ...REP_KEYS), r));
    tradeRows = tv.data.map((r) => (num(r, "value"), r));
    savedRepair = Object.fromEntries(repairRows.map((r) => [r.id, repSnap(r)]));
    savedTrade = Object.fromEntries(tradeRows.map((r) => [r.id, tradeSnap(r)]));
    goneRepair = [];
    goneTrade = [];
    dirty = false;
    repairState = "ready";
  } catch (e) {
    console.error("loadRepair", e);
    repairErr = e;
    repairState = "failed";
  }
  if (view === "repair") renderRepair();
}
const brands = () => [...new Set(repairRows.map((r) => r.brand))];
const money = (v, attrs) =>
  `<span class="money"><input class="inp num" type="number" min="0" step="any" inputmode="decimal" value="${v}" ${attrs}><svg class="riyal"><use href="#i-riyal"/></svg></span>`;
function renderRepair() {
  const loading = repairState !== "ready";
  $("#saveRepair").disabled = loading;
  $("#addModel").hidden = loading;
  $("#repError").hidden = repairState !== "failed";
  $("#repBody").hidden = repairState === "failed";
  if (repairState === "failed") {
    $("#repError").innerHTML = `<div class="card">${errBox("الأسعار", "repair", repairErr)}</div>`;
    return;
  }
  if (loading) {
    $("#rTabs").innerHTML = "";
    $("#repGrid").innerHTML = `<div style="grid-column:1/-1">${skLines(6, 30)}</div>`;
    $("#tradeGrid").innerHTML = `<div style="grid-column:1/-1">${skLines(6, 30)}</div>`;
    return;
  }
  const bs = brands();
  if (!bs.includes(rBrand)) rBrand = bs[0] || "Apple";
  $("#rTabs").innerHTML = bs
    .map((b) => `<button class="tab" aria-pressed="${rBrand === b}" data-b="${esc(b)}">${esc(b)}</button>`)
    .join("");
  const rows = repairRows.map((r, i) => [r, i]).filter(([r]) => r.brand === rBrand);
  $("#repGrid").innerHTML =
    `<span class="h">الموديل</span><span class="h">الشاشة</span><span class="h">البطارية</span><span class="h">الزجاج الخلفي</span><span></span>` +
    (rows.length
      ? rows
          .map(
            ([r, i]) =>
              `<input class="inp" value="${esc(r.model)}" data-ri="${i}" data-f="model" aria-label="اسم الموديل" placeholder="اسم الموديل">${REP_KEYS.map((k, n) => money(r[k], `data-ri="${i}" data-f="${k}" aria-label="${esc(r.model)} — ${["الشاشة", "البطارية", "الزجاج الخلفي"][n]}"`)).join("")}<button class="icon-btn" data-rm="${i}" aria-label="حذف ${esc(r.model)}"><svg class="i"><use href="#i-trash"/></svg></button>`,
          )
          .join("")
      : `<div class="empty" style="grid-column:1/-1">ما فيه موديلات لهذي الماركة.</div>`);
  $("#tradeGrid").innerHTML =
    `<span class="h">الجهاز</span><span class="h">القيمة</span><span></span>` +
    tradeRows
      .map(
        (r, i) =>
          `<input class="inp" value="${esc(r.model)}" data-ti="${i}" data-f="model" aria-label="اسم الجهاز" placeholder="اسم الجهاز">${money(r.value, `data-ti="${i}" data-f="value" aria-label="${esc(r.model)} — القيمة"`)}<button class="icon-btn" data-trm="${i}" aria-label="حذف ${esc(r.model)}"><svg class="i"><use href="#i-trash"/></svg></button>`,
      )
      .join("") +
    `<button class="btn btn-line btn-sm add" id="addTrade"><svg class="i"><use href="#i-plus"/></svg>إضافة جهاز</button>`;
}
$("#rTabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  rBrand = b.dataset.b;
  renderRepair();
});
/* Edits go straight into the rows; nothing is saved until "حفظ التغييرات". */
function editCell(t, rows) {
  const r = rows[+(t.dataset.ri ?? t.dataset.ti)];
  if (!r) return;
  r[t.dataset.f] = t.dataset.f === "model" ? t.value : t.value === "" ? NaN : +t.value;
  t.classList.remove("bad");
  dirty = true;
}
$("#repGrid").addEventListener("input", (e) => e.target.dataset.ri && editCell(e.target, repairRows));
$("#tradeGrid").addEventListener("input", (e) => e.target.dataset.ti && editCell(e.target, tradeRows));
$("#repGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-rm]");
  if (!b) return;
  const [r] = repairRows.splice(+b.dataset.rm, 1);
  if (r.id) goneRepair.push(r.id);
  dirty = true;
  renderRepair();
});
$("#addModel").onclick = () => {
  repairRows.push({ brand: rBrand, model: "", screen: 0, battery: 0, back: 0 });
  dirty = true;
  renderRepair();
  $$("#repGrid [data-f=model]").pop()?.focus();
};
$("#tradeGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-trm]");
  if (b) {
    const [r] = tradeRows.splice(+b.dataset.trm, 1);
    if (r.id) goneTrade.push(r.id);
    dirty = true;
    return renderRepair();
  }
  if (e.target.closest("#addTrade")) {
    tradeRows.push({ model: "", value: 0 });
    dirty = true;
    renderRepair();
    $$("#tradeGrid [data-f=model]").pop()?.focus();
  }
});
/* First problem in the editor, or null: empty/duplicate names, bad amounts. */
function repairProblem() {
  const seen = new Set();
  for (const [i, r] of repairRows.entries()) {
    r.model = r.model.trim();
    const key = r.brand + "|" + r.model.toLowerCase();
    if (!r.model) return { brand: r.brand, sel: `[data-ri="${i}"][data-f=model]`, m: "في موديل اسمه فاضي." };
    if (seen.has(key)) return { brand: r.brand, sel: `[data-ri="${i}"][data-f=model]`, m: `الموديل ${r.model} مكرر.` };
    seen.add(key);
    const k = REP_KEYS.find((k) => !(r[k] >= 0));
    if (k) return { brand: r.brand, sel: `[data-ri="${i}"][data-f=${k}]`, m: `سعر غير صحيح في ${r.model}.` };
  }
  seen.clear();
  for (const [i, r] of tradeRows.entries()) {
    r.model = r.model.trim();
    if (!r.model) return { sel: `[data-ti="${i}"][data-f=model]`, m: "في جهاز استبدال اسمه فاضي." };
    if (seen.has(r.model.toLowerCase())) return { sel: `[data-ti="${i}"][data-f=model]`, m: `الجهاز ${r.model} مكرر.` };
    seen.add(r.model.toLowerCase());
    if (!(r.value >= 0)) return { sel: `[data-ti="${i}"][data-f=value]`, m: `قيمة غير صحيحة في ${r.model}.` };
  }
  return null;
}
/* Save everything in one go: deletes, then changed rows, then new rows.
   Local state is updated after each step, so a retry never repeats work. */
$("#saveRepair").addEventListener("click", async () => {
  const bad = repairProblem();
  if (bad) {
    if (bad.brand && bad.brand !== rBrand) rBrand = bad.brand;
    renderRepair();
    const el = $(bad.sel);
    el?.classList.add("bad");
    el?.focus();
    return toast(bad.m, true);
  }
  const b = $("#saveRepair");
  b.disabled = true;
  const label = b.innerHTML;
  b.textContent = "جاري الحفظ…";
  // keep the on-screen order in the calculator
  let sort = 0;
  for (const br of brands()) repairRows.filter((r) => r.brand === br).forEach((r) => (r.sort = ++sort));
  tradeRows.forEach((r, i) => (r.sort = i + 1));
  const repRow = (r) => ({ brand: r.brand, model: r.model, screen: r.screen, battery: r.battery, back: r.back, sort: r.sort });
  const trRow = (r) => ({ model: r.model, value: r.value, sort: r.sort });
  try {
    if (goneRepair.length) {
      const res = await sb.from("repair_prices").delete().in("id", goneRepair).select("id");
      if (res.error) throw res.error;
      goneRepair = [];
    }
    if (goneTrade.length) {
      const res = await sb.from("trade_values").delete().in("id", goneTrade).select("id");
      if (res.error) throw res.error;
      goneTrade = [];
    }
    const upd = [
      ...repairRows
        .filter((r) => r.id && savedRepair[r.id] !== repSnap(r))
        .map((r) => ["repair_prices", r, repRow(r), savedRepair, repSnap]),
      ...tradeRows
        .filter((r) => r.id && savedTrade[r.id] !== tradeSnap(r))
        .map((r) => ["trade_values", r, trRow(r), savedTrade, tradeSnap]),
    ];
    const results = await Promise.all(
      upd.map(([t, r, row]) => sb.from(t).update(row).eq("id", r.id).select("id")),
    );
    let firstErr = null;
    results.forEach((res, i) => {
      const [, r, , saved, sn] = upd[i];
      if (res.error || !res.data?.length) firstErr ||= res.error || new Error("ما عندك صلاحية.");
      else saved[r.id] = sn(r);
    });
    if (firstErr) throw firstErr;
    for (const [t, rows, toRow, saved, sn] of [
      ["repair_prices", repairRows, repRow, savedRepair, repSnap],
      ["trade_values", tradeRows, trRow, savedTrade, tradeSnap],
    ]) {
      const fresh = rows.filter((r) => !r.id);
      if (!fresh.length) continue;
      const res = await sb.from(t).insert(fresh.map(toRow)).select("id");
      if (res.error) throw res.error;
      fresh.forEach((r, i) => {
        r.id = res.data[i].id;
        saved[r.id] = sn(r);
      });
    }
    dirty = false;
    toast("انحفظت التغييرات — الحاسبة في المتجر تتحدث على طول");
  } catch (err) {
    const dup = err?.code === "23505";
    toast("ما انحفظت كل التغييرات. " + (dup ? "في اسم مكرر." : errMsg(err)), true);
  } finally {
    b.disabled = false;
    b.innerHTML = label;
    renderRepair();
  }
});
addEventListener("beforeunload", (e) => {
  if (me && dirty) e.preventDefault();
});

/* ---------- init ---------- */
boot();
