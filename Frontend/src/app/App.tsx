import { useState, useEffect } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "motion/react";
import { Home, UtensilsCrossed, Bot, BarChart3, User } from "lucide-react";
import HomeScreen from "./components/HomeScreen";
import MealsScreen from "./components/MealsScreen";
import AICoachScreen from "./components/AICoachScreen";
import AnalyticsScreen from "./components/AnalyticsScreen";
import ProfileScreen from "./components/ProfileScreen";
import AuthScreen from "./components/AuthScreen";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "meals", label: "Meals", icon: UtensilsCrossed },
  { id: "ai", label: "AI Coach", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("accessToken"));

  const renderScreen = () => {
    switch (activeTab) {
      case "home": return <HomeScreen />;
      case "meals": return <MealsScreen />;
      case "ai": return <AICoachScreen />;
      case "analytics": return <AnalyticsScreen />;
      case "profile": return <ProfileScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, #0d1f0d 0%, #0a0a0a 55%, #0a0a14 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px",
    }}>
      <div style={{
        width: "390px",
        height: "844px",
        background: "#121212",
        borderRadius: "50px",
        border: "2px solid #242424",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 0 0 10px #181818, 0 40px 120px rgba(0,0,0,0.9), 0 0 80px rgba(76,175,80,0.06)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Status Bar */}
        <div style={{
          padding: "14px 28px 8px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#fff", fontSize: "13px", fontWeight: 700 }}>9:41</span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "1px", alignItems: "flex-end" }}>
              {[3, 5, 7, 9].map((h, i) => (
                <div key={i} style={{ width: "3px", height: `${h}px`, background: i < 3 ? "#fff" : "rgba(255,255,255,0.3)", borderRadius: "1px" }} />
              ))}
            </div>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 2.2C5.3 2.2 3.3 3.1 1.8 4.6L0 2.8C2 1 4.6 0 7.5 0s5.5 1 7.5 2.8L13.2 4.6C11.7 3.1 9.7 2.2 7.5 2.2z" fill="white" opacity="0.4"/>
              <path d="M7.5 5.4c-1.5 0-2.9.6-3.9 1.5L1.8 5.1C3.2 3.8 5.2 3 7.5 3s4.3.8 5.7 2.1L11.4 6.9C10.4 6 9 5.4 7.5 5.4z" fill="white" opacity="0.7"/>
              <path d="M7.5 8.6c-.8 0-1.5.3-2 .8L7.5 11.5l2-2.1c-.5-.5-1.2-.8-2-.8z" fill="white"/>
            </svg>
            <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
              <div style={{ width: "22px", height: "11px", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "3px", padding: "1px", display: "flex" }}>
                <div style={{ width: "70%", background: "rgba(255,255,255,0.9)", borderRadius: "1px" }} />
              </div>
              <div style={{ width: "2px", height: "5px", background: "rgba(255,255,255,0.4)", borderRadius: "0 1px 1px 0" }} />
            </div>
          </div>
        </div>

        {isAuthenticated ? (
          <>
            {/* Screen Content */}
            <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ height: "100%", overflow: "hidden" }}
                >
                  {renderScreen()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Tab Bar */}
            <div style={{
              background: "rgba(12,12,12,0.97)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              padding: "8px 0 26px",
              display: "flex",
              flexShrink: 0,
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "3px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                      outline: "none",
                    }}
                  >
                    <motion.div
                      whileTap={{ scale: 0.82 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}
                    >
                      <div style={{
                        width: "34px",
                        height: "28px",
                        borderRadius: "10px",
                        background: isActive ? "rgba(76,175,80,0.15)" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.25s",
                        boxShadow: isActive ? "0 0 14px rgba(76,175,80,0.25)" : "none",
                      }}>
                        <Icon size={isActive ? 19 : 17} color={isActive ? "#4CAF50" : "#505050"} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span style={{
                        color: isActive ? "#4CAF50" : "#505050",
                        fontSize: "9px",
                        fontWeight: isActive ? 700 : 400,
                        transition: "all 0.25s",
                        letterSpacing: isActive ? "0.2px" : "0",
                      }}>
                        {tab.label}
                      </span>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />
          </div>
        )}
      </div>
    </div>
  );
}
