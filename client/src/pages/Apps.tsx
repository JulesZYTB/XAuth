import { useState, useEffect, useCallback } from "react";
import { 
  Rocket, 
  Plus, 
  Trash2, 
  Key, 
  MessageSquare, 
  Pause, 
  Play, 
  ChevronRight,
  ShieldCheck,
  Settings2,
  Webhook,
  Package
} from "lucide-react";


import { Link } from "react-router";
import ConfirmModal from "../components/ConfirmModal";
import WebhookModal from "../components/WebhookModal";
import ReleaseModal from "../components/ReleaseModal";
import { useTranslation } from "react-i18next";



type App = {
  id: number;
  name: string;
  secret_key: string;
  broadcast_message?: string;
  is_paused: boolean;
};

export default function Apps() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<App[]>([]);
  const [newAppName, setNewAppName] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<number | null>(null);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [appForWebhook, setAppForWebhook] = useState<App | null>(null);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [appForRelease, setAppForRelease] = useState<App | null>(null);



  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/apps", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setApps(data);
      } else {
        console.error("Invalid apps data:", data);
        setApps([]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/apps", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ name: newAppName }),
      });
      setNewAppName("");
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePause = async (app: App) => {
    try {
      await fetch(`/api/apps/${app.id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ is_paused: !app.is_paused }),
      });
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;
    try {
      await fetch(`/api/apps/${appToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBroadcast = async (id: number, message: string) => {
    try {
      await fetch(`/api/apps/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ broadcast_message: message }),
      });
      fetchApps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="bg-secondary/40 p-8 rounded-4xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-accent/20 rounded-4xl shadow-xl shadow-accent/10">

            <Rocket className="w-10 h-10 text-accent" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Application Hub</h2>
            <p className="text-gray-400 mt-1 font-medium">Create and manage your protectable software</p>
          </div>
        </div>

        <form onSubmit={handleCreateApp} className="flex w-full md:w-auto gap-3">
          <input
            type="text"
            placeholder="App Name (e.g. Photoshop Plugin)"
            className="flex-1 md:w-64 bg-dark/50 border border-gray-800 rounded-2xl px-5 py-4 outline-none focus:border-accent transition-all text-white text-sm"
            value={newAppName}
            onChange={(e) => setNewAppName(e.target.value)}
            required
            aria-label="New application name"
          />
          <button 
            type="submit"
            className="bg-accent px-8 py-5 rounded-4xl text-white text-sm font-black flex items-center gap-3 shadow-2xl shadow-accent/30 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" /> Deploy
          </button>
        </form>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500 font-bold" aria-live="polite">
          <div className="w-2 h-2 bg-accent rounded-full animate-ping mr-4" /> Synchronizing applications...
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {apps.map((app) => (
            <li 
              key={app.id} 
              className="group bg-secondary border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-accent/40 transition-all outline-none relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 flex gap-2">
                <button 
                  type="button"
                  onClick={() => handleTogglePause(app)}
                  className={`p-3 rounded-2xl transition-all ${app.is_paused ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-gray-800/50 text-gray-500 hover:text-white border border-transparent'}`}
                  title={app.is_paused ? "Resume App" : "Pause App"}
                >
                  {app.is_paused ? <Play className="w-5 h-5" fill="currentColor" /> : <Pause className="w-5 h-5" fill="currentColor" />}
                </button>
                <button 
                  type="button"
                  onClick={() => { setAppForRelease(app); setIsReleaseModalOpen(true); }}
                  className="p-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl hover:bg-blue-500/20 transition-all"
                  title="Manage Releases"
                >
                  <Package className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => { setAppForWebhook(app); setIsWebhookModalOpen(true); }}

                  className="p-3 bg-accent/10 text-accent border border-accent/20 rounded-2xl hover:bg-accent/20 transition-all"
                  title="Configure Webhooks"
                >
                  <Webhook className="w-5 h-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => { setAppToDelete(app.id); setIsDeleteModalOpen(true); }}
                  className="p-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500/20 transition-all"
                  aria-label={`Delete ${app.name}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>

              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                  <Settings2 className="w-7 h-7 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{app.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${app.is_paused ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{app.is_paused ? "Service Paused" : "Active & Protected"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-black px-1">
                    <Package className="w-3 h-3" /> App ID
                  </div>
                  <div className="bg-dark/50 p-4 rounded-2xl border border-gray-800/50 flex justify-between items-center group/key">
                    <code className="text-sm font-mono text-gray-300 truncate max-w-[200px]">{app.id}</code>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText(app.id.toString())}
                      className="text-[10px] text-accent font-black uppercase opacity-0 group-hover/key:opacity-100 transition-all cursor-pointer"
                    >
                      {t("copy")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-black px-1">
                    <Key className="w-3 h-3" /> App Secret Key
                  </div>
                  <div className="bg-dark/50 p-4 rounded-2xl border border-gray-800/50 flex justify-between items-center group/key">
                    <code className="text-sm font-mono text-gray-300 truncate max-w-[200px]">{app.secret_key}</code>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText(app.secret_key)}
                      className="text-[10px] text-accent font-black uppercase opacity-0 group-hover/key:opacity-100 transition-all cursor-pointer"
                    >
                      {t("copy")}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase font-black px-1">
                    <MessageSquare className="w-3 h-3" /> Broadcast Message
                  </div>
                  <input
                    type="text"
                    defaultValue={app.broadcast_message || "Welcome to XAuth Omega."}
                    onBlur={(e) => handleUpdateBroadcast(app.id, e.target.value)}
                    className="w-full bg-dark/30 border border-gray-800/50 rounded-2xl px-4 py-3 text-sm text-gray-400 focus:border-accent outline-none"
                    placeholder="Enter message for clients..."
                    aria-label="Application broadcast message"
                  />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-800/50 flex justify-between items-center">
                <div className="flex -space-x-3">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-secondary overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-600">+{i}</div>)}
                </div>
                <Link 
                  to={`/apps/${app.id}/licenses`}
                  className="flex items-center gap-2 text-sm font-bold text-accent hover:underline px-4 py-2 bg-accent/5 rounded-xl border border-accent/10 transition-all font-sans"
                >
                  Manage Licenses <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </li>
          ))}

          {apps.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-gray-800 rounded-[3rem] py-32 flex flex-col items-center text-gray-600">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-5" />
              <p className="text-xl font-medium">No protected applications yet.</p>
              <p className="text-sm opacity-50 mt-1">Deploy your first app to start issuing licenses.</p>
            </div>
          )}
        </ul>
      )}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Destroy Application"
        message="This action is irreversible. Deleting this application will instantly invalidate all associated license keys and terminate active user sessions."
        confirmText="Destroy Permanently"
      />

      {appForWebhook && (
        <WebhookModal 
          isOpen={isWebhookModalOpen}
          onClose={() => setIsWebhookModalOpen(false)}
          appId={appForWebhook.id}
          appName={appForWebhook.name}
        />
      )}
      {appForRelease && (
        <ReleaseModal 
          isOpen={isReleaseModalOpen}
          onClose={() => setIsReleaseModalOpen(false)}
          appId={appForRelease.id}
          appName={appForRelease.name}
        />
      )}
    </div>


  );
}
