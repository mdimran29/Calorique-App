import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { useGenerateDiet, useSendChatMessage } from "../../hooks/useAI";

type Goal = "Muscle Gain" | "Fat Loss" | "Lean Bulk" | "Maintenance";
type Budget = "Basic" | "Standard" | "Premium";
type DietType = "Veg" | "Non-Veg" | "Eggetarian";

interface Message { id: number; role: "user" | "bot"; text: string; time: string; }

const gc = {
  background: "rgba(28,28,30,0.75)", backdropFilter: "blur(20px)",
  borderRadius: "18px", border: "1px solid rgba(255,255,255,0.07)", padding: "14px",
};

const WEEK_DAYS = ["Monday","Tuesday","Wednesday"]; // 3-day plan for speed
const MEAL_ICONS: Record<string,string> = { breakfast:"☀️", lunch:"🍛", dinner:"🌙", snack:"🥜" };
const MEAL_COLORS: Record<string,string> = { breakfast:"#FF9800", lunch:"#4CAF50", dinner:"#9C27B0", snack:"#2196F3" };

const GOALS: Goal[] = ["Muscle Gain","Fat Loss","Lean Bulk","Maintenance"];
const GOAL_ICONS: Record<Goal,string> = {"Muscle Gain":"💪","Fat Loss":"🔥","Lean Bulk":"⚡","Maintenance":"⚖️"};
const BUDGET_OPTS = [
  { label:"Basic", icon:"🪙", desc:"Budget-friendly" },
  { label:"Standard", icon:"💰", desc:"Balanced" },
  { label:"Premium", icon:"💎", desc:"Organic+" },
];
const DIET_TYPES: DietType[] = ["Veg","Non-Veg","Eggetarian"];
const DIET_ICONS: Record<DietType,string> = { Veg:"🥦","Non-Veg":"🍗", Eggetarian:"🥚" };
const ALLERGY_TAGS = ["Lactose","Gluten","Nuts","Soy","Shellfish"];
const CHIPS = ["Suggest high-protein snacks","What should I eat pre-workout?","How to reduce belly fat?"];

const getTime = () => new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});

// Map display labels → API values
const GOAL_MAP: Record<Goal, string> = {
  "Muscle Gain": "muscle_gain",
  "Fat Loss":    "fat_loss",
  "Lean Bulk":   "lean_bulk",
  "Maintenance": "maintenance",
};
const DIET_MAP: Record<DietType, string> = {
  "Veg":        "veg",
  "Non-Veg":    "non_veg",
  "Eggetarian": "eggetarian",
};
const BUDGET_MAP: Record<Budget, string> = {
  "Basic":    "basic",
  "Standard": "standard",
  "Premium":  "premium",
};

