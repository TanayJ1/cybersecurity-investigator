import { NextResponse } from "next/server";
import { addIntelDocument } from "@/lib/intel/rag";
import { starterIntel } from "@/lib/intel/seed-data";

export const runtime = "nodejs";

export async function POST() {
  try {
    const results = [];

    for (const doc of starterIntel) {
      const saved = await addIntelDocument(doc);

      results.push({
        id: saved.id,
        slug: saved.slug,
        title: saved.title,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Threat intelligence seeded successfully",
      count: results.length,
      documents: results,
    });
  } catch (error) {
    console.error("Intel seed error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to seed intelligence",
      },
      { status: 500 }
    );
  }
}