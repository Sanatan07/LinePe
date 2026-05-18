"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { axiosInstance } from "@/lib/axios";

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
};

export default function AuditPageClient() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [filters, setFilters] = useState({ type: "", status: "", action: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);

  const query = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({ ...filters, page: pagination.page, limit: pagination.limit }).filter(
          ([, value]) => value !== ""
        )
      ),
    [filters, pagination.page, pagination.limit]
  );

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get("/logs", { params: query });
      setLogs(res.data?.logs || []);
      setPagination(res.data?.pagination || { page: 1, pages: 1, total: 0, limit: 50 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <main className="min-h-screen bg-[#f4f6f2] text-stone-950">
      <header className="border-b border-stone-200 bg-white">
        <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="LinePe home">
            <span className="flex size-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">
              L
            </span>
            <span className="text-lg font-bold">LinePe</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              Chat
            </Link>
            <Link
              href="/settings"
              className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-950"
            >
              Settings
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Admin</p>
            <h1 className="mt-1 text-3xl font-black text-stone-950">Audit Logs</h1>
            <p className="mt-1 text-sm text-stone-500">{pagination.total} records</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
          >
            <option value="">All types</option>
            <option value="auth">Auth</option>
            <option value="error">Error</option>
          </select>
          <select
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          <input
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Filter by action"
            value={filters.action}
            onChange={(e) => updateFilter("action", e.target.value)}
          />
          <input
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => updateFilter("email", e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                {["Time", "Type", "Action", "Status", "User", "Route", "Message", "IP"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-stone-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-stone-50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-stone-700">{log.type}</td>
                  <td className="px-4 py-3 text-xs text-stone-700">{log.action}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${
                        log.status === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-stone-950">{log.userId?.username || "—"}</p>
                    <p className="text-xs text-stone-400">{log.email || log.userId?.email || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {log.method ? `${log.method} ${log.route}` : log.route}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-stone-700" title={log.message}>
                    <span className="block truncate">{log.message}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">{log.ip}</td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-400">
                    No audit logs found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto size-5 animate-spin text-stone-400" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            Previous
          </button>
          <span className="text-sm text-stone-500">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <button
            type="button"
            className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            disabled={pagination.page >= pagination.pages || isLoading}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
