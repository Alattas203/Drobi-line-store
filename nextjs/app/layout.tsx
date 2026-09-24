import type { Metadata } from "next";
import { Almarai } from "next/font/google";
import "./globals.css";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دروبي لاين للاتصالات",
  description: "جوالات أصلية، إكسسوارات، وصيانة معتمدة في جدة — ضمان سنتين وتوصيل بنفس اليوم.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={almarai.className}>{children}</body>
    </html>
  );
}
