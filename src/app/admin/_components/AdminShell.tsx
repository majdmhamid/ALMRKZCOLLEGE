"use client";

import {
  BookOpen,
  Building2,
  Clapperboard,
  ExternalLink,
  Eye,
  FileCheck2,
  FileSignature,
  Handshake,
  History,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  Type,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import { logoutAction } from "../login/actions";
import { useAdmin } from "../_lib/store";
import { LocaleToggle, SaveIndicator, Toasts } from "./bits";
import PublishButton from "./PublishButton";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  count?: number;
  /** نقطة حمراء: إشعارات جديدة (توقيعات وصلت) */
  badge?: number;
  /** الصفحة المقابلة في الموقع (لزر المعاينة) */
  sitePath?: string;
  external?: boolean;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, changes, demo, storeKind, signingStats, adminName } = useAdmin();
  const [open, setOpen] = useState(false);

  const siteNav: NavItem[] = [
    { href: "/admin/courses", label: "الدورات والمجالات", icon: BookOpen, count: data.courses.length, sitePath: "/courses" },
    { href: "/admin/graduates", label: "الخريجون", icon: Users, count: data.graduates.length, sitePath: "/graduates" },
    { href: "/admin/news", label: "الأخبار", icon: Newspaper, count: data.news.length, sitePath: "/news" },
    { href: "/admin/gallery", label: "معرض الصور", icon: Images, count: data.gallery.length, sitePath: "/gallery" },
    { href: "/admin/videos", label: "الفيديوهات", icon: Clapperboard, count: data.reels.length + data.videos.length + 1, sitePath: "/gallery" },
    { href: "/admin/staff", label: "الطاقم", icon: UserRound, count: data.staff.length, sitePath: "/about" },
    { href: "/admin/partners", label: "الشركاء", icon: Handshake, count: data.partners.length, sitePath: "/about" },
    { href: "/admin/site", label: "معلومات الكلية", icon: Building2, sitePath: "/contact" },
    { href: "/admin/texts", label: "نصوص الموقع", icon: Type, sitePath: "" },
  ];
  const signingNav: NavItem[] = [
    { href: "/admin/documents", label: "المستندات", icon: FileSignature, count: signingStats?.waiting, badge: signingStats?.unread },
    { href: "/admin/signed", label: "المستندات الموقّعة", icon: FileCheck2 },
    { href: "/admin/settings", label: "إعدادات التوقيع", icon: Settings },
  ];
  const all = [{ href: "/admin", label: "الرئيسية", icon: LayoutDashboard, sitePath: "" } as NavItem, ...siteNav, ...signingNav, { href: "/admin/history", label: "سجل النشر", icon: History } as NavItem];
  const current = [...all].sort((a, b) => b.href.length - a.href.length).find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  const isCurrent = (n: NavItem) => current?.href === n.href;

  const link = (n: NavItem) => {
    const Icon = n.icon;
    const inner = (
      <>
        <Icon size={19} className="shrink-0" />
        <span className="flex-1">{n.label}</span>
        {n.external && <ExternalLink size={14} className="opacity-50" />}
        {!!n.badge && <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white" title="توقيعات جديدة">{n.badge}</span>}
        {n.count !== undefined && <span className="side-count rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-ink-muted">{n.count}</span>}
      </>
    );
    return n.external ? (
      <a key={n.href} href={n.href} className="side-link">
        {inner}
      </a>
    ) : (
      <Link key={n.href} href={n.href} className="side-link" aria-current={isCurrent(n) ? "page" : undefined} onClick={() => setOpen(false)}>
        {inner}
      </Link>
    );
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-4" aria-label="لوحة التحكم">
      <Link href="/admin" className="flex items-center gap-3 px-1 pt-1" onClick={() => setOpen(false)}>
        <Image src="/images/brand/logo.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl bg-white object-contain ring-1 ring-line" />
        <span>
          <span className="block text-base font-extrabold leading-tight">كلية المركز</span>
          <span className="block text-xs font-bold text-brand-600">لوحة التحكم</span>
        </span>
      </Link>

      <div className="space-y-1">{link(all[0])}</div>

      <div>
        <p className="mb-2 px-3 text-xs font-extrabold tracking-wide text-ink-muted">محتوى الموقع</p>
        <div className="space-y-1">{siteNav.map(link)}</div>
      </div>

      <div>
        <p className="mb-2 px-3 text-xs font-extrabold tracking-wide text-ink-muted">التوقيع الإلكتروني</p>
        <div className="space-y-1">{signingNav.map(link)}</div>
      </div>

      <div>
        <p className="mb-2 px-3 text-xs font-extrabold tracking-wide text-ink-muted">النشر</p>
        <div className="space-y-1">{link(all[all.length - 1])}</div>
      </div>

      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <a href="/ar" target="_blank" rel="noopener" className="side-link">
          <ExternalLink size={19} />
          <span className="flex-1">فتح الموقع</span>
        </a>
        <form action={logoutAction}>
          <button type="submit" className="side-link w-full" title={adminName}>
            <LogOut size={19} />
            <span className="flex-1 truncate text-start">خروج</span>
            <span className="max-w-[8rem] truncate text-xs font-normal text-ink-muted" dir="auto">
              {adminName}
            </span>
          </button>
        </form>
      </div>
    </nav>
  );

  const previewPath = current?.sitePath;

  return (
    <div className="min-h-screen lg:ps-72">
      {/* القائمة الجانبية */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-72 border-e border-line bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/40" aria-label="إغلاق القائمة" onClick={() => setOpen(false)} />
          <aside className="admin-pop absolute inset-y-0 start-0 w-72 bg-white shadow-lift">
            <button className="absolute end-3 top-3 rounded-lg p-2 hover:bg-surface" aria-label="إغلاق" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* الشريط العلوي */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        {(demo || storeKind === "file") && (
          <p className="bg-amber-50 px-4 py-1.5 text-center text-xs font-bold text-amber-800">
            وضع تجريبي على هذا الجهاز — التعديلات تنحفظ هون بس{demo ? "، وبدون كلمة سر" : ""}.
          </p>
        )}
        <div className="flex items-center gap-3 px-4 py-3 md:px-8">
          <button className="rounded-lg p-2 hover:bg-surface lg:hidden" aria-label="القائمة" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold">{current?.label ?? "لوحة التحكم"}</p>
          </div>
          <div className="hidden md:block">
            <SaveIndicator />
          </div>
          {previewPath !== undefined && <LocaleToggle />}
          {previewPath !== undefined && <PreviewButton sitePath={previewPath} />}
          <PublishButton count={changes.length} />
        </div>
      </header>

      <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      <Toasts />
    </div>
  );
}

function PreviewButton({ sitePath }: { sitePath: string }) {
  const { flush, locale } = useAdmin();
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm hidden sm:inline-flex"
      onClick={async () => {
        const w = window.open("about:blank", "_blank");
        await flush();
        const url = `/admin/preview?path=${encodeURIComponent(`/${locale}${sitePath}`)}`;
        if (w) w.location.href = url;
        else window.open(url, "_self");
      }}
      title="افتح صفحة الموقع بالتعديلات قبل نشرها"
    >
      <Eye size={17} />
      معاينة على الموقع
    </button>
  );
}
