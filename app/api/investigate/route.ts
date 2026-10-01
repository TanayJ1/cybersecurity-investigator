
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { investigateFinding } from "@/lib/agent/investigator";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("findingId" in body) ||
      typeof body.findingId !== "string" ||
      !body.findingId.trim() ||
      body.findingId.length > 100
    ) {
      return NextResponse.json(
        { success: false, message: "A valid findingId is required" },
        { status: 400 }
      );
    }

    const result = await investigateFinding(body.findingId.trim());

    return NextResponse.json({
      success: true,
      message: "Investigation completed",
      investigation: result,
    });
  } catch (error) {
    console.error("Investigation error:", error);

    const message =
      error instanceof Error ? error.message : "Investigation failed";

    const status = message === "Threat finding not found" ? 404 : 500;

    return NextResponse.json(
      {
        success: false,
        message:
          status === 404
            ? message
            : "Unable to complete investigation. Check server logs and Gemini configuration.",
      },
      { status }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const findingId = searchParams.get("findingId");

    if (!findingId || findingId.length > 100) {
      return NextResponse.json(
        { success: false, message: "A valid findingId is required" },
        { status: 400 }
      );
    }

    const reports = await prisma.investigationReport.findMany({
      where: { findingId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("Fetch investigation reports error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}