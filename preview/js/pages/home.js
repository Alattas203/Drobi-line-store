/* Home page (index.html) behaviour, in page order:
   header links → product filters, hero, products, pick your colour,
   repair calculator, trade-in, branch status, map. Needs js/global.js first. */

/* ---------- page data ---------- */
const FILTERS = [
  ["new", "وصل حديثاً"],
  ["all", "الكل"],
  ["iphone", "آيفون"],
  ["samsung", "سامسونج"],
  ["acc", "إكسسوارات"],
  ["used", "مستعمل مضمون"],
  ["sale", "تخفيضات"],
];
const TITLES = {
  new: "وصل حديثاً",
  all: "كل المنتجات",
  iphone: "آيفون",
  samsung: "سامسونج",
  acc: "إكسسوارات",
  used: "مستعمل مضمون",
  sale: "تخفيضات",
  fav: "المفضلة",
};
const FEATURED = [
  {
    key: "ip16p",
    tab: "iPhone 16 Pro",
    art: "iphone",
    colors: [
      ["تيتانيوم صحراوي", "Desert Titanium", "#BFA48F"],
      ["تيتانيوم طبيعي", "Natural Titanium", "#A8A49B"],
      ["تيتانيوم أسود", "Black Titanium", "#3B3B3D"],
      ["تيتانيوم أبيض", "White Titanium", "#E4E1DA"],
    ],
  },
  {
    key: "ip17pm",
    tab: "iPhone 17 Pro Max",
    art: "iphone",
    colors: [
      ["برتقالي كوني", "Cosmic Orange", "#D9772B"],
      ["أزرق داكن", "Deep Blue", "#2F3F5E"],
      ["فضي", "Silver", "#DADCDF"],
    ],
  },
  {
    key: "s25u",
    tab: "Galaxy S25 Ultra",
    art: "galaxy",
    colors: [
      ["فضي مزرق", "Titanium Silverblue", "#6E7F99"],
      ["أسود", "Titanium Black", "#2B2D31"],
      ["رمادي", "Titanium Gray", "#8F9194"],
    ],
  },
];
const HERO = [
  [
    "جوالك الجديد يوصلك اليوم",
    "أحدث الأجهزة بضمان سنتين، وتقسيط بدون فوائد، وتوصيل بنفس اليوم لكل أحياء جدة",
  ],
  [
    "قسّطها على 4 دفعات",
    "اشترِ اليوم وادفع بعدين مع تابي وتمارا — بدون فوائد ولا رسوم إضافية",
  ],
  [
    "صيانة جوالك وأنت تنتظر",
    "فنيين معتمدين وقطع أصلية في فرعنا بالشرفية، شارع فلسطين",
  ],
];

/* ---------- header category links → product filters ---------- */
$$("[data-go]").forEach((a) =>
  a.addEventListener("click", () => {
    filter = a.dataset.go;
    query = a.dataset.q || "";
    $("#q").value = query;
    $$("[data-menu]").forEach((i) => i.classList.remove("open"));
    renderFilters();
    renderProducts();
  }),
);

