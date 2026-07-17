import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Search, Camera, X, CheckCircle2, AlertCircle, Keyboard } from "lucide-react";
import { useTodayMeals, useCreateMeal } from "../../hooks/useMeals";
import { mealsApi } from "../../api/meals.api";
import { nutritionApi } from "../../api/nutrition.api";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
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
  const [portionMode, setPortionMode] = useState<"pieces" | "grams">("grams");
  const [pieceCount, setPieceCount] = useState(1);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [added, setAdded] = useState(false);
  const [addTarget, setAddTarget] = useState("breakfast");

  const { videoRef, status: scanStatus, isSupported: scannerSupported, start: startScan, stop: stopScan } = useBarcodeScanner();
  const isScanning = scanStatus === "starting" || scanStatus === "scanning";

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

  // Centralizes portion defaults whenever a food is picked (search click, barcode scan).
  // Foods with a known piece size (roti, idli, puri...) default to a pieces stepper;
  // everything else (rice, dal, packaged/barcode items) defaults to a grams slider.
  const selectFood = (food: any) => {
    setSelectedFood(food);
    if (food.pieceGrams) {
      setPortionMode("pieces");
      setPieceCount(1);
      setPortionGrams(food.pieceGrams);
    } else {
      setPortionMode("grams");
      setPortionGrams(100);
    }
  };

  const lookupBarcode = async (barcode: string) => {
    setIsLookingUp(true);
    setScanError(null);
    try {
      const res = await nutritionApi.getBarcode(barcode);
      const product = res.data;
      const food = {
        id: `barcode_${barcode}`,
        name: product.brand ? `${product.name} (${product.brand})` : product.name,
        calories: product.calories,
        protein: product.protein,
        carbs: product.carbs,
        fat: product.fats,
        unit: "100g",
      };
      setScanResult(`${food.name} — ${Math.round(food.calories)} kcal per 100g`);
      selectFood(food);
    } catch (err: any) {
      setScanError(
        err?.response?.status === 404
          ? "Product not found for this barcode. Try searching by name instead."
          : "Couldn't look up this barcode. Please try again."
      );
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleScan = () => {
    setScanResult(null);
    setScanError(null);
    setSelectedFood(null);
    startScan((code) => {
      stopScan();
      lookupBarcode(code);
    });
  };

  const handleManualBarcodeSubmit = () => {
    if (!manualBarcode.trim()) return;
    setScanResult(null);
    setSelectedFood(null);
    lookupBarcode(manualBarcode.trim());
  };

  // Dataset macros are given per the food's natural unit: per-piece for piece foods
  // (e.g. Roti = 104 kcal per 40g piece), per-100g otherwise. The scale factor
  // reflects how many "natural units" the chosen portion represents.
  const scaleFactor =
    portionMode === "pieces" && selectedFood?.pieceGrams
      ? pieceCount
      : portionGrams / 100;

  const calcNutrient = (base: number) => Math.round((base || 0) * scaleFactor * 10) / 10;

  const resetPortionState = () => {
    setPortionMode("grams");
    setPortionGrams(100);
    setPieceCount(1);
  };

  const handleAdd = () => {
    if (!selectedFood) return;

    const quantity = portionMode === "pieces" && selectedFood.pieceGrams ? pieceCount : portionGrams;
    const unit = portionMode === "pieces" && selectedFood.pieceGrams ? (selectedFood.pieceLabel ?? "piece") : "g";

    createMealMutation.mutate({
      date: todayStr,
      type: addTarget,
      foods: [{
        name: selectedFood.name,
        quantity,
        unit,
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
          resetPortionState();
        }, 1400);
      },
      onError: (err) => {
        console.error("Failed to add meal:", err);
        alert("Failed to save meal. Please try again.");
      }
    });
  };

  const closeModal = () => {
    stopScan();
    setShowModal(false);
    setSearchQuery("");
    setSelectedFood(null);
    setScanResult(null);
    setScanError(null);
    setManualBarcode("");
    resetPortionState();
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

        {/* Daily Macros Summary */}
        {!isLoading && dailyTotals.calories > 0 && (
          <div style={{ ...gc, marginBottom: "10px", display: "flex", gap: "8px" }}>
            {[
              { label: "Protein", value: dailyTotals.protein, color: "#E91E63" },
              { label: "Carbs", value: dailyTotals.carbs, color: "#FF9800" },
              { label: "Fat", value: dailyTotals.fats, color: "#9C27B0" },
            ].map((m) => (
              <div key={m.label} style={{ flex: 1, textAlign: "center" }}>
                <p style={{ color: m.color, fontSize: "16px", fontWeight: 800, margin: 0 }}>{Math.round(m.value * 10) / 10}g</p>
                <p style={{ color: "#666", fontSize: "10px", margin: "2px 0 0" }}>{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Meal cards */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Loading meals...</div>
        ) : (
          MEAL_CATEGORIES.map((cat) => {
            const catMeals = loggedMeals.filter((m: any) => m.type === cat.type);
            const totalCal = catMeals.reduce((acc: number, m: any) => acc + m.totalCalories, 0);
            const totalProtein = catMeals.reduce((acc: number, m: any) => acc + m.totalProtein, 0);
            const totalCarbs = catMeals.reduce((acc: number, m: any) => acc + m.totalCarbs, 0);
            const totalFats = catMeals.reduce((acc: number, m: any) => acc + m.totalFats, 0);
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
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <p style={{ color: cat.color, fontSize: "11px", fontWeight: 600, margin: 0 }}>{Math.round(totalCal)} kcal</p>
                          <p style={{ color: "#555", fontSize: "10px", margin: 0 }}>
                            · P:{Math.round(totalProtein)}g C:{Math.round(totalCarbs)}g F:{Math.round(totalFats)}g
                          </p>
                        </div>
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
                          <div key={fi} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ color: "#b0b0b8", fontSize: "12px" }}>{food.name} ({food.quantity}{food.unit})</span>
                              <span style={{ color: cat.color, fontSize: "12px", fontWeight: 600 }}>{Math.round(food.calories)} kcal</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                              <span style={{ color: "#E91E63", fontSize: "10px" }}>P: {Math.round(food.protein * 10) / 10}g</span>
                              <span style={{ color: "#FF9800", fontSize: "10px" }}>C: {Math.round(food.carbs * 10) / 10}g</span>
                              <span style={{ color: "#9C27B0", fontSize: "10px" }}>F: {Math.round(food.fats * 10) / 10}g</span>
                            </div>
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

                {/* Scanner viewport — real camera feed via BarcodeDetector */}
                {isScanning && (
                  <div style={{ marginBottom: "12px", borderRadius: "14px", overflow: "hidden", position: "relative", height: "150px", background: "#000" }}>
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div style={{ position: "absolute", top: "10px", left: "10px", width: "18px", height: "18px", borderTop: "2px solid #4CAF50", borderLeft: "2px solid #4CAF50", borderRadius: "2px 0 0 0" }} />
                    <div style={{ position: "absolute", top: "10px", right: "10px", width: "18px", height: "18px", borderTop: "2px solid #4CAF50", borderRight: "2px solid #4CAF50", borderRadius: "0 2px 0 0" }} />
                    <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "18px", height: "18px", borderBottom: "2px solid #4CAF50", borderLeft: "2px solid #4CAF50", borderRadius: "0 0 0 2px" }} />
                    <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "18px", height: "18px", borderBottom: "2px solid #4CAF50", borderRight: "2px solid #4CAF50", borderRadius: "0 0 2px 0" }} />
                    <motion.div
                      animate={{ top: ["15%", "82%", "15%"] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                      style={{ position: "absolute", left: "10px", right: "10px", height: "2px", background: "rgba(76,175,80,0.9)", boxShadow: "0 0 10px #4CAF50, 0 0 20px #4CAF50" }}
                    />
                    <p style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", color: "#4CAF50", fontSize: "10px", margin: 0, whiteSpace: "nowrap" }}>Point camera at barcode...</p>
                  </div>
                )}

                {isLookingUp && (
                  <div style={{ marginBottom: "12px", padding: "12px", textAlign: "center", color: "#888", fontSize: "12px" }}>
                    Looking up product...
                  </div>
                )}

                {/* Unsupported browser fallback — manual barcode entry */}
                {!scannerSupported && !selectedFood && (
                  <div style={{ marginBottom: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <Keyboard size={13} color="#666" />
                      <p style={{ color: "#888", fontSize: "11px", margin: 0 }}>Camera scan isn't supported in this browser — enter barcode manually</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => e.key === "Enter" && handleManualBarcodeSubmit()}
                        placeholder="e.g. 8901058851279"
                        inputMode="numeric"
                        style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "8px 10px", color: "#fff", fontSize: "12px", outline: "none" }}
                      />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleManualBarcodeSubmit}
                        disabled={!manualBarcode.trim() || isLookingUp}
                        style={{ background: "#4CAF50", border: "none", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: manualBarcode.trim() ? "pointer" : "default", opacity: manualBarcode.trim() ? 1 : 0.5 }}
                      >
                        Look up
                      </motion.button>
                    </div>
                  </div>
                )}

                {scanStatus === "denied" && (
                  <div style={{ marginBottom: "12px", padding: "10px 12px", background: "rgba(233,30,99,0.08)", border: "1px solid rgba(233,30,99,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <AlertCircle size={14} color="#E91E63" />
                    <p style={{ color: "#E91E63", fontSize: "11px", margin: 0 }}>Camera access denied. Enable it in your browser settings, or enter the barcode manually below.</p>
                  </div>
                )}

                {scanError && (
                  <div style={{ marginBottom: "12px", padding: "10px 12px", background: "rgba(233,30,99,0.08)", border: "1px solid rgba(233,30,99,0.25)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "7px" }}>
                    <AlertCircle size={14} color="#E91E63" />
                    <p style={{ color: "#E91E63", fontSize: "11px", margin: 0 }}>{scanError}</p>
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
                        onClick={() => { selectFood(food); setSearchQuery(food.name); }}
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
                          <p style={{ color: "#555", fontSize: "10px", margin: 0 }}>kcal / {food.pieceLabel ? `1 ${food.pieceLabel}` : "100g"}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Portion + macros */}
                {selectedFood && (
                  <div>
                    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: 0 }}>{selectedFood.name}</p>
                        {selectedFood.pieceGrams && (
                          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: "8px", padding: "2px" }}>
                            {(["pieces", "grams"] as const).map((mode) => (
                              <button
                                key={mode}
                                onClick={() => {
                                  if (mode === portionMode) return;
                                  if (mode === "pieces") {
                                    setPieceCount(Math.max(1, Math.round(portionGrams / selectedFood.pieceGrams)));
                                    setPortionMode("pieces");
                                  } else {
                                    setPortionGrams(pieceCount * selectedFood.pieceGrams);
                                    setPortionMode("grams");
                                  }
                                }}
                                style={{
                                  background: portionMode === mode ? "#FF9800" : "transparent",
                                  border: "none", borderRadius: "6px", padding: "5px 10px", cursor: "pointer",
                                  color: portionMode === mode ? "#fff" : "#888", fontSize: "11px", fontWeight: portionMode === mode ? 700 : 400,
                                  textTransform: "capitalize",
                                }}
                              >
                                {mode === "pieces" ? (selectedFood.pieceLabel ? `${selectedFood.pieceLabel}s` : "pieces") : "grams"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {portionMode === "pieces" && selectedFood.pieceGrams ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ color: "#b0b0b8", fontSize: "12px" }}>
                            Quantity <span style={{ color: "#555" }}>({selectedFood.pieceGrams}g per {selectedFood.pieceLabel ?? "piece"})</span>
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              onClick={() => setPieceCount((c) => Math.max(1, c - 1))}
                              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >−</motion.button>
                            <span style={{ color: "#FF9800", fontSize: "16px", fontWeight: 800, minWidth: "20px", textAlign: "center" }}>{pieceCount}</span>
                            <motion.button
                              whileTap={{ scale: 0.88 }}
                              onClick={() => setPieceCount((c) => Math.min(20, c + 1))}
                              style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(255,152,0,0.15)", border: "1px solid rgba(255,152,0,0.4)", color: "#FF9800", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >+</motion.button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
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
