import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Camera, X, CheckCircle2 } from "lucide-react";
import { useTodayMeals, useCreateMeal } from "../../hooks/useMeals";
import { mealsApi } from "../../api/meals.api";
import { today } from "../../utils/dateUtils";

const gc = {
  background: "rgba(28, 28, 30, 0.75)",
  backdropFilter: "blur(20px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.07)",
  padding: "14px",
};

export default function MealsScreen() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [portionGrams, setPortionGrams] = useState(100);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [addTarget, setAddTarget] = useState("breakfast");

  const todayStr = today();
  const { data: mealsResponse, isLoading } = useTodayMeals();
  const createMealMutation = useCreateMeal();

  const dailyDoc = mealsResponse?.data?.meals?.[0];
  const loggedMeals = dailyDoc?.meals || [];
  const dailyTotals = dailyDoc?.dailyTotals || { calories: 0, protein: 0, carbs: 0, fats: 0 };

  const MEAL_CATEGORIES = [
    { type: "breakfast", label: "Breakfast", icon: "☀️", color: "#FF9800" },
    { type: "lunch", label: "Lunch", icon: "🍛", color: "#4CAF50" },
    { type: "dinner", label: "Dinner", icon: "🌙", color: "#9C27B0" },
    { type: "snack", label: "Snacks", icon: "🥜", color: "#2196F3" },
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      const delayFn = setTimeout(() => {
        mealsApi.searchFood(searchQuery).then(res => {
          setSearchResults(res.data.results || []);
        });
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    setSelectedFood(null);
    setTimeout(() => {
      setIsScanning(false);
      const mocked = { id: 99, name: "Amul Butter", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, unit: "100g" };
      setScanResult("Amul Butter — 717 kcal per 100g");
      setSelectedFood(mocked);
      setPortionGrams(10);
    }, 2600);
  };

  const calcNutrient = (base: number) => Math.round(((base || 0) * portionGrams) / 100 * 10) / 10;

  const handleAdd = () => {
    if (!selectedFood) return;
    
    createMealMutation.mutate({
      date: todayStr,
      type: addTarget,
      foods: [{
        name: selectedFood.name,
        quantity: portionGrams,
        unit: "g",
        calories: calcNutrient(selectedFood.calories),
        protein: calcNutrient(selectedFood.protein),
        carbs: calcNutrient(selectedFood.carbs),
        fats: calcNutrient(selectedFood.fat),
      }]
    }, {
      onSuccess: () => {
        setAdded(true);
        setTimeout(() => {
          setShowModal(false);
          setAdded(false);
          setSearchQuery("");
          setSelectedFood(null);
          setScanResult(null);
          setPortionGrams(100);
        }, 1400);
      },
      onError: (err) => {
        console.error("Failed to add meal:", err);
        alert("Failed to save meal. Please try again.");
      }
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchQuery("");
    setSelectedFood(null);
    setScanResult(null);
    setIsScanning(false);
    setPortionGrams(100);
  };

  return (
    <div style={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 8px", boxSizing: "border-box" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <p style={{ color: "#666", fontSize: "12px", margin: 0 }}>Today's Log</p>
            <p style={{ color: "#fff", fontSize: "21px", fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>Meal Tracker</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#666", fontSize: "10px", margin: 0, letterSpacing: "0.4px" }}>TOTAL EATEN</p>
            <p style={{ color: "#FF9800", fontSize: "16px", fontWeight: 800, margin: 0 }}>
              {Math.round(dailyTotals.calories).toLocaleString()} kcal
            </p>
          </div>
        </div>

        {/* Meal cards */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Loading meals...</div>
        ) : (
          MEAL_CATEGORIES.map((cat) => {
            const catMeals = loggedMeals.filter((m: any) => m.type === cat.type);
            const totalCal = catMeals.reduce((acc: number, m: any) => acc + m.totalCalories, 0);
            const isEmpty = catMeals.length === 0;

            return (
              <motion.div
                key={cat.type}
                style={{ ...gc, marginBottom: "10px" }}
                whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isEmpty ? 0 : "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{cat.icon}</span>
                    <div>
                      <p style={{ color: "#fff", fontSize: "13px", fontWeight: 700, margin: 0 }}>{cat.label}</p>
                      {!isEmpty && (
                        <p style={{ color: cat.color, fontSize: "11px", fontWeight: 600, margin: 0 }}>{Math.round(totalCal)} kcal</p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setAddTarget(cat.type); setShowModal(true); }}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: "8px", padding: "5px 10px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "4px",
                    }}
                  >
                    <Plus size={12} color="#888" />
                    <span style={{ color: "#888", fontSize: "11px" }}>Add</span>
                  </motion.button>
                </div>

                {isEmpty ? (
                  <div style={{ padding: "10px 0", textAlign: "center" }}>
                    <p style={{ color: "#444", fontSize: "12px", margin: 0 }}>
                      Not logged yet. Tap '+' to add {cat.label.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {catMeals.map((meal: any, i: number) => (
                      <div key={i}>
                        {meal.foods.map((food: any, fi: number) => (
                          <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "4px" }}>
                            <span style={{ color: "#b0b0b8", fontSize: "12px" }}>{food.name} ({food.quantity}{food.unit})</span>
                            <span style={{ color: cat.color, fontSize: "12px", fontWeight: 600 }}>{Math.round(food.calories)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div style={{ height: "8px" }} />
      </div>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", zIndex: 10 }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "#1c1c1e",
                borderRadius: "24px 24px 0 0",
                border: "1px solid rgba(255,255,255,0.08)",
                zIndex: 20, maxHeight: "78%",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: "36px", height: "4px", background: "#333", borderRadius: "2px" }} />
              </div>

              <div style={{ padding: "0 16px 28px", overflowY: "auto", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <p style={{ color: "#fff", fontSize: "16px", fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>Add to {addTarget}</p>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={closeModal}
                    style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={14} color="#aaa" />
                  </motion.button>
                </div>

                {/* Search + Scan */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Search size={13} color="#666" />
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedFood(null); setScanResult(null); }}
                      placeholder="Search global foods..."
                      style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: "13px", flex: 1 }}
                    />
                    {searchQuery.length > 0 && (
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSearchQuery(""); setSelectedFood(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        <X size={12} color="#666" />
                      </motion.button>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleScan}
                    title="Scan Barcode"
                    style={{
                      background: isScanning ? "rgba(76,175,80,0.15)" : "rgba(255,255,255,0.05)",
                      border: isScanning ? "1px solid rgba(76,175,80,0.5)" : "1px solid rgba(255,255,255,0.07)",
                      borderRadius: "12px", padding: "10px 13px", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "5px",
                    }}
                  >
                    <Camera size={15} color={isScanning ? "#4CAF50" : "#888"} />
                    <span style={{ color: isScanning ? "#4CAF50" : "#888", fontSize: "11px" }}>Scan</span>
                  </motion.button>
                </div>

                {/* Scanner viewport */}
                {isScanning && (
                  <div style={{ marginBottom: "12px", borderRadius: "14px", overflow: "hidden", position: "relative", height: "110px", background: "#000" }}>
                    <div style={{ position: "absolute", top: "10px", left: "10px", width: "18px", height: "18px", borderTop: "2px solid #4CAF50", borderLeft: "2px solid #4CAF50", borderRadius: "2px 0 0 0" }} />
                    <div style={{ position: "absolute", top: "10px", right: "10px", width: "18px", height: "18px", borderTop: "2px solid #4CAF50", borderRight: "2px solid #4CAF50", borderRadius: "0 2px 0 0" }} />
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "18px", height: "18px", borderBottom: "2px solid #4CAF50", borderLeft: "2px solid #4CAF50", borderRadius: "0 0 0 2px" }} />
                    <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "18px", height: "18px", borderBottom: "2px solid #4CAF50", borderRight: "2px solid #4CAF50", borderRadius: "0 0 2px 0" }} />
                    <motion.div
                      animate={{ top: ["15%", "82%", "15%"] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                      style={{ position: "absolute", left: "10px", right: "10px", height: "2px", background: "rgba(76,175,80,0.9)", boxShadow: "0 0 10px #4CAF50, 0 0 20px #4CAF50" }}
                    />
                    <p style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", color: "#4CAF50", fontSize: "10px", margin: 0, whiteSpace: "nowrap" }}>Scanning barcode...</p>
                  </div>
                )}

                {/* Scan result banner */}
                {scanResult && !isScanning && (
                  <div style={{ marginBottom: "12px", padding: "10px 12px", background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <CheckCircle2 size={14} color="#4CAF50" />
                    <div>
                      <p style={{ color: "#4CAF50", fontSize: "12px", fontWeight: 600, margin: 0 }}>Scanned successfully</p>
                      <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>{scanResult}</p>
                    </div>
                  </div>
                )}

                {/* Search results */}
                {searchResults.length > 0 && !selectedFood && (
                  <div style={{ marginBottom: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {searchResults.map((food, i) => (
                      <motion.div
                        key={food.id}
                        whileTap={{ scale: 0.99, background: "rgba(255,255,255,0.05)" }}
                        onClick={() => { setSelectedFood(food); setSearchQuery(food.name); setPortionGrams(100); }}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "11px 14px", cursor: "pointer",
                          borderBottom: i < searchResults.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}
                      >
                        <div>
                          <p style={{ color: "#e0e0e6", fontSize: "13px", margin: 0, fontWeight: 500 }}>{food.name}</p>
                          <p style={{ color: "#666", fontSize: "10px", margin: 0 }}>P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ color: "#FF9800", fontSize: "13px", fontWeight: 700, margin: 0 }}>{food.calories}</p>
                          <p style={{ color: "#555", fontSize: "10px", margin: 0 }}>kcal/100g</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Portion + macros */}
                {selectedFood && (
                  <div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
                      <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: "0 0 8px" }}>{selectedFood.name}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "#b0b0b8", fontSize: "12px" }}>Portion Size</span>
                        <span style={{ color: "#FF9800", fontSize: "12px", fontWeight: 700 }}>{portionGrams}g</span>
                      </div>
                      <input
                        type="range" min={10} max={500} step={5}
                        value={portionGrams}
                        onChange={(e) => setPortionGrams(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "#FF9800", marginBottom: "4px", cursor: "pointer" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#444", fontSize: "10px" }}>10g</span>
                        <span style={{ color: "#444", fontSize: "10px" }}>500g</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
                      {[
                        { label: "Calories", value: calcNutrient(selectedFood.calories), unit: "kcal", color: "#FF9800" },
                        { label: "Protein", value: calcNutrient(selectedFood.protein), unit: "g", color: "#E91E63" },
                        { label: "Carbs", value: calcNutrient(selectedFood.carbs), unit: "g", color: "#FF9800" },
                        { label: "Fat", value: calcNutrient(selectedFood.fat), unit: "g", color: "#9C27B0" },
                      ].map((m) => (
                        <div key={m.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "9px 5px", textAlign: "center" }}>
                          <p style={{ color: m.color, fontSize: "14px", fontWeight: 800, margin: 0 }}>{m.value}</p>
                          <p style={{ color: "#555", fontSize: "9px", margin: "1px 0 0" }}>{m.label}</p>
                        </div>
                      ))}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAdd}
                      disabled={createMealMutation.isPending}
                      style={{
                        width: "100%",
                        background: added ? "#4CAF50" : "linear-gradient(135deg, #4CAF50, #66BB6A)",
                        border: "none", borderRadius: "14px", padding: "14px",
                        color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(76,175,80,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                        transition: "background 0.2s",
                        opacity: createMealMutation.isPending ? 0.7 : 1,
                      }}
                    >
                      {added ? <><CheckCircle2 size={16} /> Added!</> : 
                       createMealMutation.isPending ? "Adding..." : <><Plus size={16} /> Add to <span style={{textTransform:'capitalize'}}>{addTarget}</span></>}
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
