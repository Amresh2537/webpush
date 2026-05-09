import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.$runCommandRaw({ ping: 1 });

    return NextResponse.json({
      ok: true,
      db: "connected",
      ping: result,
    });
  } catch (error) {
    console.error("DB health check failed", error);
    return NextResponse.json(
      {
        ok: false,
        db: "disconnected",
      },
      { status: 500 },
    );
  }
}
