"use client";

import { useEffect, useState } from "react";
import type { Content } from "@/content";
import { ArrowIcon, CalendarIcon } from "./Icons";

type Props = {
  rows: Content["courseRows"];
  filters: { id: string; label: string }[];
  showDates: boolean;
  labels: { hours: string; sessions: string; details: string };
  /** Section title block, shown beside the filter chips. */
  children: React.ReactNode;
};

const SOON_MS = 21 * 864e5;

export default function Starts({ rows, filters, showDates, labels, children }: Props) {
  const [filter, setFilter] = useState("all");
  // "Starting soon" depends on today's date, so it is only known in the browser.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const soon = (iso: string) => now !== null && iso !== "weekly" && Date.parse(iso) - now < SOON_MS;
  const shown = rows.filter((c) => filter === "all" || c.group === filter);

  return (
    <>
      <div data-reveal className="starts-head">
        {children}
        <div className="starts-filters" role="group">
          {filters.map((f) => (
            <button key={f.id} type="button" className="chip-filter" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid-courses">
        {shown.map((c, i) => (
          <article key={c.slug} data-reveal className="course-card lift zoom" style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
            <img src={c.image} alt="" loading="lazy" decoding="async" className="cover" />
            <div className="course-card-shade" />
            {showDates && (
              <span className={`course-date${soon(c.iso) ? " is-soon" : ""}`}>
                <CalendarIcon />
                {c.startLabel}
              </span>
            )}
            <div className="course-card-body">
              <span className="course-group">{c.groupName}</span>
              <h3>{c.name}</h3>
              <div className="course-meta">
                <span>
                  <b dir="ltr">{c.hours}</b> {labels.hours}
                </span>
                <span>
                  <b dir="ltr">{c.sessions}</b> {labels.sessions}
                </span>
                <span>{c.timeLabel}</span>
              </div>
              <a href={c.wa} target="_blank" rel="noopener" className="btn-course">
                {labels.details}
                <ArrowIcon />
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
