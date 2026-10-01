-- CreateTable
CREATE TABLE "AIIncidentReport" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "intelReferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIIncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIIncidentReport_incidentId_idx" ON "AIIncidentReport"("incidentId");

-- CreateIndex
CREATE INDEX "AIIncidentReport_createdAt_idx" ON "AIIncidentReport"("createdAt");
