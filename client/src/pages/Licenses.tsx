import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  Key, 
  Trash2, 
  ShieldAlert, 
  RefreshCcw, 
  Activity, 
  Lock,
  Unlock,
  ChevronLeft,
  Plus
} from "lucide-react";

import ConfirmModal from "../components/ConfirmModal";
import GenerateLicenseModal from "../components/GenerateLicenseModal";

type License = {
  id: number;
  license_key: string;
  hwid?: string;
  expiry_date: string;
  status: "active" | "banned";
  app_id: number;
};

export default function Licenses() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<{ id: number, action: "ban" | "unban" | "reset-hwid" | "delete" } | null>(null);

  const fetchLicenses = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/${appId}/licenses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setLicenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const handleCreateKey = async (data: { license_key?: string, expiry_date: string }) => {
    try {
      await fetch("/api/licenses", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ 
          ...data,
          app_id: Number(appId)
        }),
      });
      fetchLicenses();
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

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Action failed: ${errData.message || res.statusText}`);
      } else {
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred.");
    }
  };


  const openConfirm = (id: number, action: "ban" | "unban" | "reset-hwid" | "delete") => {
    setActiveAction({ id, action });
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button 
            type="button"
            onClick={() => navigate("/apps")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-4 font-bold outline-none"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Apps
          </button>
          <h2 className="text-3xl font-black text-white tracking-tight font-sans">License Forge</h2>
          <p className="text-gray-400 mt-1 font-medium">Generating and managing security keys for your product</p>
        </div>

        <button 
          type="button"
          onClick={() => setIsGenerateModalOpen(true)}
          className="bg-accent px-8 py-5 rounded-[2rem] text-white text-sm font-black flex items-center gap-3 shadow-2xl shadow-accent/30 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" /> Provision New Key
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500" aria-live="polite">
          <Activity className="w-8 h-8 animate-spin mr-3 text-accent" /> Fetching key records...
        </div>
      ) : (
        <div className="bg-secondary border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-dark/50 border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">License Key</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">Status</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">HWID</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black">Expiry</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {licenses.map((license) => (
                <tr key={license.id} className="hover:bg-white/2 transition-colors group">
                  <td className="px-6 py-5 font-mono text-sm text-gray-300">{license.license_key}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      license.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-500 text-xs font-mono">{license.hwid || "Not Linked"}</td>
                  <td className="px-6 py-5 text-gray-400 text-xs font-medium">{new Date(license.expiry_date).toLocaleDateString()}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => openConfirm(license.id, "reset-hwid")}
                        className="p-2 text-gray-500 hover:text-accent rounded-xl transition-all"
                        title="Reset HWID"
                      >
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => openConfirm(license.id, license.status === "active" ? "ban" : "unban")}
                        className={`p-2 rounded-xl transition-all ${license.status === "active" ? "text-orange-500 hover:bg-orange-500/10" : "text-green-500 hover:bg-green-500/10"}`}
                        title={license.status === "active" ? "Ban Key" : "Unban Key"}
                      >
                        {license.status === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => openConfirm(license.id, "delete")}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Delete Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {licenses.length === 0 && (
            <div className="text-center py-20 text-gray-600">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-5" />
              <p className="font-bold text-sm">No licenses issued for this app yet.</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 p-6 bg-accent/5 border border-accent/10 rounded-4xl">
        <ShieldAlert className="w-6 h-6 text-accent shrink-0" />
        <p className="text-xs text-accent/70 leading-relaxed font-medium font-sans">
          <strong>Security Note:</strong> Banning a license will instantly invalidate sessions for any client using that key. 
          HWID reset allows a user to move the software to a new machine. Provisioning is done in real-time.
        </p>
      </div>

      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmAction}
        title={activeAction?.action === 'delete' ? "Destroy License" : "Alter Security Status"}
        message={
          activeAction?.action === 'delete' 
          ? "This will permanently remove the license key from the system. Users will not be able to redeem or use it anymore."
          : `Are you sure you want to ${activeAction?.action} this license record? This will take immediate effect on all active sessions.`
        }
        confirmText="Confirm Change"
        type={activeAction?.action === 'delete' ? 'danger' : 'warning'}
      />

      <GenerateLicenseModal 
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onGenerate={handleCreateKey}
      />
    </div>
  );
}
