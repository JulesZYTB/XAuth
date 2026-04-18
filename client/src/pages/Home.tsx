import {
  Activity,
  ArrowRight,
  Globe,
  Key,
  Lock,
  Pause,
  RefreshCcw,
  Rocket,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import PageSEO from "../components/PageSEO";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark text-white font-sans selection:bg-accent selection:text-white relative overflow-hidden">
      <PageSEO title={t("seo.home_title")} />
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse pointer-events-none" />

      {/* Header */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-xl border border-accent/20">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <span className="text-xl font-black tracking-tighter">
            XAuth{" "}
            <span className="text-accent text-[10px] uppercase font-black tracking-widest ml-1">
              Omega
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors cursor-pointer px-4 py-2"
          >
            {t("home.login", "Login")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="bg-accent hover:bg-accent/80 text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
          >
            {t("home.get_started", "Get Started")}{" "}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent text-[10px] font-black uppercase tracking-widest mb-8">
          <Rocket className="w-3 h-3" /> {t("auth.hub_subtitle")}
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-tight">
          {t("home.hero_title", "Unbreakable Protection")} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-500 to-accent bg-[length:200%_auto] animate-gradient">
            {t("home.hero_highlight", "for Your Software.")}
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto font-medium mb-12 leading-relaxed">
          {t(
            "home.hero_desc",
            "XAuth Omega is the ultimate cross-platform enterprise licensing infrastructure. Secure your applications, manage users globally, and prevent unauthorized access effortlessly.",
          )}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full sm:w-auto bg-white text-dark text-sm font-black uppercase tracking-widest px-10 py-6 rounded-2xl shadow-2xl hover:bg-gray-100 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-3"
          >
            <Key className="w-5 h-5 font-bold" />{" "}
            {t("home.start_now", "Start Free Trial")}
          </button>
          <button
            type="button"
            className="w-full sm:w-auto bg-dark/50 border border-gray-800 text-white text-sm font-black uppercase tracking-widest px-10 py-6 rounded-2xl hover:bg-gray-900 transition-all active:scale-95 cursor-pointer"
          >
            {t("home.view_docs", "View Documentation")}
          </button>
        </div>
      </main>

      {/* Primary Features Showcase */}
      <section className="bg-secondary/30 py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark/50 p-10 rounded-[3rem] border border-gray-800 hover:border-accent/40 transition-all shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck className="w-32 h-32 text-accent" />
              </div>
              <div className="p-4 bg-accent/10 w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-black mb-4">
                {t("home.feature1_title")}
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {t("home.feature1_desc")}
              </p>
            </div>

            <div className="bg-dark/50 p-10 rounded-[3rem] border border-gray-800 hover:border-blue-500/40 transition-all shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-32 h-32 text-blue-500" />
              </div>
              <div className="p-4 bg-blue-500/10 w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-black mb-4">
                {t("home.feature2_title")}
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {t("home.feature2_desc")}
              </p>
            </div>

            <div className="bg-dark/50 p-10 rounded-[3rem] border border-gray-800 hover:border-green-500/40 transition-all shadow-2xl group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-32 h-32 text-green-500" />
              </div>
              <div className="p-4 bg-green-500/10 w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-black mb-4">
                {t("home.feature3_title")}
              </h3>
              <p className="text-gray-500 leading-relaxed font-medium">
                {t("home.feature3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* A to Z Features Deep-Dive */}
      <section className="py-32 bg-dark">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                {t("home.advanced_title")}
              </h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">
                {t("home.advanced_subtitle")}
              </p>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Protocol: Omega-V3
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-8 bg-secondary/20 border border-gray-800/50 rounded-[2.5rem] hover:bg-secondary/40 transition-all">
              <Pause className="w-6 h-6 text-orange-500 mb-6" />
              <h4 className="text-lg font-black mb-3">
                {t("home.kill_switch_title")}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("home.kill_switch_desc")}
              </p>
            </div>

            <div className="p-8 bg-secondary/20 border border-gray-800/50 rounded-[2.5rem] hover:bg-secondary/40 transition-all">
              <ShieldAlert className="w-6 h-6 text-red-500 mb-6" />
              <h4 className="text-lg font-black mb-3">
                {t("home.banning_title")}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("home.banning_desc")}
              </p>
            </div>

            <div className="p-8 bg-secondary/20 border border-gray-800/50 rounded-[2.5rem] hover:bg-secondary/40 transition-all">
              <RefreshCcw className="w-6 h-6 text-accent mb-6" />
              <h4 className="text-lg font-black mb-3">
                {t("home.hwid_title")}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("home.hwid_desc")}
              </p>
            </div>

            <div className="p-8 bg-secondary/20 border border-gray-800/50 rounded-[2.5rem] hover:bg-secondary/40 transition-all">
              <RefreshCcw className="w-6 h-6 text-blue-500 mb-6" />
              <h4 className="text-lg font-black mb-3">
                {t("home.regen_title")}
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t("home.regen_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Security Protocol */}
      <section className="py-32 bg-secondary/20 border-y border-gray-800/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
              {t("home.security_title")}
            </h2>
            <p className="text-gray-500 text-lg font-medium">
              {t("home.security_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-dark/80 p-12 rounded-[3.5rem] border border-gray-800 shadow-2xl relative group">
              <div className="flex items-center gap-6 mb-10">
                <div className="p-4 bg-accent/10 rounded-2xl">
                  <Search className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h4 className="text-2xl font-black">
                    {t("home.auditor_title")}
                  </h4>
                  <p className="text-accent text-[10px] uppercase font-black tracking-widest mt-1">
                    AI-Driven Intelligence
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-10 max-w-xl">
                {t("home.auditor_desc")}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-800/50 rounded-2xl border border-gray-700/50 flex items-center justify-center"
                  >
                    <div className="w-12 h-2 bg-gray-700 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-10">
              <div className="bg-accent/5 p-10 rounded-[3rem] border border-accent/20 flex-1 group hover:bg-accent/10 transition-all">
                <div className="p-4 bg-accent/20 w-fit rounded-2xl mb-6">
                  <Activity className="w-6 h-6 text-accent" />
                </div>
                <h4 className="text-xl font-black mb-4">
                  {t("home.threat_title")}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t("home.threat_desc")}
                </p>
              </div>

              <div className="bg-blue-500/5 p-10 rounded-[3rem] border border-blue-500/20 flex-1 group hover:bg-blue-500/10 transition-all">
                <div className="p-4 bg-blue-500/20 w-fit rounded-2xl mb-6">
                  <Lock className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="text-xl font-black mb-4">
                  {t("home.protocol_title")}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t("home.protocol_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-dark text-center border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="p-2 bg-accent/20 rounded-xl border border-accent/20">
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xl font-black tracking-tighter">XAuth</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            <button
              onClick={() => navigate("/login")}
              className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
            >
              {t("home.login")}
            </button>
            <button
              onClick={() => navigate("/docs")}
              className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
            >
              {t("home.view_docs")}
            </button>
            <button className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer">
              Privacy Policy
            </button>
            <button className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer">
              Terms of Service
            </button>
          </div>
          <p className="text-[9px] text-gray-700 font-medium tracking-[0.5em] uppercase">
            {atob("Q29weVJpZ2h0IFhBdXRoIGRldiBieSBCbG91bWUgU0FT")}
          </p>
        </div>
      </footer>
    </div>
  );
}
