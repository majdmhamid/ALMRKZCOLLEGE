/*
 * PLACEHOLDER — owned by the website session (src/app/(frontend)/**).
 * Created by the admin-panel session only so the project builds; replace freely.
 */
import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 40 }}>
      <h1>كلية المركز للتأهيل المهني</h1>
      <p>
        الموقع قيد البناء. لوحة التحكم: <Link href="/admin">/admin</Link>
      </p>
    </main>
  )
}
