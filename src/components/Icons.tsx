import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({ width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...props });

export const PhoneIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </svg>
);
export const MailIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 7L2 7" />
  </svg>
);
export const PinIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
export const ClockIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
export const CalendarIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
export const LayersIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="m12 2 10 5-10 5L2 7l10-5z" />
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
export const CheckIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const ChevronIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const ArrowIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)} className={`rtl:-scale-x-100 ${p.className ?? ""}`}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
export const MenuIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const XIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const PlayIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...p}>
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const AwardIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="8" r="6" />
    <path d="M15.5 13 17 22l-5-3-5 3 1.5-9" />
  </svg>
);
export const UsersIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
  </svg>
);
export const ShieldIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
export const GiftIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
export const CompassIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z" />
  </svg>
);
export const WrenchIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
export const BuildingIcon = (p: P) => (
  <svg viewBox="0 0 24 24" {...base(p)}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
  </svg>
);
export const WhatsAppIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...p}>
    <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z" />
  </svg>
);
export const FacebookIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...p}>
    <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z" />
  </svg>
);
export const YouTubeIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...p}>
    <path d="M23 7.2a2.9 2.9 0 0 0-2-2C19.2 4.7 12 4.7 12 4.7s-7.2 0-9 .5a2.9 2.9 0 0 0-2 2C.5 9 .5 12 .5 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2c1.8.5 9 .5 9 .5s7.2 0 9-.5a2.9 2.9 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8zM9.7 15.1V8.9l6 3.1-6 3.1z" />
  </svg>
);
export const AccessibilityIcon = (p: P) => (
  <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" aria-hidden {...p}>
    <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm9 7.2-6.3 1.1v3.2l2.6 6.6a1.2 1.2 0 0 1-2.2.9L12.9 15h-1.8l-2.2 6a1.2 1.2 0 0 1-2.2-.9l2.6-6.6v-3.2L3 9.2a1.2 1.2 0 0 1 .4-2.4l6.4 1.1h4.4l6.4-1.1a1.2 1.2 0 0 1 .4 2.4z" />
  </svg>
);
