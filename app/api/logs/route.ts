
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type LogInput = {
  timestamp: string;
  sourceIp: string;
  destination?: string | null;
  method?: string | null;
  statusCode?: number | null;
  username?: string | null;
  eventType?: string | null;
  message?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

function isValidLog(value: unknown): value is LogInput {
  if (!isRecord(value)) return false;

  return (
    typeof value.timestamp === "string" &&
    !Number.isNaN(Date.parse(value.timestamp)) &&
    typeof value.sourceIp === "string" &&
    value.sourceIp.trim().length > 0 &&
    value.sourceIp.trim().length <= 255 &&
    isOptionalString(value.destination) &&
    isOptionalString(value.method) &&
    isOptionalString(value.username) &&
    isOptionalString(value.eventType) &&
    isOptionalString(value.message) &&
    (
      value.statusCode === undefined ||
      value.statusCode === null ||
      (
        typeof value.statusCode === "number" &&
        Number.isInteger(value.statusCode) &&
        value.statusCode >= 100 &&
        value.statusCode <= 599
      )
    )
  );
}

export async function GET() {
  try {
    const logs = await prisma.securityEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    const total = await prisma.securityEvent.count();

    return NextResponse.json({
      success: true,
      total,
      returned: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Fetch logs error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !isRecord(body) ||
      !Array.isArray(body.logs) ||
      body.logs.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "Provide a non-empty logs array" },
        { status: 400 }
      );
    }

    if (body.logs.length > 1000) {
      return NextResponse.json(
        { success: false, message: "Maximum 1000 logs per request" },
        { status: 400 }
      );
    }

    const validLogs = body.logs.filter(isValidLog);

    if (validLogs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid logs found",
          inserted: 0,
          rejected: body.logs.length,
        },
        { status: 400 }
      );
    }

    const result = await prisma.securityEvent.createMany({
      data: validLogs.map((log) => ({
        timestamp: new Date(log.timestamp),
        sourceIp: log.sourceIp.trim(),
        destination: log.destination?.trim() || null,
        method: log.method?.trim() || null,
        statusCode: log.statusCode ?? null,
        username: log.username?.trim() || null,
        eventType: log.eventType?.trim() || null,
        message: log.message?.trim() || null,
      })),
    });

    return NextResponse.json({
      success: true,
      message: "Logs ingested successfully",
      inserted: result.count,
      rejected: body.logs.length - validLogs.length,
    });
  } catch (error) {
    console.error("Log ingestion error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to ingest logs" },
      { status: 500 }
    );
  }
}