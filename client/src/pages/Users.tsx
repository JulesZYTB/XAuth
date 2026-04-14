import { useState, useEffect, useCallback } from "react";
import { User, Shield, Trash2, ShieldAlert, Activity } from "lucide-react";
import ConfirmModal from "../components/ConfirmModal";

type UserData = {
  id: number;
  username: string;
  email: string;
  role: "admin" | "user";
};

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleRole = async (user: UserData) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await fetch(`/api/users/${userToDelete}`, {
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
          <h2 className="text-3xl font-black text-white tracking-tight">Identity Center</h2>
          <p className="text-gray-400 mt-1">Manage platform users and access levels</p>
        </div>
        <div className="bg-accent/10 border border-accent/20 px-4 py-2 rounded-full text-accent text-xs font-bold flex items-center gap-2">
          <Shield className="w-4 h-4" /> Admin Controls Active
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="w-8 h-8 animate-spin mr-3" /> Fetching identity records...
        </div>
      ) : (
        <div className="bg-secondary border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-dark/50 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">User</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">Email</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-center">Identity Role</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/10">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                      <span className="font-bold text-white">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-gray-400 text-sm font-medium">{user.email}</span>
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
                      onClick={() => { setUserToDelete(user.id); setIsDeleteModalOpen(true); }}
                      disabled={user.id === 1}
                      className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all disabled:opacity-30"
                      aria-label={`Delete ${user.username}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-4 p-6 bg-red-500/5 border border-red-500/10 rounded-4xl">
        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
        <p className="text-xs text-red-500/70 leading-relaxed font-medium font-sans">
          <strong>Security Warning:</strong> Modifying user roles can expose sensitive data. 
          Deleting a user will cascade-delete all associated licenses and application configurations. 
          The system administrator account (ID 1) is protected from deletion.
        </p>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Sanitize Identity Record"
        message="This operation is final. Deleting this user will remove all their data, including hosted applications and all associated license keys. This cannot be undone."
        confirmText="Confirm Deletion"
      />
    </div>
  );
}
