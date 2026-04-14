import { useState } from "react";
import { Sparkles, Clock, Hash } from "lucide-react";
import { useTranslation } from "react-i18next";

import Modal from "./Modal";

type GenerateLicenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: { license_key?: string, expiry_date: string }) => void;
};



export default function GenerateLicenseModal({ isOpen, onClose, onGenerate }: GenerateLicenseModalProps) {
  const { t } = useTranslation();

  const DURATION_OPTIONS = [
    { label: t("time.1_hour", "1 Hour"), value: 1 * 60 * 60 * 1000 },
    { label: t("time.1_day", "1 Day"), value: 24 * 60 * 60 * 1000 },
    { label: t("time.7_days", "7 Days"), value: 7 * 24 * 60 * 60 * 1000 },
    { label: t("time.30_days", "30 Days"), value: 30 * 24 * 60 * 60 * 1000 },
    { label: t("time.lifetime", "Lifetime"), value: 3650 * 24 * 60 * 60 * 1000 },
  ];

  const PATTERN_OPTIONS = [
    { label: t("licenses.pattern_standard", "Standard (XXXX-XXXX-XXXX)"), pattern: "XXXX-XXXX-XXXX" },
    { label: t("licenses.pattern_extended", "Extended (XXXXX-XXXXX-XXXXX)"), pattern: "XXXXX-XXXXX-XXXXX" },
    { label: t("licenses.pattern_legacy", "Legacy (XXXX-XXXX)"), pattern: "XXXX-XXXX" },
  ];

  const [duration, setDuration] = useState(DURATION_OPTIONS[3].value);
  const [pattern, setPattern] = useState(PATTERN_OPTIONS[0].pattern);
  const [manualKey, setManualKey] = useState("");

  const generatePatternKey = (pat: string) => {
    return pat.replace(/X/g, () => Math.random().toString(36).charAt(2).toUpperCase());
  };

  const handleGenerate = () => {
    const key = manualKey || generatePatternKey(pattern);
    const expiryDate = new Date(Date.now() + duration).toISOString();
    onGenerate({ license_key: key, expiry_date: expiryDate });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("licenses.forge_title", "Advanced License Forge")}>
      <div className="space-y-8">
        {/* Key Pattern Selection */}
        <div className="space-y-3">
          <label 
            htmlFor="pattern-selector"
            className="text-[10px] text-gray-500 uppercase font-black px-1 flex items-center gap-2"
          >
            <Hash className="w-3 h-3" /> {t("licenses.key_format", "Key Format Architecture")}
          </label>
          <div id="pattern-selector" className="grid grid-cols-1 gap-2">

            {PATTERN_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.pattern}
                onClick={() => { setPattern(opt.pattern); setManualKey(""); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  pattern === opt.pattern && !manualKey
                    ? "bg-accent/10 border-accent/50 text-white" 
                    : "bg-dark/30 border-gray-800 text-gray-500 hover:border-gray-700"
                }`}
              >
                <div className="text-sm font-bold">{opt.label}</div>
                <div className="text-[10px] font-mono opacity-50 mt-1">{opt.pattern}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <label 
            htmlFor="duration-selector"
            className="text-[10px] text-gray-500 uppercase font-black px-1 flex items-center gap-2"
          >
            <Clock className="w-3 h-3" /> {t("licenses.temporal_validity", "Temporal Validity")}
          </label>
          <div id="duration-selector" className="grid grid-cols-3 gap-2">

            {DURATION_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.label}
                onClick={() => setDuration(opt.value)}
                className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase transition-all border cursor-pointer ${
                  duration === opt.value 
                    ? "bg-white text-dark border-white" 
                    : "bg-dark/30 text-gray-500 border-gray-800 hover:border-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <label 
            htmlFor="manual-key-input"
            className="absolute -top-2 left-4 px-2 bg-secondary text-[9px] text-gray-500 uppercase font-black z-10"
          >
            {t("licenses.manual_override", "Manual Override")}
          </label>
          <input
            id="manual-key-input"
            type="text"
            placeholder={t("licenses.leave_blank_auto", "LEAVE BLANK FOR AUTO-GEN")}
            className="w-full bg-dark/50 border border-gray-800 rounded-2xl px-6 py-4 outline-none focus:border-accent text-white font-mono text-sm transition-all"
            value={manualKey}
            onChange={(e) => { setManualKey(e.target.value.toUpperCase()); setPattern(""); }}
          />

        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="w-full bg-accent hover:bg-accent/80 text-white font-black py-5 rounded-4xl shadow-2xl shadow-accent/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
        >
          <Sparkles className="w-5 h-5" /> {t("licenses.init_prod", "Initialize Production")}
        </button>
      </div>
    </Modal>
  );
}
