import { useState, useEffect, useCallback } from "react";
import { Activity, Clock, Globe, Monitor, Box, User, Terminal } from "lucide-react";

type AuditLog = {
  id: number;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  app_name?: string;
  username?: string;
};

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl font-black text-white tracking-tight">Audit Trail</h2>
        <p className="text-gray-400 mt-1">Real-time system activity and security events</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <Activity className="w-8 h-8 animate-spin mr-3" /> Analyzing system events...
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {logs.map((log) => (
            <article 
              key={log.id} 
              className="bg-secondary border border-gray-800 rounded-3xl p-6 hover:border-accent/20 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-dark/50 flex items-center justify-center shrink-0 border border-gray-800 group-hover:border-accent/30 transition-colors">
                    <Terminal className="w-5 h-5 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-black text-white uppercase tracking-widest">{log.action}</span>
                      <span className="text-[10px] bg-dark px-2 py-0.5 rounded-full text-gray-500 border border-gray-800 font-bold">
                        #{log.id}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">{log.details}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 shrink-0">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-3 h-3" aria-hidden="true" />
                    {log.ip_address}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-gray-800/50">
                {log.username && (
                  <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 text-[10px] font-bold text-gray-300">
                    <User className="w-3 h-3 text-accent" aria-hidden="true" />
                    {log.username}
                  </div>
                )}
                {log.app_name && (
                  <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 text-[10px] font-bold text-gray-300">
                    <Box className="w-3 h-3 text-accent" aria-hidden="true" />
                    {log.app_name}
                  </div>
                )}
                <div className="bg-dark/50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-gray-800 grow md:grow-0 text-[9px] font-medium text-gray-500">
                  <Monitor className="w-3 h-3 text-gray-600" aria-hidden="true" />
                  <span className="truncate max-w-[200px]" title={log.user_agent}>
                    {log.user_agent}
                  </span>
                </div>
              </div>
            </article>
          ))}

          {logs.length === 0 && (
            <div className="text-center py-20 bg-dark/20 rounded-[3rem] border-2 border-dashed border-gray-800">
              <Activity className="w-12 h-12 mx-auto text-gray-800 mb-4" />
              <p className="text-gray-500 font-medium">No activity logs found yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
