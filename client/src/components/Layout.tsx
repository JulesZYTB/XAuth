import {
  Book,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Rocket,
  ShieldCheck,
  Terminal,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

import { useTranslation } from "react-i18next";
import Spotlight from "./Spotlight";

export default function Layout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{
    id: number;
    username: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser(decoded);
    } catch (e) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    // Close sidebar on route change for mobile
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuItems = [
    {
      label:
        user?.role === "admin"
          ? t("menu.global_dashboard", "Global Dashboard")
          : t("menu.my_licenses", "My Licenses"),
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["admin", "user"],
    },
    {
      label: t("menu.applications", "Applications"),
      icon: Rocket,
      path: "/apps",
      roles: ["admin", "user"],
    },
    {
      label: t("menu.user_management", "User Management"),
      icon: Users,
      path: "/users",
      roles: ["admin"],
    },
    {
      label: t("menu.audit_logs", "Audit Logs"),
      icon: Terminal,
      path: "/logs",
      roles: ["admin"],
    },

    {
      label: t("menu.documentation", "Documentation"),
      icon: Book,
      path: "/docs",
      roles: ["admin", "user"],
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="p-3 bg-accent/20 rounded-2xl border border-accent/20">
          <ShieldCheck className="w-8 h-8 text-accent" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter">XAuth</h1>
          <p className="text-[10px] text-accent uppercase font-black tracking-[0.2em]">
            Omega Edition
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {menuItems
          .filter((item) => item.roles.includes(user?.role || ""))
          .map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group outline-none focus:ring-2 focus:ring-accent ${
                location.pathname === item.path
                  ? "bg-accent text-white shadow-xl shadow-accent/20"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
              aria-current={
                location.pathname === item.path ? "page" : undefined
              }
            >
              <div className="flex items-center gap-4">
                <item.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${location.pathname === item.path ? "text-white" : "text-gray-500 group-hover:text-accent"}`}
                />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {location.pathname === item.path && (
                <ChevronRight className="w-4 h-4 animate-in slide-in-from-left-2" />
              )}
            </Link>
          ))}
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <Link
          to="/profile"
          className="bg-dark/50 p-4 rounded-2xl mb-4 border border-gray-800/50 flex items-center gap-3 hover:border-accent/40 transition-colors group cursor-pointer block"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate text-white">
                {user?.username}
              </p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                {user?.role}
              </p>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm group cursor-pointer"
          aria-label="Log out of your account"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          {t("menu.sign_out", "Sign Out")}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-dark text-white font-sans selection:bg-accent selection:text-white overflow-x-hidden">
      <Spotlight />

      {/* Desktop Sidebar */}
      <nav
        className="hidden lg:flex w-72 bg-secondary border-r border-gray-800 flex flex-col p-6 shadow-2xl relative z-20"
        aria-label="Main Navigation"
      >
        <SidebarContent />
      </nav>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
        
        {/* Sidebar Panel */}
        <nav
          className={`absolute inset-y-0 left-0 w-80 bg-secondary border-r border-gray-800 flex flex-col p-6 shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-6 right-6 p-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <SidebarContent />
        </nav>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-secondary border-b border-gray-800 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-xl border border-accent/20">
              <ShieldCheck className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-xl font-black tracking-tighter">XAuth</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-dark/50 border border-gray-800 rounded-xl text-gray-400 hover:text-white hover:border-accent/40 transition-all cursor-pointer"
            aria-label={t("menu.toggle_menu")}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Content Area */}
        <main
          className="flex-1 p-6 sm:p-8 lg:p-12 overflow-y-auto bg-linear-to-br from-dark via-dark to-slate-900/40 relative"
          id="main-content"
        >
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full -z-10 animate-pulse" />
          <div className="max-w-6xl mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            <footer className="mt-20 py-8 text-center text-[9px] text-gray-500 font-medium opacity-20 select-none uppercase tracking-[0.3em] pointer-events-none">
              {atob("Q29weVJpZ2h0IFhBdXRoIGRldiBieSBCbG91bWUgU0FT")}
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
