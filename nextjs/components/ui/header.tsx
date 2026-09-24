"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  BadgePercent,
  Heart,
  MessageCircle,
  MoveLeft,
  Search,
  ShoppingBag,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Store data                                                          */
/* ------------------------------------------------------------------ */

export const STORE_WHATSAPP = "966552605370";
const WHATSAPP_URL = `https://wa.me/${STORE_WHATSAPP}`;
const BOOK_REPAIR_URL = `${WHATSAPP_URL}?text=${encodeURIComponent("السلام عليكم، أبغى أحجز موعد صيانة")}`;

type LinkItem = { title: string; href: string };
type LinkColumn = { heading: string; links: LinkItem[]; optional?: boolean };
type Promo = {
  tag: string;
  title: string;
  subtitle?: string;
  price: number;
  wasPrice?: number;
  image: string;
  href: string;
};

type MegaItem = {
  kind: "mega";
  title: string;
  columns: LinkColumn[];
  promo?: Promo;
  rates?: { model: string; issue: string; price: number }[];
  service?: boolean;
};
type BrandsItem = { kind: "brands"; title: string; brands: LinkItem[] };
type SimpleItem = { kind: "link"; title: string; href: string; deal?: boolean };
type NavItem = MegaItem | BrandsItem | SimpleItem;

const phoneBrands: LinkItem[] = [
  { title: "Apple iPhone", href: "/category/iphone" },
  { title: "Samsung Galaxy", href: "/category/samsung" },
  { title: "Honor", href: "/category/honor" },
  { title: "Xiaomi", href: "/category/xiaomi" },
];

const navigationItems: NavItem[] = [
  { kind: "link", title: "عروض", href: "/sale", deal: true },
  {
    kind: "mega",
    title: "جوالات",
    columns: [
      { heading: "حسب الماركة", links: phoneBrands },
      {
        heading: "تسوّق حسب",
        links: [
          { title: "وصل حديثاً", href: "/new" },
          { title: "تخفيضات", href: "/sale" },
          { title: "مستعمل مضمون", href: "/category/used" },
          { title: "كل الجوالات", href: "/category/phones" },
        ],
      },
      {
        heading: "الأكثر طلباً",
        optional: true,
        links: [
          { title: "iPhone 17 Pro Max", href: "/product/iphone-17-pro-max" },
          { title: "Galaxy S25 Ultra", href: "/product/galaxy-s25-ultra" },
          { title: "iPhone 16 Pro", href: "/product/iphone-16-pro" },
          { title: "Galaxy Z Flip7", href: "/product/galaxy-z-flip7" },
        ],
      },
    ],
    promo: {
      tag: "وصل حديثاً",
      title: "iPhone 17 Pro Max",
      subtitle: "256GB · Cosmic Orange",
      price: 5299,
      image:
        "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
      href: "/product/iphone-17-pro-max",
    },
  },
  {
    kind: "mega",
    title: "إكسسوارات",
    columns: [
      {
        heading: "شحن وطاقة",
        links: [
          { title: "شواحن Anker", href: "/category/anker" },
          { title: "باور بانك", href: "/category/power-banks" },
          { title: "منتجات Green Lion", href: "/category/green-lion" },
        ],
      },
      {
        heading: "الحماية",
        links: [
          { title: "حماية الشاشة", href: "/category/screen-protection" },
          { title: "كفرات MagSafe", href: "/category/magsafe" },
        ],
      },
      {
        heading: "الصوت",
        optional: true,
        links: [
          { title: "سماعات لاسلكية", href: "/category/earbuds" },
          { title: "كل الإكسسوارات", href: "/category/accessories" },
        ],
      },
    ],
    promo: {
      tag: "خصم 24%",
      title: "شاحن Anker Prime GaN 65W",
      subtitle: "3 منافذ · شحن سريع",
      price: 189,
      wasPrice: 249,
      image:
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80",
      href: "/product/anker-prime-65w",
    },
  },
  {
    kind: "mega",
    title: "صيانة واستبدال",
    service: true,
    columns: [
      {
        heading: "الخدمات",
        links: [
          { title: "حاسبة الصيانة", href: "/#services" },
          { title: "استبدل جهازك", href: "/#trade-in" },
          { title: "موقع الفرع وأوقات الدوام", href: "/#branch" },
        ],
      },
    ],
    rates: [
      { model: "iPhone 16 Pro", issue: "الشاشة", price: 1349 },
      { model: "iPhone 15", issue: "البطارية", price: 349 },
      { model: "Galaxy S24 Ultra", issue: "الشاشة", price: 1199 },
    ],
  },
  {
    kind: "brands",
    title: "ماركات",
    brands: [
      { title: "Apple", href: "/category/iphone" },
      { title: "SAMSUNG", href: "/category/samsung" },
      { title: "HONOR", href: "/category/honor" },
      { title: "Xiaomi", href: "/category/xiaomi" },
      { title: "Anker", href: "/category/anker" },
      { title: "Green Lion", href: "/category/green-lion" },
    ],
  },
  { kind: "link", title: "مستعمل مضمون", href: "/category/used" },
  { kind: "link", title: "وصل حديثاً", href: "/new" },
];

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="دروبي لاين للاتصالات"
      className="flex shrink-0 items-center gap-2.5 text-[#1D4E9E]"
    >
      <svg
        viewBox="0 0 48 48"
        className={cn("h-9 w-9", !compact && "lg:h-10 lg:w-10")}
        aria-hidden="true"
      >
        <path
          d="M6 8h16a16 16 0 0 1 0 32H6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinejoin="round"
        />
        <path
          d="M13 16h8a8 8 0 0 1 0 16h-8z"
          fill="currentColor"
          opacity=".18"
        />
        <path
          d="M13 16v16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M34 6a14 14 0 0 1 8 8M36 12a6 6 0 0 1 2.5 3"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M42 40H28"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="flex flex-col leading-tight">
        <span className="text-base font-extrabold lg:text-lg">دروبي لاين</span>
        {!compact && (
          <span
            className="font-sans text-[10.5px] font-bold lg:text-[11.5px]"
            dir="ltr"
          >
            Drobi Line Telecom
          </span>
        )}
      </span>
    </Link>
  );
}

