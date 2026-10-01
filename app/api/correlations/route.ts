import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { correlateEvents } from "@/lib/correlation/correlate";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await correlateEvents();

    return NextResponse.json({
      success: true,
      message: "Event correlation completed",
      ...result,
    });
  } catch (error) {
    console.error("Correlation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to correlate events",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const limitParam = Number(
      request.nextUrl.searchParams.get("limit") ?? "50"
    );

    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(Math.floor(limitParam), 1), 100)
      : 50;

    const incidents = await prisma.correlatedIncident.findMany({
      orderBy: { startTime: "desc" },
      take: limit,
    });

    const detailedIncidents = await Promise.all(
      incidents.map(async (incident) => {
        const [events, findings] = await Promise.all([
          incident.eventIds.length > 0
            ? prisma.securityEvent.findMany({
                where: { id: { in: incident.eventIds } },
                orderBy: { timestamp: "asc" },
              })
            : Promise.resolve([]),

          incident.findingIds.length > 0
            ? prisma.threatFinding.findMany({
                where: { id: { in: incident.findingIds } },
                orderBy: { firstSeen: "asc" },
              })
            : Promise.resolve([]),
        ]);

        return {
          ...incident,
          events,
          findings,
        };
      })
    );

    return NextResponse.json({
      success: true,
      count: detailedIncidents.length,
      incidents: detailedIncidents,
    });
  } catch (error) {
    console.error("Get correlations error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load correlated incidents",
      },
      { status: 500 }
    );
  }
}