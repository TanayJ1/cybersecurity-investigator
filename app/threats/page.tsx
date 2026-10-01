
"use client";

import { useCallback, useEffect, useState } from "react";

type Finding = {
  id: string;
  title: string;
  category: string;
  description: string;
  sourceIp: string;
  severity: string;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
  evidenceIds: string[];
};

const severityColors: Record<string, string> = {
  LOW: "bg-slate-700 text-slate-200",
  MEDIUM: "bg-yellow-900/60 text-yellow-300",
  HIGH: "bg-orange-900/60 text-orange-300",
  CRITICAL: "bg-red-900/60 text-red-300",
};

export default function ThreatsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchFindings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/threats", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to fetch findings");
      }

      setFindings(data.findings);
      setTotal(data.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch findings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFindings();
  }, [fetchFindings]);

  async function runScan() {
    setScanning(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/threats", {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Scan failed");
      }

      setMessage(
        `Scan complete. Analyzed ${data.eventsAnalyzed} events and found ${data.detectionsFound} detections.`
      );

      await fetchFindings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Threat scan failed"
      );
    } finally {
      setScanning(false);
    }
  }

  const criticalCount = findings.filter(
    (finding) => finding.severity === "CRITICAL"
  ).length;

  const highCount = findings.filter(
    (finding) => finding.severity === "HIGH"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-400">
              AI Cybersecurity Investigator
            </p>
            <h1 className="text-3xl font-bold">Threat Detection</h1>
            <p className="text-slate-400">
              Identify suspicious patterns in your security logs.
            </p>
          </div>

          <button
            onClick={runScan}
            disabled={scanning}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {scanning ? "Scanning..." : "Run Detection"}
          </button>
        </header>

        {message && (
          <p role="status" className="rounded-lg bg-green-950 p-4 text-sm text-green-300">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red-950 p-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total findings</p>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">High severity</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">
              {highCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Critical severity</p>
            <p className="mt-2 text-3xl font-bold text-red-400">
              {criticalCount}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Detected findings</h2>
            <button
              onClick={() => void fetchFindings()}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {findings.length === 0 && !loading ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="font-medium">No findings yet</p>
              <p className="mt-2 text-sm text-slate-400">
                Run detection after uploading security logs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((finding) => (
                <article
                  key={finding.id}
                  className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">{finding.title}</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        severityColors[finding.severity] ??
                        "bg-slate-700 text-white"
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300">
                    {finding.description}
                  </p>

                  <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
                    <p>Source IP: <span className="font-mono text-white">{finding.sourceIp}</span></p>
                    <p>Category: <span className="text-white">{finding.category}</span></p>
                    <p>Events: <span className="text-white">{finding.eventCount}</span></p>
                    <p>Status: <span className="text-white">{finding.status}</span></p>
                  </div>

                  <div className="text-xs text-slate-500">
                    First seen: {new Date(finding.firstSeen).toLocaleString()}
                    {" · "}
                    Last seen: {new Date(finding.lastSeen).toLocaleString()}
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-blue-400">
                      View evidence ({finding.evidenceIds.length} event IDs)
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-slate-400">
                      {finding.evidenceIds.map((id) => (
                        <li key={id} className="break-all font-mono">{id}</li>
                      ))}
                    </ul>
                  </details>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}