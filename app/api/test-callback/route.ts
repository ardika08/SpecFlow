import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Ambil query params dari callback Google (simulasi)
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    return NextResponse.json({
      message: "Google callback test endpoint",
      received: {
        code: code ? "SET" : "NOT_SET",
        state: state ? "SET" : "NOT_SET",
        error: error || "NONE",
        allParams: Object.fromEntries(searchParams),
      },
      note: "Kalau ada code dari Google, Better Auth akan memprosesnya",
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
