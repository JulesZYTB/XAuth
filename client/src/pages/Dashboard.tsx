import { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  ShieldCheck, 
  Activity as ActivityIcon, 
  Zap, 
  TrendingUp, 
  ChevronRight,
  Terminal,
  Activity
} from "lucide-react";

import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from "recharts";

type Stats = {
  totalUsers: number;
  totalApps: number;
  totalLicenses: number;
  activeLicenses: number;
  trafficData: { date: string, count: number }[];
  recentActivity: { id: number, action: string, details: string, created_at: string, username?: string, app_name?: string }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setStats(data);
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
        <p className="font-black uppercase tracking-widest text-xs">Synchronizing Core Metrics...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Active Licenses", value: stats.activeLicenses, growth: "Live", icon: ShieldCheck, color: "text-accent" },
    { label: "Total Users", value: stats.totalUsers, growth: "+All", icon: Users, color: "text-blue-500" },
    { label: "Total Apps", value: stats.totalApps, growth: "Stable", icon: Zap, color: "text-orange-500" },
    { label: "Requests (Logs)", value: stats.trafficData.reduce((acc, curr) => acc + curr.count, 0), growth: "Total", icon: ActivityIcon, color: "text-green-500" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">System Overview</h2>
          <p className="text-gray-400 mt-1 font-medium">Real-time telemetrics for XAuth Omega infrastructure</p>
        </div>
        <div className="bg-secondary px-6 py-3 rounded-2xl border border-gray-800 flex items-center gap-3">
          <span className="text-[10px] text-gray-500 uppercase font-black">Period:</span>
          <span className="text-sm font-bold text-white">Last 7 Days</span>
          <ChevronRight className="w-4 h-4 text-gray-600" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8">
            <TrendingUp className="w-8 h-8 text-accent/20" />
          </div>
          <div className="mb-10">
            <h3 className="text-xl font-black text-white mb-1">Traffic Analysis</h3>
            <p className="text-sm text-gray-500 font-medium">Daily license validation requests</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trafficData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "16px", border: "1px solid #1e293b", fontSize: "12px", fontWeight: "bold" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-secondary p-10 rounded-[3rem] border border-gray-800 shadow-2xl flex flex-col">
          <h3 className="text-xl font-black text-white mb-8">Live Feed</h3>
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
                <div className="mt-2 flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="w-2 h-2 text-accent" />
                   </div>
                   <span className="text-[9px] text-gray-600 font-bold">@{log.username || "system"}</span>
                </div>
              </div>
            ))}
          </div>
          <button 
            type="button"
            className="w-full mt-8 bg-dark p-4 rounded-2xl border border-gray-800 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            Full Audit Logs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
