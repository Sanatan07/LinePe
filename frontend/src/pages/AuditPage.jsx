import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { axiosInstance } from "../lib/axios";

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
};

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });
  const [filters, setFilters] = useState({ type: "", status: "", action: "", email: "" });
  const [isLoading, setIsLoading] = useState(false);

  const query = useMemo(
    () =>
      Object.fromEntries(
        Object.entries({
          ...filters,
          page: pagination.page,
          limit: pagination.limit,
        }).filter(([, value]) => value !== "")
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
    setFilters((state) => ({ ...state, [key]: value }));
    setPagination((state) => ({ ...state, page: 1 }));
  };

  return (
    <main className="min-h-screen bg-base-200 pt-24 px-4 pb-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Audit Logs</h1>
            <p className="text-sm text-base-content/60">{pagination.total} records</p>
          </div>

          <button type="button" className="btn btn-primary btn-sm gap-2" onClick={fetchLogs} disabled={isLoading}>
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <select className="select select-bordered w-full" value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
            <option value="">All types</option>
            <option value="auth">Auth</option>
            <option value="error">Error</option>
          </select>
          <select className="select select-bordered w-full" value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
          <input className="input input-bordered w-full" placeholder="Action" value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} />
          <input className="input input-bordered w-full" placeholder="Email" value={filters.email} onChange={(e) => updateFilter("email", e.target.value)} />
        </div>

        <div className="overflow-x-auto rounded-lg border border-base-300 bg-base-100">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Action</th>
                <th>Status</th>
                <th>User</th>
                <th>Route</th>
                <th>Message</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="whitespace-nowrap text-xs">{formatDate(log.createdAt)}</td>
                  <td>{log.type}</td>
                  <td>{log.action}</td>
                  <td>
                    <span className={`badge ${log.status === "success" ? "badge-success" : "badge-error"}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="text-sm">
                    <div>{log.userId?.username || "-"}</div>
                    <div className="text-xs text-base-content/60">{log.email || log.userId?.email || ""}</div>
                  </td>
                  <td className="text-xs">{log.method ? `${log.method} ${log.route}` : log.route}</td>
                  <td className="max-w-xs truncate" title={log.message}>{log.message}</td>
                  <td className="text-xs">{log.ip}</td>
                </tr>
              ))}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-base-content/60">No audit logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-sm"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setPagination((state) => ({ ...state, page: state.page - 1 }))}
          >
            Previous
          </button>
          <span className="text-sm text-base-content/70">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={pagination.page >= pagination.pages || isLoading}
            onClick={() => setPagination((state) => ({ ...state, page: state.page + 1 }))}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
};

export default AuditPage;
