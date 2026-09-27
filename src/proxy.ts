import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMockBackend } from "@/lib/backend-mode";

/**
 * يعمل فقط على /admin و /sign (صفحات الموقع العامة ما بتمر من هون):
 *  - /admin: يحدّث جلسة Supabase للمدير، ويحوّل الزائر غير المسجّل لـ /admin/login.
 *    الفحص الحقيقي (صف admin_profiles) بيصير بالسيرفر في requireAdmin — هاد بس بوابة سريعة.
 *  - /sign: بدون أي دخول (العملاء ما عندهم حساب) — بس بنعلّم المنطقة حتى تنختار لغة الصفحة صح.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/preview"];

function withArea(request: NextRequest, area: "admin" | "sign") {
  const headers = new Headers(request.headers);
  headers.set("x-app-area", area);
  return headers;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/sign")) {
    return NextResponse.next({ request: { headers: withArea(request, "sign") } });
  }

  const headers = withArea(request, "admin");
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  const toLogin = () => NextResponse.redirect(new URL("/admin/login", request.url));

  if (isMockBackend) {
    if (!isPublic && !request.cookies.has("mock_admin_session")) return toLogin();
    return NextResponse.next({ request: { headers } });
  }

  let response = NextResponse.next({ request: { headers } });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        // الكوكيز الجديدة لازم توصل للسيرفر بنفس الطلب
        response = NextResponse.next({ request: { headers: withArea(request, "admin") } });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!isPublic && !data.user) return toLogin();
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/sign/:path*"],
};
