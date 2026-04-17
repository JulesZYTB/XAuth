import { useState, useEffect } from "react";
import { X, ShieldAlert, Activity, Search, AlertTriangle, Key, Ban } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../services/apiConfig.js";

interface AuditorData {
  suspiciousIPs: { ip: string, failedAttempts: number, lastAttempt: string }[];
  sharedKeys: { id: number, licenseKey: string, countriesCount: number, ipsCount: number, countries: string }[];
}

interface SecurityAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityAuditorModal({ isOpen, onClose }: SecurityAuditorModalProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<AuditorData | null>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      startScan();
    } else {
      setData(null);
      setProgress(0);
      setScanning(false);
    }
  }, [isOpen]);

  const startScan = async () => {
    setScanning(true);
    setProgress(0);
    setData(null);

    // Fake animation for style
    for (let i = 0; i <= 100; i += Math.floor(Math.random() * 10) + 5) {
      setProgress(Math.min(i, 99));
      await new Promise(r => setTimeout(r, 150));
    }

    try {
      const res = await fetch(getApiUrl("/api/dashboard/auditor-scan"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setProgress(100);
      setTimeout(() => setScanning(false), 500);
    }
  };

  const handleBanLicense = async (id: number) => {
    try {
        await fetch(getApiUrl(`/api/licenses/${id}/ban`), {
            method: "PATCH",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        startScan();
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-secondary w-full max-w-4xl rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden shadow-black/80 flex flex-col h-[80vh]">
        <header className="p-8 border-b border-gray-800 flex justify-between items-center bg-secondary/80 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">{t("dashboard.auditor_title", "Security Auditor")}</h3>
              <p className="text-xs text-gray-400 font-medium">{t("dashboard.auditor_subtitle", "Automated threat detection and anomalies scan")}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-3 hover:bg-gray-800 rounded-2xl transition-all text-gray-500 hover:text-white cursor-pointer select-none">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          {scanning ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Search className="w-16 h-16 text-accent animate-ping absolute opacity-20" />
                <Search className="w-16 h-16 text-accent relative z-10" />
              </div>
              <h4 className="text-white font-black text-xl tracking-widest uppercase">{t("dashboard.auditor_scanning", "Scanning Database")}</h4>
              <div className="w-64 h-2 bg-dark rounded-full overflow-hidden border border-gray-800">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 font-mono">{progress}% Complete...</p>
            </div>
          ) : data ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              <section className="bg-dark/30 rounded-3xl border border-gray-800/50 overflow-hidden">
                <div className="p-6 border-b border-gray-800/50 flex items-center gap-3 bg-red-500/5">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h4 className="text-white font-black">{t("dashboard.auditor_ips", "Suspicious IP Addresses")}</h4>
                  <span className="ml-auto bg-red-500/20 text-red-500 text-[10px] font-black px-2 py-1 rounded-lg">
                    {data.suspiciousIPs.length} {t("dashboard.auditor_found", "Found")}
                  </span>
                </div>
                <div className="p-0 overflow-x-auto">
                  {data.suspiciousIPs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium">{t("dashboard.auditor_no_ips", "No brute-force or massive failed attempts detected recently.")}</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-dark/50">
                        <tr>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">IP Address</th>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">Failed Attempts (7d)</th>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">Last Attempt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {data.suspiciousIPs.map((ip, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-gray-300 select-all">{ip.ip}</td>
                            <td className="px-6 py-4 text-red-400 font-black">{ip.failedAttempts}</td>
                            <td className="px-6 py-4 text-gray-500 text-xs">{new Date(ip.lastAttempt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="bg-dark/30 rounded-3xl border border-gray-800/50 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-800/50 flex items-center gap-3 bg-orange-500/5">
                  <Key className="w-5 h-5 text-orange-500" />
                  <h4 className="text-white font-black">{t("dashboard.auditor_keys", "Potentially Shared Keys")}</h4>
                  <span className="ml-auto bg-orange-500/20 text-orange-500 text-[10px] font-black px-2 py-1 rounded-lg">
                    {data.sharedKeys.length} {t("dashboard.auditor_found", "Found")}
                  </span>
                </div>
                <div className="p-0 overflow-x-auto">
                  {data.sharedKeys.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm font-medium">{t("dashboard.auditor_no_keys", "No suspicious license sharing detected (Based on unique countries/IPs per key).")}</div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-dark/50">
                        <tr>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">License Key</th>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">Unique IPs</th>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black">Countries</th>
                          <th className="px-6 py-3 text-[10px] text-gray-500 uppercase font-black text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/50">
                        {data.sharedKeys.map((key, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-mono text-sm text-gray-300 truncate max-w-[200px]" title={key.licenseKey}>{key.licenseKey}</td>
                            <td className="px-6 py-4 text-orange-400 font-black">{key.ipsCount}</td>
                            <td className="px-6 py-4 text-gray-400 text-xs font-mono">{key.countries}</td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleBanLicense(key.id)}
                                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                  title={t("licenses.ban_key", "Ban Key")}
                                >
                                  <span className="flex items-center gap-1"><Ban className="w-3 h-3" /> {t("licenses.ban_key", "Ban Key")}</span>
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

            </div>
          ) : null}
        </div>

        <footer className="p-6 bg-dark/50 border-t border-gray-800 flex justify-between items-center shrink-0">
            {data && (
                <span className="text-xs text-gray-500 font-medium ml-4">
                  {t("dashboard.auditor_completed", "Scan completed. {{count}} potential issues found.", { count: data.suspiciousIPs.length + data.sharedKeys.length })}
                </span>
            )}
            <button 
              type="button"
              onClick={startScan}
              disabled={scanning}
              className={`px-8 py-3 bg-accent hover:brightness-110 rounded-2xl text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xl shadow-accent/20 ml-auto ${scanning ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Activity className="w-4 h-4" /> {t("dashboard.auditor_rescan", "Run New Scan")}
            </button>
        </footer>
      </div>
    </div>
  );
}
