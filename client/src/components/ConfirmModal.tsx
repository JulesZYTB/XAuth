import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

type ConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: "danger" | "warning" | "info";
};

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm Action",
  type = "danger"
}: ConfirmModalProps) {
  
  const colors = {
    danger: "text-red-500 bg-red-500/10 border-red-500/20",
    warning: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    info: "text-accent bg-accent/10 border-accent/20"
  };

  const btnColors = {
    danger: "bg-red-500 hover:bg-red-600 shadow-red-500/20",
    warning: "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20",
    info: "bg-accent hover:bg-accent/80 shadow-accent/20"
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className={`flex items-start gap-4 p-4 rounded-3xl border ${colors[type]}`}>
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-4 rounded-2xl bg-dark border border-gray-800 text-gray-400 font-bold hover:text-white hover:bg-white/5 transition-all outline-none focus:ring-2 focus:ring-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-6 py-4 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 outline-none focus:ring-4 focus:ring-white/10 ${btnColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
