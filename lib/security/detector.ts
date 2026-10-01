
import { prisma } from "@/lib/prisma";

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

type Event = {
  id: string;
  timestamp: Date;
  sourceIp: string;
  destination: string | null;
  statusCode: number | null;
  username: string | null;
  eventType: string | null;
  message: string | null;
};

type Detection = {
  fingerprint: string;
  title: string;
  category: string;
  description: string;
  sourceIp: string;
  severity: string;
  eventCount: number;
  firstSeen: Date;
  lastSeen: Date;
  evidenceIds: string[];
};

function severityFor(count: number) {
  if (count >= 20) return "CRITICAL";
  if (count >= 10) return "HIGH";
  if (count >= 5) return "MEDIUM";
  return "LOW";
}

function bucketStart(timestamp: Date, duration: number) {
  return Math.floor(timestamp.getTime() / duration) * duration;
}

function isFailedLogin(event: Event) {
  return (
    event.eventType?.toUpperCase() === "LOGIN_FAILURE" ||
    event.statusCode === 401 ||
    event.statusCode === 403
  );
}

export async function runThreatDetection() {
  const events: Event[] = await prisma.securityEvent.findMany({
    orderBy: { timestamp: "asc" },
    take: 5000,
  });

  const detections: Detection[] = [];

  const loginGroups = new Map<string, Event[]>();
  const unauthorizedGroups = new Map<string, Event[]>();
  const scanGroups = new Map<string, Event[]>();

  for (const event of events) {
    const time = event.timestamp.getTime();

    if (isFailedLogin(event)) {
      const bucket = bucketStart(event.timestamp, FIVE_MINUTES);
      const key = `${event.sourceIp}|${bucket}`;
      const group = loginGroups.get(key) ?? [];
      group.push(event);
      loginGroups.set(key, group);

      if (event.statusCode === 401 || event.statusCode === 403) {
        const unauthorizedKey = `${event.sourceIp}:${bucket}`;
        const unauthorized = unauthorizedGroups.get(unauthorizedKey) ?? [];
        unauthorized.push(event);
        unauthorizedGroups.set(unauthorizedKey, unauthorized);
      }
    }

    if (event.destination) {
      const bucket = bucketStart(event.timestamp, TEN_MINUTES);
      const key = `${event.sourceIp}:${bucket}`;
      const group = scanGroups.get(key) ?? [];
      group.push(event);
      scanGroups.set(key, group);
    }
  }

  for (const [key, group] of loginGroups) {
    if (group.length < 5) continue;

    const separator = key.lastIndexOf("|");
    const sourceIp = key.slice(0, separator);
    const bucket = key.slice(separator + 1);
    const firstSeen = group[0].timestamp;
    const lastSeen = group[group.length - 1].timestamp;

    detections.push({
      fingerprint: `BRUTE_FORCE:${sourceIp}:${bucket}`,
      title: "Possible brute-force attack",
      category: "BRUTE_FORCE",
      description:
        `${group.length} failed login attempts were recorded ` +
        `from ${sourceIp} within a fixed 5-minute window.`,
      sourceIp,
      severity: severityFor(group.length),
      eventCount: group.length,
      firstSeen,
      lastSeen,
      evidenceIds: group.map((event) => event.id),
    });
  }

  for (const [key, group] of unauthorizedGroups) {
    if (group.length < 8) continue;

    const [sourceIp, bucket] = key.split(":");

    detections.push({
      fingerprint: `UNAUTHORIZED_ACCESS:${sourceIp}:${bucket}`,
      title: "Repeated unauthorized access",
      category: "UNAUTHORIZED_ACCESS",
      description:
        `${group.length} HTTP 401/403 responses were recorded ` +
        `from ${sourceIp} within a fixed 5-minute window.`,
      sourceIp,
      severity: severityFor(group.length),
      eventCount: group.length,
      firstSeen: group[0].timestamp,
      lastSeen: group[group.length - 1].timestamp,
      evidenceIds: group.map((event) => event.id),
    });
  }

  for (const [key, group] of scanGroups) {
    const destinations = new Set(
      group.map((event) => event.destination).filter(Boolean)
    );

    if (destinations.size < 10) continue;

    const [sourceIp, bucket] = key.split(":");

    detections.push({
      fingerprint: `TARGET_SCANNING:${sourceIp}:${bucket}`,
      title: "Possible target scanning",
      category: "TARGET_SCANNING",
      description:
        `${sourceIp} contacted ${destinations.size} distinct destinations ` +
        `within a fixed 10-minute window. This may indicate scanning.`,
      sourceIp,
      severity: severityFor(destinations.size),
      eventCount: group.length,
      firstSeen: group[0].timestamp,
      lastSeen: group[group.length - 1].timestamp,
      evidenceIds: group.map((event) => event.id),
    });
  }

  for (const detection of detections) {
    await prisma.threatFinding.upsert({
      where: { fingerprint: detection.fingerprint },
      create: detection,
      update: {
        title: detection.title,
        description: detection.description,
        severity: detection.severity,
        eventCount: detection.eventCount,
        firstSeen: detection.firstSeen,
        lastSeen: detection.lastSeen,
        evidenceIds: detection.evidenceIds,
      },
    });
  }

  return {
    eventsAnalyzed: events.length,
    detectionsFound: detections.length,
    findings: detections,
  };
}