/* ---------- hero: low-poly backdrop + rotating short copy ---------- */
function drawHero() {
  const cv = $("#heroCanvas"),
    b = cv.getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = b.width * dpr;
  cv.height = b.height * dpr;
  const x = cv.getContext("2d");
  x.scale(dpr, dpr);
  const W = b.width,
    H = b.height,
    step = Math.max(90, W / 14);
  let s = 11;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts = [];
  for (let j = -1; j <= Math.ceil(H / step) + 1; j++) {
    const row = [];
    for (let i = -1; i <= Math.ceil(W / step) + 1; i++)
      row.push([
        i * step + (r() - 0.5) * step * 0.8,
        j * step + (r() - 0.5) * step * 0.8,
      ]);
    pts.push(row);
  }
  const col = (cx, cy, k) => {
    const t = Math.max(0, Math.min(1, cx / W));
    const a = [14, 58, 60],
      c = [18, 24, 42],
      d = [52, 28, 72];
    const m =
      t < 0.5
        ? a.map((v, i) => v + (c[i] - v) * t * 2)
        : c.map((v, i) => v + (d[i] - v) * (t - 0.5) * 2);
    const l = 0.72 + k * 0.5 - Math.abs(cy / H - 0.5) * 0.35;
    return `rgb(${m.map((v) => Math.round(v * l)).join(",")})`;
  };
  for (let j = 0; j < pts.length - 1; j++)
    for (let i = 0; i < pts[j].length - 1; i++) {
      const p = pts[j][i],
        q = pts[j][i + 1],
        u = pts[j + 1][i],
        v = pts[j + 1][i + 1];
      [
        [p, q, u],
        [q, v, u],
      ].forEach((t) => {
        const cx = (t[0][0] + t[1][0] + t[2][0]) / 3,
          cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
        x.fillStyle = col(cx, cy, r());
        x.beginPath();
        x.moveTo(...t[0]);
        x.lineTo(...t[1]);
        x.lineTo(...t[2]);
        x.closePath();
        x.fill();
        x.strokeStyle = x.fillStyle;
        x.lineWidth = 1;
        x.stroke();
      });
    }
  x.strokeStyle = "rgba(0,0,0,.35)";
  x.lineWidth = Math.max(8, W * 0.008);
  x.strokeRect(W * 0.22, -20, W * 0.56, H * 0.8);
  x.fillStyle = "rgba(0,0,0,.35)";
  x.fillRect(W * 0.84, H * 0.25, W * 0.2, H * 0.8);
}
let hi = 0,
  ht;
$("#heroDots").innerHTML = HERO.map(
  (_, i) =>
    `<button aria-label="شريحة ${i + 1}" aria-current="${i === 0}" data-i="${i}"></button>`,
).join("");
function showHero(i) {
  hi = i;
  const el = $("#heroIn");
  el.classList.add("fade");
  setTimeout(() => {
    $("#heroTitle").textContent = HERO[i][0];
    $("#heroSub").textContent = HERO[i][1];
    el.classList.remove("fade");
  }, 300);
  $$("#heroDots button").forEach((b, k) =>
    b.setAttribute("aria-current", k === i),
  );
}
const cycle = () => {
  clearInterval(ht);
  ht = setInterval(() => showHero((hi + 1) % HERO.length), 6000);
};
$("#heroDots").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  showHero(+b.dataset.i);
  cycle();
});
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) cycle();

/* ---------- products ---------- */
let filter = "new",
  query = "";
