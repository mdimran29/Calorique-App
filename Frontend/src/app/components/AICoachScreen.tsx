import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, RefreshCw, ChevronDown, ChevronUp, Plus, Check, IndianRupee } from "lucide-react";
import { useGenerateDiet, useSendChatMessage, useChatHistory } from "../../hooks/useAI";
import { useCreateMeal, useDailySummary } from "../../hooks/useMeals";
import { useGoals } from "../../hooks/useGoals";
import { useAuth } from "../../hooks/useAuth";
import { today } from "../../utils/dateUtils";
import { renderMarkdown } from "../../utils/miniMarkdown";
import type { ChatFoodSuggestion } from "../../types/ai.types";

type Budget = "Basic" | "Standard" | "Premium";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
  foodSuggestions?: ChatFoodSuggestion[];
}

const gc = {
  background: "rgba(28,28,30,0.75)", backdropFilter: "blur(20px)",
  borderRadius: "18px", border: "1px solid rgba(255,255,255,0.07)", padding: "14px",
};

const WEEK_DAYS = ["Monday","Tuesday","Wednesday"]; // 3-day plan for speed
const MEAL_ICONS: Record<string,string> = { breakfast:"☀️", lunch:"🍛", dinner:"🌙", snack:"🥜" };
const MEAL_COLORS: Record<string,string> = { breakfast:"#FF9800", lunch:"#4CAF50", dinner:"#9C27B0", snack:"#2196F3" };

const GOALS = ["Muscle Gain","Fat Loss","Lean Bulk","Maintenance"] as const;
const GOAL_ICONS: Record<string,string> = {"Muscle Gain":"💪","Fat Loss":"🔥","Lean Bulk":"⚡","Maintenance":"⚖️"};
const DIET_TYPES = ["Veg","Non-Veg","Eggetarian"] as const;
const DIET_ICONS: Record<string,string> = { Veg:"🥦","Non-Veg":"🍗", Eggetarian:"🥚" };
const ALLERGY_TAGS = ["Lactose","Gluten","Nuts","Soy","Shellfish"];
const CHIPS = ["Suggest high-protein snacks","What should I eat pre-workout?","How to reduce belly fat?"];

const BUDGET_MIN = 100;
const BUDGET_MAX = 1000;
const BUDGET_PRESETS: { label: Budget; amount: number; desc: string }[] = [
  { label: "Basic", amount: 150, desc: "Budget-friendly" },
  { label: "Standard", amount: 350, desc: "Balanced" },
  { label: "Premium", amount: 700, desc: "Organic+" },
];

const getTime = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

// Map display labels → API values (still used for the fixed presets; custom text passes through as-is)
const GOAL_MAP: Record<string, string> = {
  "Muscle Gain": "muscle_gain", "Fat Loss": "fat_loss", "Lean Bulk": "lean_bulk", "Maintenance": "maintenance",
};
const DIET_MAP: Record<string, string> = {
  "Veg": "veg", "Non-Veg": "non_veg", "Eggetarian": "eggetarian",
};

