import { NextRequest, NextResponse } from "next/server";
import { retrieveThreatIntel } from "@/lib/intel/rag";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("query")?.trim();

    if (!query || query.length < 3) {
      return NextResponse.json(
        { success: false, error: "Provide a query of at least 3 characters" },
        { status: 400 }
      );
    }

    if (query.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Query is too long" },
        { status: 400 }
      );
    }

    const results = await retrieveThreatIntel(query, 3);

    return NextResponse.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Intel search error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to search intelligence",
      },
      { status: 500 }
    );
  }
}