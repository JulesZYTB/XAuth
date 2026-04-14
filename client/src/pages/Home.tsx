import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Zap, Globe, Key, ArrowRight, Activity } from "lucide-react";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-accent selection:text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />

      {/* Header */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-xl border border-accent/20">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <span className="text-xl font-black tracking-tighter">XAuth <span className="text-accent text-[10px] uppercase font-black tracking-widest ml-1">Omega</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer px-4 py-2"
          >
            {t("home.login", "Login")}
          </button>
          <button 
            onClick={() => navigate("/register")}
            className="bg-accent hover:bg-accent/80 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {t("home.get_started", "Get Started")} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-tight">
          {t("home.hero_title", "Unbreakable Protection")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">
            {t("home.hero_highlight", "for Your Software.")}
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
          {t("home.hero_desc", "XAuth Omega is the ultimate cross-platform enterprise licensing infrastructure. Secure your applications, manage users globally, and prevent unauthorized access effortlessly.")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate("/register")}
            className="w-full sm:w-auto bg-white text-dark text-sm font-black uppercase tracking-widest px-8 py-5 rounded-2xl shadow-2xl hover:bg-gray-100 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <Key className="w-5 h-5" /> {t("home.start_now", "Start Free Trial")}
          </button>
          <button 
            className="w-full sm:w-auto bg-dark/50 border border-gray-800 text-white text-sm font-black uppercase tracking-widest px-8 py-5 rounded-2xl hover:bg-gray-900 transition-transform active:scale-95 cursor-pointer"
          >
            {t("home.view_docs", "View Documentation")}
          </button>
        </div>
      </main>

      {/* Features Showcase */}
      <section className="bg-secondary/50 border-t border-gray-800/50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">{t("home.features_title", "Enterprise-Grade Telemetry")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium">{t("home.features_subtitle", "Everything you need to successfully distribute and protect your code.")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark/50 p-8 rounded-[2.5rem] border border-gray-800 hover:border-accent/40 transition-colors shadow-xl group">
              <div className="p-4 bg-accent/10 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-black mb-2">{t("home.feature1_title", "Military-Grade AES GCM")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t("home.feature1_desc", "Fully encrypted handshake sessions ensuring your software logic is protected with dynamic nonces.")}
              </p>
            </div>
            <div className="bg-dark/50 p-8 rounded-[2.5rem] border border-gray-800 hover:border-blue-500/40 transition-colors shadow-xl group">
              <div className="p-4 bg-blue-500/10 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-black mb-2">{t("home.feature2_title", "Cross-Platform HWID")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t("home.feature2_desc", "Reliable device tracking across Windows, Linux, and macOS prevents unauthorized sharing of licenses.")}
              </p>
            </div>
            <div className="bg-dark/50 p-8 rounded-[2.5rem] border border-gray-800 hover:border-green-500/40 transition-colors shadow-xl group">
              <div className="p-4 bg-green-500/10 w-fit rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-black mb-2">{t("home.feature3_title", "Real-Time Telemetry")}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {t("home.feature3_desc", "Monitor Daily Active Users, Anomaly tracking (cracking attempts), and global map distributions live.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center bg-dark">
        <p className="text-[10px] text-gray-600 font-medium tracking-[0.3em] uppercase">
          {atob("Q29weVJpZ2h0IFhBdXRoIGRldiBieSBCbG91bWUgU0FT")}
        </p>
      </footer>
    </div>
  );
}
