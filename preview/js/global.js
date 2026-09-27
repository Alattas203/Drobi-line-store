/* Global behaviour — every page: helpers, product artwork, catalogue, cart,
   header menus, cart drawer, toast. Loaded before the page script; its top-level
   names (e.g. $, sar, art, PRODUCTS, addToCart, toast) are shared with it. */

/* ---------- helpers ---------- */
const WA = "966552605370";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const R = `<svg class="riyal" aria-label="ريال"><use href="#i-riyal"/></svg>`;
const fmtN = (n) => Math.round(n).toLocaleString("en-US");
const sar = (n) => `<span class="price">${fmtN(n)} ${R}</span>`;
/* Escape text from the database or storage before it goes into innerHTML. */
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/* ---------- product artwork (placeholder renders until real photos) ---------- */
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v));
  return (
    "#" +
    (
      (1 << 24) +
      (c((n >> 16) + a) << 16) +
      (c(((n >> 8) & 255) + a) << 8) +
      c((n & 255) + a)
    )
      .toString(16)
      .slice(1)
  );
}
let uid = 0;
function art(style, color) {
  const id = "g" + uid++,
    hi = shade(color, 38),
    lo = shade(color, -40);
  const defs = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${lo}"/></linearGradient><radialGradient id="${id}l"><stop offset="0" stop-color="#3b4a7a"/><stop offset=".45" stop-color="#0a0f1f"/><stop offset="1" stop-color="#1c2340"/></radialGradient><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22345e"/><stop offset=".5" stop-color="#0b1224"/><stop offset="1" stop-color="${shade(color, -10)}"/></linearGradient></defs>`;
  const lens = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r + 3}" fill="${shade(color, -60)}" opacity=".85"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${id}l)"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff" opacity=".35"/>`;
  const V = `viewBox="0 0 260 320" xmlns="http://www.w3.org/2000/svg"`;
  const front = (x, r) =>
    `<rect x="${x}" y="14" width="120" height="296" rx="${r}" fill="${lo}"/><rect x="${x + 4}" y="18" width="112" height="288" rx="${r - 3}" fill="url(#${id}s)"/><path d="M${x + 20} 250 C ${x + 60} 170, ${x + 80} 120, ${x + 100} 60" stroke="${hi}" stroke-width="10" fill="none" opacity=".45" stroke-linecap="round"/>`;
  if (style === "iphone")
    return `<svg ${V}>${defs}${front(128, 26)}<rect x="172" y="26" width="32" height="9" rx="4.5" fill="#000"/>
    <rect x="10" y="8" width="126" height="300" rx="28" fill="${lo}"/><rect x="13" y="11" width="120" height="294" rx="25" fill="url(#${id})"/>
    <rect x="22" y="20" width="62" height="64" rx="16" fill="${shade(color, -18)}" stroke="${hi}" stroke-opacity=".5"/>${lens(39, 38, 10)}${lens(39, 67, 10)}${lens(67, 52, 10)}
    <path d="M66 160c0-5 5-8 7-10 2 2 7 5 7 10a7 7 0 0 1-14 0z" fill="${shade(color, -25)}" opacity=".55"/></svg>`;
  if (style === "galaxy")
    return `<svg ${V}>${defs}${front(128, 14)}<circle cx="188" cy="30" r="4" fill="#000"/>
    <rect x="10" y="8" width="126" height="300" rx="14" fill="${lo}"/><rect x="13" y="11" width="120" height="294" rx="12" fill="url(#${id})"/>
    ${lens(36, 36, 10)}${lens(36, 66, 10)}${lens(36, 96, 10)}${lens(62, 40, 6)}<text x="73" y="280" text-anchor="middle" font-family="Arial" font-size="10" letter-spacing="2" fill="${hi}" opacity=".7">SAMSUNG</text></svg>`;
  if (style === "flip")
    return `<svg ${V}>${defs}
    <rect x="60" y="20" width="140" height="280" rx="22" fill="${lo}"/><rect x="63" y="23" width="134" height="274" rx="20" fill="url(#${id})"/>
    <rect x="70" y="30" width="120" height="118" rx="14" fill="#0b1224"/>${lens(90, 52, 9)}${lens(90, 82, 9)}<text x="146" y="100" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#cfd8ff">10:08</text><rect x="63" y="158" width="134" height="4" fill="${shade(color, -50)}"/></svg>`;
  if (style === "charger")
    return `<svg ${V}>${defs}<rect x="80" y="70" width="100" height="120" rx="22" fill="url(#${id})" stroke="#d6dae2"/><rect x="108" y="40" width="10" height="34" rx="3" fill="#b9c2d6"/><rect x="142" y="40" width="10" height="34" rx="3" fill="#b9c2d6"/><rect x="112" y="150" width="36" height="10" rx="5" fill="${shade(color, -60)}"/><text x="130" y="125" text-anchor="middle" font-family="Arial" font-size="14" font-weight="700" fill="${shade(color, -80)}">65W</text><path d="M130 190c0 40-30 50-30 90" stroke="${shade(color, -30)}" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;
  if (style === "case")
    return `<svg ${V}>${defs}<rect x="60" y="10" width="140" height="300" rx="30" fill="url(#${id})" opacity=".85"/><rect x="68" y="18" width="70" height="72" rx="18" fill="#0b1224" opacity=".75"/><circle cx="130" cy="170" r="42" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/><rect x="127" y="214" width="6" height="18" rx="3" fill="#fff" opacity=".8"/></svg>`;
  if (style === "glass")
    return `<svg ${V}>${defs}<rect x="68" y="14" width="124" height="292" rx="26" fill="${color}" opacity=".22" stroke="#7d93c4" stroke-width="2"/><rect x="110" y="24" width="40" height="10" rx="5" fill="#7d93c4" opacity=".5"/><path d="M80 120 170 40M80 190 180 100" stroke="#fff" stroke-opacity=".8" stroke-width="10" stroke-linecap="round"/><text x="130" y="260" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#5a6f9e">9H</text></svg>`;
  if (style === "bank")
    return `<svg ${V}>${defs}<rect x="78" y="40" width="104" height="240" rx="20" fill="url(#${id})"/><rect x="116" y="60" width="28" height="8" rx="4" fill="${shade(color, -50)}"/><g fill="#3BFF9A">${[0, 1, 2, 3].map((i) => `<circle cx="${112 + i * 12}" cy="250" r="3.5" opacity="${i < 3 ? 1 : 0.25}"/>`).join("")}</g><text x="130" y="170" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="${shade(color, 70)}">20000</text></svg>`;
  if (style === "buds")
    return `<svg ${V}>${defs}<rect x="72" y="110" width="116" height="100" rx="44" fill="url(#${id})" stroke="#d6dae2"/><path d="M72 150h116" stroke="${shade(color, -40)}" stroke-width="2"/><circle cx="130" cy="180" r="3" fill="#22c55e"/></svg>`;
  return "";
}