function matches(p) {
  if (filter === "new" && !p.isNew) return false;
  if (filter === "fav" && !favs.has(p.id)) return false;
  if (filter === "sale" && (!p.was || 1 - p.price / p.was < 0.12))
    return false;
  if (!["all", "new", "sale", "fav"].includes(filter) && p.cat !== filter)
    return false;
  if (!query) return true;
  let q = query.toLowerCase();
  [
    ["آيفون", "iphone"],
    ["ايفون", "iphone"],
    ["سامسونج", "galaxy"],
    ["جالكسي", "galaxy"],
    ["انكر", "anker"],
    ["أنكر", "anker"],
  ].forEach(([a, b]) => (q = q.replace(a, b)));
  return (p.name + " " + p.brand + " " + p.spec)
    .toLowerCase()
    .includes(q.trim());
}
function renderFilters() {
  $("#filters").innerHTML = FILTERS.map(
    ([k, l]) =>
      `<button class="chip" aria-pressed="${filter === k}" data-k="${k}">${l}</button>`,
  ).join("");
}
const favs = new Set();
function updateFav() {
  const c = $("#favCount");
  c.textContent = favs.size;
  c.hidden = !favs.size;
}
$("#favBtn").addEventListener("click", () => {
  filter = "fav";
  query = "";
  $("#q").value = "";
  renderFilters();
  renderProducts();
  document.getElementById("products").scrollIntoView();
});
/* Grey placeholder cards, the same size as a product card, while loading. */
function showSkeleton() {
  $("#grid").setAttribute("aria-busy", "true");
  $("#grid").innerHTML = Array(8)
    .fill(
      `<div class="p-card skel" aria-hidden="true"><div class="p-media"></div><div class="p-body"><i></i><i></i><i></i><i></i><i class="skel-btn"></i></div></div>`,
    )
    .join("");
}
function showLoadError() {
  $("#grid").removeAttribute("aria-busy");
  $("#grid").innerHTML =
    `<div class="empty"><b>ما قدرنا نحمّل المنتجات</b><br>تأكد من اتصالك بالإنترنت وحاول مرة ثانية.<div class="load-err"><button class="btn btn-dark" id="retry">حاول مرة ثانية</button><a class="btn btn-wa" href="https://wa.me/${WA}" target="_blank" rel="noopener"><svg class="i i-sm"><use href="#i-wa"/></svg>راسلنا واتساب</a></div></div>`;
  $("#retry").addEventListener("click", loadShop);
}
function renderProducts() {
  if (catalogStatus === "loading") return showSkeleton();
  if (catalogStatus === "failed") return showLoadError();
  $("#grid").removeAttribute("aria-busy");
  const list = PRODUCTS.filter(matches);
  $("#gridTitle").textContent = query ? `نتائج البحث` : TITLES[filter];
  $("#resultNote").textContent = query
    ? `“${query}” — ${list.length} منتج`
    : "الأسعار شاملة الضريبة";
  if (!list.length && filter === "fav" && !query) {
    $("#grid").innerHTML =
      `<div class="empty"><b>ما عندك منتجات في المفضلة</b><br>اضغط على القلب في أي منتج عشان تحفظه هنا.</div>`;
    return;
  }
  if (!list.length) {
    $("#grid").innerHTML =
      `<div class="empty"><b>ما لقينا منتجات مطابقة</b><br>جرّب كلمة ثانية أو <a href="https://wa.me/${WA}" target="_blank" rel="noopener" style="color:var(--brand);font-weight:700">اسألنا على الواتساب</a> ونوفّره لك.</div>`;
    return;
  }
  $("#grid").innerHTML = list
    .map((p) => {
      const off = p.was ? Math.round((1 - p.price / p.was) * 100) : 0,
        out = !inStock(p),
        device = ["iphone", "samsung", "other"].includes(p.cat);
      /* Out of stock: "نفد" takes the discount badge's place. */
      const deal = out ? "نفد" : off > 0 ? `خصم ${off}%` : "";
      const rib =
        p.cat === "used"
          ? `<span class="ribbon used">مستعمل مضمون</span>`
          : p.isNew
            ? `<span class="ribbon">وصل حديثاً</span>`
            : deal
              ? `<span class="ribbon">${deal}</span>`
              : "";
      const rib2 =
        (p.isNew || p.cat === "used") && deal
          ? `<span class="ribbon sale num">${deal}</span>`
          : "";
      const id = esc(p.id);
      return `<article class="p-card">
      <div class="p-media">${thumb(p)}${rib}${rib2}<button class="fav" aria-label="أضف للمفضلة" aria-pressed="${favs.has(p.id)}" data-fav="${id}"><svg class="i i-sm"><use href="#i-heart"/></svg></button></div>
      <div class="p-body">
        <span class="p-brand">${esc(p.brand)}</span>
        <h3 class="p-name">${esc(p.name)}</h3>
        <span class="p-spec">${esc(p.spec)}</span>
        ${device ? `<span class="p-warranty"><svg class="i i-sm"><use href="#i-shield"/></svg>ضمان سنتين</span>` : p.cat === "used" ? `<span class="p-warranty" style="color:var(--green)"><svg class="i i-sm"><use href="#i-shield"/></svg>ضمان 6 أشهر</span>` : ""}
        <div class="p-price num"><b>${sar(p.price)}</b>${p.was > p.price ? `<s>${fmtN(p.was)}</s>` : ""}</div>
        <div class="p-inst num">أو ${sar(p.price / 4)} × 4 <span class="pay-chip pay-tabby">tabby</span><span class="pay-chip pay-tamara">tamara</span></div>
        ${
          out
            ? `<button class="btn btn-primary btn-block add-btn" disabled>نفد المخزون</button>`
            : `<button class="btn btn-primary btn-block add-btn" data-id="${id}"><svg class="i i-sm"><use href="#i-bag"/></svg>أضف للسلة</button>`
        }
      </div></article>`;
    })
    .join("");
}
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  filter = b.dataset.k;
  renderFilters();
  renderProducts();
});
$("#grid").addEventListener("click", (e) => {
  const fv = e.target.closest("[data-fav]");
  if (fv) {
    const id = fv.dataset.fav;
    favs.has(id) ? favs.delete(id) : favs.add(id);
    fv.setAttribute("aria-pressed", favs.has(id));
    toast(favs.has(id) ? "أُضيف للمفضلة" : "أُزيل من المفضلة");
    updateFav();
    if (filter === "fav") renderProducts();
    return;
  }
  const b = e.target.closest(".add-btn");
  if (!b || b.disabled) return;
  const p = PRODUCTS.find((x) => x.id === b.dataset.id);
  if (!p) return;
  addToCart({
    id: p.id,
    productId: p.id,
    name: p.name,
    price: p.price,
    art: p.art,
    color: p.color,
    img: p.img,
  });
  b.classList.add("added");
  b.innerHTML = `<svg class="i i-sm"><use href="#i-check"/></svg>تمت الإضافة`;
  setTimeout(() => {
    b.classList.remove("added");
    b.innerHTML = `<svg class="i i-sm"><use href="#i-bag"/></svg>أضف للسلة`;
  }, 1400);
});
$("#q").addEventListener("input", (e) => {
  query = e.target.value.trim();
  if (query) filter = "all";
  renderFilters();
  renderProducts();
});
$("#q").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("products").scrollIntoView();
});

