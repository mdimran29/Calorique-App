import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Droplets, Zap, Plus } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useDailySummary, useLogWater } from "../../hooks/useMeals";
import { useGoals } from "../../hooks/useGoals";
import { today } from "../../utils/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../api/user.api";

const gc = {
  background: "rgba(28, 28, 30, 0.75)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  padding: "16px",
};

function MacroBar({ name, current, target, color, tag }: { name: string, current: number, target: number, color: string, tag: string | null }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}80` }} />
          <span style={{ color: "#c8c8cc", fontSize: "12px" }}>{name}</span>
          {tag && (
            <span style={{ color: "#555", fontSize: "9px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", padding: "1px 5px" }}>
              {tag}
            </span>
          )}
        </div>
        <span style={{ color: "#666", fontSize: "11px" }}>{Math.round(current)}g / {target}g</span>
      </div>
      <div style={{ height: "5px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${color}bb, ${color})`, borderRadius: "3px", boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { user, updateUser } = useAuth();
  const currentDate = today();
  const { data: summaryResponse } = useDailySummary(currentDate);
  const { data: goalsRes } = useGoals();
  const logWaterMutation = useLogWater();
  const [glasses, setGlasses] = useState(0);

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile(),
    enabled: !!user,
  });

  // Streak is computed server-side on each profile fetch — keep the auth store in sync
  useEffect(() => {
    if (typeof profileData?.stats?.currentStreak === "number" && profileData.stats.currentStreak !== user?.streak) {
      updateUser({ streak: profileData.stats.currentStreak });
    }
  }, [profileData?.stats?.currentStreak]);

  const dailyTotals = summaryResponse?.data?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
  const CALORIES_EATEN = Math.round(dailyTotals.calories);
  const waterGoalGlasses = goalsRes?.data ? Math.round((goalsRes.data.targetWaterIntake ?? 2.5) / 0.25) : 10;

  // Sync local glass count from the server once the day's summary loads
  useEffect(() => {
    const serverGlasses = (summaryResponse?.data as any)?.waterGlasses;
    if (typeof serverGlasses === "number") setGlasses(serverGlasses);
  }, [summaryResponse?.data]);

  const logGlasses = (count: number) => {
    const clamped = Math.max(0, Math.min(waterGoalGlasses, count));
    setGlasses(clamped);
    logWaterMutation.mutate({ date: currentDate, glasses: clamped });
  };

  // ── TDEE calculation from profile (Mifflin-St Jeor) ──────────────────
  function calcTDEE(p: typeof profileData): { calories: number; protein: number; carbs: number; fats: number } {
    const profile = p?.profile;
    const w = profile?.weightKg ?? 70;
    const h = profile?.heightCm ?? 170;
    const a = profile?.age ?? 25;
    const gender = profile?.gender ?? 'male';
    const activity = profile?.activityLevel ?? 'moderate';
    const goal = profile?.fitnessGoal ?? 'maintain';

    // BMR
    let bmr = gender === 'female'
      ? (10 * w) + (6.25 * h) - (5 * a) - 161
      : (10 * w) + (6.25 * h) - (5 * a) + 5;

    // Activity multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    let tdee = bmr * (multipliers[activity] ?? 1.55);

    // Goal adjustment
    if (goal === 'fat_loss')    tdee -= 400;
    if (goal === 'muscle_gain') tdee += 300;
    if (goal === 'lean_bulk')   tdee += 150;

    tdee = Math.round(tdee);
    // Macros: protein 30%, carbs 45%, fats 25% of calories
    const protein = Math.round((tdee * 0.30) / 4);
    const carbs   = Math.round((tdee * 0.45) / 4);
    const fats    = Math.round((tdee * 0.25) / 9);
    return { calories: tdee, protein, carbs, fats };
  }

  const goals = calcTDEE(profileData);
  const CALORIES_GOAL = goals.calories;

  const RING_R = 68;
  const RING_C = 2 * Math.PI * RING_R;
  const progressPct = Math.min(CALORIES_EATEN / CALORIES_GOAL, 1);
  const RING_OFFSET = RING_C * (1 - progressPct);

  const macros = [
    { name: "Protein", current: dailyTotals.protein, target: goals.protein, color: "#E91E63", tag: null },
    { name: "Carbs",   current: dailyTotals.carbs,   target: goals.carbs,   color: "#FF9800", tag: null },
    { name: "Fats",    current: dailyTotals.fats,    target: goals.fats,    color: "#9C27B0", tag: null },
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "12px 14px 8px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 2px" }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        <p style={{ color: "#fff", fontSize: "21px", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>Good Morning, {user?.name ? user.name.split(' ')[0] : "User"}! 👋</p>
      </div>

      {/* Calorie Ring Card */}
      <motion.div style={{ ...gc, marginBottom: "10px" }} whileHover={{ boxShadow: "0 8px 32px rgba(255,152,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width="146" height="146" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF6B35" />
                  <stop offset="100%" stopColor="#FFC107" />
                </linearGradient>
                <filter id="oGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <circle cx="80" cy="80" r={RING_R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="11" />
              <motion.circle
                cx="80" cy="80" r={RING_R} fill="none"
                stroke="url(#calGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                initial={{ strokeDashoffset: RING_C }}
                animate={{ strokeDashoffset: RING_OFFSET }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                transform="rotate(-90 80 80)"
                filter="url(#oGlow)"
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#FF9800", fontSize: "21px", fontWeight: 800, lineHeight: 1 }}>{CALORIES_EATEN.toLocaleString()}</span>
              <span style={{ color: "#777", fontSize: "10px", marginTop: "2px" }}>kcal eaten</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "10px" }}>
              <p style={{ color: "#666", fontSize: "10px", margin: "0 0 2px", letterSpacing: "0.6px" }}>DAILY GOAL</p>
              <p style={{ color: "#fff", fontSize: "17px", fontWeight: 700, margin: 0 }}>{CALORIES_GOAL.toLocaleString()} kcal</p>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <p style={{ color: "#666", fontSize: "10px", margin: "0 0 2px", letterSpacing: "0.6px" }}>REMAINING</p>
              <p style={{ color: "#4CAF50", fontSize: "17px", fontWeight: 700, margin: 0 }}>{Math.max(CALORIES_GOAL - CALORIES_EATEN, 0).toLocaleString()} kcal</p>
            </div>
            <div style={{ background: "rgba(255,152,0,0.07)", borderRadius: "10px", padding: "8px 10px" }}>
              <p style={{ color: "#666", fontSize: "10px", margin: "0 0 4px" }}>Progress</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(progressPct * 100)}%` }}
                    transition={{ duration: 1.6, ease: "easeOut" }}
                    style={{ height: "100%", background: "#FF9800", borderRadius: "2px" }}
                  />
                </div>
                <span style={{ color: "#FF9800", fontSize: "11px", fontWeight: 700 }}>
                  {Math.round(progressPct * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Macro Progress */}
      <motion.div style={{ ...gc, marginBottom: "10px" }} whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
        <p style={{ color: "#fff", fontSize: "13px", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.1px" }}>Daily Macros</p>
        {macros.map((m) => <MacroBar key={m.name} {...m} />)}
      </motion.div>

      {/* Streak + Hydration */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <motion.div
          style={{ ...gc, flex: "0 0 100px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 10px", gap: "2px" }}
          whileHover={{ boxShadow: "0 4px 20px rgba(255,152,0,0.18)" }}
        >
          <motion.span
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            style={{ fontSize: "30px" }}
          >🔥</motion.span>
          <span style={{ color: "#FF9800", fontSize: "26px", fontWeight: 800, lineHeight: 1, marginTop: "4px" }}>{user?.streak ?? 0}</span>
          <span style={{ color: "#777", fontSize: "10px", textAlign: "center" }}>Day Streak!</span>
        </motion.div>

        <motion.div
          style={{ ...gc, flex: 1, padding: "13px" }}
          whileHover={{ boxShadow: "0 4px 20px rgba(33,150,243,0.15)" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div>
              <p style={{ color: "#2196F3", fontSize: "12px", fontWeight: 700, margin: 0 }}>Hydration</p>
              <p style={{ color: "#666", fontSize: "10px", margin: "2px 0 0" }}>
                {glasses}/{waterGoalGlasses} glasses · {(glasses * 0.25).toFixed(2)}L
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => logGlasses(glasses + 1)}
              style={{
                background: "#2196F3",
                border: "none",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 14px rgba(33,150,243,0.45)",
              }}
            >
              <Plus size={14} color="#fff" />
            </motion.button>
          </div>
          <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
            {Array.from({ length: waterGoalGlasses }).map((_, i) => (
              <motion.div
                key={i}
                whileTap={{ scale: 0.82 }}
                onClick={() => logGlasses(i + 1)}
                style={{ cursor: "pointer" }}
              >
                <Droplets
                  size={16}
                  color={i < glasses ? "#2196F3" : "#2a2a2e"}
                  fill={i < glasses ? "rgba(33,150,243,0.25)" : "none"}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI Suggestion */}
      <motion.div
        style={{
          ...gc,
          marginBottom: "8px",
          background: "linear-gradient(135deg, rgba(76,175,80,0.07) 0%, rgba(33,150,243,0.04) 100%)",
          border: "1px solid rgba(76,175,80,0.22)",
        }}
        whileHover={{ boxShadow: "0 4px 24px rgba(76,175,80,0.14)" }}
      >
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(76,175,80,0.18), rgba(33,150,243,0.1))", borderRadius: "12px", padding: "9px", flexShrink: 0 }}>
            <Zap size={15} color="#4CAF50" />
          </div>
          <div>
            <p style={{ color: "#4CAF50", fontSize: "11px", fontWeight: 700, margin: "0 0 5px", letterSpacing: "0.3px" }}>✨ Gemini Smart Coach</p>
            <p style={{ color: "#b0b0b8", fontSize: "12px", margin: 0, lineHeight: 1.65 }}>
              💡 You're 45g short on protein today. Try adding 150g of Paneer or a cup of Greek Yogurt to your evening snack for an easy boost!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
