import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Rocket, Key, User, Command, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { getApiUrl } from "../services/apiConfig.js";

type SearchResult = {
  apps: any[];
  licenses: any[];
  users: any[];
};

export default function Spotlight() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ apps: [], licenses: [], users: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ apps: [], licenses: [], users: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/search?q=${encodeURIComponent(q)}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults({ apps: [], licenses: [], users: [] });
      }
    } catch {
      setResults({ apps: [], licenses: [], users: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-dark/60 animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-secondary border border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex items-center border-b border-gray-800 p-4">
          <Search className="w-5 h-5 text-gray-500 ml-2" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-white text-lg font-medium placeholder:text-gray-600"
            placeholder={t("search.placeholder", "Search for apps, licenses, users...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-2 px-2">
            <span className="text-[10px] bg-dark/50 text-gray-500 font-black px-2 py-1 rounded-lg border border-gray-800">ESC</span>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded-lg text-gray-500">
               <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {!query && (
            <div className="py-20 text-center text-gray-600">
              <Command className="w-12 h-12 mx-auto mb-4 opacity-5" />
              <p className="text-sm font-bold uppercase tracking-widest">{t("search.start_typing", "Quick Access Spotlight")}</p>
              <p className="text-[10px] mt-1 opacity-50 uppercase tracking-widest font-black">Search through your Omega infrastructure</p>
            </div>
          )}

          {loading && <div className="p-8 text-center text-accent animate-pulse font-black text-xs uppercase tracking-widest">Searching...</div>}

          {!loading && query.length >= 2 && (
            <div className="space-y-6">
              {results?.apps?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 px-3">Applications</h4>
                  {results?.apps?.map(app => (
                    <button 
                      key={app.id}
                      onClick={() => navigateTo(`/apps`)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-accent/10 border border-transparent hover:border-accent/20 transition-all text-left group"
                    >
                      <div className="p-2 bg-accent/10 rounded-xl text-accent"><Rocket className="w-4 h-4" /></div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">{app.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {results?.licenses?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 px-3">Licenses</h4>
                  {results?.licenses?.map(lic => (
                    <button 
                      key={lic.id}
                      onClick={() => navigateTo(`/apps/${lic.app_id}/licenses`)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-all text-left group"
                    >
                      <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Key className="w-4 h-4" /></div>
                      <div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white block">{lic.license_key}</span>
                        <span className="text-[10px] text-gray-600 uppercase font-black">{lic.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results?.users?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3 px-3">Users (Admin)</h4>
                  {results?.users?.map(u => (
                    <button 
                      key={u.id}
                      onClick={() => navigateTo(`/users`)}
                      className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-all text-left group"
                    >
                      <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><User className="w-4 h-4" /></div>
                      <div>
                        <span className="text-sm font-bold text-gray-300 group-hover:text-white block">{u.username}</span>
                        <span className="text-[10px] text-gray-600">{u.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {(!results?.apps || results.apps.length === 0) && (!results?.licenses || results.licenses.length === 0) && (!results?.users || results.users.length === 0) && (
                <div className="py-12 text-center text-gray-600 text-xs font-bold uppercase tracking-widest">{t("search.no_results", "No matches found.")}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