/* ---------- featured colour picker ---------- */
let fm = 0,
  fc = 0;
function renderFeatured(anim) {
  const m = FEATURED[fm],
    c = m.colors[fc];
  $("#fTabs").innerHTML = FEATURED.map(
    (x, i) =>
      `<button role="tab" aria-selected="${i === fm}" data-i="${i}">${x.tab}</button>`,
  ).join("");
  const st = $("#fStage"),
    draw = () => {
      st.innerHTML = art(m.art, c[2]);
    };
  if (anim && st.firstChild) {
    st.firstChild.classList.add("swap");
    setTimeout(draw, 180);
  } else draw();
  $("#fName").textContent = m.tab;
  $("#fColor").textContent = `${c[0]} · ${c[1]}`;
  $("#swatches").innerHTML = m.colors
    .map(
      (x, i) =>
        `<button class="swatch" style="--c:${x[2]}" aria-pressed="${i === fc}" aria-label="${x[0]}" title="${x[0]}" data-i="${i}"></button>`,
    )
    .join("");
  /* Price and stock come from the product itself once the catalogue is in. */
  const p = PRODUCTS.find((x) => x.id === m.key),
    add = $("#fAdd");
  $("#fPrice").innerHTML = p ? sar(p.price) : "";
  $("#fInst").innerHTML = p
    ? `أو ${sar(p.price / 4)} × 4 بدون فوائد <span class="pay-chip pay-tabby">tabby</span><span class="pay-chip pay-tamara">tamara</span>`
    : "";
  add.disabled = !p || !inStock(p);
  add.innerHTML =
    p && !inStock(p)
      ? "نفد المخزون"
      : `<svg class="i i-sm"><use href="#i-bag"/></svg>أضف للسلة`;
}
$("#fTabs").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  fm = +b.dataset.i;
  fc = 0;
  renderFeatured(true);
});
$("#swatches").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  fc = +b.dataset.i;
  renderFeatured(true);
});
$("#fAdd").addEventListener("click", () => {
  const m = FEATURED[fm],
    c = m.colors[fc],
    p = PRODUCTS.find((x) => x.id === m.key);
  if (!p || !inStock(p)) return;
  addToCart({
    id: m.key + "-" + fc,
    productId: m.key,
    name: `${m.tab} — ${c[1]}`,
    price: p.price,
    art: m.art,
    color: c[2],
  });
});

/* ---------- maintenance calculator (prices from repair_prices) ---------- */
const REPAIR = {}; // { brand: { model: [screen, battery, back] } }
const ISSUE = {
  screen: ["الشاشة", 0, "45 دقيقة"],
  battery: ["البطارية", 1, "30 دقيقة"],
  back: ["الزجاج الخلفي", 2, "ساعتين"],
};
let issue = "screen";
const mB = $("#mBrand"),
  mM = $("#mModel");
