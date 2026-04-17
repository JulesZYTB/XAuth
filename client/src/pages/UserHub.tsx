import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Cpu, Calendar, Activity, Key, CreditCard, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../services/apiConfig.js";

type License = {
  id: number;
  license_key: string;
  hwid: string;
  expiry_date: string;
  status: string;
  app_name: string;
};

export default function UserHub() {
  const { t } = useTranslation();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemKey, setRedeemKey] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchMyLicenses = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/my-licenses"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLicenses(data);
      } else {
        setLicenses([]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyLicenses(); }, [fetchMyLicenses]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemStatus(null);
    try {
      const res = await fetch(getApiUrl("/api/licenses/redeem"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}` 
        },
        body: JSON.stringify({ license_key: redeemKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setRedeemStatus({ type: "success", msg: data.message });
        setRedeemKey("");
        fetchMyLicenses();
      } else {
        setRedeemStatus({ type: "error", msg: data.message });
      }
    } catch (err) {
      setRedeemStatus({ type: "error", msg: "Server error occurred" });
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 h-full">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">{t("user_hub.title", "License Hub")}</h2>
          <p className="text-gray-400 mt-1">{t("user_hub.subtitle", "Manage your active software subscriptions and products")}</p>
        </div>
        
        <form onSubmit={handleRedeem} className="w-full md:w-auto flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                type="text"
                placeholder="PRO-XXXX-XXXX-XXXX"
                className="w-full md:w-64 bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent transition-all text-white text-sm font-mono"
                value={redeemKey}
                onChange={(e) => setRedeemKey(e.target.value)}
                required
                aria-label="License activation key"
              />
            </div>
            <button 
              type="submit"
              className="bg-white hover:bg-white/90 text-dark px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" /> {t("user_hub.redeem", "Redeem")}
            </button>
          </div>
          {redeemStatus && (
            <div className={`text-xs font-bold flex items-center gap-2 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 ${redeemStatus.type === "success" ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}>
              {redeemStatus.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {redeemStatus.msg}
            </div>
          )}
        </form>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500" aria-live="polite">
          <Activity className="w-8 h-8 animate-spin mr-3" /> {t("user_hub.loading", "Fetching your software portfolio...")}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {licenses.map((license) => (
            <li 
              key={license.id} 
              className="bg-secondary border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-accent/30 transition-all focus-within:ring-2 focus-within:ring-accent outline-none relative overflow-hidden group list-none"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                  license.status === "active" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}>
                  {license.status}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck className="w-8 h-8 text-accent" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{license.app_name}</h3>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">{t("user_hub.enterprise_license", "Enterprise License")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-dark/50 p-5 rounded-4xl border border-gray-800/50">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-2 opacity-50">{t("user_hub.license_identity", "License Identity")}</p>
                  <code className="text-sm font-mono text-gray-200 block truncate">
                    {license.license_key}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark/30 p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-gray-800 transition-all">
                    <Cpu className="w-4 h-4 text-gray-600" aria-hidden="true" />
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">{t("user_hub.digital_hwid", "Digital HWID")}</p>
                      <p className="text-xs text-gray-300 font-mono truncate w-24">
                        {license.hwid || t("user_hub.not_pooled", "Not Pooled")}
                      </p>
                    </div>
                  </div>
                  <div className="bg-dark/30 p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-gray-800 transition-all">
                    <Calendar className="w-4 h-4 text-gray-600" aria-hidden="true" />
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">{t("user_hub.end_date", "End Date")}</p>
                      <p className="text-xs text-gray-300 font-bold uppercase tracking-tighter">
                        {new Date(license.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 active:scale-[0.98] text-gray-400 group-hover:text-white cursor-pointer"
                aria-label={`View documentation for ${license.app_name}`}
              >
                {t("user_hub.access_docs", "Access Product Docs")}
              </button>
            </li>
          ))}

          {licenses.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-gray-800 rounded-[3rem] py-32 flex flex-col items-center text-gray-600">
              <Key className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-bold">{t("user_hub.no_licenses", "No active licenses found.")}</p>
              <p className="text-sm opacity-50 mt-1">{t("user_hub.redeem_hint", "Redeem a product key above to activate your software.")}</p>
            </div>
          )}
        </ul>
      )}
    </div>
  );
}
