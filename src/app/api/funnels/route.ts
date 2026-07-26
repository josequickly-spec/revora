import { NextResponse } from "next/server";
import { mockData } from "@/db";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      funnels: mockData.funnels,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
