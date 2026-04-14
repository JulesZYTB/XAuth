import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Rocket, 
  ShieldCheck, 
  Users, 
  Terminal, 
  LogOut,
  ChevronRight,
  User 
} from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ id: number; username: string; role: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const menuItems = [
    { 
      label: user?.role === "admin" ? "Global Dashboard" : "My Licenses", 
      icon: LayoutDashboard, 
      path: "/", 
      roles: ["admin", "user"] 
    },
    { 
      label: "Applications", 
      icon: Rocket, 
      path: "/apps", 
      roles: ["admin"] 
    },
    { 
      label: "User Management", 
      icon: Users, 
      path: "/users", 
      roles: ["admin"] 
    },
    { 
      label: "Audit Logs", 
      icon: Terminal, 
      path: "/logs", 
      roles: ["admin", "user"] 
    },
  ];

  return (
    <div className="flex min-h-screen bg-dark text-white font-sans selection:bg-accent selection:text-white">
      {/* Sidebar Overlay for Glassmorphism */}
      <nav 
        className="w-72 bg-secondary border-r border-gray-800 flex flex-col p-6 shadow-2xl relative z-10"
        aria-label="Main Navigation"
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="p-3 bg-accent/20 rounded-2xl border border-accent/20">
            <ShieldCheck className="w-8 h-8 text-accent" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">XAuth</h1>
            <p className="text-[10px] text-accent uppercase font-black tracking-[0.2em]">Omega Edition</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {menuItems.filter(item => item.roles.includes(user?.role || "")).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group outline-none focus:ring-2 focus:ring-accent ${
                location.pathname === item.path 
                  ? "bg-accent text-white shadow-xl shadow-accent/20" 
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
              aria-current={location.pathname === item.path ? "page" : undefined}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${location.pathname === item.path ? "text-white" : "text-gray-500 group-hover:text-accent"}`} />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {location.pathname === item.path && <ChevronRight className="w-4 h-4 animate-in slide-in-from-left-2" />}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-800">
          <div className="bg-dark/50 p-4 rounded-2xl mb-4 border border-gray-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{user?.username}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm group"
            aria-label="Log out of your account"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main 
        className="flex-1 p-12 overflow-y-auto bg-linear-to-br from-dark via-dark to-slate-900/40 relative"
        id="main-content"
      >
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
