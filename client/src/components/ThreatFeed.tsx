import { AlertCircle, ShieldAlert, Terminal, User } from "lucide-react";
import { useTranslation } from "react-i18next";

type Threat = {
  id: number;
  license_id: number | null;
  app_id: number;
  ip_address: string;
  country: string;
  country_code: string;
  status: string;
  error_type: string | null;
  created_at: string;
  license_key?: string;
  username?: string;
};

interface ThreatFeedProps {
  threats: Threat[];
}

export default function ThreatFeed({ threats }: ThreatFeedProps) {
  const { t } = useTranslation();

  if (!threats || threats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-600 grayscale opacity-30">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">
          {t("threats.no_threats")}
        </p>
      </div>
    );
  }

  const getErrorTypeLabel = (type: string | null) => {
    if (!type) return t("threats.suspicious");
    switch (type) {
      case "UNAUTHORIZED_APP":
        return t("threats.pattern_secret");
      case "HWID_MISMATCH":
        return t("threats.pattern_hwid");
      case "BYPASS_DETECTED":
      case "DEBUGGER_DETECTED":
        return t("threats.pattern_toolkit");
      default:
        return type.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-4">
      {threats.map((threat) => (
        <div
          key={threat.id}
          className="relative overflow-hidden bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 p-5 rounded-2xl transition-all group animate-pulse-slow"
        >
          {/* Accent Line */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40" />

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block">
                  {getErrorTypeLabel(threat.error_type)}
                </span>
                <span className="text-[9px] text-gray-500 font-bold uppercase italic">
                  {new Date(threat.created_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-dark/50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-800 font-mono">
                {threat.ip_address}
              </span>
              <img
                src={`https://flagcdn.com/w20/${threat.country_code.toLowerCase()}.png`}
                alt={threat.country}
                className="w-4 h-3 opacity-60 rounded-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
              <User className="w-3 h-3" />
              <span className="truncate">
                {threat.username || t("threats.anonymous")}
              </span>
            </div>
            {threat.license_key && (
              <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                <Terminal className="w-3 h-3" />
                <span className="font-mono truncate">
                  {threat.license_key.substring(0, 10)}...
                </span>
              </div>
            )}
          </div>

          {/* Cyber Warning Text */}
          <div className="mt-4 pt-3 border-t border-red-500/5 flex items-center justify-between">
            <p className="text-[9px] font-black text-red-500/40 uppercase tracking-tighter">
              {t("threats.pattern_label")}{" "}
              {getErrorTypeLabel(threat.error_type)}
            </p>
            <button
              type="button"
              className="text-[9px] font-black text-red-500 uppercase hover:underline cursor-pointer"
            >
              {t("threats.details")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
