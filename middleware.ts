import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle preflight requests for API routes
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      });
    }
  }

  // Continue to the route
  const response = NextResponse.next();

  // Add CORS headers to API responses
  if (pathname.startsWith("/api/")) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
