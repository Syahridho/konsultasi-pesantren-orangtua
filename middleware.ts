import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect logged-in users away from auth pages
    if (token && (pathname === "/login" || pathname === "/register")) {
      // Redirect orangtua to /home, others to /dashboard
      if (token.role === "orangtua") {
        return NextResponse.redirect(new URL("/home", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Redirect orangtua from /dashboard to /home
    if (token && token.role === "orangtua" && pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/home", req.url));
    }

    // Protect /dashboard/admin/* routes - admin only
    if (token && pathname.startsWith("/dashboard/admin")) {
      if (token.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ];

        // If it's a public route, allow access
        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true;
        }

        // Dashboard, home, and chat routes require authentication
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/chat") || pathname.startsWith("/home")) {
          return !!token;
        }

        // Default to allowing access for other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
