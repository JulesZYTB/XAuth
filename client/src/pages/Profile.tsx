import { useState, useEffect } from "react";
import { User, Mail, ShieldAlert, CheckCircle2, Key } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../services/apiConfig.js";
import PageSEO from "../components/PageSEO";

export default function Profile() {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ id: number; username: string; email: string; role: string } | null>(null);
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUser(decoded);
        setFormData({ username: decoded.username, email: decoded.email || "", password: "" });
      } catch (e) {
        // Ignored
      }
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const response = await fetch(getApiUrl("/api/auth/profile"), {
        credentials: "include",
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setStatus({ type: "success", msg: t("profile.update_success", "Profile updated successfully") });
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else {
        setStatus({ type: "error", msg: data.message || "Failed to update profile" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "Server error" });
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-3xl mx-auto">
      <PageSEO title={t("seo.profile_title", "Security Settings")} />
      <header>
        <h2 className="text-4xl font-black text-white tracking-tighter">{t("profile.title", "My Profile")}</h2>
        <p className="text-gray-400 mt-1 font-medium">{t("profile.subtitle", "Manage your personal settings and identity")}</p>
      </header>

      <div className="bg-secondary border border-gray-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        {status && (
          <div className={`mb-8 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border animate-shake ${status.type === "success" ? "text-green-500 bg-green-500/10 border-green-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"}`}>
            {status.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            {status.msg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-800/50">
            <div className="w-24 h-24 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center">
              <User className="w-10 h-10 text-accent" />
            </div>
            <div>
              <p className="text-sm font-black text-white">{user?.username}</p>
              <p className="text-[10px] text-accent uppercase font-black tracking-widest">{user?.role}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="username">{t("auth.username", "Username")}</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" />
              <input
                id="username"
                type="text"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent transition-all text-white text-sm"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="email">{t("auth.email", "Email Address")}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" />
              <input
                id="email"
                type="email"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent transition-all text-white text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="password">{t("profile.new_password", "New Password (Leave blank to keep)")}</label>
            <div className="relative group">
              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-red-500 transition-colors" />
              <input
                id="password"
                type="password"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-red-500 transition-all text-white text-sm"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-accent hover:bg-accent/80 text-white font-black py-4 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 cursor-pointer"
            >
              {t("profile.save_changes", "Save Changes")}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-secondary border border-gray-800 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <header className="mb-8">
           <div className="flex items-center gap-3">
             <Key className="w-5 h-5 text-accent" />
             <h3 className="text-xl font-black text-white">{t("profile.api_keys", "Developer API Keys")}</h3>
           </div>
           <p className="text-gray-500 text-xs mt-1">{t("profile.api_keys_desc", "Authenticate your external services (Sellix, Shoppy) via these keys.")}</p>
        </header>

        <ApiKeyManager />
      </div>
    </div>
  );
}

import { Trash2, Copy, Plus } from "lucide-react";

function ApiKeyManager() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const res = await fetch(getApiUrl("/api/api-keys"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setKeys(data);
    } catch {}
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName) return;
    try {
      const res = await fetch(getApiUrl("/api/api-keys"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      setGeneratedKey(data.api_key);
      setNewKeyName("");
      fetchKeys();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/api-keys/${id}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      fetchKeys();
    } catch {}
  };

  return (
    <div className="space-y-6">
      {generatedKey && (
        <div className="bg-accent/10 border border-accent/20 p-6 rounded-2xl space-y-4 animate-in zoom-in-95 duration-500">
          <p className="text-xs font-black text-accent uppercase tracking-widest">{t("profile.new_key_generated", "New Secret Key Generated")}</p>
          <div className="bg-dark/50 p-4 rounded-xl border border-accent/20 flex justify-between items-center group">
            <code className="text-white text-sm font-mono break-all">{generatedKey}</code>
            <button 
              onClick={() => { navigator.clipboard.writeText(generatedKey); }}
              className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-gray-500 italic">{t("profile.key_warning", "Store this key safely! You won't be able to see it again.")}</p>
          <button 
            onClick={() => setGeneratedKey(null)}
            className="text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            {t("common.close", "Close")}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input 
          type="text"
          placeholder={t("profile.key_name_placeholder", "Key Name (e.g. Sellix Integration)")}
          className="flex-1 bg-dark/50 border border-gray-800 rounded-xl px-4 py-3 outline-none focus:border-accent transition-all text-white text-sm"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
        />
        <button 
          onClick={handleCreate}
          className="bg-accent px-6 rounded-xl text-white font-black text-xs uppercase flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t("common.generate", "Generate")}
        </button>
      </div>

      <div className="space-y-2">
        {keys.map(key => (
          <div key={key.id} className="bg-dark/30 p-4 rounded-2xl border border-gray-800/50 flex justify-between items-center group">
            <div>
              <p className="text-sm font-bold text-white mb-1">{key.name}</p>
              <div className="flex items-center gap-4">
                <p className="text-[10px] font-mono text-gray-500">{key.key_prefix}••••••••</p>
                <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">
                   {t("profile.last_used", "Last Used:")} {key.last_used ? new Date(key.last_used).toLocaleDateString() : t("common.never", "Never")}
                </p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(key.id)}
              className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

