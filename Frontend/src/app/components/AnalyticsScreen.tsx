import { useState } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronUp, ChevronDown, Target } from "lucide-react";

const gc = {
  background: "rgba(28, 28, 30, 0.75)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  padding: "15px",
};

const calorieData = [
  { day: "Mon", calories: 1950, target: 2100 },
  { day: "Tue", calories: 2240, target: 2100 },
  { day: "Wed", calories: 1820, target: 2100 },
  { day: "Thu", calories: 2060, target: 2100 },
  { day: "Fri", calories: 1910, target: 2100 },
  { day: "Sat", calories: 2310, target: 2100 },
  { day: "Sun", calories: 1450, target: 2100 },
];

const weightData = [
  { week: "Wk 1", weight: 73.2 },
  { week: "Wk 2", weight: 72.8 },
  { week: "Wk 3", weight: 72.5 },
  { week: "Wk 4", weight: 72.4 },
];

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
  const [calorieGoal, setCalorieGoal] = useState(2100);
  const [waterGoal, setWaterGoal] = useState(10);

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
            <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[1300, 2450]} />
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
      </motion.div>

      {/* Weight Progress */}
      <motion.div style={{ ...gc, marginBottom: "11px" }} whileHover={{ boxShadow: "0 4px 22px rgba(33,150,243,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div>
            <p style={{ color: "#e0e0e6", fontSize: "13px", fontWeight: 700, margin: 0 }}>Weight Progress</p>
            <p style={{ color: "#666", fontSize: "11px", margin: 0 }}>4-week trend</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#2196F3", fontSize: "14px", fontWeight: 800, margin: 0 }}>72.4 kg</p>
            <p style={{ color: "#4CAF50", fontSize: "11px", margin: 0 }}>↓ 0.8 kg</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "7px", marginBottom: "12px" }}>
          {[
            { label: "Current", value: "72.4 kg", color: "#2196F3" },
            { label: "Target", value: "70.0 kg", color: "#4CAF50" },
            { label: "Remaining", value: "2.4 kg", color: "#FF9800" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "11px", padding: "9px 6px", textAlign: "center" }}>
              <p style={{ color: s.color, fontSize: "13px", fontWeight: 800, margin: 0 }}>{s.value}</p>
              <p style={{ color: "#555", fontSize: "9px", margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

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
            <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} domain={[69.5, 73.8]} />
            <Tooltip content={<WtTooltip />} />
            <Line
              type="monotone" dataKey="weight"
              stroke="url(#wGrad)" strokeWidth={2.5}
              dot={{ fill: "#2196F3", r: 4, stroke: "rgba(33,150,243,0.3)", strokeWidth: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
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
          { label: "Daily Calorie Goal", value: calorieGoal, unit: "kcal", color: "#FF9800", step: 50, min: 1200, max: 4000, set: setCalorieGoal },
          { label: "Daily Water Goal", value: waterGoal, unit: "glasses", color: "#2196F3", step: 1, min: 4, max: 20, set: setWaterGoal },
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
                  onClick={() => item.set((v) => Math.min(item.max, v + item.step))}
                  style={{ background: `rgba(${item.color === "#FF9800" ? "255,152,0" : "33,150,243"},0.12)`, border: `1px solid rgba(${item.color === "#FF9800" ? "255,152,0" : "33,150,243"},0.3)`, borderRadius: "8px", padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <ChevronUp size={15} color={item.color} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => item.set((v) => Math.max(item.min, v - item.step))}
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
      </motion.div>
    </div>
  );
}