/* ---------- catalogue (loaded from Supabase; header promos, cart and pages read it) ---------- */
const PRODUCTS = [];
let catalogStatus = "loading"; // loading | ready | failed
/* The page script fills these in to redraw whatever depends on PRODUCTS. */
const catalogView = { loading() {}, ready() {}, failed() {} };
const HEX = /^#[0-9a-f]{6}$/i;
const toProduct = (r) => ({
  id: r.id,
  cat: r.cat,
  brand: r.brand || "",
  name: r.name,
  spec: r.spec || "",
  price: +r.price,
  was: r.was == null ? null : +r.was,
  stock: r.stock,
  art: r.art,
  color: HEX.test(r.color) ? r.color : "#8C8A85",
  img: r.image_url || "",
  isNew: !!r.is_new,
});
const inStock = (p) => p.stock == null || p.stock > 0;
/* Product picture: the real photo when there is one, else the drawn artwork. */
const thumb = (p) =>
  p.img
    ? `<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">`
    : art(p.art, p.color);
async function loadCatalog() {
  catalogStatus = "loading";
  catalogView.loading();
  try {
    const { data, error } = await sb
      .from("products")
      .select("id,cat,brand,name,spec,price,was,stock,art,color,image_url,is_new")
      .eq("visible", true)
      .order("sort");
    if (error) throw error;
    PRODUCTS.splice(0, PRODUCTS.length, ...data.map(toProduct));
  } catch (e) {
    console.error("loadCatalog", e);
    catalogStatus = "failed";
    catalogView.failed();
    return;
  }
  catalogStatus = "ready";
  syncCart();
  syncAddButtons();
  catalogView.ready();
}

/* ---------- cart ---------- */
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("drobi-cart") || "[]");
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  cart = [];
}
/* Older saved carts have no productId; colour-picker items look like "ip16p-2". */
cart.forEach((c) => {
  c.productId = c.productId || String(c.id).split("-")[0];
});
const save = () => {
  try {
    localStorage.setItem("drobi-cart", JSON.stringify(cart));
  } catch (e) {}
};
function addToCart(item) {
  const f = cart.find((c) => c.id === item.id && c.name === item.name);
  if (f) f.qty++;
  else cart.push({ ...item, qty: 1 });
  save();
  renderCart();
  toast(`تمت إضافة ${item.name} للسلة`);
  const c = $("#cartCount");
  c.classList.add("bump");
  setTimeout(() => c.classList.remove("bump"), 250);
}
/* Keep saved cart prices and photos in step with the loaded catalogue. */
function syncCart() {
  cart.forEach((c) => {
    const p = PRODUCTS.find((x) => x.id === c.productId);
    if (!p) return;
    c.price = p.price;
    if (c.id === p.id) c.img = p.img;
  });
  save();
  renderCart();
}

