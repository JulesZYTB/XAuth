import { useState, useEffect } from "react";
import { X, Webhook, Trash2, Plus, ShieldCheck, ExternalLink, Activity } from "lucide-react";

interface WebhookData {
  id: number;
  url: string;
  event_types: string;
  is_enabled: boolean;
  secret?: string;
}

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  appName: string;
}

export default function WebhookModal({ isOpen, onClose, appId, appName }: WebhookModalProps) {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`/api/apps/${appId}/webhooks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setWebhooks(data);
    } catch (err) {
      console.error("Failed to fetch webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchWebhooks();
  }, [isOpen, appId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          app_id: appId,
          url: newUrl,
          secret: newSecret,
          event_types: "all",
        }),
      });
      setNewUrl("");
      setNewSecret("");
      fetchWebhooks();
    } catch (err) {
      console.error("Failed to create webhook:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchWebhooks();
    } catch (err) {
      console.error("Failed to delete webhook:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-secondary w-full max-w-2xl rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden shadow-black/50">
        <header className="p-8 border-b border-gray-800 flex justify-between items-center bg-secondary/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <Webhook className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Event Webhooks</h3>
              <p className="text-xs text-gray-400">Notifications for <span className="text-accent font-bold">{appName}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
          {/* Create Webhook Form */}
          <form onSubmit={handleCreate} className="space-y-4 bg-dark/30 p-6 rounded-3xl border border-gray-800/50">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase font-black px-1">Destination URL</label>
              <input
                type="url"
                required
                placeholder="https://your-server.com/webhook"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-accent transition-all"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-black px-1">Secret (Optional)</label>
                <input
                  type="text"
                  placeholder="For HMAC signature"
                  className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-accent transition-all"
                  value={newSecret}
                  onChange={(e) => setNewSecret(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  className="w-full bg-accent h-[46px] rounded-2xl text-white text-xs font-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/20"
                >
                  <Plus className="w-4 h-4" /> Add Webhook
                </button>
              </div>
            </div>
          </form>

          {/* Webhook List */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-gray-500 uppercase font-black px-1 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Active Endpoints
            </h4>
            
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-600 font-bold animate-pulse">Loading endpoints...</div>
            ) : webhooks.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 italic text-sm">
                No webhooks configured for this app yet.
              </div>
            ) : (
              webhooks.map((hook) => (
                <div key={hook.id} className="bg-dark/20 border border-gray-800 rounded-2xl p-4 flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="max-w-md truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-200 truncate">{hook.url}</span>
                        {hook.secret && <span className="bg-accent/10 text-accent text-[8px] font-black px-1.5 py-0.5 rounded border border-accent/20">HMAC SECURE</span>}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Events: <span className="text-gray-400 capitalize">{hook.event_types}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => window.open(hook.url, "_blank")}
                      className="p-2 text-gray-500 hover:text-accent transition-all"
                      title="Test URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(hook.id)}
                      className="p-2 text-gray-500 hover:text-red-500 transition-all"
                      title="Delete Hook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="p-8 bg-dark/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl text-white text-xs font-black transition-all"
          >
            Finished
          </button>
        </footer>
      </div>
    </div>
  );
}
