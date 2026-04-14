import { useState, useEffect, useCallback } from "react";
import { X, Rocket, Package, ExternalLink, ShieldCheck, Trash2 } from "lucide-react";

interface Release {
  id: number;
  version: string;
  channel: "stable" | "beta";
  download_url: string;
  checksum: string;
  is_active: boolean;
  created_at: string;
}

interface ReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: number;
  appName: string;
}

export default function ReleaseModal({ isOpen, onClose, appId, appName }: ReleaseModalProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New release form
  const [version, setVersion] = useState("");
  const [url, setUrl] = useState("");
  const [checksum, setChecksum] = useState("");
  const [channel, setChannel] = useState<"stable" | "beta">("stable");

  const fetchReleases = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appId}/releases`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setReleases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (isOpen) fetchReleases();
  }, [isOpen, fetchReleases]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/releases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          app_id: appId,
          version,
          channel,
          download_url: url,
          checksum,
        }),
      });
      setVersion("");
      setUrl("");
      setChecksum("");
      fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/releases/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchReleases();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-secondary w-full max-w-3xl rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden">
        <header className="p-8 border-b border-gray-800 flex justify-between items-center bg-secondary/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Release Management</h3>
              <p className="text-xs text-gray-400">Deploying versions for <span className="text-accent font-bold">{appName}</span></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Create Release Form */}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark/30 p-6 rounded-3xl border border-gray-800/50">
            <div className="space-y-2">
              <label htmlFor="ver" className="text-[10px] text-gray-500 uppercase font-black px-1">Version String</label>
              <input
                id="ver"
                type="text"
                required
                placeholder="v1.0.4-stable"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="chan" className="text-[10px] text-gray-500 uppercase font-black px-1">Target Channel</label>
              <select
                id="chan"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all appearance-none"
                value={channel}
                onChange={(e) => setChannel(e.target.value as "stable" | "beta")}
              >
                <option value="stable">Stable / Main</option>
                <option value="beta">Beta / Testing</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="url" className="text-[10px] text-gray-500 uppercase font-black px-1">Download URL (Direct Link)</label>
              <input
                id="url"
                type="url"
                required
                placeholder="https://cdn.yourstorage.com/app/v104.exe"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-blue-500 transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="hash" className="text-[10px] text-gray-500 uppercase font-black px-1">SHA-256 Checksum</label>
              <input
                id="hash"
                type="text"
                required
                placeholder="a3f5...99e1"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-3 text-xs font-mono text-white outline-none focus:border-blue-500 transition-all"
                value={checksum}
                onChange={(e) => setChecksum(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full bg-blue-600 h-[46px] rounded-2xl text-white text-xs font-black flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
              >
                <Rocket className="w-4 h-4" /> Publish Release
              </button>
            </div>
          </form>

          {/* Release List */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-gray-500 uppercase font-black px-1">Deployment History</h4>
            
            {loading ? (
              <div className="py-12 text-center text-xs text-gray-600 font-bold animate-pulse">Fetching releases...</div>
            ) : releases.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 italic text-sm">
                No releases published yet. Use the gateway to deploy your first version.
              </div>
            ) : (
              releases.map((rel) => (
                <div key={rel.id} className="bg-dark/20 border border-gray-800 rounded-2xl p-6 flex justify-between items-center group">
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${rel.channel === 'stable' ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                      <ShieldCheck className={`w-6 h-6 ${rel.channel === 'stable' ? 'text-green-500' : 'text-orange-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-white">{rel.version}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${rel.channel === 'stable' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                          {rel.channel}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono mt-1 opacity-60 truncate max-w-xs">{rel.checksum}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      type="button"
                      onClick={() => window.open(rel.download_url, "_blank")}
                      className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500/20 transition-all"
                      title="Download Binary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(rel.id)}
                      className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                      title="Delete Release"
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
            type="button"
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
