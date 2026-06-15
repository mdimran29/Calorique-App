import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Lock, Activity, ChevronRight } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/authStore";

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { setUser, setTokens } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await authApi.login({ email, password });
        const data = response.data ?? (response as any);
        const tokens = data.tokens;
        const userObj = data.user;
        setUser(userObj);
        setTokens(tokens.accessToken, tokens.refreshToken);
        onLoginSuccess();
      } else {
        const response = await authApi.register({ email, password, displayName: name });
        const data = response.data ?? (response as any);
        const tokens = data.tokens;
        const userObj = data.user;
        setUser(userObj);
        setTokens(tokens.accessToken, tokens.refreshToken);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100%", padding: "30px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "40px" }}
      >
        <div style={{
          width: "80px", height: "80px", borderRadius: "24px",
          background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 10px 30px rgba(76,175,80,0.3)",
          transform: "rotate(-10deg)"
        }}>
          <Activity size={40} color="#fff" />
        </div>
        <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.5px" }}>
          Calorique
        </h1>
        <p style={{ color: "#888", fontSize: "14px", margin: 0 }}>Your AI-powered nutrition coach</p>
      </motion.div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <AnimatePresence mode="popLayout">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ position: "relative" }}>
                <User size={18} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                  style={{
                    width: "100%", padding: "16px 16px 16px 44px", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px", color: "#fff", fontSize: "14px", outline: "none",
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: "relative" }}>
          <Mail size={18} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%", padding: "16px 16px 16px 44px", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px", color: "#fff", fontSize: "14px", outline: "none",
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <Lock size={18} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%", padding: "16px 16px 16px 44px", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px", color: "#fff", fontSize: "14px", outline: "none",
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#E91E63", fontSize: "12px", margin: "0", textAlign: "center" }}>{error}</p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "16px", marginTop: "10px",
            background: loading ? "#2E7D32" : "#4CAF50",
            border: "none", borderRadius: "16px",
            color: "#fff", fontSize: "16px", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 20px rgba(76,175,80,0.3)",
            display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
          }}
        >
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          {!loading && <ChevronRight size={18} />}
        </motion.button>
      </form>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <p style={{ color: "#666", fontSize: "14px" }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: "none", border: "none", color: "#4CAF50",
              fontWeight: 700, marginLeft: "6px", cursor: "pointer", fontSize: "14px"
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
