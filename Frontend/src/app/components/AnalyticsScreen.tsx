import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronUp, ChevronDown, Target } from "lucide-react";
import { useCalorieHistory, useProgress, useLogWeight } from "../../hooks/useProgress";
import { useGoals, useSetGoals } from "../../hooks/useGoals";
import { dayLabel } from "../../utils/dateUtils";

const gc = {
  background: "rgba(28, 28, 30, 0.75)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  padding: "15px",
};

const CalTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(16,16,18,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 12px" }}>
      <p style={{ color: "#777", fontSize: "10px", margin: "0 0 4px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: "12px", fontWeight: 700, margin: "1px 0 0" }}>
          {p.name === "calories" ? "Eaten" : "Target"}: {p.value} kcal
        </p>
      ))}
    </div>
  );
};

const WtTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(16,16,18,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 12px" }}>
      <p style={{ color: "#777", fontSize: "10px", margin: "0 0 3px" }}>{label}</p>
      <p style={{ color: "#2196F3", fontSize: "12px", fontWeight: 700, margin: 0 }}>{payload[0].value} kg</p>
    </div>
  );
};

export default function AnalyticsScreen() {
  const { data: calorieHistoryRes, isLoading: calLoading } = useCalorieHistory(7);
  const { data: progressRes, isLoading: progLoading } = useProgress(30);
  const { data: goalsRes } = useGoals();
  const setGoalsMutation = useSetGoals();
  const logWeightMutation = useLogWeight();

  const goals = goalsRes?.data;
  const weightEntries = progressRes?.data?.weightEntries ?? [];

  const [calorieGoal, setCalorieGoalLocal] = useState(2100);
  const [waterGoal, setWaterGoalLocal] = useState(10);

  useEffect(() => {
    if (goals) {
      setCalorieGoalLocal(goals.targetCalories);
      setWaterGoalLocal(Math.round((goals.targetWaterIntake ?? 2.5) / 0.25));
    }
  }, [goals]);

  const calorieData = (calorieHistoryRes?.data ?? []).map((e) => ({
    day: dayLabel(e.date),
    calories: e.caloriesConsumed,
    target: e.caloriesGoal,
  }));

  // Weight history comes newest-first; chart wants oldest-first
  const weightData = [...weightEntries]
    .slice(0, 8)
    .reverse()
    .map((e) => ({ week: dayLabel(e.date), weight: e.weightKg }));

  const currentWeight = weightEntries[0]?.weightKg;
  const targetWeight = goals?.targetWeight;
  const earliestWeight = weightEntries[weightEntries.length - 1]?.weightKg;
  const weightDelta = currentWeight != null && earliestWeight != null ? Math.round((currentWeight - earliestWeight) * 10) / 10 : null;
  const remainingWeight = currentWeight != null && targetWeight != null ? Math.round((currentWeight - targetWeight) * 10) / 10 : null;

  const commitGoalChange = (updates: Partial<{ targetCalories: number; targetWaterIntake: number }>) => {
    if (!goals) return;
    setGoalsMutation.mutate({
      targetCalories: updates.targetCalories ?? goals.targetCalories,
      targetProtein: goals.targetProtein,
      targetCarbs: goals.targetCarbs,
      targetFats: goals.targetFats,
      targetWeight: goals.targetWeight,
      targetWaterIntake: updates.targetWaterIntake ?? goals.targetWaterIntake,
      fitnessGoal: goals.fitnessGoal,
    });
  };

  const adjustCalorieGoal = (delta: number) => {
    const next = Math.min(4000, Math.max(1200, calorieGoal + delta));
    setCalorieGoalLocal(next);
    commitGoalChange({ targetCalories: next });
  };

  const adjustWaterGoal = (delta: number) => {
    const next = Math.min(20, Math.max(4, waterGoal + delta));
    setWaterGoalLocal(next);
    commitGoalChange({ targetWaterIntake: Math.round(next * 0.25 * 100) / 100 });
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "12px 14px 8px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>Last 7 days</p>
        <p style={{ color: "#fff", fontSize: "21px", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>Analytics</p>
      </div>

      {/* Calorie Trend */}
      <motion.div style={{ ...gc, marginBottom: "11px" }} whileHover={{ boxShadow: "0 4px 22px rgba(255,152,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <p style={{ color: "#e0e0e6", fontSize: "13px", fontWeight: 700, margin: 0 }}>Calorie Trend</p>
            <p style={{ color: "#666", fontSize: "11px", margin: 0 }}>7-day overview</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "10px", height: "2px", background: "#FF9800", borderRadius: "1px" }} />
              <span style={{ color: "#666", fontSize: "10px" }}>Eaten</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "10px", height: "2px", background: "#4CAF50", borderRadius: "1px", opacity: 0.6 }} />
              <span style={{ color: "#666", fontSize: "10px" }}>Target</span>
            </div>
          </div>
        </div>
        {calLoading ? (
          <div style={{ height: 118, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: "12px" }}>Loading...</div>
        ) : calorieData.every((d) => d.calories === 0) ? (
          <div style={{ height: 118, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "12px", textAlign: "center", padding: "0 20px" }}>
            No meals logged this week yet — log a meal to see your trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={118}>
            <AreaChart data={calorieData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="calFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF9800" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF9800" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CalTooltip />} />
              <Area
                type="monotone" dataKey="calories"
                stroke="#FF9800" strokeWidth={2.5}
                fill="url(#calFill)"
                dot={{ fill: "#FF9800", r: 3, stroke: "#FF9800" }}
                activeDot={{ r: 5, fill: "#FF9800", stroke: "rgba(255,152,0,0.3)", strokeWidth: 4 }}
              />
              <Line
                type="monotone" dataKey="target"
                stroke="#4CAF50" strokeWidth={1.5}
                strokeDasharray="5 4" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Weight Progress */}
      <motion.div style={{ ...gc, marginBottom: "11px" }} whileHover={{ boxShadow: "0 4px 22px rgba(33,150,243,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <p style={{ color: "#e0e0e6", fontSize: "13px", fontWeight: 700, margin: 0 }}>Weight Progress</p>
            <p style={{ color: "#666", fontSize: "11px", margin: 0 }}>Last {weightData.length} entries</p>
          </div>
          {currentWeight != null && (
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#2196F3", fontSize: "14px", fontWeight: 800, margin: 0 }}>{currentWeight} kg</p>
              {weightDelta != null && (
                <p style={{ color: weightDelta <= 0 ? "#4CAF50" : "#FF9800", fontSize: "11px", margin: 0 }}>
                  {weightDelta <= 0 ? "↓" : "↑"} {Math.abs(weightDelta)} kg
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "7px", marginBottom: "12px" }}>
          {[
            { label: "Current", value: currentWeight != null ? `${currentWeight} kg` : "—", color: "#2196F3" },
            { label: "Target", value: targetWeight != null ? `${targetWeight} kg` : "—", color: "#4CAF50" },
            { label: "Remaining", value: remainingWeight != null ? `${Math.abs(remainingWeight)} kg` : "—", color: "#FF9800" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "11px", padding: "9px 6px", textAlign: "center" }}>
              <p style={{ color: s.color, fontSize: "13px", fontWeight: 800, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#555", fontSize: "9px", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {progLoading ? (
          <div style={{ height: 95, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: "12px" }}>Loading...</div>
        ) : weightData.length < 2 ? (
          <div style={{ height: 95, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: "12px", textAlign: "center", padding: "0 20px" }}>
            Log your weight a couple of times to see a trend
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={95}>
            <LineChart data={weightData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2196F3" />
                  <stop offset="100%" stopColor="#4CAF50" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={<WtTooltip />} />
              <Line
                type="monotone" dataKey="weight"
                stroke="url(#wGrad)" strokeWidth={2.5}
                dot={{ fill: "#2196F3", r: 4, stroke: "rgba(33,150,243,0.3)", strokeWidth: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={logWeightMutation.isPending}
          onClick={() => {
            const input = window.prompt("Log today's weight (kg):", currentWeight ? String(currentWeight) : "");
            if (!input) return;
            const weightKg = Number(input);
            if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500) {
              alert("Please enter a valid weight between 20 and 500 kg.");
              return;
            }
            logWeightMutation.mutate({ weightKg, date: new Date().toISOString().split("T")[0] });
          }}
          style={{ width: "100%", marginTop: "10px", background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.3)", borderRadius: "10px", padding: "9px", color: "#2196F3", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
        >
          {logWeightMutation.isPending ? "Saving..." : "+ Log Today's Weight"}
        </motion.button>
      </motion.div>

      {/* Goal Configurator */}
      <motion.div style={{ ...gc, marginBottom: "8px" }} whileHover={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "13px" }}>
          <div style={{ background: "rgba(76,175,80,0.15)", borderRadius: "9px", padding: "6px" }}>
            <Target size={14} color="#4CAF50" />
          </div>
          <p style={{ color: "#e0e0e6", fontSize: "13px", fontWeight: 700, margin: 0 }}>Goal Configurator</p>
        </div>

        {[
          { label: "Daily Calorie Goal", value: calorieGoal, unit: "kcal", color: "#FF9800", step: 50, min: 1200, max: 4000, adjust: adjustCalorieGoal },
          { label: "Daily Water Goal", value: waterGoal, unit: "glasses", color: "#2196F3", step: 1, min: 4, max: 20, adjust: adjustWaterGoal },
        ].map((item) => (
          <div key={item.label} style={{ padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "13px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: "#a0a0aa", fontSize: "12px", margin: 0 }}>{item.label}</p>
                <p style={{ color: item.color, fontSize: "20px", fontWeight: 800, margin: "3px 0 0", lineHeight: 1 }}>
                  {item.value}{" "}
                  <span style={{ fontSize: "12px", color: "#666", fontWeight: 400 }}>{item.unit}</span>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => item.adjust(item.step)}
                  style={{ background: `rgba(${item.color === "#FF9800" ? "255,152,0" : "33,150,243"},0.12)`, border: `1px solid rgba(${item.color === "#FF9800" ? "255,152,0" : "33,150,243"},0.3)`, borderRadius: "8px", padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronUp size={15} color={item.color} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => item.adjust(-item.step)}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronDown size={15} color="#666" />
                </motion.button>
              </div>
            </div>
            <div style={{ marginTop: "10px" }}>
              <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${Math.round(((item.value - item.min) / (item.max - item.min)) * 100)}%`, height: "100%", background: item.color, borderRadius: "2px", transition: "width 0.3s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
                <span style={{ color: "#444", fontSize: "9px" }}>{item.min} {item.unit}</span>
                <span style={{ color: "#444", fontSize: "9px" }}>{item.max} {item.unit}</span>
              </div>
            </div>
          </div>
        ))}
        {!goals && (
          <p style={{ color: "#555", fontSize: "10px", margin: "4px 0 0", textAlign: "center" }}>
            Set up your profile in the Profile tab to unlock personalized goals
          </p>
        )}
      </motion.div>
    </div>
  );
}
