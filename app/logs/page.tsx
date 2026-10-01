
"use client";

import { useCallback, useEffect, useState } from "react";

type SecurityEvent = {
  id: string;
  timestamp: string;
  sourceIp: string;
  destination: string | null;
  method: string | null;
  statusCode: number | null;
  username: string | null;
  eventType: string | null;
  message: string | null;
  severity: string;
};

const sampleLogs = [
  {
    timestamp: new Date().toISOString(),
    sourceIp: "192.168.1.15",
    destination: "192.168.1.20",
    method: "POST",
    statusCode: 401,
    username: "admin",
    eventType: "LOGIN_FAILURE",
    message: "Failed login attempt",
  },
];

export default function LogsPage() {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(sampleLogs, null, 2)
  );
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchLogs = useCallback(async () => {
    setFetching(true);
    setError("");

    try {
      const response = await fetch("/api/logs", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load logs");
      }

      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to fetch logs"
      );
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  async function handleUpload() {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const parsed: unknown = JSON.parse(jsonText);

      if (!Array.isArray(parsed)) {
        throw new Error("JSON must contain an array of log objects.");
      }

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logs: parsed }),
      });

      const result = await response.json();

      if (!response.ok && result.inserted === undefined) {
        throw new Error(result.message || "Upload failed");
      }

      setMessage(
        `${result.inserted} logs uploaded, ${result.rejected} rejected.`
      );

      await fetchLogs();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage("");
    setError("");

    if (!file.name.toLowerCase().endsWith(".json")) {
      setError("Please select a .json file.");
      event.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error("The JSON file must contain an array.");
      }

      setJsonText(JSON.stringify(parsed, null, 2));
      setMessage(`Loaded ${file.name}. Review the logs and click Upload Logs.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to read this JSON file"
      );
    }

    event.target.value = "";
  }

  return (
    <main className="min-h-screen bg-slate-950 p-5 text-white sm:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-medium text-blue-400">
            AI Cybersecurity Investigator
          </p>
          <h1 className="text-3xl font-bold">
            Security Log Ingestion
          </h1>
          <p className="text-slate-400">
            Upload, validate, store, and inspect security events.
          </p>
        </header>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Upload security logs</h2>
            <label className="cursor-pointer rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
              Choose JSON file
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <p className="text-sm text-slate-400">
            Paste a JSON array of security events or select a
            JSON file. Each event needs a timestamp and source IP.
          </p>

          <textarea
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-4 font-mono text-sm text-green-300 outline-none focus:border-blue-500"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Logs"}
            </button>

            <button
              onClick={() => setJsonText(JSON.stringify(sampleLogs, null, 2))}
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm hover:bg-slate-800"
            >
              Load sample
            </button>
          </div>

          {message && (
            <p role="status" className="text-sm text-green-400">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Stored security events</h2>
              <p className="text-sm text-slate-400">
                {total} total events in the database · Showing up to 100 most recent
              </p>
            </div>
            <button
              onClick={() => void fetchLogs()}
              disabled={fetching}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {fetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Source IP</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Event type</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/70">
                    <td className="whitespace-nowrap p-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono">{log.sourceIp}</td>
                    <td className="p-3">{log.username || "—"}</td>
                    <td className="p-3">{log.eventType || "—"}</td>
                    <td className="p-3">{log.statusCode ?? "—"}</td>
                    <td className="p-3">{log.severity}</td>
                    <td className="max-w-xs p-3 text-slate-400">
                      {log.message || "—"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !fetching && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No security events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}