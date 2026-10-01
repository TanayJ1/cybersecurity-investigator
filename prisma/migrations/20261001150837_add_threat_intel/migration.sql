-- CreateTable
CREATE TABLE "ThreatIntelDocument" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "techniqueId" TEXT,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreatIntelDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreatIntelDocument_slug_key" ON "ThreatIntelDocument"("slug");

-- CreateIndex
CREATE INDEX "ThreatIntelDocument_category_idx" ON "ThreatIntelDocument"("category");

-- CreateIndex
CREATE INDEX "ThreatIntelDocument_techniqueId_idx" ON "ThreatIntelDocument"("techniqueId");
