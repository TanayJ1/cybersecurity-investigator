
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await prisma.securityEvent.count();

    return NextResponse.json({
      success: true,
      message: "Database connected successfully!",
      totalEvents: count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Database connection failed" },
      { status: 500 }
    );
  }
}