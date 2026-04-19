import { X } from "lucide-react";
import { useEffect, useRef } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/80 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="bg-secondary border border-gray-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-50" />

        <header className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-800/50 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 sm:p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
