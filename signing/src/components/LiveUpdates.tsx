"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Keeps the admin pages current without a manual refresh: when a client signs,
 * the bell count, the row status and "1/2 signed" update on their own.
 * - Supabase: Realtime postgres_changes (RLS applies — admins only).
 * - Mock mode: polls /api/admin/live every few seconds.
 */
export function LiveUpdates({ mode }: { mode: "supabase" | "mock" }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Several rows change per signature; refresh once.
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 400);
    };

    if (mode === "mock") {
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
          /* offline — try again next tick */
        }
      };
      void tick();
      const id = setInterval(tick, 3000);
      return () => clearInterval(id);
    }

    const supabase = supabaseBrowser();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      // Realtime needs the admin's JWT so RLS lets the changes through.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) await supabase.realtime.setAuth(data.session.access_token);
      channel = supabase
        .channel("admin-live")
        .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "signers" }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, refresh)
        .subscribe();
    })();
    // Coming back to the tab after a while: catch up.
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [mode, router]);

  return null;
}
