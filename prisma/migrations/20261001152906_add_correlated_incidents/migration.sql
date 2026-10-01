-- CreateTable
CREATE TABLE "CorrelatedIncident" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "findingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "eventIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrelatedIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CorrelatedIncident_fingerprint_key" ON "CorrelatedIncident"("fingerprint");

-- CreateIndex
CREATE INDEX "CorrelatedIncident_sourceIp_idx" ON "CorrelatedIncident"("sourceIp");

-- CreateIndex
CREATE INDEX "CorrelatedIncident_severity_idx" ON "CorrelatedIncident"("severity");

-- CreateIndex
CREATE INDEX "CorrelatedIncident_startTime_idx" ON "CorrelatedIncident"("startTime");
