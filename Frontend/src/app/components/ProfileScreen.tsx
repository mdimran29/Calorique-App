import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, Bell, Moon, Shield, LogOut, Crown, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, type UpdateProfilePayload } from "../../api/user.api";const gc = {
  background: "rgba(28, 28, 30, 0.75)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  padding: "14px",
};

const PREMIUM_BENEFITS = [
  "Unlimited Gemini Diet Generation",
  "24/7 AI Coach Chat (Aria)",
  "Barcode Scanning — Unlimited",
  "Food Image Analysis",
  "Advanced Analytics & Reports",
  "Priority Customer Support",
];

function Toggle({ value, onChange, color = "#4CAF50" }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <motion.div
      onClick={onChange}
      style={{
        width: "40px", height: "23px",
        background: value ? color : "rgba(255,255,255,0.1)",
        borderRadius: "12px", position: "relative", cursor: "pointer",
        transition: "background 0.25s",
        boxShadow: value ? `0 0 12px ${color}50` : "none",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: value ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        style={{ position: "absolute", top: "2px", width: "19px", height: "19px", background: "#fff", borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
      />
    </motion.div>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfilePayload>({});

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userApi.updateProfile(payload),
    onSuccess: (data) => {
      // Sync name change to auth store so dashboard reflects it immediately
      const updatedUser = data.data?.user ?? data.data;
      if (updatedUser?.name) updateUser({ name: updatedUser.name });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    }
  });

  const handleEditClick = () => {
    if (profileData?.profile) {
      setEditForm({
        displayName: user?.name || "",
        age: profileData.profile.age,
        gender: profileData.profile.gender,
        heightCm: profileData.profile.heightCm,
        weightKg: profileData.profile.weightKg,
        targetWeightKg: profileData.profile.targetWeightKg,
        activityLevel: profileData.profile.activityLevel,
        fitnessGoal: profileData.profile.fitnessGoal,
        dietType: profileData.profile.dietType,
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(editForm);
  };

  if (isLoading) {
    return <div style={{ color: "white", padding: "20px", textAlign: "center" }}>Loading profile...</div>;
  }

  const profile = profileData?.profile;
  const stats = profileData?.stats;

  return (
    <div style={{ height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Profile Header */}
      <div style={{ background: "linear-gradient(180deg, rgba(76,175,80,0.12) 0%, transparent 100%)", padding: "20px 14px 16px", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: "10px" }}>
          <div style={{
            width: "70px", height: "70px", borderRadius: "50%",
            background: "linear-gradient(135deg, #4CAF50, #2196F3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto",
            boxShadow: "0 0 28px rgba(76,175,80,0.28), 0 0 0 3px rgba(76,175,80,0.1)",
          }}>
            <span style={{ color: "#fff", fontSize: "22px", fontWeight: 800, letterSpacing: "1px" }}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
            </span>
          </div>
          <div 
            onClick={handleEditClick}
            style={{ position: "absolute", bottom: 0, right: 0, background: "#2a2a2e", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #1c1c1e", cursor: "pointer" }}
          >
            <span style={{ fontSize: "10px" }}>✏️</span>
          </div>
        </div>

        <p style={{ color: "#fff", fontSize: "18px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.2px" }}>{user?.name || "User"}</p>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 10px" }}>{user?.email || ""}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
          <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "4px 12px", color: "#888", fontSize: "11px" }}>
            {user?.isPremium ? "Premium" : "Free Tier"}
          </span>
          <span style={{ background: "rgba(76,175,80,0.1)", border: "1px solid rgba(76,175,80,0.28)", borderRadius: "20px", padding: "4px 12px", color: "#4CAF50", fontSize: "11px" }}>
            🔥 {stats?.currentStreak || 0}-Day Streak
          </span>
        </div>
      </div>

      <div style={{ padding: "0 14px 24px" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "13px" }}>
          {[
            { label: "Days Active", value: stats?.daysActive || "0", color: "#4CAF50" },
            { label: "Meals Logged", value: stats?.mealsLogged || "0", color: "#FF9800" },
            { label: "Goals Hit", value: stats?.goalsHit || "0", color: "#2196F3" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, ...gc, textAlign: "center", padding: "12px 6px" }}>
              <p style={{ color: s.color, fontSize: "20px", fontWeight: 800, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "#555", fontSize: "10px", margin: "4px 0 0" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Premium Card Hidden for now as per user request */}

        {/* Settings */}
        <div style={{ ...gc }}>
          <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", margin: "0 0 10px" }}>PREFERENCES</p>

          {[
            { icon: Moon, label: "Dark Mode", color: "#9C27B0", value: darkMode, toggle: () => setDarkMode((v) => !v) },
            { icon: Bell, label: "Push Notifications", color: "#2196F3", value: notifications, toggle: () => setNotifications((v) => !v) },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `rgba(${item.color === "#9C27B0" ? "156,39,176" : "33,150,243"},0.14)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={15} color={item.color} />
                </div>
                <span style={{ color: "#c8c8cc", fontSize: "13px" }}>{item.label}</span>
              </div>
              <Toggle value={item.value} onChange={item.toggle} color={item.color} />
            </div>
          ))}

          <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", margin: "12px 0 8px" }}>REMINDERS</p>

          {[
            { icon: "🍽️", label: "Meal Reminders", value: mealReminders, toggle: () => setMealReminders((v) => !v) },
            { icon: "💧", label: "Water Reminders", value: waterReminders, toggle: () => setWaterReminders((v) => !v) },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "15px" }}>{item.icon}</span>
                </div>
                <span style={{ color: "#c8c8cc", fontSize: "13px" }}>{item.label}</span>
              </div>
              <Toggle value={item.value} onChange={item.toggle} />
            </div>
          ))}

          <p style={{ color: "#555", fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", margin: "12px 0 6px" }}>ACCOUNT</p>

          {[
            { icon: Shield, label: "Privacy & Security", color: "#4CAF50" },
            { icon: LogOut, label: "Sign Out", color: "#E91E63" },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              whileTap={{ scale: 0.98 }}
              onClick={item.label === "Sign Out" ? logout : undefined}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: idx === 0 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `rgba(${item.color === "#4CAF50" ? "76,175,80" : "233,30,99"},0.1)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <item.icon size={15} color={item.color} />
                </div>
                <span style={{ color: item.label === "Sign Out" ? "#E91E63" : "#c8c8cc", fontSize: "13px" }}>{item.label}</span>
              </div>
              <ChevronRight size={15} color="#444" />
            </motion.div>
          ))}
        </div>

        <p style={{ color: "#3a3a3e", fontSize: "11px", textAlign: "center", margin: "14px 0 0" }}>Nutrivora AI v1.0.0 · Made with ❤️ in India</p>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{
                background: "#1c1c1e", borderRadius: "24px", width: "100%", maxHeight: "80%", overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#fff", margin: 0, fontSize: "18px" }}>Edit Profile</h3>
                <X size={20} color="#888" cursor="pointer" onClick={() => setIsEditing(false)} />
              </div>
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ color: "#888", fontSize: "12px" }}>Name</label>
                  <input type="text" value={editForm.displayName || ""} onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#888", fontSize: "12px" }}>Age</label>
                    <input type="number" value={editForm.age || ""} onChange={(e) => setEditForm(prev => ({ ...prev, age: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#888", fontSize: "12px" }}>Gender</label>
                    <select value={editForm.gender || "other"} onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value as any }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#888", fontSize: "12px" }}>Weight (kg)</label>
                    <input type="number" value={editForm.weightKg || ""} onChange={(e) => setEditForm(prev => ({ ...prev, weightKg: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#888", fontSize: "12px" }}>Height (cm)</label>
                    <input type="number" value={editForm.heightCm || ""} onChange={(e) => setEditForm(prev => ({ ...prev, heightCm: Number(e.target.value) }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: "#888", fontSize: "12px" }}>Goal</label>
                  <select value={editForm.fitnessGoal || "maintain"} onChange={(e) => setEditForm(prev => ({ ...prev, fitnessGoal: e.target.value as any }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}>
                    <option value="fat_loss">Fat Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="lean_bulk">Lean Bulk</option>
                    <option value="maintain">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label style={{ color: "#888", fontSize: "12px" }}>Activity Level</label>
                  <select value={editForm.activityLevel || "sedentary"} onChange={(e) => setEditForm(prev => ({ ...prev, activityLevel: e.target.value as any }))} style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", outline: "none", boxSizing: "border-box" }}>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Lightly Active</option>
                    <option value="moderate">Moderately Active</option>
                    <option value="active">Very Active</option>
                    <option value="very_active">Super Active</option>
                  </select>
                </div>
                <button type="submit" disabled={updateProfileMutation.isPending} style={{ marginTop: "10px", padding: "12px", background: "#4CAF50", border: "none", borderRadius: "8px", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Details"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