/** Saudi Riyal sign, drawn as an icon until the official SVG is dropped in. */
function RiyalSign({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("inline-block h-[0.85em] w-[0.85em]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="ريال"
    >
      <path d="M9.2 2.8V17.2c0 1.2-1.2 2-4.4 2.6" />
      <path d="M14.6 4.6v11.8" />
      <path d="M3.8 10.9 20.2 7.4" />
      <path d="M3.8 15.4 20.2 11.9" />
      <path d="M13.6 20.9l6.6-1.4" />
    </svg>
  );
}

function Price({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", className)}
    >
      {fmt(value)}
      <RiyalSign />
    </span>
  );
}

function IconButton({
  label,
  badge,
  badgeTone = "dark",
  onClick,
  className,
  children,
}: {
  label: string;
  badge?: number;
  badgeTone?: "dark" | "red";
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      onClick={onClick}
      className={cn(
        "relative grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-muted",
        className,
      )}
    >
      {children}
      {!!badge && (
        <span
          className={cn(
            "absolute -top-0.5 start-6 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-background px-1 text-[10.5px] font-extrabold leading-none text-white tabular-nums",
            badgeTone === "red" ? "bg-red-700" : "bg-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/** Underlined text-style trigger/link for the category row. */
const navItemClass =
  "relative inline-flex h-12 items-center gap-1.5 bg-transparent px-3 text-[14.5px] font-normal text-foreground transition-colors hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-center after:scale-x-0 after:bg-foreground after:transition-transform hover:after:scale-x-100 data-[state=open]:after:scale-x-100";

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <div className="col-span-2 grid grid-cols-[110px_1fr] items-center gap-4 rounded-xl bg-muted p-4 lg:col-span-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={promo.image}
        alt={promo.title}
        className="h-36 w-full rounded-lg bg-background object-cover"
        onError={(e) => (e.currentTarget.style.visibility = "hidden")}
      />
      <div className="flex flex-col items-start gap-1">
        <span className="rounded-sm bg-red-800 px-2 py-0.5 text-[11.5px] font-bold text-white">
          {promo.tag}
        </span>
        <p className="mt-1 text-[15px] font-extrabold leading-snug">
          {promo.title}
        </p>
        {promo.subtitle && (
          <p className="text-[13px] text-muted-foreground">{promo.subtitle}</p>
        )}
        <p className="flex items-baseline gap-2 text-[17px] font-extrabold">
          <Price value={promo.price} />
          {promo.wasPrice && (
            <s className="text-[13px] font-normal text-muted-foreground">
              {fmt(promo.wasPrice)}
            </s>
          )}
        </p>
        <p className="text-[11.5px] text-muted-foreground tabular-nums">
          أو {fmt(promo.price / 4)} × 4 مع تابي وتمارا
        </p>
        <Button size="sm" className="mt-2" asChild>
          <Link href={promo.href}>تسوّق الآن</Link>
        </Button>
      </div>
    </div>
  );
}

function MegaPanel({ item }: { item: MegaItem | BrandsItem }) {
  const inner = "container mx-auto px-4 pb-6 pt-5 lg:px-6 lg:pb-8 lg:pt-7";

  if (item.kind === "brands") {
    return (
      <div
        className={cn(
          inner,
          "grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr] lg:gap-8",
        )}
      >
        <div>
          <p className="mb-2.5 text-[12.5px] font-extrabold text-muted-foreground">
            الماركات
          </p>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">
            وكلاء معتمدين وضمان سنتين على كل الأجهزة الجديدة.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {item.brands.map((b) => (
            <NavigationMenuLink asChild key={b.title}>
              <Link
                href={b.href}
                dir="ltr"
                className="grid h-16 place-items-center rounded-xl border font-sans text-[13.5px] lg:h-20 lg:text-[15px] font-extrabold tracking-wide text-foreground/80 transition-colors hover:border-foreground hover:text-foreground"
              >
                {b.title}
              </Link>
            </NavigationMenuLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        inner,
        "grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-[repeat(2,minmax(0,1fr))_320px] lg:gap-8 xl:grid-cols-[repeat(3,minmax(0,1fr))_340px]",
      )}
    >
      {item.columns.map((col) => (
        <div
          key={col.heading}
          className={cn(col.optional && "lg:hidden xl:block")}
        >
          <p className="mb-2.5 text-[12.5px] font-extrabold text-muted-foreground">
            {col.heading}
          </p>
          <ul className="flex flex-col">
            {col.links.map((l) => (
              <li key={l.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={l.href}
                    className="block py-1.5 text-[14.5px] transition-colors hover:text-[#1D4E9E]"
                  >
                    {l.title}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {item.rates && (
        <div className="col-span-2 lg:col-span-1 xl:col-span-2">
          <p className="mb-2.5 text-[12.5px] font-extrabold text-muted-foreground">
            أسعار شائعة
          </p>
          <table className="w-full text-sm">
            <tbody>
              {item.rates.map((r) => (
                <tr key={r.model + r.issue} className="border-b">
                  <td className="py-2.5">{r.model}</td>
                  <td className="py-2.5 text-muted-foreground">{r.issue}</td>
                  <td className="py-2.5 text-end font-extrabold">
                    <Price value={r.price} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <NavigationMenuLink asChild>
            <Link
              href="/#services"
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-extrabold"
            >
              احسب سعر جهازك <MoveLeft className="h-4 w-4" />
            </Link>
          </NavigationMenuLink>
        </div>
      )}

      {item.promo && <PromoCard promo={item.promo} />}

      {item.service && (
        <div className="col-span-2 flex flex-col items-start gap-2 rounded-xl bg-foreground p-5 text-background lg:col-span-1">
          <p className="text-[17px] font-extrabold">صيانة وأنت تنتظر</p>
          <p className="text-[13px] leading-relaxed opacity-75">
            فنيين معتمدين وقطع أصلية في فرع الشرفية، وضمان 6 أشهر على الإصلاح.
          </p>
          <Button
            size="sm"
            className="mt-2 bg-[#25D366] text-[#063B1A] hover:bg-[#25D366]/90"
            asChild
          >
            <a href={BOOK_REPAIR_URL} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              احجز عبر الواتساب
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export interface HeaderProps {
  /** Number of items in the cart (badge hidden at 0). */
  cartCount?: number;
  /** Number of saved favourites (badge hidden at 0). */
  favCount?: number;
  /** Opens the cart drawer. */
  onCartClick?: () => void;
  /** Opens the favourites list. Falls back to /favorites when omitted. */
  onFavClick?: () => void;
  /** Called on every keystroke and on submit. Falls back to /search?q= when omitted. */
  onSearch?: (query: string) => void;
}

function Header1({
  cartCount = 0,
  favCount = 0,
  onCartClick,
  onFavClick,
  onSearch,
}: HeaderProps) {
  const [query, setQuery] = useState("");

  const submitSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (onSearch) onSearch(q);
    else window.location.href = `/search?q=${encodeURIComponent(q)}`;
  };

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-40 w-full border-b bg-background"
    >
      {/* Row 1 — logo · search · icons (mobile: menu · logo · icons / search) */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2.5 py-2.5 [grid-template-areas:'logo_icons'_'search_search'] sm:min-h-[68px] sm:grid-cols-[1fr_minmax(0,440px)_1fr] sm:gap-x-4 sm:py-0 sm:[grid-template-areas:'logo_search_icons'] lg:min-h-[76px] lg:grid-cols-[1fr_minmax(0,560px)_1fr] lg:gap-x-8">
          <div className="justify-self-start [grid-area:logo]">
            <Logo />
          </div>

          <form
            role="search"
            onSubmit={submitSearch}
            className="w-full justify-self-center [grid-area:search]"
          >
            <label className="relative block">
              <span className="sr-only">ابحث في المتجر</span>
              <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="ابحث عن آيفون، سامسونج، شاحن…"
                className="h-11 w-full rounded-full border border-transparent bg-[#F1F2F4] pe-4 ps-12 text-[14.5px] outline-none transition placeholder:text-[#8A909C] focus:border-foreground focus:bg-background focus:ring-4 focus:ring-foreground/5"
              />
            </label>
          </form>

          <div className="flex items-center gap-0.5 justify-self-end [grid-area:icons]">
            <Link
              href="/account"
              aria-label="حسابي"
              title="حسابي"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted"
            >
              <UserRound className="h-[21px] w-[21px]" />
            </Link>
            <IconButton
              label="المفضلة"
              badge={favCount}
              badgeTone="red"
              onClick={
                onFavClick ?? (() => (window.location.href = "/favorites"))
              }
            >
              <Heart className="h-[21px] w-[21px]" />
            </IconButton>
            <IconButton label="السلة" badge={cartCount} onClick={onCartClick}>
              <ShoppingBag className="h-[21px] w-[21px]" />
            </IconButton>
          </div>
        </div>
      </div>

      {/* Row 2 — category nav: centered on desktop, swipeable row on mobile; mega panels span the full header width */}
      <NavigationMenu
        dir="rtl"
        viewport={false}
        className="static flex w-full max-w-none [&>div]:!static [&>div]:w-full [&>div]:min-w-0"
      >
        <NavigationMenuList className="h-12 w-full justify-start gap-0 overflow-x-auto overscroll-x-contain px-2.5 [justify-content:safe_center] [scrollbar-width:none] lg:gap-1.5 lg:px-0 [&::-webkit-scrollbar]:hidden">
          {navigationItems.map((item) => (
            <NavigationMenuItem key={item.title} className="static shrink-0">
              {item.kind === "link" ? (
                <NavigationMenuLink asChild>
                  <Link
                    href={item.href}
                    className={cn(navItemClass, item.deal && "font-extrabold")}
                  >
                    {item.deal && (
                      <BadgePercent className="h-[17px] w-[17px] text-red-700" />
                    )}
                    {item.title}
                  </Link>
                </NavigationMenuLink>
              ) : (
                <>
                  <NavigationMenuTrigger
                    className={cn(
                      navItemClass,
                      "rounded-none [&>svg]:text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!absolute inset-x-0 top-full z-50 max-h-[70vh] overflow-y-auto border-y bg-background shadow-[0_30px_40px_-30px_rgba(16,24,40,.25)] md:!w-full lg:max-h-none lg:overflow-visible">
                    <MegaPanel item={item} />
                  </NavigationMenuContent>
                </>
              )}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}

export { Header1 };
