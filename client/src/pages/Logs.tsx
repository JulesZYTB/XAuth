import {
  Activity,
  Box,
  Clock,
  Globe,
  Monitor,
  Terminal,
  User,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../services/apiConfig.js";
import ConfirmModal from "../components/ConfirmModal.js";

type AuditLog = {
  id: number;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  app_name?: string;
  username?: string;
};

export default function Logs() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(50);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUserRole(payload.role);
        } catch (e) {
            console.error("Failed to parse token role", e);
        }
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const url = new URL(getApiUrl("/api/logs"));
      if (searchTerm) url.searchParams.append("search", searchTerm);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const res = await fetch(url.toString(), {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setLogs(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, limit]);

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch(getApiUrl("/api/logs/bulk"), {
        credentials: "include",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(getApiUrl("/api/logs/reset"), {
        credentials: "include",
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
      setIsResetModalOpen(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {t("logs.title", "Audit Trail")}
          </h2>
          <p className="text-gray-400 mt-1">
            {t("logs.subtitle", "Real-time system activity and security events")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder={t("common.search", "Search events...")}
            value={searchTerm}
            onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
            }}
            className="bg-dark border border-gray-800 rounded-2xl px-6 py-3 text-sm text-white focus:border-accent/50 transition-all outline-none min-w-[250px]"
          />
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete_selected", { count: selectedIds.length })}
            </button>
          )}
          {userRole === "admin" && (
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all border border-orange-500/20"
            >
              <Terminal className="w-4 h-4" />
              {t("logs.reset_all", "Factory Reset Logs")}
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="w-8 h-8 animate-spin mr-3" />{" "}
          {t("logs.fetching", "Analyzing system events...")}
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {logs.map((log) => (
            <article
              key={log.id}
              onClick={() => handleSelectOne(log.id)}
              className={`bg-secondary border rounded-3xl p-6 transition-all group cursor-pointer ${
                selectedIds.includes(log.id)
                  ? "border-accent/40 bg-accent/5"
                  : "border-gray-800 hover:border-accent/20"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-dark/50 flex items-center justify-center shrink-0 border border-gray-800 group-hover:border-accent/30 transition-colors">
                    <Terminal
                      className="w-5 h-5 text-accent"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-white uppercase tracking-widest">
                        {log.action}
                      </span>
                      <span className="text-[10px] bg-dark px-2 py-0.5 rounded-full text-gray-500 border border-gray-800 font-bold">
                        #{log.id}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                      {log.details}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3" aria-hidden="true" />
                    {log.ip_address}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-800/50">
                {log.username && (
                  <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 text-[10px] font-bold text-gray-300">
                    <User className="w-3 h-3 text-accent" aria-hidden="true" />
                    {log.username}
                  </div>
                )}
                {log.app_name && (
                  <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 text-[10px] font-bold text-gray-300">
                    <Box className="w-3 h-3 text-accent" aria-hidden="true" />
                    {log.app_name}
                  </div>
                )}
                <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 grow md:grow-0 text-[9px] font-medium text-gray-500">
                  <Monitor
                    className="w-3 h-3 text-gray-600"
                    aria-hidden="true"
                  />
                  <span
                    className="truncate max-w-[200px]"
                    title={log.user_agent}
                  >
                    {log.user_agent}
                  </span>
                </div>
              </div>
            </article>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-20 bg-dark/20 rounded-[3rem] border-2 border-dashed border-gray-800">
              <Activity className="w-12 h-12 mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 font-medium">
                {t("logs.no_logs_found", "No activity logs found yet.")}
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="bg-secondary border border-gray-800 text-gray-400 px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-30 transition-all"
              >
                {t("common.previous", "Previous")}
              </button>
              <span className="text-gray-500 text-xs font-black">
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="bg-secondary border border-gray-800 text-gray-400 px-6 py-2 rounded-xl text-xs font-bold hover:bg-gray-800 disabled:opacity-30 transition-all"
              >
                {t("common.next", "Next")}
              </button>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title={t("logs.bulk_delete_title", "Purge Audit Records")}
        message={t("common.bulk_delete_confirm", { count: selectedIds.length })}
        confirmText={t("common.confirm_action")}
        loading={isBulkDeleting}
        type="danger"
      />
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleReset}
        title={t("logs.reset_title", "Total Log Wipeout")}
        message={t("logs.reset_confirm_msg", "This will permanently delete ALL audit logs from the database. This action is irreversible and usually done for maintenance.")}
        confirmText={t("logs.reset_now", "Clear Everything")}
        loading={isResetting}
        type="danger"
      />
    </div>
  );
}
