/* Shared helpers — loaded by the store and the admin page before their own scripts:
   DOM shortcuts, number/price formatting, HTML escaping and the placeholder
   product artwork. Its top-level names are shared with the page scripts. */

/* ---------- DOM + formatting ---------- */
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

const HEX = /^#[0-9a-f]{6}$/i; // valid artwork colour

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
