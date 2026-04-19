import { AlertTriangle, Code, Info, Save, X, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface EditVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variables: string) => Promise<void>;
  initialVariables: string;
  licenseKey: string;
}

export default function EditVariablesModal({
  isOpen,
  onClose,
  onSave,
  initialVariables,
  licenseKey,
}: EditVariablesModalProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from JSON string
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>(() => {
    try {
      const obj = JSON.parse(initialVariables || "{}");
      return Object.entries(obj).map(([k, v]) => ({
        key: k,
        value: typeof v === "string" ? v : JSON.stringify(v),
      }));
    } catch {
      return [];
    }
  });

  const handleAddPair = () => {
    setPairs([...pairs, { key: "", value: "" }]);
  };

  const handleRemovePair = (index: number) => {
    setPairs(pairs.filter((_, i) => i !== index));
  };

  const handleChangePair = (
    index: number,
    field: "key" | "value",
    val: string,
  ) => {
    const next = [...pairs];
    next[index][field] = val;
    setPairs(next);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setIsSaving(true);

      // Reconstruct JSON object
      const obj: Record<string, string> = {};
      for (const p of pairs) {
        if (p.key.trim()) {
          obj[p.key.trim()] = p.value;
        }
      }

      await onSave(JSON.stringify(obj));
      onClose();
    } catch (err: unknown) {
      setError(t("licenses.metadata_save_fail", "Failed to save configuration."));
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
              <h3 className="text-xl font-black text-white">
                {t("licenses.metadata_title", "License Metadata")}
              </h3>
              <p className="text-xs text-gray-400">
                {t("licenses.metadata_settings", "Settings for")}{" "}
                <span className="text-accent font-bold truncate max-w-[150px] inline-block align-bottom">
                  {licenseKey}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="bg-accent/5 p-4 rounded-2xl border border-accent/10 flex gap-4">
            <Info className="w-5 h-5 text-accent shrink-0" />
            <p className="text-xs text-gray-400 leading-relaxed">
              {t(
                "licenses.metadata_desc",
                "These variables are returned to the client software during validation. Use JSON format to store feature flags, user roles, or custom configurations.",
              )}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-500 uppercase font-black px-1">
                {t("licenses.metadata_title", "Variables")}
              </label>
              <button
                type="button"
                onClick={handleAddPair}
                className="flex items-center gap-1.5 text-[9px] font-black text-accent uppercase hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" /> {t("licenses.var_add", "Add Variable")}
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {pairs.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600 italic text-xs">
                  Aucune variable configurée.
                </div>
              ) : (
                pairs.map((p, idx) => (
                  <div key={idx} className="flex gap-2 group animate-in slide-in-from-left-2 duration-300">
                    <input
                      type="text"
                      className="flex-1 bg-dark/50 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-accent transition-all"
                      placeholder={t("licenses.var_key", "Key")}
                      value={p.key}
                      onChange={(e) => handleChangePair(idx, "key", e.target.value)}
                    />
                    <input
                      type="text"
                      className="flex-[2] bg-dark/50 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-accent transition-all"
                      placeholder={t("licenses.var_value", "Value")}
                      value={p.value}
                      onChange={(e) => handleChangePair(idx, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePair(idx)}
                      className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
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
            {isSaving ? (
              t("common.saving", "Saving...")
            ) : (
              <>
                <Save className="w-4 h-4" />{" "}
                {t("licenses.metadata_save", "Save Metadata")}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
