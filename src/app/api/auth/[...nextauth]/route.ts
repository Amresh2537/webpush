export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Defer all imports to runtime - prevents static analysis failures during Vercel build collection
export async function GET(request: Request) {
  const NextAuth = (await import("next-auth")).default;
  const { authOptions } = await import("@/lib/auth");
  const handler = NextAuth(authOptions);
  return handler(request);
}

export async function POST(request: Request) {
  const NextAuth = (await import("next-auth")).default;
  const { authOptions } = await import("@/lib/auth");
  const handler = NextAuth(authOptions);
  return handler(request);
}
