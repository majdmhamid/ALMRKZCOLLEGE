"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * صفحة موقع كاملة بعرض الكمبيوتر (1280px) مصغّرة لتناسب العمود — معاينة حيّة تتحدث مع كل حرف.
 */
export default function PageMini({ children, width = 1280, maxHeight }: { children: ReactNode; width?: number; maxHeight?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const s = o.clientWidth / width;
      setScale(s);
      setHeight(i.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="relative overflow-hidden bg-white" style={{ height: maxHeight ? Math.min(height, maxHeight) : height }}>
      <div ref={inner} className="page-mini absolute right-0 top-0" style={{ width, transform: `scale(${scale})` }} aria-hidden="true" inert>
        {children}
      </div>
    </div>
  );
}
