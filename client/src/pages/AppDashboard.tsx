import {
  Activity,
  BarChart3,
  ChevronLeft,
  Flame,
  Globe,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Users,
  Trash2,
  UserPlus
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SecurityAuditorModal from "../components/SecurityAuditorModal";
import ThreatFeed from "../components/ThreatFeed";
import WorldMap from "../components/WorldMap";
import { getApiUrl } from "../services/apiConfig.js";

type Stats = {
  totalUsers: number;
  totalApps: number;
  totalLicenses: number;
  activeLicenses: number;
  trafficData: { date: string; count: number }[];
  recentActivity: {
    id: number;
    action: string;
    details: string;
    created_at: string;
    username?: string;
    app_name?: string;
  }[];
  mapData: { country: string; value: number }[];
  dauData: { date: string; count: number }[];
  anomalyData: { timestamp: string; successes: number; failures: number }[];
  recentThreats: any[];
};

type Reseller = {
  user_id: number;
  app_id: number;
  username: string;
  email: string;
  key_quota: number;
  keys_generated: number;
};

export default function AppDashboard() {
  const { t } = useTranslation();
  const { appId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuditorOpen, setIsAuditorOpen] = useState(false);
  
  // Reseller states
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [newResellerEmail, setNewResellerEmail] = useState("");
  const [newResellerQuota, setNewResellerQuota] = useState(10);
  const [resellerLoading, setResellerLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      const base = `/api/apps/${appId}/dashboard`;

      const [coreRes, mapRes, dauRes, anomalyRes] = await Promise.all([
        fetch(getApiUrl(`${base}/stats`), { credentials: "include", headers }),
        fetch(getApiUrl(`${base}/map`), { credentials: "include", headers }),
        fetch(getApiUrl(`${base}/dau`), { credentials: "include", headers }),
        fetch(getApiUrl(`${base}/anomalies`), {
          credentials: "include",
          headers,
        }),
      ]);

      const [core, map, dau, anomaly] = await Promise.all([
        coreRes.ok ? coreRes.json() : null,
        mapRes.ok ? mapRes.json() : [],
        dauRes.ok ? dauRes.json() : [],
        anomalyRes.ok ? anomalyRes.json() : [],
      ]);

      if (core) {
        setStats({
          ...core,
          mapData: Array.isArray(map) ? map : [],
          dauData: Array.isArray(dau) ? dau : [],
          anomalyData: Array.isArray(anomaly) ? anomaly : [],
          recentThreats: Array.isArray(core.recentThreats)
            ? core.recentThreats
            : [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  const fetchResellers = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl(`/api/apps/${appId}/resellers`), {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setResellers(data);
    } catch (err) {
      console.error(err);
    }
  }, [appId]);

  useEffect(() => {
    fetchStats();
    fetchResellers();
  }, [fetchStats, fetchResellers]);

  const handleAddReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    setResellerLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/resellers"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          appId: Number(appId),
          email: newResellerEmail,
          keyQuota: newResellerQuota,
        }),
      });

      if (res.ok) {
        setNewResellerEmail("");
        fetchResellers();
      } else {
        const data = await res.json();
        alert(data.message || "Error adding reseller");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResellerLoading(false);
    }
  };

  const handleRemoveReseller = async (userId: number) => {
    try {
      await fetch(getApiUrl(`/api/apps/${appId}/resellers/${userId}`), {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchResellers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearThreats = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
      const res = await fetch(getApiUrl(`/api/apps/${appId}/dashboard/threats`), {
        method: "DELETE",
        credentials: "include",
        headers,
      });

      if (res.ok) {
        setStats((prev) => prev ? { ...prev, recentThreats: [] } : null);
      }
    } catch (err) {
      console.error("Failed to clear threat logs:", err);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500 gap-4">
        <Activity className="w-12 h-12 animate-spin text-accent" />
        <p className="font-black uppercase tracking-widest text-xs">
          {t("dashboard.isolating_metrics")}
        </p>
      </div>
    );
  }

  const statCards = [
    {
      label: t("dashboard.active_licenses", "Active Licenses"),
      value: stats.activeLicenses,
      growth: "App",
      icon: ShieldCheck,
      color: "text-accent",
    },
    {
      label: t("dashboard.total_users", "App Users"),
      value: stats.totalUsers,
      growth: "Live",
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: t("dashboard.managed_keys"),
      value: stats.totalLicenses,
      growth: "DB",
      icon: Rocket,
      color: "text-orange-500",
    },
    {
      label: t("dashboard.app_reach"),
      value: stats.mapData.length,
      growth: "Countries",
      icon: Globe,
      color: "text-green-500",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/apps")}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm mb-4 font-bold outline-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />{" "}
            {t("licenses.back_to_apps", "Back to Apps")}
          </button>
          <h2 className="text-4xl font-black text-white tracking-tighter">
            App Insights
          </h2>
          <p className="text-gray-400 mt-1 font-medium">
            Deep analytics for Application #{appId}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-secondary p-8 rounded-[2.5rem] border border-gray-800 shadow-xl hover:border-accent/30 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-dark/50 border border-gray-800 group-hover:border-accent/20 transition-colors">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/10">
                {stat.growth}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
              {stat.label}
            </p>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WorldMap data={stats.mapData} />
        <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden text-center flex flex-col items-center justify-center">
          <BarChart3 className="w-16 h-16 text-accent/20 mb-4" />
          <h3 className="text-lg font-black text-white mb-2">
            Detailed App Stats
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            Specific user retention and activity for this application only.
          </p>
        </div>
      </div>

      {/* Reseller Management Section */}
      <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
           <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20">
              <Users className="w-6 h-6 text-orange-500" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-white">{t("apps.resellers_title", "Reseller Management")}</h3>
              <p className="text-sm text-gray-500 font-medium">Assign third-party key generation quotas</p>
           </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
           {/* Add Reseller Form */}
           <form onSubmit={handleAddReseller} className="bg-dark/20 p-8 rounded-4xl border border-gray-800/50 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 uppercase font-black px-1">{t("apps.reseller_email")}</label>
                 <input 
                   type="email" 
                   required
                   className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-orange-500 transition-all"
                   placeholder="reseller@partner.com"
                   value={newResellerEmail}
                   onChange={(e) => setNewResellerEmail(e.target.value)}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] text-gray-500 uppercase font-black px-1">{t("apps.reseller_quota")}</label>
                 <input 
                   type="number" 
                   required
                   min="1"
                   className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-orange-500 transition-all font-mono"
                   value={newResellerQuota}
                   onChange={(e) => setNewResellerQuota(Number(e.target.value))}
                 />
              </div>
              <button 
                type="submit" 
                disabled={resellerLoading}
                className="w-full bg-orange-600 h-[60px] rounded-3xl text-white text-sm font-black flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-5 h-5" /> {t("apps.reseller_add")}
              </button>
           </form>

           {/* Resellers List */}
           <div className="xl:col-span-2 space-y-4">
              {resellers.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-4xl py-12 text-gray-600 italic">
                    {t("apps.reseller_empty")}
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {resellers.map((r) => (
                      <div key={r.user_id} className="bg-dark/30 border border-gray-800 rounded-3xl p-6 flex justify-between items-center group">
                         <div>
                            <p className="text-white font-black">{r.username}</p>
                            <p className="text-[10px] text-gray-500 font-medium mb-3">{r.email}</p>
                            <div className="flex items-center gap-3">
                               <div className="h-1.5 w-24 bg-dark/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-orange-500 rounded-full" 
                                    style={{ width: `${Math.min((r.keys_generated / r.key_quota) * 100, 100)}%` }} 
                                  />
                               </div>
                               <span className="text-[10px] font-black text-orange-500 uppercase">
                                  {r.keys_generated} / {r.key_quota}
                               </span>
                            </div>
                         </div>
                         <button 
                           type="button"
                           onClick={() => handleRemoveReseller(r.user_id)}
                           className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 cursor-pointer"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Flame className="w-40 h-40 text-red-500" />
          </div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white">
                {t("dashboard.threat_intel", "Threat Intelligence")}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                  {t("dashboard.active_threats", "Live Bypass Attempts")}
                </span>
              </div>
            </div>
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div className="flex-1 relative z-10">
            <ThreatFeed threats={stats.recentThreats} onClear={handleClearThreats} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-black text-white mb-1">
                Anomaly Detection
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Crack attempts specific to this application
              </p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.anomalyData}>
                <defs>
                  <linearGradient id="colorSuc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1e293b"
                  vertical={false}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke="#64748b"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${new Date(val).getHours()}:00`}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "16px",
                    border: "1px solid #1e293b",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="successes"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorSuc)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorFail)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <SecurityAuditorModal
        isOpen={isAuditorOpen}
        onClose={() => setIsAuditorOpen(false)}
        appId={Number(appId)}
      />
    </div>
  );
}