export default function AICoachScreen() {
  const [segment, setSegment] = useState<"generate"|"chat">("generate");
  const [goal, setGoal] = useState<Goal>("Muscle Gain");
  const [budget, setBudget] = useState<Budget>("Standard");
  const [dietType, setDietType] = useState<DietType>("Veg");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [showPlan, setShowPlan] = useState(false);
  const [planData, setPlanData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [expandedMeal, setExpandedMeal] = useState<string|null>(null);

  const [messages, setMessages] = useState<Message[]>([{
    id:1, role:"bot",
    text:"Hi! 👋 I'm Aria, your AI Dietitian powered by Gemini. I can help you plan meals, track macros, and give personalised nutrition advice. What can I help you with today?",
    time:"9:41 AM",
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(CHIPS);
  const msgRef = useRef<HTMLDivElement>(null);

  const generateDiet = useGenerateDiet();
  const sendChat    = useSendChatMessage();

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages, isTyping]);

  const toggleAllergy = (a: string) =>
    setAllergies(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a]);

  const handleGenerate = async () => {
    try {
      const res = await generateDiet.mutateAsync({
        fitnessGoal: GOAL_MAP[goal] as any,
        dietType:    DIET_MAP[dietType] as any,
        budget:      BUDGET_MAP[budget] as any,
        allergies,
        durationDays: 3,
      });
      // Backend returns: { success, data: { plan, dietPlanId } }
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
    const userMsg: Message = { id: Date.now(), role:"user", text, time: getTime() };
    setMessages(p => [...p, userMsg]);
    setInput(""); setIsTyping(true);
    try {
      const res = await sendChat.mutateAsync({ message: text, context: { currentGoal: goal as any, dietType: dietType as any } });
      const data = (res as any)?.data ?? res;
      const reply = data?.message?.content ?? data?.reply ?? "I couldn't generate a response right now. Please try again.";
      const newSuggestions = data?.suggestions;
      if (newSuggestions?.length) setSuggestions(newSuggestions);
      setMessages(p => [...p, { id: Date.now()+1, role:"bot", text: reply, time: getTime() }]);
    } catch {
      setMessages(p => [...p, { id: Date.now()+1, role:"bot", text: "⚠️ Aria is temporarily offline. Please try again in a moment.", time: getTime() }]);
    } finally { setIsTyping(false); }
  };

  const dayData = planData?.days?.find((d:any) => d.day === selectedDay);
  const dayMeals: any[] = dayData?.meals ?? [];

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
                {/* Fitness Goal */}
                <div style={{...gc,marginBottom:"10px"}}>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 10px",letterSpacing:"0.7px"}}>FITNESS GOAL</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
                    {GOALS.map(g=>(
                      <motion.button key={g} whileTap={{scale:0.95}} onClick={()=>setGoal(g)} style={{
                        background:goal===g?"rgba(76,175,80,0.16)":"rgba(255,255,255,0.04)",
                        border:goal===g?"1px solid rgba(76,175,80,0.6)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"11px",padding:"10px 6px",cursor:"pointer",
                        color:goal===g?"#4CAF50":"#888",fontSize:"11px",fontWeight:goal===g?700:400,transition:"all 0.2s",
                      }}>{GOAL_ICONS[g]} {g}</motion.button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div style={{...gc,marginBottom:"10px"}}>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 10px",letterSpacing:"0.7px"}}>DIET BUDGET</p>
                  <div style={{display:"flex",gap:"7px"}}>
                    {BUDGET_OPTS.map(({label,icon,desc})=>(
                      <motion.button key={label} whileTap={{scale:0.95}} onClick={()=>setBudget(label as Budget)} style={{
                        flex:1, background:budget===label?"rgba(76,175,80,0.12)":"rgba(255,255,255,0.04)",
                        border:budget===label?"1px solid rgba(76,175,80,0.5)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"11px",padding:"10px 4px",cursor:"pointer",textAlign:"center",transition:"all 0.2s",
                      }}>
                        <span style={{fontSize:"17px",display:"block"}}>{icon}</span>
                        <span style={{color:budget===label?"#4CAF50":"#888",fontSize:"11px",fontWeight:budget===label?700:400,display:"block"}}>{label}</span>
                        <span style={{color:"#444",fontSize:"9px",display:"block"}}>{desc}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Diet Type + Allergies */}
                <div style={{...gc,marginBottom:"12px"}}>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 10px",letterSpacing:"0.7px"}}>DIET TYPE</p>
                  <div style={{display:"flex",gap:"7px",marginBottom:"14px"}}>
                    {DIET_TYPES.map(d=>(
                      <motion.button key={d} whileTap={{scale:0.95}} onClick={()=>setDietType(d)} style={{
                        flex:1, background:dietType===d?"rgba(76,175,80,0.12)":"rgba(255,255,255,0.04)",
                        border:dietType===d?"1px solid rgba(76,175,80,0.5)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"11px",padding:"9px 4px",cursor:"pointer",
                        color:dietType===d?"#4CAF50":"#888",fontSize:"11px",fontWeight:dietType===d?700:400,transition:"all 0.2s",
                      }}>{DIET_ICONS[d]} {d}</motion.button>
                    ))}
                  </div>
                  <p style={{color:"#777",fontSize:"10px",fontWeight:700,margin:"0 0 8px",letterSpacing:"0.7px"}}>ALLERGIES / AVOID</p>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {ALLERGY_TAGS.map(a=>(
                      <motion.button key={a} whileTap={{scale:0.93}} onClick={()=>toggleAllergy(a)} style={{
                        background:allergies.includes(a)?"rgba(233,30,99,0.14)":"rgba(255,255,255,0.04)",
                        border:allergies.includes(a)?"1px solid rgba(233,30,99,0.5)":"1px solid rgba(255,255,255,0.06)",
                        borderRadius:"20px",padding:"5px 12px",cursor:"pointer",
                        color:allergies.includes(a)?"#E91E63":"#777",fontSize:"11px",transition:"all 0.2s",
                      }}>{allergies.includes(a)?"✕ ":""}{a}</motion.button>
                    ))}
                  </div>
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
                    <p style={{color:"#4CAF50",fontSize:"13px",fontWeight:700,margin:0}}>✅ {planData?.title ?? "Your 7-Day Plan"}</p>
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
                                <p style={{color:color,fontSize:"11px",fontWeight:600,margin:0}}>{meal.mealCalories} kcal</p>
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
                          {/* Meal name */}
                          <p style={{color:"#a0a0aa",fontSize:"12px",margin:"7px 0 0",lineHeight:1.5}}>
                            {meal.name ?? meal.foods?.map((f:any)=>f.name).join(", ")}
                          </p>
                          {/* Expanded foods */}
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

                    {/* Tips */}
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
                  <div style={{maxWidth:"76%"}}>
                    {msg.role==="bot" && <p style={{color:"#666",fontSize:"10px",margin:"0 0 3px 4px"}}>Aria · {msg.time}</p>}
                    <div style={{
                      background:msg.role==="user"?"linear-gradient(135deg,#4CAF50,#66BB6A)":"rgba(36,36,40,0.95)",
                      border:msg.role==="bot"?"1px solid rgba(255,255,255,0.07)":"none",
                      borderRadius:msg.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                      padding:"10px 12px",
                      boxShadow:msg.role==="user"?"0 2px 12px rgba(76,175,80,0.2)":"none",
                    }}>
                      <p style={{color:"#fff",fontSize:"12px",margin:0,lineHeight:1.65,whiteSpace:"pre-line"}}>{msg.text}</p>
                    </div>
                    {msg.role==="user" && <p style={{color:"#555",fontSize:"10px",margin:"3px 4px 0",textAlign:"right"}}>{msg.time}</p>}
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
