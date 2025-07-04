import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Running for path: ${pathname}`);
  console.log('[Middleware] Request cookies received:', request.cookies.getAll().map(c => c.name));


  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser();
  console.log('[Middleware] User object from Supabase:', user ? `Logged in as ${user.email}`: 'Not logged in. This is expected in an iframe after login.');

  // Protect dashboard routes
  if (!user && pathname.startsWith('/dashboard')) {
    console.log('[Middleware] Path is /dashboard/** and no user. Redirecting to /');
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Redirect logged in users from login page to dashboard
  if (user && pathname === '/') {
    console.log('[Middleware] User is logged in and path is /. Redirecting to /dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  console.log('[Middleware] No special redirect conditions met. Continuing...');

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
