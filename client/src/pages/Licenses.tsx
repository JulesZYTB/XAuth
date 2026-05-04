import {
  Activity,
  CheckCircle2,
  ChevronLeft,
  Code,
  Key,
  Lock,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  Unlock,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import EditVariablesModal from "../components/EditVariablesModal";
import GenerateLicenseModal from "../components/GenerateLicenseModal";
import { getApiUrl } from "../services/apiConfig.js";

type License = {
  id: number;
  license_key: string;
  hwid?: string;
  expiry_date: string;
  status: "active" | "banned";
  app_id: number;
  variables?: string;
  max_hwids?: number;
  is_online?: boolean;
};

export default function Licenses() {
  const { t } = useTranslation();
  const { appId } = useParams();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isEditVariablesModalOpen, setIsEditVariablesModalOpen] =
    useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [activeAction, setActiveAction] = useState<{
    id: number;
    action: "ban" | "unban" | "reset-hwid" | "delete" | "regenerate" | "purge" | "purge-date";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeYears, setPurgeYears] = useState(1000);
  const [purgeDate, setPurgeDate] = useState(new Date().toISOString().split('T')[0]);

  const showNotification = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchLicenses = useCallback(async () => {
    try {
      const url = new URL(getApiUrl(`/api/apps/${appId}/licenses`));
      if (searchTerm) url.searchParams.append("search", searchTerm);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const res = await fetch(url.toString(), {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setLicenses(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setLicenses([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appId, searchTerm, page, limit]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  const handleCreateKey = async (data: {
    license_key?: string;
    expiry_date: string;
  }) => {
    try {
      const res = await fetch(getApiUrl("/api/licenses"), {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...data,
          app_id: Number(appId),
        }),
      });

      if (res.ok) {
        showNotification(t("licenses.success_provision"));
        fetchLicenses();
      } else {
        showNotification(t("licenses.error_provision"), "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmAction = async () => {
    if (!activeAction) return;
    const { id, action } = activeAction;
    let method = "PATCH";
    let url = `/api/licenses/${id}/${action}`;

    if (action === "delete") {
      method = "DELETE";
      url = `/api/licenses/${id}`;
    }

    if (action === "purge") {
        method = "DELETE";
        url = `/api/apps/${appId}/licenses/purge-long?years=${purgeYears}`;
        setIsPurging(true);
    }

    if (action === "purge-date") {
        method = "DELETE";
        url = `/api/apps/${appId}/licenses/purge-by-date?date=${purgeDate}`;
        setIsPurging(true);
    }

    try {
      const res = await fetch(getApiUrl(url), {
        credentials: "include",
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showNotification(errData.message || "Operation failed", "error");
      } else {
        const successMessages: Record<string, string> = {
          ban: t("licenses.success_ban", "License banned successfully."),
          unban: t("licenses.success_unban", "License restored."),
          "reset-hwid": t(
            "licenses.success_reset",
            "Hardware ID has been cleared.",
          ),
          regenerate: t(
            "licenses.success_regen",
            "New license key generated successfully.",
          ),
          delete: t("licenses.success_delete", "License permanentely removed."),
        };
        showNotification(
          successMessages[action] ||
            t("licenses.success_generic", "Action completed."),
        );
        if (action === "purge") {
            const affectedData = await res.json().catch(() => ({}));
            showNotification(t("licenses.success_purge", { count: affectedData.affected || 0 }));
        }
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      showNotification(
        t("licenses.error_network", "Network error occurred."),
        "error",
      );
    } finally {
        setIsPurging(false);
        setIsConfirmModalOpen(false);
        setActiveAction(null);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(licenses.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch(getApiUrl("/api/licenses/bulk"), {
        credentials: "include",
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        showNotification(t("common.success_bulk_delete", { count: selectedIds.length }));
        setSelectedIds([]);
        fetchLicenses();
      } else {
        showNotification("Failed to delete licenses", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Network error", "error");
    } finally {
      setIsBulkDeleting(false);
      setIsConfirmModalOpen(false);
    }
  };

  const handleUpdateLicense = async (variables: string, max_hwids: number) => {
    if (!selectedLicense) return;
    try {
      const res = await fetch(
        getApiUrl(`/api/licenses/${selectedLicense.id}`),
        {
          credentials: "include",
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ variables, max_hwids }),
        },
      );

      if (res.ok) {
        showNotification(t("licenses.success_metadata"));
        fetchLicenses();
      } else {
        showNotification(t("licenses.error_metadata"), "error");
      }
    } catch (err) {
      console.error(err);
      showNotification(t("licenses.error_metadata"), "error");
    }
  };

  const openConfirm = (
    id: number,
    action: "ban" | "unban" | "reset-hwid" | "delete" | "regenerate",
  ) => {
    setActiveAction({ id, action });
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {notification && (
        <div
          className={`fixed top-8 right-8 z-100 flex items-center gap-3 px-6 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-top-12 duration-500 ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-500"
              : "bg-red-500/10 border-red-500/20 text-red-500"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <ShieldAlert className="w-5 h-5" />
          )}
          <span className="text-sm font-bold">{notification.message}</span>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/apps")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-4 font-bold outline-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />{" "}
            {t("licenses.back_to_apps", "Back to Apps")}
          </button>
          <h2 className="text-3xl font-black text-white tracking-tight font-sans">
            {t("licenses.title", "License Forge")}
          </h2>
          <p className="text-gray-400 mt-1 font-medium">
            {t(
              "licenses.subtitle",
              "Generating and managing security keys for your product",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder={t("common.search_licenses", "Search status...")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-dark border border-gray-800 rounded-2xl px-6 py-4 text-sm text-white focus:border-accent/50 transition-all outline-none min-w-[200px]"
          />
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                setActiveAction({ id: 0, action: "delete" });
                setIsConfirmModalOpen(true);
              }}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.delete_selected", { count: selectedIds.length })}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
                setActiveAction({ id: 0, action: "purge" });
                setIsConfirmModalOpen(true);
            }}
            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all border border-orange-500/20"
            title={t("licenses.purge_long_desc", "Delete licenses with > 1000y duration")}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("licenses.purge_long", "Purge Spam")}
          </button>
          <button
            type="button"
            onClick={() => {
                setActiveAction({ id: 0, action: "purge-date" });
                setIsConfirmModalOpen(true);
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-tighter flex items-center gap-2 transition-all border border-red-500/20"
            title={t("licenses.purge_date_desc", "Delete licenses expiring after a specific date")}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("licenses.purge_date", "Purge by Date")}
          </button>
          <button
            type="button"
            onClick={() => setIsGenerateModalOpen(true)}
            className="bg-accent px-8 py-5 rounded-4xl text-white text-sm font-black flex items-center gap-3 shadow-2xl shadow-accent/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />{" "}
            {t("licenses.provision_new", "Provision New Key")}
          </button>
        </div>
      </header>

      {loading ? (
        <div
          className="flex items-center justify-center h-64 text-gray-500"
          aria-live="polite"
        >
          <Activity className="w-8 h-8 animate-spin mr-3 text-accent" />{" "}
          {t("licenses.fetching", "Fetching key records...")}
        </div>
      ) : (
        <div className="bg-secondary border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] lg:min-w-0">
              <thead className="bg-dark/50 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === licenses.length && licenses.length > 0}
                      className="w-4 h-4 rounded border-gray-700 bg-dark text-accent focus:ring-accent"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("licenses.table_key", "License Key")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("licenses.table_status", "Status")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("licenses.table_hwid", "HWID")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("licenses.table_expiry", "Expiry")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-right">
                    {t("licenses.table_actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {licenses.map((license) => (
                  <tr
                    key={license.id}
                    className={`hover:bg-white/2 transition-colors group ${selectedIds.includes(license.id) ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(license.id)}
                        onChange={() => handleSelectOne(license.id)}
                        className="w-4 h-4 rounded border-gray-700 bg-dark text-accent focus:ring-accent"
                      />
                    </td>
                    <td className="px-6 py-5 font-mono text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                           <span className="select-all">{license.license_key}</span>
                           {license.is_online && (
                             <span className="absolute -top-1 -right-4 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          license.status === "active"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {license.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-500 text-xs font-mono">
                      {license.hwid || t("licenses.not_linked", "Not Linked")}
                    </td>
                    <td className="px-6 py-5 text-gray-400 text-xs font-medium">
                      {new Date(license.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLicense(license);
                            setIsEditVariablesModalOpen(true);
                          }}
                          className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-500/10 rounded-xl transition-all cursor-pointer"
                          title={t(
                            "licenses.edit_metadata",
                            "Edit License Metadata",
                          )}
                        >
                          <Code className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirm(license.id, "regenerate")}
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all cursor-pointer"
                          title={t("licenses.regen_key", "Regenerate Key Value")}
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openConfirm(license.id, "reset-hwid")}
                          className="p-2 text-gray-500 hover:text-accent hover:bg-accent/10 rounded-xl transition-all cursor-pointer"
                          title={t("licenses.reset_hwid", "Reset HWID")}
                        >
                          <RefreshCcw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              license.id,
                              license.status === "active" ? "ban" : "unban",
                            )
                          }
                          className={`p-2 rounded-xl transition-all cursor-pointer ${license.status === "active" ? "text-orange-500 hover:bg-orange-500/10" : "text-green-500 hover:bg-green-500/10"}`}
                          title={
                            license.status === "active"
                              ? t("licenses.ban_key", "Ban Key")
                              : t("licenses.unban_key", "Unban Key")
                          }
                        >
                          {license.status === "active" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openConfirm(license.id, "delete")}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                          title={t("licenses.delete_key", "Delete Key")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {licenses.length === 0 && (
            <div className="text-center py-20 text-gray-600">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-5" />
              <p className="font-bold text-sm">
                {t(
                  "licenses.no_licenses_found",
                  "No licenses issued for this app yet.",
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
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

      <div className="flex items-center gap-4 p-6 bg-accent/5 border border-accent/10 rounded-4xl">
        <ShieldAlert className="w-6 h-6 text-accent shrink-0" />
        <p className="text-xs text-accent/70 leading-relaxed font-medium font-sans">
          <strong>{t("licenses.security_note_title", "Security Note:")}</strong>{" "}
          {t(
            "licenses.security_note_desc",
            "Banning a license will instantly invalidate sessions for any client using that key. HWID reset allows a user to move the software to a new machine. Provisioning is done in real-time.",
          )}
        </p>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          if (activeAction?.id === 0) setActiveAction(null);
        }}
        onConfirm={
          activeAction?.id === 0 && !activeAction.action.startsWith("purge")
            ? handleBulkDelete
            : confirmAction
        }
        title={
          activeAction?.action === "purge" || activeAction?.action === "purge-date"
            ? t("licenses.purge_title", "Massive Spam Purge")
            : activeAction?.id === 0
            ? t("licenses.bulk_delete_title", "Destroy Selection")
            : activeAction?.action === "delete"
            ? t("licenses.destroy_license", "Destroy License")
            : activeAction?.action === "regenerate"
              ? t("licenses.regen_secret", "Regenerate Key Secret")
              : t("licenses.alter_security", "Alter Security Status")
        }
        message={
          activeAction?.action === "purge" || activeAction?.action === "purge-date"
            ? t("licenses.purge_confirm_msg", "This will permanently delete ALL licenses for this application that have a duration exceeding the specified threshold. This action is irreversible and used to clear mass-generated spam.")
            : activeAction?.action === "delete"
            ? t(
                "licenses.delete_confirm_msg",
                "This will permanently remove the license key from the system. Users will not be able to redeem or use it anymore.",
              )
            : activeAction?.action === "regenerate"
              ? t(
                  "licenses.regen_confirm_msg",
                  "This will void the current license string and generate a completely new one. Any client currently using the old string will be disconnected.",
                )
              : t(
                  "licenses.alter_confirm",
                  "Are you sure you want to {{action}} this license record? This will take immediate effect on all active sessions.",
                  { action: activeAction?.action },
                )
        }
        confirmText={
          activeAction?.action === "purge" || activeAction?.action === "purge-date"
            ? t("licenses.purge_now", "Purge Everything Now")
            : activeAction?.action === "regenerate"
            ? t("licenses.regen_now")
            : t("licenses.confirm_change")
        }
        loading={isBulkDeleting || isPurging}
        type={
          activeAction?.action === "delete" || activeAction?.action === "purge" || activeAction?.action === "purge-date"
            ? "danger"
            : activeAction?.action === "regenerate"
              ? "info"
              : "warning"
        }
      >
        {activeAction?.action === "purge" && (
          <div className="mt-4">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
              {t("licenses.years_to_purge", "Licenses older than (years)")}
            </label>
            <input
              type="number"
              min="1"
              value={purgeYears}
              onChange={(e) => setPurgeYears(Number(e.target.value))}
              className="w-full bg-dark border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-accent/50 transition-all outline-none"
              placeholder="1000"
            />
          </div>
        )}
        {activeAction?.action === "purge-date" && (
          <div className="mt-4">
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
              {t("licenses.date_to_purge", "Licenses expiring after")}
            </label>
            <input
              type="date"
              value={purgeDate}
              onChange={(e) => setPurgeDate(e.target.value)}
              className="w-full bg-dark border border-gray-800 rounded-2xl px-6 py-4 text-white focus:border-accent/50 transition-all outline-none"
            />
          </div>
        )}
      </ConfirmModal>

      <GenerateLicenseModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleCreateKey}
      />

      {selectedLicense && (
        <EditVariablesModal
          isOpen={isEditVariablesModalOpen}
          onClose={() => setIsEditVariablesModalOpen(false)}
          onSave={handleUpdateLicense}
          initialVariables={selectedLicense.variables || "{}"}
          initialMaxHwids={selectedLicense.max_hwids || 1}
          licenseKey={selectedLicense.license_key}
        />
      )}
    </div>
  );
}
