
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { runThreatDetection } from "@/lib/security/detector";

export async function GET() {
  try {
    const findings = await prisma.threatFinding.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const total = await prisma.threatFinding.count();

    return NextResponse.json({
      success: true,
      total,
      findings,
    });
  } catch (error) {
    console.error("Fetch threats error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch threat findings" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await runThreatDetection();

    return NextResponse.json({
      success: true,
      message: "Threat detection completed",
      eventsAnalyzed: result.eventsAnalyzed,
      detectionsFound: result.detectionsFound,
      findings: result.findings,
    });
  } catch (error) {
    console.error("Threat detection error:", error);

    return NextResponse.json(
      { success: false, message: "Threat detection failed" },
      { status: 500 }
    );
  }
}