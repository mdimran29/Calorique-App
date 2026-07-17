import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Lock, Activity, ChevronRight, Phone, ArrowLeft } from "lucide-react";
import { authApi } from "../../api/auth.api";
import { useAuthStore } from "../../store/authStore";
import { signInWithGoogle, startPhoneSignIn, confirmOtp, resetRecaptcha } from "../../services/firebase";
import type { ConfirmationResult } from "firebase/auth";

const RECAPTCHA_CONTAINER_ID = "recaptcha-container";

const inputStyle = {
  width: "100%", padding: "16px 16px 16px 44px", boxSizing: "border-box" as const,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px", color: "#fff", fontSize: "14px", outline: "none",
};

const primaryButtonStyle = (loading: boolean) => ({
  width: "100%", padding: "16px", marginTop: "10px",
  background: loading ? "#2E7D32" : "#4CAF50",
  border: "none", borderRadius: "16px",
  color: "#fff", fontSize: "16px", fontWeight: 700,
  cursor: loading ? "not-allowed" : "pointer",
  boxShadow: "0 4px 20px rgba(76,175,80,0.3)",
  display: "flex", justifyContent: "center", alignItems: "center", gap: "8px",
});

type Mode = "form" | "phone-number" | "phone-otp";

export default function AuthScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { setUser, setTokens } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [mode, setMode] = useState<Mode>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const applyAuthResult = (response: any) => {
    const data = response.data ?? response;
    setUser(data.user);
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    onLoginSuccess();
  };

  // Login-first-then-register-fallback: works for both fresh and returning
  // Google/Phone users since the backend auto-registers on first login with a token.
  const authenticateWithFirebaseToken = async (firebaseToken: string) => {
    try {
      applyAuthResult(await authApi.login({ firebaseToken }));
    } catch {
      applyAuthResult(await authApi.register({ firebaseToken }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        applyAuthResult(await authApi.login({ email, password }));
      } else {
        applyAuthResult(await authApi.register({ email, password, displayName: name }));
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      const token = await signInWithGoogle();
      await authenticateWithFirebaseToken(token);
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") {
        // user cancelled — not an error worth showing
      } else {
        console.error(err);
        setError(err?.response?.data?.message || "Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = phoneNumber.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(trimmed)) {
      setError("Enter phone number with country code, e.g. +919876543210");
      return;
    }
    setLoading(true);
    try {
      const result = await startPhoneSignIn(trimmed, RECAPTCHA_CONTAINER_ID);
      setConfirmation(result);
      setMode("phone-otp");
    } catch (err: any) {
      console.error(err);
      resetRecaptcha();
      setError(err?.response?.data?.message || "Couldn't send OTP. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError("");
    setLoading(true);
    try {
      const token = await confirmOtp(confirmation, otp.trim());
      await authenticateWithFirebaseToken(token);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const backToForm = () => {
    setMode("form");
    setOtp("");
    setConfirmation(null);
    setError("");
    resetRecaptcha();
  };

  return (
    <div style={{ height: "100%", padding: "30px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "32px" }}
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

      <AnimatePresence mode="wait">
        {mode === "form" && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Google Sign-In */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              style={{
                width: "100%", padding: "14px", marginBottom: "12px",
                background: "#fff", border: "none", borderRadius: "16px",
                color: "#1a1a1a", fontSize: "14px", fontWeight: 700,
                cursor: googleLoading ? "not-allowed" : "pointer",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
              </svg>
              {googleLoading ? "Signing in..." : "Continue with Google"}
            </motion.button>

            {/* Phone Sign-In */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setMode("phone-number")}
              style={{
                width: "100%", padding: "14px", marginBottom: "20px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px",
                color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "10px",
              }}
            >
              <Phone size={17} color="#4CAF50" />
              Continue with Phone
            </motion.button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              <span style={{ color: "#555", fontSize: "11px" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            </div>

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
                        style={inputStyle}
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
                  style={inputStyle}
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
                  style={inputStyle}
                />
              </div>

              {error && (
                <p style={{ color: "#E91E63", fontSize: "12px", margin: "0", textAlign: "center" }}>{error}</p>
              )}

              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                {!loading && <ChevronRight size={18} />}
              </motion.button>
            </form>

            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <p style={{ color: "#666", fontSize: "14px" }}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(""); }}
                  style={{
                    background: "none", border: "none", color: "#4CAF50",
                    fontWeight: 700, marginLeft: "6px", cursor: "pointer", fontSize: "14px"
                  }}
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {mode === "phone-number" && (
          <motion.div key="phone-number" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <button onClick={backToForm} style={{ background: "none", border: "none", color: "#888", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", marginBottom: "20px", fontSize: "13px", padding: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>Enter your phone number</p>
            <p style={{ color: "#666", fontSize: "12px", margin: "0 0 20px" }}>We'll text you a verification code.</p>
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <Phone size={18} color="#666" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              {error && <p style={{ color: "#E91E63", fontSize: "12px", margin: 0, textAlign: "center" }}>{error}</p>}
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                {loading ? "Sending code..." : "Send Code"}
                {!loading && <ChevronRight size={18} />}
              </motion.button>
            </form>
          </motion.div>
        )}

        {mode === "phone-otp" && (
          <motion.div key="phone-otp" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <button onClick={() => setMode("phone-number")} style={{ background: "none", border: "none", color: "#888", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", marginBottom: "20px", fontSize: "13px", padding: 0 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: "0 0 6px" }}>Enter verification code</p>
            <p style={{ color: "#666", fontSize: "12px", margin: "0 0 20px" }}>Sent to {phoneNumber}</p>
            <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
                maxLength={6}
                style={{ ...inputStyle, padding: "16px", textAlign: "center", letterSpacing: "4px", fontSize: "18px" }}
              />
              {error && <p style={{ color: "#E91E63", fontSize: "12px", margin: 0, textAlign: "center" }}>{error}</p>}
              <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} style={primaryButtonStyle(loading)}>
                {loading ? "Verifying..." : "Verify & Continue"}
                {!loading && <ChevronRight size={18} />}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible reCAPTCHA anchor required by Firebase Phone Auth */}
      <div id={RECAPTCHA_CONTAINER_ID} />
    </div>
  );
}
