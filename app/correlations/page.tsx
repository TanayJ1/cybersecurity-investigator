"use client";

import { useCallback, useEffect, useState } from "react";

type Event = {
  id: string;
  timestamp: string;
  sourceIp: string;
  destination: string | null;
  username: string | null;
  eventType: string | null;
  statusCode: number | null;
  severity: string;
  message: string | null;
};

type Finding = {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  firstSeen: string;
  lastSeen: string;
};

type Incident = {
  id: string;
  title: string;
  sourceIp: string;
  severity: string;
  startTime: string;
  endTime: string;
  eventCount: number;
  events: Event[];
  findings: Finding[];
};

const severityStyles: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function CorrelationsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/correlations");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load incidents");
      }

      setIncidents(data.incidents);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  async function runCorrelation() {
    setScanning(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/correlations", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Correlation failed");
      }

      setMessage(
        `Correlation complete. Analyzed ${data.analyzedEvents} events and ${data.analyzedFindings} findings. Created or updated ${data.incidentsCreatedOrUpdated} incidents.`
      );

      await loadIncidents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setScanning(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              AI Cybersecurity Investigator
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Event Correlation & Timeline
            </h1>
            <p className="mt-2 text-slate-600">
              Connect related security events into chronological incidents.
            </p>
          </div>

          <button
            onClick={runCorrelation}
            disabled={scanning}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {scanning ? "Correlating..." : "Run Correlation"}
          </button>
        </header>

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total incidents</p>
            <p className="mt-2 text-3xl font-bold">{incidents.length}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">High / Critical</p>
            <p className="mt-2 text-3xl font-bold">
              {
                incidents.filter(
                  (incident) =>
                    incident.severity === "HIGH" ||
                    incident.severity === "CRITICAL"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Events correlated</p>
            <p className="mt-2 text-3xl font-bold">
              {incidents.reduce(
                (total, incident) => total + incident.eventCount,
                0
              )}
            </p>
          </div>
        </section>

        {loading ? (
          <p className="py-10 text-center text-slate-500">
            Loading incidents...
          </p>
        ) : incidents.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold">No correlated incidents yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Run correlation to group events and findings into incidents.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="rounded-xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {incident.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Source IP: {incident.sourceIp}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      severityStyles[incident.severity] ??
                      "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {incident.severity}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-slate-500">Start</p>
                    <p className="mt-1 font-medium">
                      {formatDate(incident.startTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">End</p>
                    <p className="mt-1 font-medium">
                      {formatDate(incident.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Events</p>
                    <p className="mt-1 font-medium">
                      {incident.eventCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 font-semibold">Incident timeline</h3>

                  {incident.events.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No matching events were found in this time bucket.
                    </p>
                  ) : (
                    <ol className="space-y-4 border-l-2 border-slate-200 pl-4">
                      {incident.events.map((event) => (
                        <li key={event.id} className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-blue-600 bg-white" />

                          <p className="text-xs text-slate-500">
                            {formatDate(event.timestamp)}
                          </p>
                          <p className="mt-1 font-medium">
                            {event.eventType || "Security event"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {event.message || "No event message provided"}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
                            {event.username && (
                              <span>User: {event.username}</span>
                            )}
                            {event.statusCode !== null && (
                              <span>Status: {event.statusCode}</span>
                            )}
                            {event.destination && (
                              <span>Destination: {event.destination}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="mt-6">
                  <h3 className="mb-3 font-semibold">Associated findings</h3>
                  {incident.findings.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No findings attached.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {incident.findings.map((finding) => (
                        <li
                          key={finding.id}
                          className="rounded-lg bg-slate-50 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{finding.title}</p>
                            <span className="text-xs text-slate-500">
                              {finding.severity} · {finding.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {finding.category} · First seen{" "}
                            {formatDate(finding.firstSeen)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}