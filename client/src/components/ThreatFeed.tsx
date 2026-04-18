import { AlertCircle, ShieldAlert, Terminal, User, FileText, Globe, Activity, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";

type Threat = {
  id: number;
  license_id: number | null;
  app_id: number;
  ip_address: string;
  country: string;
  country_code: string;
  status: string;
  error_type: string | null;
  details?: string | null;
  created_at: string;
  license_key?: string;
  hwid?: string;
  username?: string;
};

interface ThreatFeedProps {
  threats: Threat[];
  onClear?: () => void;
}

export default function ThreatFeed({ threats, onClear }: ThreatFeedProps) {
  const { t } = useTranslation();
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!threats || threats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-600 grayscale opacity-30">
        <ShieldAlert className="w-12 h-12 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest">
          {t("threats.no_threats")}
        </p>
        {onClear && (
            <button
                type="button"
                onClick={() => onClear()}
                className="mt-4 text-[9px] font-black hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
            >
                {t("threats.clear_history")}
            </button>
        )}
      </div>
    );
  }

  const handleClear = () => {
    if (isConfirmingClear) {
      onClear?.();
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
    }
  };

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
      {onClear && (
        <div className="flex justify-end pb-2">
            <button
                type="button"
                onClick={handleClear}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                    isConfirmingClear 
                    ? "bg-red-500/20 text-red-500 border-red-500/50 scale-95" 
                    : "bg-dark/50 text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
                }`}
            >
                {isConfirmingClear ? (
                    <>
                        <AlertCircle className="w-3 h-3" />
                        {t("threats.clear_confirm")}
                    </>
                ) : (
                    <>
                        <Trash2 className="w-3 h-3" />
                        {t("threats.clear_history")}
                    </>
                )}
            </button>
        </div>
      )}
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
              onClick={() => setSelectedThreat(threat)}
              className="text-[9px] font-black text-red-500 uppercase hover:underline cursor-pointer flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              {t("threats.details")}
            </button>
          </div>
        </div>
      ))}

      {/* Threat Detail Modal */}
      <Modal
        isOpen={!!selectedThreat}
        onClose={() => setSelectedThreat(null)}
        title={t("threats.details")}
      >
        {selectedThreat && (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-red-500 font-black uppercase tracking-widest text-xs">
                  {getErrorTypeLabel(selectedThreat.error_type)}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  {new Date(selectedThreat.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{t("dashboard.global_reach")}</span>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[11px] text-white font-bold">{selectedThreat.country} ({selectedThreat.country_code})</span>
                   <span className="text-[10px] font-mono text-gray-500">{selectedThreat.ip_address}</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Activity className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{t("licenses.table_hwid")}</span>
                </div>
                <p className="text-[10px] font-mono text-white bg-dark/50 p-2 rounded-lg border border-white/5 break-all">
                  {selectedThreat.hwid || t("user_hub.not_pooled")}
                </p>
              </div>

               <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-3xl relative overflow-hidden">
                <div className="flex items-center gap-2 text-red-400 mb-3">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Metadata / Payload</span>
                </div>
                <div className="bg-dark/80 p-4 rounded-xl border border-red-500/10 min-h-[100px]">
                  <p className="text-[11px] text-red-200/80 font-mono leading-relaxed whitespace-pre-wrap">
                    {selectedThreat.details || t("threats.no_details_available") || "No detailed telemetry payload provided by the client check instance."}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Activity className="w-12 h-12 text-red-500" />
                </div>
              </div>
            </div>

            <div className="pt-4">
               <button
                type="button"
                onClick={() => setSelectedThreat(null)}
                className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
