import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { generateIncidentReport } from "@/lib/incident/report-generator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incidentId = body.incidentId;

    if (
      typeof incidentId !== "string" ||
      !incidentId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid incidentId is required",
        },
        { status: 400 }
      );
    }

    const report = await generateIncidentReport(incidentId);

    return NextResponse.json({
      success: true,
      message: "Incident report generated successfully",
      report,
    });
  } catch (error) {
    console.error("Incident report generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate incident report",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const incidentId =
      request.nextUrl.searchParams.get("incidentId");

    const reports = await prisma.aIIncidentReport.findMany({
      where: incidentId ? { incidentId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Incident report history error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load report history",
      },
      { status: 500 }
    );
  }
}