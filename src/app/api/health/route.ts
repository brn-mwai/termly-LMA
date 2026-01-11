import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    runtime: "nodejs",
  });
}

export async function POST() {
  return NextResponse.json({
    status: "ok",
    method: "POST",
    timestamp: new Date().toISOString(),
  });
}