/* ---------- header ---------- */
$$("[data-menu]").forEach((item) => {
  const btn = item.querySelector(".nav-link");
  let t;
  const open = (v) => {
    item.classList.toggle("open", v);
    btn.setAttribute("aria-expanded", v);
  };
  const hover = matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (hover) {
    item.addEventListener("mouseenter", () => {
      clearTimeout(t);
      $$("[data-menu]").forEach(
        (o) => o !== item && o.classList.remove("open"),
      );
      open(true);
    });
    item.addEventListener("mouseleave", () => {
      t = setTimeout(() => open(false), 140);
    });
  }
  btn.addEventListener("click", () => {
    const v = !item.classList.contains("open");
    $$("[data-menu]").forEach((o) => {
      o.classList.remove("open");
      o.querySelector(".nav-link").setAttribute("aria-expanded", "false");
    });
    open(v);
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $$("[data-menu]").forEach((i) => i.classList.remove("open"));
    closeCart();
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-row"))
    $$("[data-menu]").forEach((i) => i.classList.remove("open"));
});
$$(".mega a").forEach((a) =>
  a.addEventListener("click", () =>
    $$("[data-menu]").forEach((i) => i.classList.remove("open")),
  ),
);

/* ---------- cart drawer ---------- */
const AREAS = [
  "الشرفية",
  "البغدادية",
  "الروضة",
  "الحمراء",
  "الزهراء",
  "السلامة",
  "النعيم",
  "الصفا",
  "المروة",
  "الفيصلية",
  "الرحاب",
  "أبحر الشمالية",
  "الحمدانية",
  "العزيزية",
  "حي آخر",
];
$("#cArea").innerHTML = AREAS.map((a) => `<option>${a}</option>`).join("");
const FREE = 500,
  DEL = 25;
function totals() {
  const g = cart.reduce((s, c) => s + c.price * c.qty, 0),
    sub = g / 1.15,
    del = g === 0 || g >= FREE ? 0 : DEL;
  return { g, sub, vat: g - sub, del, total: g + del };
}
function renderCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0),
    t = totals();
  $("#cartCount").textContent = count;
  $("#cartCount").hidden = !count;
  $("#dCount").textContent = count ? `(${count})` : "";
  const body = $("#dBody");
  if (!cart.length) {
    body.innerHTML = `<div class="d-empty"><div class="t-ic"><svg class="i"><use href="#i-bag"/></svg></div><b>سلتك فاضية</b><p>تصفّح المنتجات وأضف جهازك الجديد.</p><a href="#products" class="btn btn-dark" id="goShop">تصفح المنتجات</a></div>`;
    $("#dFoot").hidden = true;
    $("#goShop").addEventListener("click", closeCart);
    return;
  }
  $("#dFoot").hidden = false;
  body.innerHTML = cart
    .map(
      (
        c,
        i,
      ) => `<div class="ci"><div class="ci-img">${thumb(c)}</div>
    <div><div class="ci-name">${esc(c.name)}</div><div class="ci-price num">${sar(c.price)}</div>
    <div class="qty"><button data-a="inc" data-i="${i}" aria-label="زيادة"><svg class="i i-sm"><use href="#i-plus"/></svg></button><span class="num">${c.qty}</span><button data-a="dec" data-i="${i}" aria-label="إنقاص"><svg class="i i-sm"><use href="#i-minus"/></svg></button></div></div>
    <button class="ci-rm" data-a="rm" data-i="${i}" aria-label="حذف"><svg class="i"><use href="#i-trash"/></svg></button></div>`,
    )
    .join("");
  $("#sSub").innerHTML = sar(t.sub);
  $("#sVat").innerHTML = sar(t.vat);
  $("#sDel").innerHTML = t.del ? sar(t.del) : "مجاني";
  $("#sTot").innerHTML = sar(t.total);
  $("#freeBar").innerHTML =
    t.g >= FREE
      ? `<b style="color:var(--green)">التوصيل مجاني لطلبك</b><div class="track"><div class="fill" style="width:100%;background:var(--green)"></div></div>`
      : `باقي <b class="num">${sar(FREE - t.g)}</b> على التوصيل المجاني<div class="track"><div class="fill" style="width:${(t.g / FREE) * 100}%"></div></div>`;
}
$("#dBody").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-a]");
  if (!b) return;
  const i = +b.dataset.i;
  if (b.dataset.a === "inc") cart[i].qty++;
  if (b.dataset.a === "dec")
    cart[i].qty > 1 ? cart[i].qty-- : cart.splice(i, 1);
  if (b.dataset.a === "rm") cart.splice(i, 1);
  save();
  renderCart();
});
function orderMessage() {
  const t = totals();
  return `طلب جديد — دروبي لاين للاتصالات\n\n${cart.map((c, i) => `${i + 1}. ${c.name} × ${c.qty} = ${Math.round(c.price * c.qty)} ريال`).join("\n")}\n\nالمجموع قبل الضريبة: ${t.sub.toFixed(2)} ريال\nالضريبة 15%: ${t.vat.toFixed(2)} ريال\nالتوصيل: ${t.del ? t.del + " ريال" : "مجاني"}\n*الإجمالي: ${t.total.toFixed(2)} ريال*\n\nالاسم: ${$("#cName").value.trim()}\nالحي: ${$("#cArea").value}\nالعنوان: ${$("#cAddr").value.trim()}\nالدفع: ${$("#cPay").value}`;
}
["#cName", "#cAddr", "#cArea", "#cPay"].forEach((s) =>
  $(s).addEventListener("input", () => {
    $("#cErr").hidden = true;
  }),
);
/* Save the order in Supabase (prices are worked out on the server), then hand
   the numbered order over to WhatsApp. */
