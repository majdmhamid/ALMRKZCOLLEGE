"use client";

import { AlertOctagon, ArrowUpLeft, CircleMinus, CirclePlus, Pencil, Rocket, Shuffle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { SECTION_LABEL, type Change } from "@/lib/cms/diff";
import { RULE_LABEL, type MissingIssue, type RuleIssue } from "@/lib/cms/rules";
import type { SiteContent } from "@/lib/cms/schema";
import { discardDraft, publishDraft } from "../actions";
import { useAdmin } from "../_lib/store";
import { Dialog } from "./bits";

const KIND_ICON = { added: CirclePlus, removed: CircleMinus, changed: Pencil, reordered: Shuffle } as const;
const KIND_TONE = { added: "text-brand-600", removed: "text-red-600", changed: "text-amber-600", reordered: "text-ink-muted" } as const;

/** وين بصلّح المشكلة؟ رابط للصفحة المناسبة في اللوحة */
export function issueTarget(issue: { path: string }, draft: SiteContent): { href: string; where: string } {
  const [section, index] = issue.path.split(".");
  const list = (draft as unknown as Record<string, unknown>)[section];
  const item = Array.isArray(list) ? (list[Number(index)] as Record<string, unknown> | undefined) : undefined;
  const name = item ? ((item.name ?? item.title) as { ar?: string } | undefined)?.ar : undefined;
  const where = `${SECTION_LABEL[section]?.many ?? section}${name ? ` — ${name}` : ""}`;
  if (section === "courses" && item) return { href: `/admin/courses/${item.slug}`, where };
  if (section === "groups" && item) return { href: `/admin/courses/group/${item.slug}`, where };
  if (section === "news" && item) return { href: `/admin/news/${item.slug}`, where };
  const map: Record<string, string> = { graduates: "graduates", staff: "staff", partners: "partners", gallery: "gallery", videos: "videos", reels: "videos", promoVideo: "videos", site: "site", texts: "texts", galleryCategories: "gallery" };
  return { href: `/admin/${map[section] ?? ""}`, where };
}

export default function PublishButton({ count }: { count: number }) {
  const { changes, issues, missing, flush, draft, toast } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-primary btn-sm relative" onClick={() => setOpen(true)} disabled={!count} style={!count ? { opacity: 0.55, boxShadow: "none" } : undefined}>
        <Rocket size={17} />
        نشر
        {count > 0 && <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-brand-700">{count}</span>}
      </button>
      {open && <PublishDialog changes={changes} issues={issues} missing={missing} onClose={() => setOpen(false)} flush={flush} draft={draft} toast={toast} />}
    </>
  );
}

function PublishDialog({
  changes,
  issues,
  missing,
  onClose,
  flush,
  draft,
  toast,
}: {
  changes: Change[];
  issues: RuleIssue[];
  missing: MissingIssue[];
  onClose: () => void;
  flush: () => Promise<boolean>;
  draft: SiteContent;
  toast: ReturnType<typeof useAdmin>["toast"];
}) {
  const { reload } = useAdmin();
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const blocked = issues.length > 0 || missing.length > 0;

  const publish = () =>
    start(async () => {
      if (!(await flush())) {
        toast({ tone: "error", message: "ما قدرنا نحفظ آخر تعديل — جرّب كمان مرة." });
        return;
      }
      const res = await publishDraft(note);
      if (res.ok) {
        toast({ tone: "success", message: "انتشر! الموقع صار فيه التعديلات الجديدة." });
        onClose();
        reload();
      } else if (res.message === "rules") toast({ tone: "error", message: "في نص مخالف لقواعد الكلية — صلّحه قبل النشر." });
      else if (res.message === "missing") toast({ tone: "error", message: "في عناصر ناقصة (اسم أو صورة) — كمّلها قبل النشر." });
      else if (res.message === "nothing") toast({ message: "ما في تغييرات جديدة للنشر." });
    });

  const discard = () =>
    start(async () => {
      await flush();
      await discardDraft();
      toast({ message: "رجعت المسودة مثل الموقع الحالي." });
      onClose();
      reload();
    });

  const grouped = changes.reduce<Record<string, Change[]>>((acc, c) => ((acc[c.section] ??= []).push(c), acc), {});

  return (
    <Dialog
      open
      onClose={onClose}
      wide
      title={
        <span className="inline-flex items-center gap-2">
          <Rocket size={20} className="text-brand-600" /> نشر التعديلات على الموقع
        </span>
      }
      footer={
        confirmDiscard ? (
          <>
            <span className="me-auto text-sm font-bold text-red-700">أكيد؟ كل التعديلات اللي ما انتشرت رح تنمسح.</span>
            <button type="button" className="btn btn-sm border border-line bg-white" onClick={() => setConfirmDiscard(false)} disabled={pending}>
              لا، رجوع
            </button>
            <button type="button" className="btn btn-sm bg-red-600 text-white hover:bg-red-700" onClick={discard} disabled={pending}>
              <Trash2 size={16} /> نعم، امسح التعديلات
            </button>
          </>
        ) : (
          <>
            <button type="button" className="me-auto inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:underline" onClick={() => setConfirmDiscard(true)} disabled={pending}>
              <Trash2 size={15} /> إلغاء كل التعديلات
            </button>
            <button type="button" className="btn btn-sm border border-line bg-white" onClick={onClose} disabled={pending}>
              لسا مش هلأ
            </button>
            <button type="button" className="btn btn-primary" onClick={publish} disabled={pending || blocked || !changes.length}>
              <Rocket size={18} /> {pending ? "عم ننشر…" : `انشر ${changes.length} ${changes.length === 1 ? "تغيير" : "تغييرات"}`}
            </button>
          </>
        )
      }
    >
      {blocked && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 font-extrabold text-red-800">
            <AlertOctagon size={19} /> لازم تصلّح هدول قبل النشر (قواعد الكلية)
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {issues.slice(0, 8).map((i, n) => {
              const t = issueTarget(i, draft);
              return (
                <li key={n} className="rounded-xl bg-white p-3">
                  <p className="font-bold text-red-800">{RULE_LABEL[i.rule]}</p>
                  <p className="mt-1 text-ink-soft">
                    «…{i.match}…» — <span className="font-bold">{t.where}</span>
                  </p>
                  <Link href={t.href} onClick={onClose} className="mt-1 inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                    روح صلّحه <ArrowUpLeft size={14} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 font-extrabold text-amber-900">
            <AlertOctagon size={19} /> في عناصر ناقصة — كمّلها أو احذفها قبل النشر
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {missing.slice(0, 8).map((m, n) => {
              const t = issueTarget(m, draft);
              return (
                <li key={n} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white p-3">
                  <span className="font-bold">{t.where}</span>
                  <span className="text-amber-800">{m.what === "name" ? "بدون اسم بالعربي" : "بدون صورة"}</span>
                  <Link href={t.href} onClick={onClose} className="ms-auto inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                    روح كمّله <ArrowUpLeft size={14} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mb-3 text-sm text-ink-soft">هاي التعديلات اللي رح تظهر للزوار بعد النشر. بتقدر دايماً ترجع لنسخة قديمة من «سجل النشر».</p>
      <div className="space-y-4">
        {Object.entries(grouped).map(([section, list]) => (
          <div key={section}>
            <p className="mb-1.5 text-xs font-extrabold text-ink-muted">{SECTION_LABEL[section]?.many ?? section}</p>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {list.map((c, i) => {
                const Icon = KIND_ICON[c.kind];
                return (
                  <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <Icon size={17} className={`shrink-0 ${KIND_TONE[c.kind]}`} />
                    <span className="flex-1 font-bold">{c.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <label className="label mt-6" htmlFor="publish-note">
        ملاحظة للسجل (اختياري)
      </label>
      <input id="publish-note" className="input" placeholder="مثلاً: إضافة خريجي أيلول" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
    </Dialog>
  );
}
