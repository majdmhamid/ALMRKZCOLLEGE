import React from 'react'

type P = { size?: number; className?: string; style?: React.CSSProperties; color?: string }

const WA_PATH =
  'M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z'

export const WhatsAppIcon = ({ size = 22, color = 'currentColor', style }: P) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color} style={style} aria-hidden="true">
    <path d={WA_PATH} />
  </svg>
)

const stroke = (
  d: React.ReactNode,
  { size = 20, style, color = 'currentColor', className }: P,
  sw = 2.2,
) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={style}
    className={className}
    aria-hidden="true"
  >
    {d}
  </svg>
)

/** Arrow pointing "forward" in RTL (drawn right→left). */
export const ArrowIcon = (p: P) =>
  stroke(<path d="M5 12h14M12 5l7 7-7 7" />, { size: 16, className: 'arrow', ...p })
export const ChevronDown = (p: P) => stroke(<path d="m6 9 6 6 6-6" />, { size: 26, ...p }, 2)
export const ChevronRight = (p: P) => stroke(<path d="m9 6 6 6-6 6" />, p, 2.4)
export const ChevronLeft = (p: P) => stroke(<path d="m15 6-6 6 6 6" />, p, 2.4)
export const SwipeArrow = (p: P) => stroke(<path d="M19 12H5M11 6l-6 6 6 6" />, { size: 18, ...p })
export const MenuIcon = (p: P) =>
  stroke(<path d="M4 7h16M4 12h10M4 17h16" />, { size: 22, ...p }, 2)
export const CloseIcon = (p: P) => stroke(<path d="M18 6 6 18M6 6l12 12" />, { size: 22, ...p }, 2)
export const PlusIcon = (p: P) => stroke(<path d="M12 5v14M5 12h14" />, { size: 18, ...p }, 2.4)
export const CheckIcon = (p: P) => stroke(<path d="M20 6 9 17l-5-5" />, { size: 14, ...p }, 3)
export const HomeIcon = (p: P) =>
  stroke(
    <path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
    { size: 22, ...p },
    2,
  )
export const LayersIcon = (p: P) =>
  stroke(
    <>
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
    </>,
    { size: 22, ...p },
    2,
  )
export const PhoneIcon = (p: P) =>
  stroke(
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
    { size: 18, ...p },
    2,
  )
export const PinIcon = (p: P) =>
  stroke(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </>,
    { size: 18, ...p },
    2,
  )
export const MailIcon = (p: P) =>
  stroke(
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </>,
    { size: 18, ...p },
    2,
  )
export const PlayIcon = ({ size = 32 }: P) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const FILLED: Record<string, string> = {
  facebook:
    'M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.3H7.4V14h2.8v8h3.3z',
  youtube:
    'M23 7.2a2.9 2.9 0 0 0-2-2C19.2 4.7 12 4.7 12 4.7s-7.2 0-9 .5a2.9 2.9 0 0 0-2 2C.5 9 .5 12 .5 12s0 3 .5 4.8a2.9 2.9 0 0 0 2 2c1.8.5 9 .5 9 .5s7.2 0 9-.5a2.9 2.9 0 0 0 2-2c.5-1.8.5-4.8.5-4.8s0-3-.5-4.8zM9.7 15.1V8.9l6 3.1-6 3.1z',
  instagram:
    'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2.2c2.7 0 3 0 4 .1 2.7.1 4 1.4 4.1 4.1.1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.7-1.4 4-4.1 4.1-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1-.1-1.3-.1-4s0-3 .1-4C3.9 3.6 5.3 2.3 8 2.3c1-.1 1.3-.1 4-.1z',
  tiktok:
    'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-1.8-2.5V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z',
}

export const SocialIcon = ({ platform, size = 20 }: { platform: string; size?: number }) =>
  platform === 'whatsapp' ? (
    <WhatsAppIcon size={size} />
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d={FILLED[platform] ?? FILLED.facebook} />
    </svg>
  )