$("#checkout").addEventListener("click", async () => {
  const name = $("#cName").value.trim(),
    addr = $("#cAddr").value.trim();
  if (!name || !addr) {
    $("#cErr").hidden = false;
    (name ? $("#cAddr") : $("#cName")).focus();
    return;
  }
  const b = $("#checkout"),
    label = b.innerHTML;
  b.disabled = true;
  b.textContent = "جاري إرسال الطلب…";
  let orderNo, error;
  try {
    ({ data: orderNo, error } = await sb.rpc("place_order", {
      p_items: cart.map((c) => ({ id: c.productId, qty: c.qty, label: c.name })),
      p_name: name,
      p_area: $("#cArea").value,
      p_address: addr,
      p_pay: $("#cPay").value,
    }));
  } catch (e) {
    error = e;
  }
  if (error || orderNo == null) {
    console.error("place_order", error);
    toast("ما قدرنا نرسل الطلب، جرّب مرة ثانية أو راسلنا واتساب");
    b.disabled = false;
    b.innerHTML = label;
    if (String(error?.message).includes("منتج غير متوفر")) loadCatalog();
    return;
  }
  const msg = `طلب رقم #${orderNo}\n\n${orderMessage()}`;
  cart = [];
  save();
  renderCart();
  closeCart();
  b.disabled = false;
  b.innerHTML = label;
  window.location.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
});
function openCart() {
  $("#drawer").classList.add("open");
  $("#scrim").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
}
function closeCart() {
  $("#drawer").classList.remove("open");
  $("#scrim").classList.remove("open");
  $("#drawer").setAttribute("aria-hidden", "true");
}
$("#cartBtn").addEventListener("click", openCart);
$("#dClose").addEventListener("click", closeCart);
$("#scrim").addEventListener("click", closeCart);

/* ---------- toast ---------- */
let tt;
function toast(m) {
  $("#toastTxt").textContent = m;
  $("#toast").classList.add("show");
  clearTimeout(tt);
  tt = setTimeout(() => $("#toast").classList.remove("show"), 2200);
}

/* ---------- footer year + header promo cards ---------- */
$("#yr").textContent = new Date().getFullYear();
$$("[data-art]").forEach((el) => {
  el.innerHTML = art(el.dataset.art, el.dataset.color);
});
/* Promo buttons stay disabled until their product has loaded and is in stock. */
function syncAddButtons() {
  $$("[data-add]").forEach((b) => {
    const p = PRODUCTS.find((x) => x.id === b.dataset.add);
    b.disabled = !p || !inStock(p);
    if (p && !inStock(p)) b.textContent = "نفد المخزون";
  });
}
$$("[data-add]").forEach((b) => {
  b.disabled = true;
  b.addEventListener("click", () => {
    const p = PRODUCTS.find((x) => x.id === b.dataset.add);
    if (!p || !inStock(p)) return;
    addToCart({
      id: p.id,
      productId: p.id,
      name: p.name,
      price: p.price,
      art: p.art,
      color: p.color,
      img: p.img,
    });
    $$("[data-menu]").forEach((i) => i.classList.remove("open"));
  });
});

/* ---------- init ---------- */
renderCart();
