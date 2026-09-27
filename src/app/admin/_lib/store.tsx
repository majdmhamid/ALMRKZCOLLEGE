"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@content/types";
import type { DocumentStats } from "@/features/signing/lib/domain";
import { diffContent, type Change } from "@/lib/cms/diff";
import { checkContent, checkMissing, type MissingIssue, type RuleIssue } from "@/lib/cms/rules";
import type { SectionKey, SiteContent } from "@/lib/cms/schema";
import { buildSiteData, type SiteData } from "@/lib/site-data";
import { saveSection } from "../actions";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "conflict";

interface ToastItem {
  id: number;
  message: string;
  tone?: "success" | "error" | "info";
  undo?: () => void;
}

interface AdminCtx {
  draft: SiteContent;
  published: SiteContent;
  publishedAt: string | null;
  data: SiteData;
  version: number;
  status: SaveStatus;
  savedAt: string | null;
  locale: Locale;
  setLocale: (l: Locale) => void;
  update: <K extends SectionKey>(section: K, next: SiteContent[K] | ((prev: SiteContent[K]) => SiteContent[K])) => void;
  /** يحفظ فوراً كل التعديلات المعلّقة (قبل النشر أو المعاينة) */
  flush: () => Promise<boolean>;
  /** يجيب آخر نسخة من السيرفر ويبدأ منها (بعد نشر / إلغاء / إرجاع نسخة) */
  reload: () => void;
  changes: Change[];
  issues: RuleIssue[];
  missing: MissingIssue[];
  toast: (t: Omit<ToastItem, "id">) => void;
  toasts: ToastItem[];
  dismissToast: (id: number) => void;
  demo: boolean;
  storeKind: "file" | "supabase";
  adminName: string;
  /** أرقام التوقيع الإلكتروني (للقائمة والرئيسية) */
  signingStats: SigningStats | null;
}

export type SigningStats = DocumentStats & { unread: number };

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside AdminProvider");
  return c;
}

const SAVE_DELAY = 700;

export function AdminProvider({
  initialDraft,
  initialVersion,
  initialSavedAt,
  published,
  publishedAt,
  demo,
  storeKind,
  adminName,
  signingStats,
  children,
}: {
  initialDraft: SiteContent;
  initialVersion: number;
  initialSavedAt: string | null;
  published: SiteContent;
  publishedAt: string | null;
  demo: boolean;
  storeKind: "file" | "supabase";
  adminName: string;
  signingStats: SigningStats | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [version, setVersion] = useState(initialVersion);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState(initialSavedAt);
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const draftRef = useRef(draft);
  const versionRef = useRef(version);
  const pending = useRef(new Set<SectionKey>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef<Promise<boolean> | null>(null);

  // الصفحة بتتحدّث لحالها (تحديثات التوقيع الحيّة) — ما منمسح تعديلات المتصفح إلا إذا:
  //  - طلبنا نحن التحديث (بعد نشر، إلغاء، إرجاع نسخة)، أو
  //  - السيرفر عنده نسخة أحدث وما في تعديلات معلّقة هون.
  const [seen, setSeen] = useState({ initialDraft, initialVersion });
  const [resetRequested, setResetRequested] = useState(false);
  if (seen.initialDraft !== initialDraft || seen.initialVersion !== initialVersion) {
    setSeen({ initialDraft, initialVersion });
    const idle = status !== "pending" && status !== "saving";
    if (resetRequested || (idle && initialVersion > version)) {
      setResetRequested(false);
      setDraft(initialDraft);
      setVersion(initialVersion);
      setSavedAt(initialSavedAt);
      if (status === "conflict") setStatus("idle");
    }
  }
  const reload = useCallback(() => {
    setResetRequested(true);
    router.refresh();
  }, [router]);
  useEffect(() => {
    draftRef.current = draft;
    versionRef.current = version;
  }, [draft, version]);

  useEffect(() => {
    try {
      const l = localStorage.getItem("almrkz-admin-locale");
      // اللغة المحفوظة تُقرأ بعد أول رسم فقط (السيرفر ما بعرفها) — تبديل لمرة وحدة
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (l === "he" || l === "ar") setLocaleState(l);
    } catch {}
  }, []);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("almrkz-admin-locale", l);
    } catch {}
  }, []);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), t.undo ? 7000 : 3500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);

  const runSaves = useCallback(async (): Promise<boolean> => {
    if (running.current) await running.current;
    if (!pending.current.size) return true;
    const job = (async () => {
      setStatus("saving");
      while (pending.current.size) {
        const [section] = pending.current;
        pending.current.delete(section);
        const res = await saveSection(section, draftRef.current[section], versionRef.current).catch(() => ({ ok: false as const, reason: "error" as const }));
        if (!res.ok) {
          setStatus(res.reason === "conflict" ? "conflict" : "error");
          if (res.reason === "conflict") {
            toast({ tone: "error", message: "اللوحة مفتوحة ومتعدّلة من مكان ثاني — رح نحدّث الصفحة بآخر نسخة." });
            setTimeout(() => {
              setResetRequested(true);
              router.refresh();
            }, 1500);
          }
          if (res.reason === "error") pending.current.add(section);
          return false;
        }
        versionRef.current = res.version;
        setVersion(res.version);
        setSavedAt(res.updatedAt);
      }
      setStatus("saved");
      return true;
    })();
    running.current = job;
    const ok = await job;
    running.current = null;
    return ok;
  }, [toast, router]);

  const schedule = useCallback(() => {
    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void runSaves(), SAVE_DELAY);
  }, [runSaves]);

  const update = useCallback<AdminCtx["update"]>(
    (section, next) => {
      setDraft((prev) => {
        const value = typeof next === "function" ? (next as (p: unknown) => unknown)(prev[section]) : next;
        const out = { ...prev, [section]: value } as SiteContent;
        draftRef.current = out;
        return out;
      });
      pending.current.add(section);
      schedule();
    },
    [schedule],
  );

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    return runSaves();
  }, [runSaves]);

  // إعادة المحاولة تلقائياً بعد خطأ شبكة
  useEffect(() => {
    if (status !== "error") return;
    const t = setTimeout(() => void runSaves(), 4000);
    return () => clearTimeout(t);
  }, [status, runSaves]);

  // تحذير عند إغلاق الصفحة قبل الحفظ
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pending.current.size || status === "saving" || status === "pending") e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);

  const data = useMemo(() => buildSiteData(draft), [draft]);
  const changes = useMemo(() => diffContent(published, draft), [published, draft]);
  const issues = useMemo(() => checkContent(draft), [draft]);
  const missing = useMemo(() => checkMissing(draft), [draft]);

  const value: AdminCtx = {
    draft,
    published,
    publishedAt,
    data,
    version,
    status,
    savedAt,
    locale,
    setLocale,
    update,
    flush,
    reload,
    changes,
    issues,
    missing,
    toast,
    toasts,
    dismissToast,
    demo,
    storeKind,
    adminName,
    signingStats,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
