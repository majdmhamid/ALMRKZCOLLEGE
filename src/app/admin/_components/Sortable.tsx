"use client";

import { GripVertical } from "lucide-react";
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";

/**
 * ترتيب بالسحب: اسحب البطاقة من المقبض ⠿ وأفلتها مكان بطاقة ثانية.
 * السحب يبدأ من المقبض فقط، حتى ما يخرب الكتابة داخل البطاقة.
 */
interface Ctx {
  dragging: string | null;
  over: string | null;
  setDragging: (k: string | null) => void;
  setOver: (k: string | null) => void;
  onMove: (from: string, to: string) => void;
}
const SortCtx = createContext<Ctx | null>(null);

export function Sortable({ onMove, children }: { onMove: (from: string, to: string) => void; children: ReactNode }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  return <SortCtx.Provider value={{ dragging, over, setDragging, setOver, onMove }}>{children}</SortCtx.Provider>;
}

export function SortableItem({ id, className = "", style, children }: { id: string; className?: string; style?: CSSProperties; children: (handle: ReactNode) => ReactNode }) {
  const ctx = useContext(SortCtx)!;
  const [armed, setArmed] = useState(false);
  const handle = (
    <span
      role="button"
      tabIndex={-1}
      title="اسحب لتغيير الترتيب"
      aria-label="اسحب لتغيير الترتيب"
      className="inline-flex cursor-grab items-center justify-center rounded-lg bg-white/95 p-1.5 text-ink-muted shadow-sm ring-1 ring-line hover:text-brand-700 active:cursor-grabbing"
      onPointerDown={() => setArmed(true)}
      onPointerUp={() => setArmed(false)}
    >
      <GripVertical size={16} />
    </span>
  );
  const isOver = ctx.over === id && ctx.dragging && ctx.dragging !== id;
  return (
    <div
      className={`edit-card relative ${ctx.dragging === id ? "is-dragging" : ""} ${isOver ? "drop-before" : ""} ${className}`}
      style={style}
      draggable={armed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        ctx.setDragging(id);
      }}
      onDragEnd={() => {
        setArmed(false);
        ctx.setDragging(null);
        ctx.setOver(null);
      }}
      onDragOver={(e) => {
        if (!ctx.dragging) return;
        e.preventDefault();
        if (ctx.over !== id) ctx.setOver(id);
      }}
      onDrop={(e) => {
        if (!ctx.dragging) return;
        e.preventDefault();
        if (ctx.dragging !== id) ctx.onMove(ctx.dragging, id);
        ctx.setDragging(null);
        ctx.setOver(null);
      }}
    >
      {children(handle)}
    </div>
  );
}
