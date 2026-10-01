-- CreateTable
CREATE TABLE "InvestigationReport" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "analysis" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "toolTrace" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestigationReport_findingId_idx" ON "InvestigationReport"("findingId");

-- CreateIndex
CREATE INDEX "InvestigationReport_createdAt_idx" ON "InvestigationReport"("createdAt");
