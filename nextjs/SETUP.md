# هيدر دروبي لاين — Next.js + shadcn/ui + Tailwind + TypeScript

السطر الأول: الشعار يمين، البحث في النص، وأيقونات الحساب والمفضلة والسلة يسار.
السطر الثاني: قائمة الأقسام في النص (عروض، جوالات، إكسسوارات، صيانة واستبدال، ماركات، مستعمل مضمون، وصل حديثاً)، وكل قسم فيه قائمة عريضة بعرض الصفحة.
على الجوال: نفس سطر الأقسام يصير شريط تسحبه يمين ويسار، والقائمة تنفتح بالضغط تحته.

## 1) إنشاء المشروع (لو ما عندك مشروع جاهز)

```bash
npx create-next-app@latest drobi-line --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd drobi-line
npx shadcn@latest init
```

أمر `shadcn init` ينشئ `components.json` ويضبط `lib/utils.ts` والمتغيرات في `app/globals.css`.

## 2) ليش لازم مجلد `components/ui`؟

هذا المسار الافتراضي في shadcn (موجود في `components.json` تحت `aliases.ui`).
أمر `npx shadcn add ...` يحط المكونات فيه، وكل الاستيرادات مثل `@/components/ui/button` تعتمد عليه.
لو غيّرته لازم تعدّل الـ alias وكل الاستيرادات، فالأسهل تخليه زي ما هو.

## 3) تثبيت الحزم

```bash
npm i lucide-react @radix-ui/react-slot class-variance-authority @radix-ui/react-icons @radix-ui/react-navigation-menu clsx tailwind-merge
```

(مع Tailwind v4 يكون `tw-animate-css` مثبت من `shadcn init`، وهو المسؤول عن حركة فتح القائمة.)

## 4) انسخ الملفات

| الملف | المكان في مشروعك |
|---|---|
| `components/ui/header.tsx` | الهيدر نفسه (`Header1`) |
| `components/ui/button.tsx` | زر shadcn |
| `components/ui/navigation-menu.tsx` | قائمة shadcn بعد تعديلها للعربي (RTL) |
| `components/ui/demo.tsx` | مثال استخدام |
| `lib/utils.ts` | دالة `cn` (غالباً موجودة بعد init) |
| `app/layout.tsx` | خط Almarai و `dir="rtl"` |
| `app/page.tsx` | صفحة تجربة |

> لو أضفت button أو navigation-menu بالأمر `npx shadcn add`، استبدل ملف navigation-menu بنسختنا لأنها معدّلة للعربي.

## 5) الخصائص (Props)

```tsx
<Header1
  cartCount={2}                 // رقم السلة (يختفي إذا صفر)
  favCount={1}                  // رقم المفضلة (يختفي إذا صفر)
  onCartClick={openDrawer}      // يفتح سلة التسوق الجانبية
  onFavClick={openFavourites}   // بدونه يروح على /favorites
  onSearch={(q) => setQuery(q)} // بدونه يروح البحث على /search?q=
/>
```

الأقسام وروابطها كلها في مصفوفة `navigationItems` أول الملف، تعدّلها من هناك بدون ما تلمس التصميم.

## 6) وش تغيّر عن المكون الأصلي

- التصميم على شكل سطرين: (شعار · بحث · أيقونات) ثم قائمة أقسام في النص بخط تحت القسم المفتوح.
- القوائم المنسدلة بعرض الصفحة كاملة: أعمدة روابط + بطاقة منتج (صورة، سعر، تقسيط، زر). قسم الصيانة فيه جدول أسعار شائعة وبطاقة حجز واتساب، وقسم الماركات مربعات.
- أضفت خاصية `viewport={false}` لملف navigation-menu عشان القائمة تنفتح بعرض الصفحة بدل صندوق صغير.
- `dir="rtl"`، أسهم `MoveLeft`، ومسافات منطقية (`ms-*`, `start-*`, `ps-*`).
- ما فيه زر قائمة ولا لوحة جانبية: سطر الأقسام نفسه يظهر على الجوال كشريط يتسحب.
- الهيدر `sticky` بدل `fixed` عشان ما يغطي أول المحتوى.

## 7) الصور

بطاقتي المنتج في القوائم تستخدم روابط صور من Unsplash كبداية (ما قدرت أتأكد إنها تفتح من هنا، ولو ما فتحت تختفي الصورة بدون ما يخرب الشكل).
الأفضل تحط صور منتجاتكم في `public/products/` وتغيّر `image` في `navigationItems`.
الشعار ورمز الريال SVG مؤقتين داخل الملف، بدّلهم بالشعار الحقيقي والرمز الرسمي.
