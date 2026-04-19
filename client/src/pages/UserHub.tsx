import {
  Activity,
  Calendar,
  CheckCircle2,
  Cpu,
  CreditCard,
  Key,
  ShieldCheck,
  XCircle,
  FlaskConical,
  Copy,
  Clock
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

type App = {
  id: number;
  name: string;
};

export default function UserHub() {
  const { t } = useTranslation();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemKey, setRedeemKey] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Trial states
  const [apps, setApps] = useState<App[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | "">("");
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialResult, setTrialResult] = useState<{ key: string } | null>(null);

  const fetchMyLicenses = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/my-licenses"), {
        credentials: "include",
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

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/apps"), {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setApps(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchMyLicenses();
    fetchApps();
  }, [fetchMyLicenses, fetchApps]);

  const handleRequestTrial = async () => {
    if (!selectedAppId) return;
    setTrialLoading(true);
    setRedeemStatus(null);
    try {
      const res = await fetch(getApiUrl("/api/licenses/request-trial"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ appId: Number(selectedAppId) }),
      });
      const data = await res.json();
      if (res.ok) {
        setTrialResult({ key: data.license_key });
        fetchMyLicenses();
      } else {
        setRedeemStatus({ type: "error", msg: data.message });
      }
    } catch (err) {
      setRedeemStatus({ type: "error", msg: "Trial request failed" });
    } finally {
      setTrialLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeemStatus(null);
    try {
      const res = await fetch(getApiUrl("/api/licenses/redeem"), {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="w-full">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t("user_hub.title", "License Hub")}
          </h2>
          <p className="text-gray-400 mt-1 text-sm md:text-base">
            {t(
              "user_hub.subtitle",
              "Manage your active software subscriptions and products",
            )}
          </p>
        </div>

        <form
          onSubmit={handleRedeem}
          className="w-full lg:w-auto flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative group flex-1">
              <Key
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="PRO-XXXX-XXXX-XXXX"
                className="w-full lg:w-64 bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent transition-all text-white text-sm font-mono"
                value={redeemKey}
                onChange={(e) => setRedeemKey(e.target.value)}
                required
                aria-label="License activation key"
              />
            </div>
            <button
              type="submit"
              className="bg-white hover:bg-white/90 text-dark px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-5 h-5" />{" "}
              {t("user_hub.redeem", "Redeem")}
            </button>
          </div>
          {redeemStatus && (
            <div
              className={`text-[10px] font-bold flex items-center gap-2 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-top-2 ${redeemStatus.type === "success" ? "text-green-400 bg-green-400/10 border border-green-400/20" : "text-red-400 bg-red-400/10 border border-red-400/20"}`}
            >
              {redeemStatus.type === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {redeemStatus.msg}
            </div>
          )}
        </form>
      </header>

      {/* Trial Request CTA */}
      <section className="bg-accent/5 border border-accent/20 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[1.6] transition-transform duration-1000 hidden sm:block">
            <FlaskConical className="w-40 h-40 text-accent" />
         </div>
         
         <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-8 md:gap-10">
            <div className="w-full xl:max-w-xl text-center xl:text-left">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
                  <Clock className="w-4 h-4 text-accent" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                     {t("user_hub.limited_offer")}
                  </span>
               </div>
               <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                  {t("user_hub.trial_request", "Free 24h Omega Trial")}
               </h3>
               <p className="text-gray-400 text-sm md:text-base font-medium">
                  Experience the full power of our protected software. Generate a one-time trial key locked to your hardware instantly.
               </p>
            </div>

            <div className="w-full sm:w-[400px] space-y-4">
               {trialResult ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl animate-in zoom-in duration-500">
                     <p className="text-[10px] text-green-500 font-black uppercase mb-3">{t("user_hub.trial_success")}</p>
                     <div className="flex items-center justify-between bg-dark/50 p-4 rounded-xl border border-green-500/20 gap-3">
                        <code className="text-white font-mono text-xs sm:text-sm truncate">{trialResult.key}</code>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(trialResult.key);
                            setRedeemStatus({ type: "success", msg: t("common.copied") });
                          }}
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-all flex-shrink-0"
                        >
                           <Copy className="w-4 h-4" />
                        </button>
                     </div>
                     <button 
                       onClick={() => setTrialResult(null)}
                       className="w-full mt-4 text-[10px] text-gray-500 font-black uppercase hover:text-white transition-all cursor-pointer"
                     >
                        Close
                     </button>
                  </div>
               ) : (
                  <div className="space-y-4">
                     <select 
                        value={selectedAppId}
                        onChange={(e) => setSelectedAppId(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-accent transition-all appearance-none cursor-pointer"
                     >
                        <option value="">Select an application...</option>
                        {apps.map(app => (
                           <option key={app.id} value={app.id}>{app.name}</option>
                        ))}
                     </select>
                     <button 
                        onClick={handleRequestTrial}
                        disabled={!selectedAppId || trialLoading}
                        className="w-full bg-accent h-[60px] sm:h-[64px] rounded-2xl text-white text-sm font-black flex items-center justify-center gap-3 shadow-2xl shadow-accent/40 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                     >
                        {trialLoading ? <Activity className="w-5 h-5 animate-spin" /> : <FlaskConical className="w-5 h-5" />}
                        {t("user_hub.trial_request")}
                     </button>
                  </div>
               )}
            </div>
         </div>
      </section>

      {loading ? (
        <div
          className="flex items-center justify-center h-64 text-gray-500"
          aria-live="polite"
        >
          <Activity className="w-8 h-8 animate-spin mr-3" />{" "}
          {t("user_hub.loading", "Fetching your software portfolio...")}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {licenses.map((license) => (
            <li
              key={license.id}
              className="bg-secondary border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl hover:border-accent/30 transition-all focus-within:ring-2 focus-within:ring-accent outline-none relative overflow-hidden group list-none"
            >
              <div className="absolute top-0 right-0 p-8">
                <div
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    license.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}
                >
                  {license.status}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-accent/10 rounded-2xl group-hover:bg-accent/20 transition-colors">
                  <ShieldCheck
                    className="w-8 h-8 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    {license.app_name}
                  </h3>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                    {t("user_hub.enterprise_license", "Enterprise License")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-dark/50 p-5 rounded-4xl border border-gray-800/50">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-2 opacity-50">
                    {t("user_hub.license_identity", "License Identity")}
                  </p>
                  <code className="text-sm font-mono text-gray-200 block truncate">
                    {license.license_key}
                  </code>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark/30 p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-gray-800 transition-all">
                    <Cpu className="w-4 h-4 text-gray-600" aria-hidden="true" />
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">
                        {t("user_hub.digital_hwid", "Digital HWID")}
                      </p>
                      <p className="text-xs text-gray-300 font-mono truncate w-24">
                        {license.hwid || t("user_hub.not_pooled", "Not Pooled")}
                      </p>
                    </div>
                  </div>
                  <div className="bg-dark/30 p-4 rounded-2xl flex items-center gap-3 border border-transparent hover:border-gray-800 transition-all">
                    <Calendar
                      className="w-4 h-4 text-gray-600"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-black">
                        {t("user_hub.end_date", "End Date")}
                      </p>
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
              <p className="text-lg font-bold">
                {t("user_hub.no_licenses", "No active licenses found.")}
              </p>
              <p className="text-sm opacity-50 mt-1">
                {t(
                  "user_hub.redeem_hint",
                  "Redeem a product key above to activate your software.",
                )}
              </p>
            </div>
          )}
        </ul>
      )}
    </div>
  );
}
