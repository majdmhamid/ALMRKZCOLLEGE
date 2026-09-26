"use client";

import { useId, useState } from "react";
import { PlusIcon } from "./Icons";

export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const id = useId();

  return (
    <div className="faq-list">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} data-reveal className={`glass faq-item${isOpen ? " is-open" : ""}`} style={{ "--d": `${i * 60}ms` } as React.CSSProperties}>
            <button type="button" aria-expanded={isOpen} aria-controls={`${id}-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
              <span>{f.q}</span>
              <span className="faq-icon">
                <PlusIcon />
              </span>
            </button>
            <div id={`${id}-${i}`} className="faq-body" role="region" aria-hidden={!isOpen}>
              <div>
                <p>{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
