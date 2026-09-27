import type { Metadata } from "next";
import { Almarai, Heebo } from "next/font/google";
import type { ReactNode } from "react";
import "../globals.css";
import "./admin.css";

const almarai = Almarai({ subsets: ["arabic", "latin"], weight: ["300", "400", "700", "800"], variable: "--font-almarai", display: "swap" });
const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "لوحة التحكم — كلية المركز", template: "%s · لوحة التحكم" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.png" },
};

/** لوحة التحكم — نفس خطوط وألوان الموقع، بالعربي ومن اليمين لليسار */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${heebo.variable}`}>
      <body className="admin-body min-h-screen bg-surface text-ink">{children}</body>
    </html>
  );
}
