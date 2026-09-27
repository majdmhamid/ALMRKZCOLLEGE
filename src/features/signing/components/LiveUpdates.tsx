"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * بيخلّي صفحات التوقيع محدّثة لحالها: لما عميل يوقّع، الجرس وحالة الصف و«1/2 وقّعوا» بيتغيّروا بدون تحديث يدوي.
 * كل 3 ثواني بيسأل /api/admin/live «في إشي تغيّر؟» (رقم صغير)، وإذا تغيّر بيحدّث الصفحة.
 * (الدخول صار عبر لوحة التحكم مش Supabase Auth، فما منستعمل Supabase Realtime.)
 */
export function LiveUpdates() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // كذا صف بيتغيّر مع كل توقيع — تحديث واحد بيكفي
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };
    let last: string | null = null;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" });
        if (!res.ok) return;
        const { v } = (await res.json()) as { v: string };
        if (last !== null && v !== last) refresh();
        last = v;
      } catch {
        /* بدون إنترنت — منجرّب بالدورة الجاي */
      }
    };
    void tick();
    const id = setInterval(tick, 3000);
    const onVisible = () => document.visibilityState === "visible" && void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
