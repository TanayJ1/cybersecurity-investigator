
"use client";

import { useEffect, useState } from "react";

type Finding = {
  id: string;
  title: string;
  sourceIp: string;
  severity: string;
  category: string;
};

type Report = {
  reportId: string;
  findingId: string;
  title: string;
  severity: string;
  report: string;
  createdAt: string;
};

type SavedReport = {
  id: string;
  findingId: string;
  summary: string;
  createdAt: string;
};

export default function InvestigationsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingId, setFindingId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFindings() {
      try {
        const response = await fetch("/api/threats", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load findings");
        }

        setFindings(data.findings);
        if (data.findings.length > 0) {
          setFindingId(data.findings[0].id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load findings"
        );
      }
    }

    void loadFindings();
  }, []);

  async function loadHistory(id: string) {
    if (!id) {
      setHistory([]);
      return;
    }

    setFetching(true);
    try {
      const response = await fetch(
        `/api/investigate?findingId=${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load history");
      }

      setHistory(data.reports);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load history"
      );
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    setReport(null);
    void loadHistory(findingId);
  }, [findingId]);

  async function startInvestigation() {
    if (!findingId) return;

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findingId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Investigation failed");
      }

      setReport(data.investigation);
      await loadHistory(findingId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Investigation failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const selected = findings.find((f) => f.id === findingId);

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-blue-400">
            AI Cybersecurity Investigator
          </p>
          <h1 className="text-3xl font-bold">AI Investigation Agent</h1>
          <p className="text-slate-400">
            Investigate detected threats using security event evidence.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Select a finding</h2>

          {findings.length === 0 ? (
            <p className="text-sm text-slate-400">
              No threat findings are available yet. Run threat detection first.
            </p>
          ) : (
            <>
              <select
                value={findingId}
                onChange={(event) => setFindingId(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500"
              >
                {findings.map((finding) => (
                  <option key={finding.id} value={finding.id}>
                    {finding.title} — {finding.sourceIp} ({finding.severity})
                  </option>
                ))}
              </select>

              {selected && (
                <div className="rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
                  <p>Category: {selected.category}</p>
                  <p>Source IP: {selected.sourceIp}</p>
                  <p>Severity: {selected.severity}</p>
                </div>
              )}

              <button
                onClick={startInvestigation}
                disabled={loading || !findingId}
                className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Investigating..." : "Start AI Investigation"}
              </button>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
        </section>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-slate-300">
            Gemini is reviewing evidence and preparing a report. This may take a little time.
          </div>
        )}

        {report && (
          <section className="space-y-4 rounded-xl border border-blue-900 bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Investigation report</h2>
              <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-300">
                AI-generated · Review required
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {report.title} · {report.severity}
            </p>
            <div className="whitespace-pre-wrap leading-7 text-slate-200">
              {report.report}
            </div>
            <p className="text-xs text-slate-500">
              Created {new Date(report.createdAt).toLocaleString()}
            </p>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Investigation history</h2>
          {fetching && (
            <p className="text-sm text-slate-400">Loading history...</p>
          )}
          {!fetching && history.length === 0 && findingId && (
            <p className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-sm text-slate-400">
              No saved investigations for this finding yet.
            </p>
          )}
          {history.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <p className="mb-2 text-xs text-slate-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {item.summary}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}