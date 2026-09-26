import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the admin's Supabase session fresh and sends logged-out visitors of
 * /admin to /login. The real admin check (admin_profiles row) happens in
 * requireAdmin() on the server — this is only the fast first gate.
 * /sign/* is never touched here: signers have no Supabase session.
 */
export async function proxy(request: NextRequest) {
  const isAdminArea = request.nextUrl.pathname.startsWith("/admin");

  if (process.env.MOCK_BACKEND === "1") {
    if (isAdminArea && !request.cookies.has("mock_admin_session")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  if (isAdminArea && !data.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
