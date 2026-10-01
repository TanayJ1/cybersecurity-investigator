
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalEvents,
      totalFindings,
      openFindings,
      totalIncidents,
      totalInvestigations,
      totalReports,
      recentEvents,
      recentFindings,
      recentIncidents,
    ] = await Promise.all([
      prisma.securityEvent.count(),
      prisma.threatFinding.count(),
      prisma.threatFinding.count({
        where: { status: "OPEN" },
      }),
      prisma.correlatedIncident.count(),
      prisma.investigationReport.count(),
      prisma.aIIncidentReport.count(),

      prisma.securityEvent.findMany({
        orderBy: { timestamp: "desc" },
        take: 8,
        select: {
          id: true,
          timestamp: true,
          sourceIp: true,
          username: true,
          eventType: true,
          statusCode: true,
          severity: true,
          message: true,
        },
      }),

      prisma.threatFinding.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          sourceIp: true,
          severity: true,
          eventCount: true,
          status: true,
          updatedAt: true,
        },
      }),

      prisma.correlatedIncident.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          sourceIp: true,
          severity: true,
          eventCount: true,
          startTime: true,
          endTime: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        totalFindings,
        openFindings,
        totalIncidents,
        totalInvestigations,
        totalReports,
      },
      recentEvents,
      recentFindings,
      recentIncidents,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard data",
      },
      { status: 500 }
    );
  }
}