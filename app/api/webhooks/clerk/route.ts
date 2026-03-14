import { NextResponse } from "next/server";

// Simple webhook endpoint - bisa dikembangkan nanti
export async function POST(req: Request) {
  try {
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
