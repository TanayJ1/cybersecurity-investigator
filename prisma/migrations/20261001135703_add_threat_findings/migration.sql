-- CreateTable
CREATE TABLE "ThreatFinding" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sourceIp" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "evidenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreatFinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ThreatFinding_fingerprint_key" ON "ThreatFinding"("fingerprint");

-- CreateIndex
CREATE INDEX "ThreatFinding_sourceIp_idx" ON "ThreatFinding"("sourceIp");

-- CreateIndex
CREATE INDEX "ThreatFinding_severity_idx" ON "ThreatFinding"("severity");

-- CreateIndex
CREATE INDEX "ThreatFinding_status_idx" ON "ThreatFinding"("status");

-- CreateIndex
CREATE INDEX "ThreatFinding_category_idx" ON "ThreatFinding"("category");
