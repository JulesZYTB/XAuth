import { 
  Book, 
  Terminal, 
  ShieldCheck, 
  Key, 
  Zap, 
  Lock, 
  Code2, 
  ExternalLink,
  ChevronRight
} from "lucide-react";

import { useTranslation } from "react-i18next";

export default function Docs() {
  const { t } = useTranslation();

  const GITHUB_URL = "https://github.com/JulesZYTB/XAuth";

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Book className="w-6 h-6 text-accent" />
          <h2 className="text-3xl font-black text-white tracking-tight">{t("docs.title")}</h2>
        </div>
        <p className="text-gray-400 font-medium">{t("docs.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Getting Started */}
          <section className="bg-secondary/50 border border-gray-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-24 h-24 text-accent" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-sm">1</span>
              {t("docs.getting_started")}
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">{t("docs.gs_desc")}</p>
              <ul className="space-y-3">
                {[t("docs.step1"), t("docs.step2"), t("docs.step3")].map((step, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-300">
                    <ChevronRight className="w-4 h-4 text-accent" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Protocol Architecture */}
          <section className="space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <Terminal className="w-6 h-6 text-accent" />
              {t("docs.protocol_arch")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark/40 border border-gray-800 p-6 rounded-3xl hover:border-accent/40 transition-colors">
                <h4 className="font-black text-accent text-xs uppercase tracking-widest mb-3">{t("docs.handshake")}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t("docs.handshake_desc")}</p>
              </div>
              <div className="bg-dark/40 border border-gray-800 p-6 rounded-3xl hover:border-accent/40 transition-colors">
                <h4 className="font-black text-accent text-xs uppercase tracking-widest mb-3">{t("docs.validation")}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{t("docs.validation_desc")}</p>
              </div>
            </div>
          </section>

          {/* Code Examples Section */}
          <section className="bg-accent/5 border border-accent/20 rounded-[2.5rem] p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-3">
                  <Code2 className="w-6 h-6 text-accent" />
                  {t("docs.examples_title")}
                </h3>
                <p className="text-gray-400 text-sm">{t("docs.examples_desc")}</p>
              </div>
              <a 
                href={GITHUB_URL} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-black text-xs hover:bg-accent hover:text-white transition-all whitespace-nowrap"
              >
                <Code2 className="w-4 h-4" />
                {t("docs.view_on_github")}

                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {['Python', 'NodeJS', 'PHP', 'Go'].map(lang => (
                <div key={lang} className="bg-dark/60 py-4 rounded-2xl border border-gray-800 text-center text-xs font-bold text-gray-500 hover:text-accent transition-colors">
                  {lang}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar / Security Info */}
        <div className="space-y-8">
          <section className="bg-secondary/30 border border-gray-800 rounded-3xl p-6">
            <h3 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-accent" />
              {t("docs.security_tips")}
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1">
                  < Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-300 mb-1 uppercase tracking-wider">Obfuscation</h4>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{t("docs.tip_obfuscation")}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-300 mb-1 uppercase tracking-wider">Encryption</h4>
                  <p className="text-gray-500 text-[11px] leading-relaxed">{t("docs.tip_secrets")}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="mt-1">
                  <Key className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-300 mb-1 uppercase tracking-wider">Session Nonce</h4>
                  <p className="text-gray-500 text-[11px] leading-relaxed"> Handshake requires a dynamic session nonce combined with your APP_SECRET.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="p-8 rounded-[2rem] bg-linear-to-br from-accent to-purple-600 shadow-2xl shadow-accent/20 relative overflow-hidden group">
            <div className="absolute -bottom-6 -right-6 opacity-20 rotate-12 group-hover:scale-125 transition-transform duration-700">
               <ShieldCheck className="w-32 h-32 text-white" />
            </div>
            <h4 className="text-white font-black text-lg leading-tight mb-2">Need Help?</h4>
            <p className="text-white/70 text-xs font-bold mb-4">Join our developer community to get expert support for your integration.</p>
            <button className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
              Join Discord
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
