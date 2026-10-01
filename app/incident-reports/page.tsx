"use client";

import { useCallback, useEffect, useState } from "react";

type Incident = {
  id: string;
  title: string;
  sourceIp: string;
  severity: string;
  startTime: string;
  endTime: string;
  eventCount: number;
};

type IntelReference = {
  title: string;
  category: string;
  source: string;
  techniqueId: string | null;
  similarity: number;
};

type IncidentReport = {
  id: string;
  incidentId: string;
  title: string;
  report: string;
  intelReferences: IntelReference[];
  createdAt: string;
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

export default function IncidentReportsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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

      const items: Incident[] = data.incidents.map(
        (incident: Incident) => ({
          id: incident.id,
          title: incident.title,
          sourceIp: incident.sourceIp,
          severity: incident.severity,
          startTime: incident.startTime,
          endTime: incident.endTime,
          eventCount: incident.eventCount,
        })
      );

      setIncidents(items);

      if (items.length > 0) {
        setSelectedId((current) =>
          items.some((item) => item.id === current)
            ? current
            : items[0].id
        );
      } else {
        setSelectedId("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReports = useCallback(async (incidentId: string) => {
    if (!incidentId) {
      setReports([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/incident-reports?incidentId=${encodeURIComponent(
          incidentId
        )}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load reports");
      }

      setReports(data.reports);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load reports"
      );
    }
  }, []);

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    void loadReports(selectedId);
  }, [selectedId, loadReports]);

  async function generateReport() {
    if (!selectedId) return;

    setGenerating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/incident-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId: selectedId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to generate incident report"
        );
      }

      setMessage("Incident report generated and saved successfully.");

      await loadReports(selectedId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setGenerating(false);
    }
  }

  const selectedIncident = incidents.find(
    (incident) => incident.id === selectedId
  );

  const latestReport = reports[0];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-medium text-blue-600">
            AI Cybersecurity Investigator
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            AI Incident Reports
          </h1>

          <p className="mt-2 text-slate-600">
            Generate consolidated AI reports from correlated
            security events and threat intelligence.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message}
          </div>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <label
            htmlFor="incident"
            className="mb-2 block text-sm font-semibold"
          >
            Select a correlated incident
          </label>

          {loading ? (
            <p className="text-sm text-slate-500">
              Loading incidents...
            </p>
          ) : incidents.length === 0 ? (
            <p className="text-sm text-slate-500">
              No correlated incidents found. Run event correlation
              first.
            </p>
          ) : (
            <>
              <select
                id="incident"
                value={selectedId}
                onChange={(event) =>
                  setSelectedId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm outline-none focus:border-blue-500"
              >
                {incidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.title} — {incident.sourceIp} (
                    {incident.severity})
                  </option>
                ))}
              </select>

              {selectedIncident && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">
                      {selectedIncident.title}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        severityStyles[
                          selectedIncident.severity
                        ] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selectedIncident.severity}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Source IP</p>
                      <p className="font-medium">
                        {selectedIncident.sourceIp}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Events</p>
                      <p className="font-medium">
                        {selectedIncident.eventCount}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Start</p>
                      <p className="font-medium">
                        {formatDate(selectedIncident.startTime)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">End</p>
                      <p className="font-medium">
                        {formatDate(selectedIncident.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={generateReport}
                disabled={generating || !selectedId}
                className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {generating
                  ? "Generating Report..."
                  : "Generate AI Incident Report"}
              </button>
            </>
          )}
        </section>

        {latestReport && (
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Investigation Report
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  AI-generated · Review required
                </p>
              </div>

              <span className="text-xs text-slate-500">
                {formatDate(latestReport.createdAt)}
              </span>
            </div>

            <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {latestReport.report}
            </div>

            {latestReport.intelReferences?.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold">
                  Retrieved threat intelligence
                </h3>

                <ul className="mt-3 space-y-3">
                  {latestReport.intelReferences.map((intel, index) => (
                    <li
                      key={`${intel.title}-${index}`}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <p className="font-medium">{intel.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {intel.source}
                        {intel.techniqueId
                          ? ` · ${intel.techniqueId}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Similarity:{" "}
                        {Number(intel.similarity).toFixed(3)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Report History</h2>

          {reports.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              No reports generated for this incident yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {reports.map((report, index) => (
                <details
                  key={report.id}
                  className="rounded-lg border p-3"
                  open={index === 0}
                >
                  <summary className="cursor-pointer text-sm font-medium">
                    {report.title} · {formatDate(report.createdAt)}
                  </summary>

                  <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {report.report}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}