function buildRepair(rows) {
  rows.forEach((r) => {
    (REPAIR[r.brand] ||= {})[r.model] = [+r.screen, +r.battery, +r.back];
  });
  mB.innerHTML = Object.keys(REPAIR)
    .map((b) => `<option>${esc(b)}</option>`)
    .join("");
  fillModels();
  calcRepair();
}
const fillModels = () => {
  mM.innerHTML = Object.keys(REPAIR[mB.value] || {})
    .map((m) => `<option>${esc(m)}</option>`)
    .join("");
};
function calcRepair() {
  const [label, idx, time] = ISSUE[issue],
    price = REPAIR[mB.value]?.[mM.value]?.[idx];
  if (price == null) return;
  $("#mPrice").innerHTML = sar(price);
  $("#mTime").textContent = `مدة الإصلاح: ${time} · ضمان 6 أشهر`;
  const msg = `السلام عليكم، أبغى أحجز موعد صيانة في فرع الشرفية\n\nالجهاز: ${mM.value}\nالعطل: ${label}\nالسعر التقديري: ${price} ريال\n\nمتى أقرب موعد؟`;
  $("#mBook").href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}
mB.addEventListener("change", () => {
  fillModels();
  calcRepair();
});
mM.addEventListener("change", calcRepair);
$("#mIssue").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  issue = b.dataset.v;
  $$("#mIssue button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  calcRepair();
});

/* ---------- trade-in (old values from trade_values, new devices from PRODUCTS) ---------- */
let OLD = [], // [[model, value]]
  NEW = [];
function buildTradeOld(rows) {
  OLD = rows.map((r) => [r.model, +r.value]);
  $("#tOld").innerHTML = OLD.map(
    (o, i) =>
      `<option value="${i}" ${i === 3 ? "selected" : ""}>${esc(o[0])}</option>`,
  ).join("");
  calcTrade();
}
function buildTradeNew() {
  NEW = PRODUCTS.filter((p) => ["iphone", "samsung", "other"].includes(p.cat));
  const was = $("#tNew").value;
  $("#tNew").innerHTML = NEW.map(
    (p) =>
      `<option value="${esc(p.id)}" ${p.id === was ? "selected" : ""}>${esc(p.name)} — ${fmtN(p.price)} ريال</option>`,
  ).join("");
  calcTrade();
}
let cond = 1;
function calcTrade() {
  const o = OLD[+$("#tOld").value],
    np = NEW.find((p) => p.id === $("#tNew").value);
  if (!o || !np) return;
  const st = +$("#tStorage").value,
    val = Math.round((o[1] * (1 + st * 0.08) * cond) / 10) * 10,
    diff = Math.max(0, np.price - val);
  const cl = $("#tCond [aria-pressed=true]").textContent.trim();
  $("#tNewP").innerHTML = sar(np.price);
  $("#tOldP").innerHTML = "− " + sar(val);
  $("#tDiff").innerHTML = sar(diff);
  $("#tInst").innerHTML = diff
    ? `أو ${sar(diff / 4)} × 4 <span class="pay-chip pay-tabby">tabby</span><span class="pay-chip pay-tamara">tamara</span>`
    : "";
  const msg = `السلام عليكم، أبغى أستبدل جهازي\n\nجهازي: ${o[0]} (${$("#tStorage").selectedOptions[0].text}) — الحالة: ${cl}\nالقيمة التقديرية: ${val} ريال\nالجهاز الجديد: ${np.name} — ${np.price} ريال\nالفرق: ${diff} ريال`;
  $("#tBook").href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
}
["#tOld", "#tStorage", "#tNew"].forEach((s) =>
  $(s).addEventListener("change", calcTrade),
);
$("#tCond").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  cond = +b.dataset.v;
  $$("#tCond button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  calcTrade();
});

/* ---------- loading: catalogue + calculator prices ---------- */
let pricesLoaded = false;
async function loadPrices() {
  try {
    const [rp, tv] = await Promise.all([
      sb.from("repair_prices").select("brand,model,screen,battery,back").order("sort"),
      sb.from("trade_values").select("model,value").order("sort"),
    ]);
    if (rp.error) throw rp.error;
    if (tv.error) throw tv.error;
    buildRepair(rp.data);
    buildTradeOld(tv.data);
    pricesLoaded = true;
  } catch (e) {
    console.error("loadPrices", e);
  }
}
catalogView.loading = renderProducts;
catalogView.failed = renderProducts;
catalogView.ready = () => {
  renderProducts();
  renderFeatured(false);
  buildTradeNew();
};
function loadShop() {
  loadCatalog();
  if (!pricesLoaded) loadPrices();
}

