import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '160px 20px 80px', textAlign: 'center' }}>
      <h1 className="h2">404</h1>
      <p className="lead" style={{ margin: '12px auto' }}>
        الصفحة غير موجودة · הדף לא נמצא
      </p>
      <Link
        href="/ar"
        className="btn btn-green"
        style={{ height: 48, padding: '0 20px', marginTop: 12 }}
      >
        كلية المركز
      </Link>
    </div>
  )
}
