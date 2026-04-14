import { useState } from "react";
import { X, Save, Code, Info, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EditVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variables: string) => Promise<void>;
  initialVariables: string;
  licenseKey: string;
}

export default function EditVariablesModal({ isOpen, onClose, onSave, initialVariables, licenseKey }: EditVariablesModalProps) {
  const { t } = useTranslation();
  const [variables, setVariables] = useState(initialVariables);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setError(null);
      // Validate JSON
      JSON.parse(variables);
      
      setIsSaving(true);
      await onSave(variables);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof SyntaxError ? t("licenses.metadata_invalid_json", "Invalid JSON format. Please check your syntax.") : t("licenses.metadata_save_fail", "Failed to save configuration."));
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-secondary w-full max-w-xl rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden shadow-black/50">
        <header className="p-8 border-b border-gray-800 flex justify-between items-center bg-secondary/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <Code className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{t("licenses.metadata_title", "License Metadata")}</h3>
              <p className="text-xs text-gray-400">{t("licenses.metadata_settings", "Settings for")} <span className="text-accent font-bold truncate max-w-[150px] inline-block align-bottom">{licenseKey}</span></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex gap-4">
            <Info className="w-5 h-5 text-accent shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              {t("licenses.metadata_desc", "These variables are returned to the client software during validation. Use JSON format to store feature flags, user roles, or custom configurations.")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="license-config" className="text-[10px] text-gray-500 uppercase font-black px-1">{t("licenses.metadata_json", "JSON Configuration")}</label>
            <textarea
              id="license-config"
              className="w-full h-48 bg-dark/50 border border-gray-800 rounded-3xl p-6 font-mono text-sm text-gray-300 outline-none focus:border-accent transition-all resize-none box-shadow-inner"
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              placeholder='{ "vip": true, "version": "2.0" }'
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold animate-in shake duration-500">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        <footer className="p-8 bg-dark/20 flex gap-3 justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-800 hover:bg-gray-800 rounded-2xl text-gray-400 text-xs font-black transition-all cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 bg-accent hover:brightness-110 rounded-2xl text-white text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-accent/20 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? t("common.saving", "Saving...") : <><Save className="w-4 h-4" /> {t("licenses.metadata_save", "Save Metadata")}</>}
          </button>
        </footer>
      </div>
    </div>
  );
}
