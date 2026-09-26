import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const stroke = (size: number, width = 2) => ({
  viewBox: "0 0 24 24",
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function PhoneIcon({ size = 18, strokeWidth = 2, ...p }: P) {
  return (
    <svg {...stroke(size, Number(strokeWidth))} {...p}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden {...p}>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
    </svg>
  );
}

/** Arrow pointing "forward" in RTL (i.e. to the left). */
export function ArrowIcon({ size = 16, strokeWidth = 2.4, ...p }: P) {
  return (
    <svg {...stroke(size, Number(strokeWidth))} style={{ transform: "scaleX(-1)", flexShrink: 0 }} {...p}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export function CalendarIcon({ size = 16 }: P) {
  return (
    <svg {...stroke(size, 2.2)}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function InfoIcon({ size = 16, ...p }: P) {
  return (
    <svg {...stroke(size)} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export function LayersIcon({ size = 22, ...p }: P) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}

export function MenuIcon({ size = 22 }: P) {
  return (
    <svg {...stroke(size)}>
      <path d="M4 7h16M4 12h10M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ size = 22 }: P) {
  return (
    <svg {...stroke(size)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function PlusIcon({ size = 18 }: P) {
  return (
    <svg {...stroke(size, 2.4)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon({ size = 26 }: P) {
  return (
    <svg {...stroke(size, 3)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PlayIcon({ size = 38, ...p }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" aria-hidden {...p}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function FacebookIcon({ size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
    </svg>
  );
}

export function YouTubeIcon({ size = 20 }: P) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M23 7.2a2.9 2.9 0 0 0-2-2C19.2 4.7 12 4.7 12 4.7s-7.2 0-9 .5a2.9 2.9 0 0 0-2 2C.5 9 .5 12 .5 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2c1.8.5 9 .5 9 .5s7.2 0 9-.5a2.9 2.9 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8zM9.7 15.1V8.9l6 3.1-6 3.1z" />
    </svg>
  );
}
