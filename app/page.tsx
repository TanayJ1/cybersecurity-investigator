
"use client";

import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  success: boolean;
  stats: {
    totalEvents: number;
    totalFindings: number;
    openFindings: number;
    totalIncidents: number;
    totalInvestigations: number;
    totalReports: number;
  };
  recentEvents: {
    id: string;
    timestamp: string;
    sourceIp: string;
    username: string | null;
    eventType: string | null;
    statusCode: number | null;
    severity: string;
    message: string | null;
  }[];
  recentFindings: {
    id: string;
    title: string;
    category: string;
    sourceIp: string;
    severity: string;
    eventCount: number;
    status: string;
    updatedAt: string;
  }[];
  recentIncidents: {
    id: string;
    title: string;
    sourceIp: string;
    severity: string;
    eventCount: number;
    startTime: string;
    endTime: string;
    updatedAt: string;
  }[];
  generatedAt: string;
};

const navigation = [
  { label: "Security Logs", href: "/logs", icon: "📋", description: "Upload and review events" },
  { label: "Threat Detection", href: "/threats", icon: "🛡️", description: "Review suspicious activity" },
  { label: "AI Investigations", href: "/investigations", icon: "🔎", description: "Investigate findings with AI" },
  { label: "Correlated Incidents", href: "/correlations", icon: "🔗", description: "Explore linked activity" },
  { label: "AI Incident Reports", href: "/incident-reports", icon: "📄", description: "Generate consolidated reports" },
];

function severityClass(severity: string) {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "MEDIUM":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Dashboard request failed");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">
              Security Operations
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              AI Cybersecurity Investigator
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Investigate suspicious activity, correlate events, and generate
              evidence-based incident reports.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "↻ Refresh data"}
          </button>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
            {error}
            <button
              onClick={loadDashboard}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Security Events", value: stats?.totalEvents, icon: "📋" },
            { label: "Threat Findings", value: stats?.totalFindings, icon: "🛡️" },
            { label: "Open Findings", value: stats?.openFindings, icon: "⚠️" },
            { label: "Correlated Incidents", value: stats?.totalIncidents, icon: "🔗" },
            { label: "AI Investigations", value: stats?.totalInvestigations, icon: "🔎" },
            { label: "AI Incident Reports", value: stats?.totalReports, icon: "📄" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-black/10"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{item.label}</p>
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-semibold tabular-nums">
                {loading && !data ? "—" : item.value ?? 0}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Investigation workspace</h2>
            <p className="mt-1 text-sm text-slate-400">
              Open a tool to continue analyzing your security data.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-cyan-700 hover:bg-slate-900/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                  <span className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-400">
                    →
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{item.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold">Recent threat findings</h2>
                <p className="mt-1 text-xs text-slate-400">Latest updated detections</p>
              </div>
              <a href="/threats" className="text-sm text-cyan-400 hover:underline">
                View all
              </a>
            </div>

            {data?.recentFindings.length ? (
              <div className="divide-y divide-slate-800">
                {data.recentFindings.map((finding) => (
                  <div key={finding.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{finding.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {finding.sourceIp} · {finding.eventCount} events · {finding.status}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(finding.severity)}`}>
                      {finding.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-slate-400">
                {loading ? "Loading findings..." : "No findings available yet."}
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div>
                <h2 className="font-semibold">Recent correlated incidents</h2>
                <p className="mt-1 text-xs text-slate-400">Grouped suspicious activity</p>
              </div>
              <a href="/correlations" className="text-sm text-cyan-400 hover:underline">
                View all
              </a>
            </div>

            {data?.recentIncidents.length ? (
              <div className="divide-y divide-slate-800">
                {data.recentIncidents.map((incident) => (
                  <div key={incident.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{incident.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {incident.sourceIp} · {incident.eventCount} events
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(incident.startTime)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${severityClass(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-5 py-8 text-sm text-slate-400">
                {loading ? "Loading incidents..." : "No correlated incidents available yet."}
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <div>
              <h2 className="font-semibold">Recent security events</h2>
              <p className="mt-1 text-xs text-slate-400">Latest records stored in the database</p>
            </div>
            <a href="/logs" className="text-sm text-cyan-400 hover:underline">
              Open logs
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                  <th className="px-5 py-3 font-medium">Source IP</th>
                  <th className="px-5 py-3 font-medium">Event</th>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-400">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs">
                      {event.sourceIp}
                    </td>
                    <td className="px-5 py-3">{event.eventType || "—"}</td>
                    <td className="px-5 py-3">{event.username || "—"}</td>
                    <td className="px-5 py-3">{event.statusCode ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${severityClass(event.severity)}`}>
                        {event.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data?.recentEvents.length && (
            <p className="px-5 py-8 text-sm text-slate-400">
              {loading ? "Loading events..." : "No security events available yet."}
            </p>
          )}
        </section>

        <footer className="mt-8 flex flex-col gap-1 border-t border-slate-800 pt-4 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>AI Cybersecurity Investigator · Evidence-based analysis</span>
          <span>
            {data?.generatedAt
              ? `Last refreshed: ${formatDate(data.generatedAt)}`
              : "Waiting for dashboard data"}
          </span>
        </footer>
      </div>
    </main>
  );
}