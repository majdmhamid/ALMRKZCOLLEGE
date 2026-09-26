import React from 'react'

/*
 * PLACEHOLDER — owned by the website session (src/app/(frontend)/**).
 * Created by the admin-panel session only so the project builds; replace freely.
 */
export const metadata = {
  title: 'كلية المركز للتأهيل المهني',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