function EditableChipRow({
  label, options, icons, selected, onSelect, color = "#4CAF50",
}: {
  label: string;
  options: readonly string[];
  icons?: Record<string, string>;
  selected: string;
  onSelect: (v: string) => void;
  color?: string;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const isCustomSelected = !options.includes(selected as any) && selected !== "";

  return (
    <div style={{ ...gc, marginBottom: "10px" }}>
      <p style={{ color: "#777", fontSize: "10px", fontWeight: 700, margin: "0 0 10px", letterSpacing: "0.7px" }}>{label}</p>
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
        {options.map((opt) => (
          <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => { onSelect(opt); setCustomOpen(false); }} style={{
            background: selected === opt ? `${color}29` : "rgba(255,255,255,0.04)",
            border: selected === opt ? `1px solid ${color}99` : "1px solid rgba(255,255,255,0.06)",
            borderRadius: "11px", padding: "9px 12px", cursor: "pointer",
            color: selected === opt ? color : "#888", fontSize: "11px", fontWeight: selected === opt ? 700 : 400, transition: "all 0.2s",
          }}>{icons?.[opt] ?? ""} {opt}</motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCustomOpen((v) => !v)} style={{
          background: isCustomSelected ? `${color}29` : "rgba(255,255,255,0.04)",
          border: isCustomSelected ? `1px solid ${color}99` : "1px dashed rgba(255,255,255,0.15)",
          borderRadius: "11px", padding: "9px 12px", cursor: "pointer",
          color: isCustomSelected ? color : "#666", fontSize: "11px", fontWeight: isCustomSelected ? 700 : 400, transition: "all 0.2s",
        }}>✏️ {isCustomSelected ? selected : "Other"}</motion.button>
      </div>
      <AnimatePresence>
        {customOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              <input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder={`Type your own ${label.toLowerCase()}...`}
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "8px 10px", color: "#fff", fontSize: "12px", outline: "none" }}
              />
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => { if (customValue.trim()) { onSelect(customValue.trim()); setCustomOpen(false); } }}
                style={{ background: color, border: "none", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Use
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AICoachScreen() {
  const { user } = useAuth();
  const [segment, setSegment] = useState<"generate"|"chat">("generate");
  const [goal, setGoal] = useState<string>("Muscle Gain");
  const [budgetAmount, setBudgetAmount] = useState(350);
  const [dietType, setDietType] = useState<string>("Veg");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [notes, setNotes] = useState("");
  const [showPlan, setShowPlan] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [expandedMeal, setExpandedMeal] = useState<string|null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(CHIPS);
  const [loggedKeys, setLoggedKeys] = useState<Set<string>>(new Set());
  const msgRef = useRef<HTMLDivElement>(null);

  const generateDiet = useGenerateDiet();
  const sendChat    = useSendChatMessage();
  const createMeal  = useCreateMeal();
  const { data: chatHistoryRes } = useChatHistory();
  const { data: summaryRes } = useDailySummary(today());
  const { data: goalsRes } = useGoals();

  // ── Load persisted chat history once, then generate a proactive, data-aware greeting ──
  useEffect(() => {
    if (historyLoaded) return;
    if (chatHistoryRes === undefined) return; // still loading

    const history = (chatHistoryRes.data ?? []).map((m: any) => ({
      id: m.id, role: m.role === "user" ? "user" as const : "bot" as const,
      text: m.content, time: new Date(m.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    }));

    if (history.length > 0) {
      setMessages(history);
    } else {
      const eaten = summaryRes?.data?.dailyTotals;
      const goals = goalsRes?.data;
      let greeting = `Hi${user?.name ? " " + user.name.split(" ")[0] : ""}! 👋 I'm Aria, your AI Dietitian powered by Gemini. I can help you plan meals, track macros, and give personalised nutrition advice. What can I help you with today?`;

      if (eaten && goals) {
        const remainingCal = Math.max(0, Math.round(goals.targetCalories - eaten.calories));
        const remainingProtein = Math.max(0, Math.round(goals.targetProtein - eaten.protein));
        if (eaten.calories === 0) {
          greeting = `Good to see you${user?.name ? ", " + user.name.split(" ")[0] : ""}! 👋 You haven't logged anything today yet — your target is **${goals.targetCalories} kcal**. Want a breakfast idea to get started?`;
        } else if (remainingCal > 0) {
          greeting = `Hey${user?.name ? " " + user.name.split(" ")[0] : ""}! 👋 You're at **${Math.round(eaten.calories)} / ${goals.targetCalories} kcal** today, with **${remainingProtein}g protein** left to hit your goal. Want a suggestion for your next meal?`;
        } else {
          greeting = `Nice work${user?.name ? ", " + user.name.split(" ")[0] : ""}! 🎉 You've hit your **${goals.targetCalories} kcal** target for today. Anything else I can help with — tomorrow's plan, a recipe, or workout nutrition tips?`;
        }
      }

      setMessages([{ id: "welcome", role: "bot", text: greeting, time: getTime() }]);
    }
    setHistoryLoaded(true);
  }, [chatHistoryRes, historyLoaded, summaryRes, goalsRes, user]);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages, isTyping]);

  const toggleAllergy = (a: string) =>
    setAllergies(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a]);

  const addCustomAllergy = () => {
    const v = customAllergy.trim();
    if (v && !allergies.includes(v)) setAllergies(p => [...p, v]);
    setCustomAllergy("");
  };

  const handleGenerate = async () => {
    try {
      const res = await generateDiet.mutateAsync({
        fitnessGoal: GOAL_MAP[goal] ?? goal,
        dietType:    DIET_MAP[dietType] ?? dietType,
        budgetAmountInr: budgetAmount,
        allergies,
        notes: notes.trim() || undefined,
        durationDays: 3,
      });
      const plan = (res as any)?.plan ?? (res as any)?.data?.plan;
      if (plan) {
        setPlanData(plan);
        setShowPlan(true);
        setSelectedDay(plan.days?.[0]?.day ?? "Monday");
      } else {
        alert("No plan data returned. Please try again.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? err?.message ?? "Failed to generate plan. Please try again.";
      alert(msg);
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: `u-${Date.now()}`, role:"user", text, time: getTime() };
    setMessages(p => [...p, userMsg]);
    setInput(""); setIsTyping(true);
    try {
      const res = await sendChat.mutateAsync({ message: text, context: { currentGoal: goal as any, dietType: dietType as any } });
      const data = (res as any)?.data ?? res;
      const reply = data?.message?.content ?? data?.reply ?? "I couldn't generate a response right now. Please try again.";
      const newSuggestions = data?.suggestions;
      const foodSuggestions = data?.foodSuggestions;
      if (newSuggestions?.length) setSuggestions(newSuggestions);
      setMessages(p => [...p, { id: `b-${Date.now()}`, role:"bot", text: reply, time: getTime(), foodSuggestions }]);
    } catch {
      setMessages(p => [...p, { id: `b-${Date.now()}`, role:"bot", text: "⚠️ Aria is temporarily offline. Please try again in a moment.", time: getTime() }]);
    } finally { setIsTyping(false); }
  };

  const logSuggestedFood = (msgId: string, food: ChatFoodSuggestion, idx: number) => {
    const key = `${msgId}-${idx}`;
    createMeal.mutate({
      date: today(),
      type: "snack",
      foods: [{
        name: food.name,
        quantity: 1,
        unit: food.quantity,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
      }],
    }, {
      onSuccess: () => setLoggedKeys(prev => new Set(prev).add(key)),
      onError: () => alert("Couldn't log this food. Please try adding it from the Meals tab."),
    });
  };

  const dayData = planData?.days?.find((d:any) => d.day === selectedDay);
  const dayMeals: any[] = dayData?.meals ?? [];
  const hasCosts = dayMeals.some((m: any) => typeof m.estimatedCost === "number");
  const dayCost = dayMeals.reduce((s: number, m: any) => s + (m.estimatedCost ?? 0), 0);

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"12px 14px 0",flexShrink:0}}>
        <p style={{color:"#666",fontSize:"12px",margin:0}}>Powered by Gemini AI</p>
        <p style={{color:"#fff",fontSize:"21px",fontWeight:800,margin:"0 0 12px",letterSpacing:"-0.3px"}}>AI Coach</p>
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:"12px",padding:"3px",marginBottom:"12px"}}>
          {(["generate","chat"] as const).map(s=>(
            <motion.button key={s} onClick={()=>setSegment(s)} whileTap={{scale:0.97}} style={{
              flex:1, background:segment===s?"#4CAF50":"transparent", border:"none",
              borderRadius:"10px", padding:"9px 4px", color:segment===s?"#fff":"#777",
              cursor:"pointer", fontSize:"12px", fontWeight:segment===s?700:400,
              boxShadow:segment===s?"0 2px 10px rgba(76,175,80,0.35)":"none", transition:"all 0.25s",
            }}>
              {s==="generate"?"🌿 Generate Diet":"💬 Chat with Aria"}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {segment==="generate" ? (
          <motion.div key="gen" initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:16}}
            transition={{duration:0.2}} style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>

            {!showPlan ? (
              <div>
                <EditableChipRow label="FITNESS GOAL" options={GOALS} icons={GOAL_ICONS} selected={goal} onSelect={setGoal} />

                {/* Budget — real ₹/day amount */}
                <div style={{...gc,marginBottom:"10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                    <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:0,letterSpacing:"0.7px"}}>DAILY FOOD BUDGET</p>
                    <div style={{display:"flex",alignItems:"center",gap:"3px",color:"#4CAF50",fontWeight:800,fontSize:"16px"}}>
                      <IndianRupee size={14} strokeWidth={2.5} />{budgetAmount}
                      <span style={{color:"#555",fontSize:"10px",fontWeight:400,marginLeft:"2px"}}>/day</span>
                    </div>
                  </div>
                  <input
                    type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={10}
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#4CAF50", marginBottom: "6px", cursor: "pointer" }}
                  />
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
                    <span style={{color:"#444",fontSize:"9px"}}>₹{BUDGET_MIN}</span>
                    <span style={{color:"#444",fontSize:"9px"}}>₹{BUDGET_MAX}+</span>
                  </div>
                  <div style={{display:"flex",gap:"7px"}}>
                    {BUDGET_PRESETS.map(({label,amount,desc})=>(
                      <motion.button key={label} whileTap={{scale:0.95}} onClick={()=>setBudgetAmount(amount)} style={{
                        flex:1, background: budgetAmount===amount ?"rgba(76,175,80,0.12)":"rgba(255,255,255,0.04)",
                        border: budgetAmount===amount ?"1px solid rgba(76,175,80,0.5)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"11px",padding:"8px 4px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",
                      }}>
                        <span style={{color: budgetAmount===amount ?"#4CAF50":"#888",fontSize:"11px",fontWeight:700,display:"block"}}>₹{amount}</span>
                        <span style={{color:"#444",fontSize:"9px",display:"block"}}>{desc}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <EditableChipRow label="DIET TYPE" options={DIET_TYPES} icons={DIET_ICONS} selected={dietType} onSelect={setDietType} />

                {/* Allergies + custom */}
                <div style={{...gc,marginBottom:"10px"}}>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 8px",letterSpacing:"0.7px"}}>ALLERGIES / AVOID</p>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
                    {ALLERGY_TAGS.map(a=>(
                      <motion.button key={a} whileTap={{scale:0.93}} onClick={()=>toggleAllergy(a)} style={{
                        background:allergies.includes(a)?"rgba(233,30,99,0.14)":"rgba(255,255,255,0.04)",
                        border:allergies.includes(a)?"1px solid rgba(233,30,99,0.5)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"20px",padding:"5px 12px",cursor:"pointer",
                        color:allergies.includes(a)?"#E91E63":"#777",fontSize:"11px",transition:"all 0.2s",
                      }}>{allergies.includes(a)?"✕ ":""}{a}</motion.button>
                    ))}
                    {allergies.filter(a => !ALLERGY_TAGS.includes(a)).map(a => (
                      <motion.button key={a} whileTap={{scale:0.93}} onClick={()=>toggleAllergy(a)} style={{
                        background:"rgba(233,30,99,0.14)", border:"1px solid rgba(233,30,99,0.5)",
                        borderRadius:"20px",padding:"5px 12px",cursor:"pointer", color:"#E91E63",fontSize:"11px",
                      }}>✕ {a}</motion.button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:"6px"}}>
                    <input
                      value={customAllergy}
                      onChange={(e) => setCustomAllergy(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllergy())}
                      placeholder="Something else to avoid? (e.g. mushrooms)"
                      style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"8px 10px", color:"#fff", fontSize:"12px", outline:"none" }}
                    />
                    <motion.button whileTap={{scale:0.95}} onClick={addCustomAllergy} style={{ background:"rgba(233,30,99,0.15)", border:"1px solid rgba(233,30,99,0.4)", borderRadius:"8px", padding:"8px 12px", cursor:"pointer", color:"#E91E63", display:"flex", alignItems:"center" }}>
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Notes — catch-all free text */}
                <div style={{...gc,marginBottom:"12px"}}>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 8px",letterSpacing:"0.7px"}}>ANYTHING ELSE? (OPTIONAL)</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                    placeholder="e.g. Training for a marathon, prefer 2 big meals not 4 small ones, recovering from injury, PCOS-friendly..."
                    rows={3}
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"10px", color:"#fff", fontSize:"12px", outline:"none", resize:"vertical", fontFamily:"inherit" }}
                  />
                  <p style={{color:"#444",fontSize:"9px",margin:"4px 0 0",textAlign:"right"}}>{notes.length}/500</p>
                </div>

                {/* Generate Button */}
                <motion.button whileTap={{scale:0.97}} onClick={handleGenerate}
                  disabled={generateDiet.isPending}
                  style={{
                    width:"100%", background:generateDiet.isPending?"rgba(76,175,80,0.25)":"linear-gradient(135deg,#4CAF50 0%,#2196F3 100%)",
                    border:"none",borderRadius:"16px",padding:"15px",color:"#fff",fontSize:"14px",fontWeight:700,
                    cursor:generateDiet.isPending?"default":"pointer",
                    boxShadow:generateDiet.isPending?"none":"0 6px 24px rgba(76,175,80,0.35)",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.3s",
                  }}>
                  {generateDiet.isPending ? (
                    <>
                      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:0.9,ease:"linear"}}>
                        <RefreshCw size={15}/>
                      </motion.div>
                      Generating your plan...
                    </>
                  ) : (<><Sparkles size={15}/> Generate with Gemini AI</>)}
                </motion.button>

                {generateDiet.isPending && (
                  <div style={{display:"flex",justifyContent:"center",gap:"6px",marginTop:"14px"}}>
                    {[0,1,2,3,4].map(i=>(
                      <motion.div key={i} animate={{scale:[0.7,1.3,0.7],opacity:[0.4,1,0.4]}}
                        transition={{repeat:Infinity,duration:1.2,delay:i*0.12}}
                        style={{width:"6px",height:"6px",borderRadius:"50%",background:i%2===0?"#4CAF50":"#2196F3"}}/>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* ── Generated Plan ── */
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <div>
                    <p style={{color:"#4CAF50",fontSize:"13px",fontWeight:700,margin:0}}>✅ {planData?.title ?? "Your Plan"}</p>
                    <p style={{color:"#555",fontSize:"10px",margin:"2px 0 0"}}>
                      {planData?.dailyCalories} kcal/day · P:{planData?.macros?.protein}g · C:{planData?.macros?.carbs}g · F:{planData?.macros?.fats}g
                    </p>
                  </div>
                  <motion.button whileTap={{scale:0.95}} onClick={()=>setShowPlan(false)}
                    style={{background:"rgba(255,255,255,0.06)",border:"none",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",color:"#888",fontSize:"11px"}}>
                    ↺ New Plan
                  </motion.button>
                </div>

                {/* Day selector */}
                <div style={{display:"flex",gap:"6px",marginBottom:"12px",overflowX:"auto",paddingBottom:"2px"}}>
                  {WEEK_DAYS.map(day=>(
                    <motion.button key={day} whileTap={{scale:0.93}} onClick={()=>setSelectedDay(day)} style={{
                      background:selectedDay===day?"#4CAF50":"rgba(255,255,255,0.05)",
                      border:selectedDay===day?"none":"1px solid rgba(255,255,255,0.07)",
                      borderRadius:"10px",padding:"7px 10px",cursor:"pointer",
                      color:selectedDay===day?"#fff":"#888",fontSize:"12px",fontWeight:selectedDay===day?700:400,
                      flexShrink:0,boxShadow:selectedDay===day?"0 2px 12px rgba(76,175,80,0.4)":"none",transition:"all 0.2s",
                    }}>{day.slice(0,3)}</motion.button>
                  ))}
                  {hasCosts && (
                    <div style={{ marginLeft:"auto", flexShrink:0, display:"flex", alignItems:"center", gap:"3px", background:"rgba(76,175,80,0.1)", border:"1px solid rgba(76,175,80,0.3)", borderRadius:"10px", padding:"6px 10px", color:"#4CAF50", fontSize:"11px", fontWeight:700 }}>
                      <IndianRupee size={11} />{Math.round(dayCost)} today
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={selectedDay} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.15}}>
                    {dayMeals.length===0 ? (
                      <div style={{...gc,textAlign:"center",padding:"24px"}}>
                        <p style={{color:"#555",fontSize:"12px"}}>No data for {selectedDay}</p>
                      </div>
                    ) : dayMeals.map((meal:any)=>{
                      const color = MEAL_COLORS[meal.type] ?? "#4CAF50";
                      const icon  = MEAL_ICONS[meal.type] ?? "🍽️";
                      const key   = selectedDay+meal.type;
                      const open  = expandedMeal===key;
                      return (
                        <motion.div key={meal.type} style={{...gc,marginBottom:"9px"}} whileHover={{boxShadow:`0 4px 20px ${color}18`}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                            onClick={()=>setExpandedMeal(open?null:key)}>
                            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                              <span style={{fontSize:"16px"}}>{icon}</span>
                              <div>
                                <p style={{color:"#e0e0e6",fontSize:"12px",fontWeight:700,margin:0,textTransform:"capitalize"}}>{meal.type}</p>
                                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                                  <p style={{color:color,fontSize:"11px",fontWeight:600,margin:0}}>{meal.mealCalories} kcal</p>
                                  {typeof meal.estimatedCost === "number" && (
                                    <p style={{color:"#666",fontSize:"10px",margin:0}}>· ₹{meal.estimatedCost}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                              <div style={{display:"flex",gap:"5px"}}>
                                {[{l:"P",v:meal.mealProtein,c:"#E91E63"},{l:"C",v:meal.mealCarbs,c:"#FF9800"},{l:"F",v:meal.mealFats,c:"#9C27B0"}].map(m=>(
                                  <div key={m.l} style={{background:"rgba(255,255,255,0.04)",borderRadius:"6px",padding:"3px 7px"}}>
                                    <span style={{color:m.c,fontSize:"10px",fontWeight:700}}>{m.v}g</span>
                                    <span style={{color:"#444",fontSize:"9px"}}> {m.l}</span>
                                  </div>
                                ))}
                              </div>
                              {open ? <ChevronUp size={13} color="#555"/> : <ChevronDown size={13} color="#555"/>}
                            </div>
                          </div>
                          <p style={{color:"#a0a0aa",fontSize:"12px",margin:"7px 0 0",lineHeight:1.5}}>
                            {meal.name ?? meal.foods?.map((f:any)=>f.name).join(", ")}
                          </p>
                          <AnimatePresence>
                            {open && (
                              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                                transition={{duration:0.2}} style={{overflow:"hidden"}}>
                                <div style={{marginTop:"10px",borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:"8px"}}>
                                  {meal.foods?.map((f:any,i:number)=>(
                                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
                                      <div>
                                        <p style={{color:"#ccc",fontSize:"11px",margin:0}}>{f.name}</p>
                                        <p style={{color:"#555",fontSize:"10px",margin:0}}>{f.quantity}</p>
                                      </div>
                                      <span style={{color:color,fontSize:"11px",fontWeight:600}}>{f.calories} kcal</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}

                    {planData?.tips?.length > 0 && (
                      <div style={{...gc,marginTop:"6px"}}>
                        <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 8px",letterSpacing:"0.7px"}}>💡 NUTRITION TIPS</p>
                        {planData.tips.map((tip:string,i:number)=>(
                          <p key={i} style={{color:"#a0a0aa",fontSize:"11px",margin:"0 0 5px",lineHeight:1.5}}>• {tip}</p>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Chat View ── */
          <motion.div key="chat" initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-16}}
            transition={{duration:0.2}} style={{flex:1,display:"flex",flexDirection:"column",padding:"0 14px 12px",overflow:"hidden"}}>

            <div ref={msgRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"10px",paddingBottom:"6px"}}>
              {messages.map(msg=>(
                <div key={msg.id} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",gap:"7px",alignItems:"flex-end"}}>
                  {msg.role==="bot" && (
                    <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"linear-gradient(135deg,#4CAF50,#2196F3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px"}}>🤖</div>
                  )}
                  <div style={{maxWidth:"80%"}}>
                    {msg.role==="bot" && <p style={{color:"#666",fontSize:"10px",margin:"0 0 3px 4px"}}>Aria · {msg.time}</p>}
                    <div style={{
                      background:msg.role==="user"?"linear-gradient(135deg,#4CAF50,#66BB6A)":"rgba(36,36,40,0.95)",
                      border:msg.role==="bot"?"1px solid rgba(255,255,255,0.07)":"none",
                      borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                      padding:"10px 12px",
                      boxShadow:msg.role==="user"?"0 2px 12px rgba(76,175,80,0.2)":"none",
                    }}>
                      <div style={{color:"#fff",fontSize:"12px"}}>
                        {msg.role === "bot" ? renderMarkdown(msg.text) : <p style={{margin:0,lineHeight:1.65,whiteSpace:"pre-line"}}>{msg.text}</p>}
                      </div>
                    </div>
                    {msg.role==="user" && <p style={{color:"#555",fontSize:"10px",margin:"3px 4px 0",textAlign:"right"}}>{msg.time}</p>}

                    {/* Quick-log cards for any foods Aria recommended in this reply */}
                    {msg.foodSuggestions && msg.foodSuggestions.length > 0 && (
                      <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {msg.foodSuggestions.map((food, i) => {
                          const key = `${msg.id}-${i}`;
                          const logged = loggedKeys.has(key);
                          return (
                            <div key={key} style={{ background: "rgba(76,175,80,0.06)", border: "1px solid rgba(76,175,80,0.2)", borderRadius: "12px", padding: "9px 11px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                              <div>
                                <p style={{ color: "#e0e0e6", fontSize: "12px", fontWeight: 600, margin: 0 }}>{food.name} <span style={{color:"#666",fontWeight:400}}>({food.quantity})</span></p>
                                <p style={{ color: "#666", fontSize: "10px", margin: "2px 0 0" }}>{food.calories} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fats}g</p>
                              </div>
                              <motion.button
                                whileTap={{ scale: 0.92 }}
                                disabled={logged}
                                onClick={() => logSuggestedFood(msg.id, food, i)}
                                style={{
                                  flexShrink: 0, display: "flex", alignItems: "center", gap: "4px",
                                  background: logged ? "rgba(76,175,80,0.2)" : "#4CAF50",
                                  border: "none", borderRadius: "8px", padding: "6px 10px",
                                  color: "#fff", fontSize: "10px", fontWeight: 700, cursor: logged ? "default" : "pointer",
                                }}
                              >
                                {logged ? <><Check size={11} /> Logged</> : <><Plus size={11} /> Log</>}
                              </motion.button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div style={{display:"flex",gap:"7px",alignItems:"flex-end"}}>
                  <div style={{width:"26px",height:"26px",borderRadius:"50%",background:"linear-gradient(135deg,#4CAF50,#2196F3)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px"}}>🤖</div>
                  <div style={{background:"rgba(36,36,40,0.95)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px 16px 16px 4px",padding:"11px 14px"}}>
                    <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
                      {[0,1,2].map(i=>(
                        <motion.div key={i} animate={{y:[0,-5,0]}} transition={{repeat:Infinity,duration:0.7,delay:i*0.18}}
                          style={{width:"5px",height:"5px",borderRadius:"50%",background:"#4CAF50"}}/>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick chips */}
            <div style={{flexShrink:0,marginBottom:"8px"}}>
              <div style={{display:"flex",gap:"6px",overflowX:"auto"}}>
                {suggestions.map(chip=>(
                  <motion.button key={chip} whileTap={{scale:0.94}} onClick={()=>sendMessage(chip)} style={{
                    flexShrink:0,background:"rgba(76,175,80,0.08)",border:"1px solid rgba(76,175,80,0.28)",
                    borderRadius:"20px",padding:"6px 11px",cursor:"pointer",color:"#4CAF50",fontSize:"10px",whiteSpace:"nowrap",
                  }}>{chip}</motion.button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div style={{flexShrink:0,display:"flex",gap:"8px",alignItems:"center",background:"rgba(255,255,255,0.05)",borderRadius:"14px",padding:"8px 8px 8px 14px",border:"1px solid rgba(255,255,255,0.08)"}}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&input.trim()&&sendMessage(input.trim())}
                placeholder="Ask Aria anything..."
                style={{flex:1,background:"none",border:"none",outline:"none",color:"#fff",fontSize:"13px"}}/>
              <motion.button whileTap={{scale:0.88}} onClick={()=>input.trim()&&sendMessage(input.trim())} style={{
                background:input.trim()?"#4CAF50":"rgba(255,255,255,0.08)", border:"none",borderRadius:"10px",
                padding:"8px 9px",cursor:input.trim()?"pointer":"default",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow:input.trim()?"0 2px 10px rgba(76,175,80,0.35)":"none",transition:"all 0.2s",
              }}>
                <Send size={14} color={input.trim()?"#fff":"#555"}/>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
