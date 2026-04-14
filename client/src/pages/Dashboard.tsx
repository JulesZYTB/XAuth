import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  Users, 
  ShieldCheck, 
  Activity as ActivityIcon, 
  Zap, 
  TrendingUp, 
  ChevronRight,
  Terminal,
  Activity,
  Globe,
  ShieldAlert,
  BarChart3,
  Download
} from "lucide-react";

import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend
} from "recharts";

import WorldMap from "../components/WorldMap";

type Stats = {
  totalUsers: number;
  totalApps: number;
  totalLicenses: number;
  activeLicenses: number;
  trafficData: { date: string, count: number }[];
  recentActivity: { id: number, action: string, details: string, created_at: string, username?: string, app_name?: string }[];
  mapData: { country: string, value: number }[];
  dauData: { date: string, count: number }[];
  anomalyData: { timestamp: string, successes: number, failures: number }[];
};

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };
      
      const [coreRes, mapRes, dauRes, anomalyRes] = await Promise.all([
        fetch("/api/dashboard/stats", { headers }),
        fetch("/api/dashboard/map", { headers }),
        fetch("/api/dashboard/dau", { headers }),
        fetch("/api/dashboard/anomalies", { headers })
      ]);

      const [core, map, dau, anomaly] = await Promise.all([
        coreRes.json(),
        mapRes.json(),
        dauRes.json(),
        anomalyRes.json()
      ]);
      
      setStats({
        ...core,
        mapData: Array.isArray(map) ? map : [],
        dauData: Array.isArray(dau) ? dau : [],
        anomalyData: Array.isArray(anomaly) ? anomaly : []
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500 gap-4">
        <Activity className="w-12 h-12 animate-spin text-accent" />
        <p className="font-black uppercase tracking-widest text-xs">{t("dashboard.syncing", "Synchronizing Core Metrics...")}</p>
      </div>
    );
  }

  const exportReport = () => {
    if (!stats) return;
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xauth_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: t("dashboard.active_licenses", "Active Licenses"), value: stats.activeLicenses, growth: t("dashboard.live", "Live"), icon: ShieldCheck, color: "text-accent" },
    { label: t("dashboard.total_users", "Total Users"), value: stats.totalUsers, growth: t("dashboard.all", "+All"), icon: Users, color: "text-blue-500" },
    { label: t("dashboard.total_apps", "Total Apps"), value: stats.totalApps, growth: t("dashboard.stable", "Stable"), icon: Zap, color: "text-orange-500" },
    { label: t("dashboard.global_reach", "Global Reach"), value: stats.mapData.length, growth: t("dashboard.countries", "Countries"), icon: Globe, color: "text-green-500" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">{t("dashboard.title", "System Overview")}</h2>
          <p className="text-gray-400 mt-1 font-medium">{t("dashboard.subtitle", "Real-time telemetrics for XAuth Omega infrastructure")}</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="bg-secondary px-6 py-3 rounded-2xl border border-gray-800 flex items-center gap-3">
            <span className="text-[10px] text-gray-500 uppercase font-black">{t("dashboard.node_status", "Node Status:")}</span>
            <span className="text-sm font-bold text-green-500 flex items-center gap-1.5">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> {t("dashboard.operational", "Operational")}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </div>
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent px-5 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-accent/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("dashboard.export", "Export Report")}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-secondary p-8 rounded-[2.5rem] border border-gray-800 shadow-xl hover:border-accent/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 rounded-2xl bg-dark/50 border border-gray-800 group-hover:border-accent/20 transition-colors">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/10">
                {stat.growth}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-white tracking-tight">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Analytics Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <WorldMap data={stats.mapData} />
        
        <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-black text-white mb-1">{t("dashboard.retention", "Retention & DAU")}</h3>
              <p className="text-sm text-gray-500 font-medium">{t("dashboard.retention_desc", "Daily Active Users over 30 days")}</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-500 opacity-50" />
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dauData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b", fontSize: "12px" }}
                  itemStyle={{ color: "#3b82f6" }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h3 className="text-xl font-black text-white mb-1">{t("dashboard.anomaly", "Anomaly Detection")}</h3>
              <p className="text-sm text-gray-500 font-medium">{t("dashboard.anomaly_desc", "Tracking failed vs successful validations (Crack Attempts)")}</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-accent rounded-full" />
                 <span className="text-[10px] font-black text-gray-500 uppercase">{t("dashboard.successes", "Successes")}</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-red-500 rounded-full" />
                 <span className="text-[10px] font-black text-gray-500 uppercase">{t("dashboard.failures", "Failures")}</span>
               </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).getHours() + ":00"}
                />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="successes" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSuc)" strokeWidth={2} />
                <Area type="monotone" dataKey="failures" stroke="#ef4444" fillOpacity={1} fill="url(#colorFail)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white">{t("dashboard.live_feed", "Live Feed")}</h3>
            <ActivityIcon className="w-5 h-5 text-accent animate-pulse" />
          </div>
          <div className="space-y-4 flex-1">
            {stats.recentActivity.map((log) => (
              <div key={log.id} className="flex flex-col p-4 bg-dark/50 rounded-2xl border border-gray-800/50 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-black uppercase text-white truncate w-32">{log.action}</span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-bold italic">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium line-clamp-1">{log.details}</p>
                <div className="mt-2 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] text-gray-600 font-bold">@{log.username || "system"}</span>
                   </div>
                   {log.app_name && <span className="text-[8px] bg-accent/5 text-accent/50 px-2 py-0.5 rounded-full border border-accent/10 font-bold">{log.app_name}</span>}
                </div>
              </div>
            ))}
          </div>
          <button 
            type="button"
            className="w-full mt-8 bg-dark p-4 rounded-2xl border border-gray-800 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {t("dashboard.security_auditor", "Security Auditor")} <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
