/* Global behaviour — every store page: catalogue, cart, header menus, cart
   drawer, toast. Loaded after js/lib/helpers.js ($, sar, esc, art…) and before
   the page script; its top-level names (e.g. PRODUCTS, addToCart, toast) are
   shared with it. */

const WA = "966552605370";

/* ---------- catalogue (loaded from Supabase; header promos, cart and pages read it) ---------- */
const PRODUCTS = [];
let catalogStatus = "loading"; // loading | ready | failed
/* The page script fills these in to redraw whatever depends on PRODUCTS. */
const catalogView = { loading() {}, ready() {}, failed() {} };
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
    checkAdmin();
    return;
  }
  catalogStatus = "ready";
  syncCart();
  syncAddButtons();
  catalogView.ready();
  checkAdmin();
}

/* ---------- admin link: green dot when a signed-in admin opens the store ---------- */
let adminChecked = false;
async function checkAdmin() {
  if (adminChecked) return;
  adminChecked = true; // once per page, and only after the products are drawn
  try {
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session) return;
    const { data } = await sb
      .from("admins")
      .select("user_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    $("#accDot").hidden = !data;
  } catch (e) {}
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
/* Promo cards: price, old price, discount and instalment come from PRODUCTS;
   buttons stay disabled until their product has loaded and is in stock. */
function syncAddButtons() {
  $$("[data-add]").forEach((b) => {
    const p = PRODUCTS.find((x) => x.id === b.dataset.add);
    b.disabled = !p || !inStock(p);
    if (p && !inStock(p)) b.textContent = "نفد المخزون";
    const card = b.closest(".promo");
    if (!p || !card) return;
    const price = card.querySelector(".pp .price"),
      was = card.querySelector(".pp s"),
      off = card.querySelector("[data-off]"),
      inst = card.querySelector("[data-inst]");
    if (price) price.outerHTML = sar(p.price);
    if (was) {
      was.hidden = !(p.was > p.price);
      was.textContent = p.was ? fmtN(p.was) : "";
    }
    if (off && p.was > p.price)
      off.textContent = `خصم ${Math.round((1 - p.price / p.was) * 100)}%`;
    if (inst) inst.textContent = `أو ${fmtN(p.price / 4)} × 4 مع تابي وتمارا`;
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
