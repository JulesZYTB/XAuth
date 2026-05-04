import { Activity, Shield, ShieldAlert, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import { getApiUrl } from "../services/apiConfig.js";

type UserData = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
};

export default function Users() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  const fetchUsers = useCallback(async () => {
    try {
      const url = new URL(getApiUrl("/api/users"));
      if (searchTerm) url.searchParams.append("search", searchTerm);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const res = await fetch(url.toString(), {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleRole = async (user: UserData) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await fetch(getApiUrl(`/api/users/${user.id}`), {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(users.filter(u => u.id !== 1).map(u => u.id));
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
      const res = await fetch(getApiUrl("/api/users/bulk"), {
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
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkDeleting(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await fetch(getApiUrl(`/api/users/${userToDelete}`), {
        credentials: "include",
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {t("users.title", "Identity Center")}
          </h2>
          <p className="text-gray-400 mt-1">
            {t("users.subtitle", "Manage platform users and access levels")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <input
            type="text"
            placeholder={t("common.search_users", "Search users...")}
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
          <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-accent text-xs font-bold flex items-center gap-2">
            <Shield className="w-4 h-4" />{" "}
            {t("users.admin_controls", "Admin Controls Active")}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="w-8 h-8 animate-spin mr-3" />{" "}
          {t("users.fetching", "Fetching identity records...")}
        </div>
      ) : (
        <div className="bg-secondary border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px] md:min-w-0">
              <thead className="bg-dark/50 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === users.filter(u => u.id !== 1).length && users.length > 1}
                      className="w-4 h-4 rounded border-gray-700 bg-dark text-accent focus:ring-accent"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("users.table_user", "User")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">
                    {t("users.table_email", "Email")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-center">
                    {t("users.table_role", "Identity Role")}
                  </th>
                  <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-right">
                    {t("users.table_actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-white/2 transition-colors group ${selectedIds.includes(user.id) ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        disabled={user.id === 1}
                        checked={selectedIds.includes(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                        className="w-4 h-4 rounded border-gray-700 bg-dark text-accent focus:ring-accent disabled:opacity-30"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-bold text-white">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-gray-400 text-sm font-medium">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleRole(user)}
                        disabled={user.id === 1}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                          user.role === "admin"
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-gray-800/30 text-gray-500 border border-transparent hover:border-gray-700"
                        } disabled:opacity-50`}
                        aria-label={`Toggle role for ${user.username}`}
                      >
                        {user.role}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setUserToDelete(user.id);
                          setIsDeleteModalOpen(true);
                        }}
                        disabled={user.id === 1}
                        className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all disabled:opacity-30 cursor-pointer"
                        aria-label={t("users.delete_user", "Delete User")}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <div className="flex items-center gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-4xl">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <p className="text-xs text-red-500/70 leading-relaxed font-medium font-sans">
          <strong>
            {t("users.security_warning_title", "Security Warning:")}
          </strong>{" "}
          {t(
            "users.security_warning_desc",
            "Modifying user roles can expose sensitive data. Deleting a user will cascade-delete all associated licenses and application configurations. The system administrator account (ID 1) is protected from deletion.",
          )}
        </p>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={userToDelete ? confirmDelete : handleBulkDelete}
        title={userToDelete ? t("users.delete_title") : t("users.bulk_delete_title", "Massive Sanitization")}
        message={userToDelete ? t("users.delete_msg") : t("common.bulk_delete_confirm", { count: selectedIds.length })}
        confirmText={t("users.delete_confirm", "Confirm Deletion")}
        loading={isBulkDeleting}
      />
    </div>
  );
}