/* ---------- branch status (Jeddah time) ---------- */
const DAYS = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const HOURS = (d) => (d === 5 ? [14, 24] : [8, 24]);
function now() {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const g = (t) => p.find((x) => x.type === t).value;
  return {
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      g("weekday"),
    ),
    h: +g("hour") % 24,
    m: +g("minute"),
  };
}
const fh = (h) =>
  h === 24
    ? "12:00 ص"
    : h === 12
      ? "12:00 م"
      : h > 12
        ? `${h - 12}:00 م`
        : `${h}:00 ص`;
function renderStatus() {
  const n = now(),
    [o, c] = HOURS(n.day),
    t = n.h + n.m / 60,
    open = t >= o && t < c,
    s = $("#status");
  s.className = "status " + (open ? "open" : "closed");
  if (open) {
    const l = c - t;
    s.innerHTML = `<span class="dot"></span>مفتوح الآن · ${l < 1 ? `يقفل بعد ${Math.round(l * 60)} دقيقة` : `حتى ${fh(c)}`}`;
  } else {
    const nd = t < o ? n.day : (n.day + 1) % 7;
    s.innerHTML = `<span class="dot"></span>مغلق الآن · يفتح ${nd === n.day ? "اليوم" : "بكرة"} ${fh(HOURS(nd)[0])}`;
  }
  $("#hours").innerHTML = [6, 0, 1, 2, 3, 4, 5]
    .map((d) => {
      const [a, b] = HOURS(d);
      return `<tr class="${d === n.day ? "today" : ""}"><td>${DAYS[d]}</td><td class="num">${fh(a)} – ${fh(b)}</td></tr>`;
    })
    .join("");
}
renderStatus();
setInterval(renderStatus, 60000);

/* ---------- light map ---------- */
function drawMap() {
  const cv = $("#mapCanvas"),
    b = cv.getBoundingClientRect(),
    dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = b.width * dpr;
  cv.height = b.height * dpr;
  const x = cv.getContext("2d");
  x.scale(dpr, dpr);
  const W = b.width,
    H = b.height;
  x.fillStyle = "#EEF1F5";
  x.fillRect(0, 0, W, H);
  let s = 7;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  x.fillStyle = "#E1E6ED";
  for (let gx = -20; gx < W; gx += 62)
    for (let gy = -20; gy < H; gy += 54)
      if (r() > 0.12) {
        x.beginPath();
        x.roundRect(gx + 8, gy + 8, 46 + r() * 6, 38 + r() * 6, 4);
        x.fill();
      }
  x.fillStyle = "#D7EEDC";
  x.beginPath();
  x.roundRect(W * 0.08, H * 0.62, W * 0.18, H * 0.18, 8);
  x.fill();
  const road = (p, w, c) => {
    x.strokeStyle = c;
    x.lineWidth = w;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(...p[0]);
    p.slice(1).forEach((q) => x.lineTo(...q));
    x.stroke();
  };
  road(
    [
      [0, H * 0.47],
      [W, H * 0.43],
    ],
    14,
    "#FFFFFF",
  );
  road(
    [
      [W * 0.5, 0],
      [W * 0.52, H],
    ],
    10,
    "#FFFFFF",
  );
  road(
    [
      [W * 0.82, 0],
      [W * 0.9, H],
    ],
    14,
    "#FDE7B0",
  );
  x.fillStyle = "#6B7280";
  x.font = "700 12px Almarai, Tahoma, sans-serif";
  x.textAlign = "center";
  x.fillText("شارع فلسطين", W * 0.25, H * 0.47 - 14);
  x.save();
  x.translate(W * 0.86 + 16, H * 0.2);
  x.rotate(Math.PI / 2 + 0.08);
  x.fillText("طريق المدينة", 0, 0);
  x.restore();
  x.fillStyle = "#9CA3AF";
  x.font = "400 11px Almarai, Tahoma, sans-serif";
  x.fillText("الشرفية", W * 0.3, H * 0.25);
  x.fillText("البغدادية", W * 0.68, H * 0.8);
  x.fillText("حديقة", W * 0.17, H * 0.72);
}
const redraw = () => {
  drawHero();
  drawMap();
};
redraw();
let rt;
addEventListener("resize", () => {
  clearTimeout(rt);
  rt = setTimeout(redraw, 150);
});
if (document.fonts) document.fonts.ready.then(drawMap);

/* ---------- init ---------- */
renderFilters();
renderFeatured(false);
loadShop();
