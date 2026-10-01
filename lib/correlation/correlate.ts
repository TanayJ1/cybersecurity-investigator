import { prisma } from "@/lib/prisma";

const WINDOW_MS = 30 * 60 * 1000;

type CorrelationBucket = {
  sourceIp: string;
  startTime: Date;
  endTime: Date;
  events: {
    id: string;
    timestamp: Date;
  }[];
  findings: {
    id: string;
    title: string;
    severity: string;
    firstSeen: Date;
    lastSeen: Date;
  }[];
};

const severityRank: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function getBucketStart(date: Date): Date {
  const bucketTime =
    Math.floor(date.getTime() / WINDOW_MS) * WINDOW_MS;

  return new Date(bucketTime);
}

export async function correlateEvents() {
  const [events, findings] = await Promise.all([
    prisma.securityEvent.findMany({
      orderBy: { timestamp: "asc" },
      take: 10000,
    }),
    prisma.threatFinding.findMany({
      orderBy: { firstSeen: "asc" },
      take: 1000,
    }),
  ]);

  const buckets = new Map<string, CorrelationBucket>();

  function getBucket(sourceIp: string, date: Date) {
    const startTime = getBucketStart(date);
    const key = `${sourceIp}|${startTime.getTime()}`;

    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = {
        sourceIp,
        startTime,
        endTime: new Date(startTime.getTime() + WINDOW_MS),
        events: [],
        findings: [],
      };

      buckets.set(key, bucket);
    }

    return bucket;
  }

  for (const event of events) {
    const bucket = getBucket(event.sourceIp, event.timestamp);

    bucket.events.push({
      id: event.id,
      timestamp: event.timestamp,
    });
  }

  for (const finding of findings) {
    const bucket = getBucket(finding.sourceIp, finding.firstSeen);

    bucket.findings.push({
      id: finding.id,
      title: finding.title,
      severity: finding.severity,
      firstSeen: finding.firstSeen,
      lastSeen: finding.lastSeen,
    });

    if (finding.lastSeen > bucket.endTime) {
      bucket.endTime = finding.lastSeen;
    }
  }

  const incidents = [];

  for (const bucket of buckets.values()) {
    // Only create incidents for buckets containing a detected finding.
    if (bucket.findings.length === 0) continue;

    const findingIds = [
      ...new Set(bucket.findings.map((finding) => finding.id)),
    ];

    const eventIds = [
      ...new Set(bucket.events.map((event) => event.id)),
    ];

    const highestSeverity = bucket.findings.reduce(
      (highest, finding) =>
        (severityRank[finding.severity] ?? 0) >
        (severityRank[highest] ?? 0)
          ? finding.severity
          : highest,
      "LOW"
    );

    const titles = [
      ...new Set(bucket.findings.map((finding) => finding.title)),
    ];

    const title =
      titles.length === 1
        ? titles[0]
        : `Correlated activity: ${titles.join(", ")}`;

    const startTime = new Date(
      Math.min(
        bucket.startTime.getTime(),
        ...bucket.findings.map((finding) => finding.firstSeen.getTime()),
        ...bucket.events.map((event) => event.timestamp.getTime())
      )
    );

    const endTime = new Date(
      Math.max(
        ...bucket.findings.map((finding) => finding.lastSeen.getTime()),
        ...bucket.events.map((event) => event.timestamp.getTime())
      )
    );

    const fingerprint =
      `${bucket.sourceIp}|${bucket.startTime.getTime()}`;

    const incident = await prisma.correlatedIncident.upsert({
      where: { fingerprint },
      update: {
        title,
        severity: highestSeverity,
        startTime,
        endTime,
        eventCount: eventIds.length,
        findingIds,
        eventIds,
      },
      create: {
        fingerprint,
        title,
        sourceIp: bucket.sourceIp,
        severity: highestSeverity,
        startTime,
        endTime,
        eventCount: eventIds.length,
        findingIds,
        eventIds,
      },
    });

    incidents.push(incident);
  }

  return {
    analyzedEvents: events.length,
    analyzedFindings: findings.length,
    incidentsCreatedOrUpdated: incidents.length,
    incidents,
  };
}