import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 font-sans selection:bg-accent selection:text-white">
      <div className="max-w-md w-full bg-secondary p-12 rounded-[3rem] border border-gray-800 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/20"></div>
        
        <header className="text-center mb-12">
          <div className="inline-flex p-4 bg-accent/10 rounded-3xl mb-6">
            <ShieldCheck className="w-12 h-12 text-accent" aria-hidden="true" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">XAuth Omega</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-[0.2em]">Enterprise Security Hub</p>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 text-xs font-bold animate-shake" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="email">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="email"
                type="email"
                required
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="admin@xauth.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase font-black px-1" htmlFor="password">Security Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-accent transition-colors" aria-hidden="true" />
              <input
                id="password"
                type="password"
                required
                className="w-full bg-dark/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-white text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/80 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Authenticate
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent font-bold hover:underline">Create one</Link>
        </p>

        <p className="mt-8 text-center text-xs text-gray-500">
          Secure, Encrypted, Professional.
        </p>
      </div>
    </div>
  );
}
