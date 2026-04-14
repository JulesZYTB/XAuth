import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", secret: "" });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/register", {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 font-sans">
      <main 
        className="max-w-md w-full bg-secondary p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-accent to-transparent opacity-50" />
        
        <header className="text-center mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{t("auth.register_title", "Join XAuth")}</h1>
          <p className="text-gray-400 text-sm">{t("auth.register_subtitle", "Create your personal license portal")}</p>
        </header>

        {error && (
          <div 
            className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-6 text-xs font-bold"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="username">{t("auth.username", "Username")}</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="username"
                type="text"
                required
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="johndoe"
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="email">{t("auth.email", "Email Address")}</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="email"
                type="email"
                required
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="john@example.com"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="password">{t("auth.password", "Password")}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="password"
                type="password"
                required
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="••••••••"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="secret">{t("auth.admin_secret", "Admin Secret (Optional)")}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="secret"
                type="password"
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="Only for authorized admins"
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              />
            </div>
          </div>


          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/80 text-white font-black py-4 rounded-2xl shadow-xl shadow-accent/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" /> {t("auth.sign_up", "Sign Up")}
          </button>
        </form>

        <footer className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            {t("auth.already_have_account", "Already have an account?")}{" "}
            <Link to="/login" className="text-accent font-bold hover:underline">{t("auth.log_in", "Log In")}</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
