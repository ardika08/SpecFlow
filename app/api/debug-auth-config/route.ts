import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    betterAuthUrl: process.env.BETTER_AUTH_URL,
    nextPublicUrl: process.env.NEXT_PUBLIC_URL,
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_URL,
    ].filter(Boolean),
    googleClientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    nodeEnv: process.env.NODE_ENV,
  });
}
