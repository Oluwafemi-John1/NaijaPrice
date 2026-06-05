import React, { useState, useEffect, FormEvent } from "react";
import {
  Search,
  Plus,
  MapPin,
  User,
  Calendar,
  Sparkles,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Menu,
  X,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  ChevronRight,
  Info,
  Layers,
  ArrowRight
} from "lucide-react";
import { PriceReport, SupportedLanguage, LanguageCopy } from "./types";
import { INITIAL_REPORTS, LANGUAGE_TRANSLATIONS } from "./data";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { db, auth, loginWithGoogle, logout, OperationType, handleFirestoreError } from "./firebase";

export default function App() {
  // Firebase Authentication UI states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Application states
  const [reports, setReports] = useState<PriceReport[]>(INITIAL_REPORTS);

  const [activeTab, setActiveTab] = useState<"home" | "submit" | "compare" | "admin">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");
  
  // Submit Drawer controls
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerProductName, setDrawerProductName] = useState("");
  const [drawerCategory, setDrawerCategory] = useState<"food" | "fuel" | "construction" | "other">("food");
  const [drawerPrice, setDrawerPrice] = useState("");
  const [drawerUnit, setDrawerUnit] = useState("Per kg");
  const [drawerMarket, setDrawerMarket] = useState("");
  const [drawerState, setDrawerState] = useState("Lagos");
  const [drawerDate, setDrawerDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [drawerContributor, setDrawerContributor] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [drawerComments, setDrawerComments] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Compare Page states
  const [compareProduct, setCompareProduct] = useState("Petrol (PMS)");

  // Mobile Menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // Validate Firestore Connection on App Init
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Live Price Reports from Firestore
  useEffect(() => {
    const reportsCol = collection(db, "reports");
    const unsubscribe = onSnapshot(reportsCol, (snapshot) => {
      const list: PriceReport[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PriceReport);
      });

      if (list.length === 0) {
        setReports(INITIAL_REPORTS);
      } else {
        // Sort descending by ID to show latest reports first
        list.sort((a, b) => b.id.localeCompare(a.id));
        setReports(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "reports");
    });

    return () => unsubscribe();
  }, []);

  // Handle trigger notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Google Login handling
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      triggerNotification("Successfully signed in with Google!");
    } catch (err) {
      console.error(err);
      triggerNotification("Google sign-in failed.");
    }
  };

  // Logout handling
  const handleLogout = async () => {
    try {
      await logout();
      triggerNotification("Successfully signed out.");
    } catch (err) {
      console.error(err);
      triggerNotification("Logout failed.");
    }
  };

  // Upvote/Downvote interactions in Firestore safely (Attribute-Based Access Control)
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!user) {
      triggerNotification("Please sign in with Google to cast votes!");
      return;
    }

    const report = reports.find((r) => r.id === id);
    if (!report) return;

    const currentUid = user.uid;
    const voters = report.voters || {};
    const previousVote = voters[currentUid];

    let newUpvotes = report.upvotes || 0;
    let newDownvotes = report.downvotes || 0;
    const nextVoters = { ...voters };

    if (previousVote === type) {
      // Undo same vote
      if (type === "up") newUpvotes = Math.max(0, newUpvotes - 1);
      else newDownvotes = Math.max(0, newDownvotes - 1);
      delete nextVoters[currentUid];
    } else {
      // Changing vote or initial vote
      if (previousVote === "up") newUpvotes = Math.max(0, newUpvotes - 1);
      if (previousVote === "down") newDownvotes = Math.max(0, newDownvotes - 1);

      if (type === "up") newUpvotes++;
      else newDownvotes++;
      nextVoters[currentUid] = type;
    }

    try {
      await updateDoc(doc(db, "reports", id), {
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        voters: nextVoters
      });
      triggerNotification(type === "up" ? "Thank you for confirming this price!" : "Thank you for flagging potential discrepancy!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${id}`);
    }
  };

  // Submit report handler
  const handleAddReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!drawerProductName || !drawerPrice || !drawerMarket) {
      alert("Please fill in main details (Product Name, Price, and Market Location)");
      return;
    }

    const priceNum = parseFloat(drawerPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    if (!user) {
      alert("Please sign in with Google in the top-right corner to submit a price report!");
      return;
    }

    // Determine default icon based on name
    let icon = "🛒";
    const nameLower = drawerProductName.toLowerCase();
    if (nameLower.includes("egg")) icon = "🥚";
    else if (nameLower.includes("fuel") || nameLower.includes("petrol") || nameLower.includes("pms") || nameLower.includes("diesel")) icon = "⛽";
    else if (nameLower.includes("cement")) icon = "🧱";
    else if (nameLower.includes("garri") || nameLower.includes("semovita") || nameLower.includes("cassava")) icon = "🥣";
    else if (nameLower.includes("tomato") || nameLower.includes("pepper") || nameLower.includes("tatashe")) icon = "🍅";
    else if (nameLower.includes("rice")) icon = "🌾";
    else if (nameLower.includes("yam")) icon = "🥔";
    else if (nameLower.includes("onion")) icon = "🧅";

    // Lookup previous prices of the same product to estimate trend direction
    const matchingProducts = reports.filter(
      (r) => r.productName.toLowerCase() === drawerProductName.toLowerCase()
    );
    let trend: "up" | "down" | "stable" = "stable";
    let changePercent = 0;
    let prevPrice = priceNum;

    if (matchingProducts.length > 0) {
      const avgPrice = matchingProducts.reduce((sum, curr) => sum + curr.price, 0) / matchingProducts.length;
      prevPrice = avgPrice;
      if (priceNum > avgPrice * 1.02) {
        trend = "up";
        changePercent = Math.round(((priceNum - avgPrice) / avgPrice) * 100);
      } else if (priceNum < avgPrice * 0.98) {
        trend = "down";
        changePercent = Math.round(((avgPrice - priceNum) / avgPrice) * 100);
      }
    }

    const reportId = "report-" + Date.now();
    const newReport: PriceReport & { voters: Record<string, "up" | "down"> } = {
      id: reportId,
      productName: drawerProductName,
      category: drawerCategory,
      unit: drawerUnit,
      price: priceNum,
      prevPrice: Math.round(prevPrice),
      changePercent: changePercent > 0 ? changePercent : undefined,
      trend,
      marketName: drawerMarket,
      state: drawerState,
      verified: false,
      contributor: isAnonymous ? "Anonymous Contributor" : drawerContributor || "Community Contributor",
      ownerId: user.uid,
      dateObserved: drawerDate,
      comments: drawerComments,
      icon,
      upvotes: 1,
      downvotes: 0,
      voters: {
        [user.uid]: "up"
      }
    };

    try {
      await setDoc(doc(db, "reports", reportId), newReport);
      setSubmitSuccess(true);
      triggerNotification(`Successfully added price report for ${drawerProductName}!`);

      // Reset fields
      setDrawerProductName("");
      setDrawerPrice("");
      setDrawerMarket("");
      setDrawerComments("");
      setIsAnonymous(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        setIsDrawerOpen(false);
      }, 1500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `reports/${reportId}`);
    }
  };

  // Admin moderation tools
  const toggleVerification = async (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    try {
      await updateDoc(doc(db, "reports", id), {
        verified: !report.verified
      });
      triggerNotification(report.verified ? "Removed verification status." : "Successfully dynamic-verified report!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${id}`);
    }
  };

  const deleteReport = async (id: string) => {
    if (confirm("Are you sure you want to delete this price report?")) {
      try {
        await deleteDoc(doc(db, "reports", id));
        triggerNotification("Deleted price report from main list.");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `reports/${id}`);
      }
    }
  };

  const handleQuickAdd = (product: string, category: "food" | "fuel" | "construction" | "other" = "food", unit: string = "Per Unit") => {
    setSearchQuery("");
    setDrawerProductName(product);
    setDrawerCategory(category);
    setDrawerUnit(unit);
    setIsDrawerOpen(true);
  };

  // Compute user-specific voted state from Firestore voters map
  const processedReports = reports.map(r => {
    const voted = r.voters && user ? r.voters[user.uid] : undefined;
    return { ...r, voted };
  });

  // Filters logic
  const filteredReports = processedReports.filter((report) => {
    const matchesSearch =
      report.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.marketName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.state.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === "all") return matchesSearch;
    return matchesSearch && report.category === selectedCategory;
  });

  // Get localized strings
  const copy = LANGUAGE_TRANSLATIONS[selectedLanguage];

  // Helper to render trend
  const renderTrendIndicator = (trend: "up" | "down" | "stable", pct?: number) => {
    if (trend === "up") {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
          <TrendingUp className="w-4 h-4" />
          {pct ? `${pct}%` : "Up"}
        </span>
      );
    }
    if (trend === "down") {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
          <TrendingDown className="w-4 h-4" />
          {pct ? `${pct}%` : "Down"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
        <Minus className="w-4 h-4" />
        Stable
      </span>
    );
  };

  // Get distinct products for compare drop-down list
  const distinctCompareProducts = Array.from(new Set(processedReports.map((r) => r.productName)));

  // States list popular in Nigeria
  const NIGERIA_STATES = [
    "Lagos", "Abuja", "Oyo", "Kano", "Kaduna", "Rivers", "Anambra", "Enugu", "Edo", "Delta", "Ogun", "Ondo", "Kwara", "Sokoto", "Plateau", "Abia"
  ];

  return (
    <div className="min-h-screen bg-naija-background text-[#1c1b1b] font-sans flex flex-col selection:bg-primary/20 selection:text-primary pb-16 md:pb-0">
      
      {/* Dynamic Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-[100] bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-xl border border-zinc-800 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-secondary-container" />
          {notification}
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-20 px-4 md:px-8">
          
          {/* Logo */}
          <div 
            onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
            className="flex items-center gap-2 overflow-hidden cursor-pointer transition-transform duration-200 active:scale-95"
            id="app-logo"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-md border border-emerald-700">
              ✓
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-2xl tracking-tight text-primary flex items-center gap-1">
                NaijaPrice
                <span className="text-xs px-1.5 py-0.5 bg-secondary-container text-on-secondary-container rounded font-bold uppercase tracking-widest leading-none">Live</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider -mt-1">Crowdsourced Tracker</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-3" id="desktop-nav">
            <button
              onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "home"
                  ? "bg-slate-100 text-primary font-bold"
                  : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              Home Feed
            </button>
            <button
              onClick={() => {
                setDrawerProductName("");
                setIsDrawerOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-slate-50 hover:text-primary transition-all"
            >
              Submit Report
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === "compare"
                  ? "bg-slate-100 text-primary font-bold"
                  : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              Compare Markets
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-slate-100 text-primary font-bold"
                  : "text-zinc-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              Admin Moderation
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </button>
          </nav>

          {/* Controls: Language and Quick CTA */}
          <div className="hidden md:flex items-center gap-3">
            {/* Guest/User Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 shrink-0">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold uppercase overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover animate-fade-in" referrerpolicy="no-referrer" />
                  ) : (
                    user.displayName?.charAt(0) || "U"
                  )}
                </div>
                <span className="text-[11px] font-bold text-zinc-700 max-w-[90px] truncate">{user.displayName || "Google User"}</span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] text-red-500 hover:text-red-750 font-extrabold ml-1 border-l border-slate-200 pl-1.5"
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-[#191919] border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs active:scale-95 text-center shrink-0 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                Sign In with Google
              </button>
            )}

            {/* Language Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 gap-1.5">
              <Globe className="w-4 h-4 text-slate-500" />
              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value as SupportedLanguage);
                  triggerNotification(`Language switched successfully!`);
                }}
                className="bg-transparent border-none text-xs font-semibold text-zinc-700 focus:ring-0 focus:outline-none cursor-pointer py-0 pl-0 pr-6"
              >
                <option value="en">English (EN)</option>
                <option value="pidgin">Pidgin (WA)</option>
                <option value="yo">Yorùbá (YỌ)</option>
                <option value="ig">Igbo (IG)</option>
                <option value="ha">Hausa (HA)</option>
              </select>
            </div>

            <button
              onClick={() => {
                setDrawerProductName("");
                setIsDrawerOpen(true);
              }}
              className="bg-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-md hover:bg-primary-container hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Report Price
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-1">
            {/* Quick language toggle */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
              className="bg-slate-50 border-none text-xs font-bold text-zinc-700 py-1.5 px-2 rounded-xl focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="pidgin">🇳🇬 WA</option>
              <option value="yo">🇳🇬 YỌ</option>
              <option value="ig">🇳🇬 IG</option>
              <option value="ha">🇳🇬 HA</option>
            </select>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 ml-1 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-30 bg-black/40 backdrop-blur-xs md:hidden animate-fade-in">
          <div className="bg-white px-5 py-6 space-y-4 border-b border-slate-100 shadow-xl flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">Navigation</p>
              <button
                onClick={() => {
                  setActiveTab("home");
                  setIsMobileMenuOpen(false);
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === "home" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Live Feed</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setDrawerProductName("");
                  setIsDrawerOpen(true);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-left"
              >
                <span>Report Price</span>
                <ChevronRight className="w-4 h-4 text-primary" />
              </button>
              <button
                onClick={() => {
                  setActiveTab("compare");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === "compare" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>Compare Markets</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left ${
                  activeTab === "admin" ? "bg-slate-100 text-primary font-bold" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  Admin Portal
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              {user ? (
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerpolicy="no-referrer" />
                      ) : (
                        user.displayName?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-800">{user.displayName || "Google User"}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Logged In</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-500 hover:text-red-750 font-extrabold"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Sign In with Google
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setDrawerProductName("");
                  setIsDrawerOpen(true);
                }}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 focus:ring-2 focus:ring-primary/20 hover:bg-primary-container"
              >
                <Plus className="w-5 h-5" />
                Report New Price Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global State Stats Strip */}
      <div className="bg-emerald-950 text-white text-[11px] py-1.5 text-center font-medium tracking-wide">
        ⚡ Live: Nigeria Market Inflation Index tracked dynamically. Estimated daily crowd-activity score: <span className="text-secondary-container font-black">94.8% (Accurate)</span>
      </div>

      {/* Main Container */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        
        {/* VIEW: HOME FEED */}
        {activeTab === "home" && (
          <div>
            {/* HERO MODULE */}
            <section className="relative overflow-hidden pt-8 pb-12 rounded-[2rem] bg-gradient-to-tr from-emerald-950 to-emerald-900 text-white px-6 md:px-12 mb-10 shadow-lg select-none">
              
              <div className="absolute inset-0 hero-pattern pointer-events-none opacity-10"></div>
              
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-secondary-container px-3.5 py-1 rounded-full text-xs font-bold mb-4 tracking-wide border border-white/5 animate-pulse">
                  <span>🇳🇬 Trusted by 50,000+ local sellers & buyers</span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                  Find the <span className="text-secondary-container underline decoration-wavy decoration-3">real price</span>. <br className="hidden sm:inline" /> From real Nigerians.
                </h1>
                
                <p className="text-sm md:text-md text-emerald-100/90 mb-8 max-w-2xl leading-relaxed">
                  Join crowd-sourced market intelligence. Real-time cost database of yams, tomatoes, fuel, mudus of Rice, and bags of Cement direct from traders today.
                </p>

                {/* Simulated search engine layout */}
                <div className="w-full max-w-2xl relative mb-4">
                  <div className="flex items-center bg-white rounded-2xl shadow-xl overflow-hidden p-1.5 border border-white hover:ring-4 hover:ring-primary/20 transition-all group">
                    <Search className="w-5 h-5 ml-3 text-slate-400 group-hover:text-primary transition-colors" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={copy.searchPlaceholder}
                      className="w-full border-none focus:ring-0 text-[#1c1b1b] text-sm md:text-md px-3 py-3 font-medium placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="p-1 text-slate-400 hover:text-slate-600 mr-2 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => triggerNotification(`Now showing details for "${searchQuery || "all item feed"}"`)}
                      className="bg-primary hover:bg-primary-container text-white font-bold rounded-xl px-6 py-3 text-sm active:scale-95 transition-all outline-none"
                    >
                      Check Price
                    </button>
                  </div>
                </div>

                {/* Popular Keywords Chips */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-emerald-200 font-semibold">{copy.popularLabel}</span>
                  {["Rice", "Tomatoes", "Fuel (PMS)", "Cement", "Eggs", "Garri"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(tag);
                        setSelectedCategory("all");
                        triggerNotification(`Filtered reports to "${tag}"`);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-3.5 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {tag === "Rice" ? "🌾 Rice" : 
                       tag === "Tomatoes" ? "🍅 Tomatoes" :
                       tag === "Fuel (PMS)" ? "⛽ Fuel" :
                       tag === "Cement" ? "🧱 Cement" : 
                       tag === "Eggs" ? "🥚 Eggs" : "🥣 Garri"}
                    </button>
                  ))}
                  {searchQuery && (
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                      className="text-secondary-container font-bold underline cursor-pointer pl-2 hover:text-[#ffe16d]"
                    >
                      Show All
                    </button>
                  )}
                </div>

              </div>
            </section>

            {/* CATEGORY & SEARCH COMPONENT */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  {copy.reportsTitle}
                </h2>
                <p className="text-xs md:text-sm text-slate-500">{copy.reportsSub}</p>
              </div>

              {/* Feed Filters */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "All Items", icon: "🍱" },
                  { id: "food", label: "Food Staples", icon: "🌾" },
                  { id: "fuel", label: "Fuel & Power", icon: "⛽" },
                  { id: "construction", label: "Building Materials", icon: "🧱" },
                  { id: "other", label: "Other Essentials", icon: "⚙️" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      triggerNotification(`Viewing ${cat.label}`);
                    }}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
                      selectedCategory === cat.id
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-zinc-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ERROR / EMPTY STATE LOGIC OR LIST */}
            {filteredReports.length === 0 ? (
              <div 
                className="w-full flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-3xl border border-zinc-100 shadow-xs relative overflow-hidden"
                id="search-empty-state"
              >
                {/* Visual atmospheric circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative w-64 h-64 md:w-72 md:h-72 mb-6">
                  {/* Studio wood crate illustration hotlinked */}
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ1I-vE9hrXoJNWFYjvVoaRxrNY4RXqxAvSct8_7zTO-EWcu9Db0GK0_0T5JIh5mTCOuvbauIsWc3GI_kbAuLBFXlvA3tDSj0CzpSgpTLjsha0CWSfXMZ5UeMnrc2nwabLMC51vfpB_pmoKdb7uDAPpI1WcWDqq_0xgiL12yh__4hLFCyPaWLxxGyCanc8ftb20JbXHTGYLs2fMIXkNtIUVDUgNVEhmn3xSBnIxTlLuzdjBKcFcAXxhwtEOfeczKM_iOX76uyHhPs"
                    alt="No results empty crate"
                    className="relative z-10 w-full h-full object-contain mx-auto rounded-2xl"
                  />
                  {/* Decorative tag badge floated bottom right */}
                  <div className="absolute bottom-6 right-8 bg-secondary-container text-on-secondary-container hover:scale-105 duration-255 font-black text-xl p-3 shadow-md rounded-2xl rotate-12 border border-amber-400">
                    ₦?
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-extrabold text-[#1c1b1b] mb-2 tracking-tight">
                  {copy.emptyTitle.replace("{query}", searchQuery || selectedCategory)}
                </h3>
                <p className="font-body-lg text-slate-500 max-w-lg mb-8 leading-relaxed text-sm md:text-md">
                  {copy.emptySub}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      if (searchQuery) setDrawerProductName(searchQuery);
                      setIsDrawerOpen(true);
                    }}
                    className="w-full sm:w-auto bg-primary hover:bg-primary-container text-white font-bold rounded-xl px-6 py-3.5 text-sm shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    {copy.beFirstBtn}
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      triggerNotification("Cleared all search filters.");
                    }}
                    className="w-full sm:w-auto border border-zinc-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl px-6 py-3.5 text-sm transition-all"
                  >
                    {copy.browseBtn}
                  </button>
                </div>
              </div>
            ) : (
              /* THE PRICE GRID */
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                id="price-reports-grid"
              >
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all duration-300 relative group"
                  >
                    
                    {/* Verified ribbon floating top right */}
                    {report.verified && (
                      <span className="absolute top-5 right-6 bg-secondary-container text-on-secondary-container text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 border border-amber-300">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Verified
                      </span>
                    )}

                    {/* Metadata block header */}
                    <div>
                      <div className="flex items-center gap-3.5 mb-5 select-none">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-2xl group-hover:bg-primary/10 transition-colors">
                          {report.icon}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-800 leading-snug group-hover:text-primary transition-colors">
                            {report.productName}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium">
                            {report.unit}
                          </p>
                        </div>
                      </div>

                      {/* Main Price Numbers */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          ₦{report.price.toLocaleString()}
                        </span>
                        {renderTrendIndicator(report.trend, report.changePercent)}
                      </div>

                      {/* Location Market */}
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-4 pl-0.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="underline decoration-slate-200 font-semibold text-slate-700">
                          {report.marketName}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span>{report.state}</span>
                      </p>

                      {/* Comments section if exists */}
                      {report.comments && (
                        <div className="bg-slate-50 rounded-2xl p-3.5 text-xs text-slate-600 border border-slate-100/50 italic mb-5 leading-relaxed relative pl-5">
                          <span className="absolute left-2.5 top-3.5 text-emerald-800 font-bold">"</span>
                          {report.comments}
                        </div>
                      )}
                    </div>

                    {/* Bottom Votes verification verification validation actions */}
                    <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between">
                      {/* Subtitle date */}
                      <span className="text-[11px] text-slate-400 font-medium flex flex-col">
                        <span>Observed on {report.dateObserved}</span>
                        <span className="text-slate-500 font-bold">By {report.contributor}</span>
                      </span>

                      {/* Micro interaction upvotes */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleVote(report.id, "up")}
                          className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1 ${
                            report.voted === "up"
                              ? "bg-primary text-white font-bold"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-emerald-700"
                          }`}
                          title="Confirm Price Is Accurate"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{report.upvotes}</span>
                        </button>

                        <button
                          onClick={() => handleVote(report.id, "down")}
                          className={`p-2 rounded-xl transition-all active:scale-90 flex items-center gap-1 ${
                            report.voted === "down"
                              ? "bg-red-650 bg-red-600 text-white font-bold"
                              : "bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700"
                          }`}
                          title="Flag Discrepancy"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span className="text-[10px]">{report.downvotes}</span>
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* CALL TO ACTION CAMPAIGN SECTION */}
            <section className="bg-primary rounded-[2.5rem] mt-16 p-8 md:p-12 text-white relative overflow-hidden shadow-lg select-none">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-emerald-700 opacity-20 transform skew-x-12 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
                    {copy.boughtTitle}
                  </h2>
                  <p className="text-sm md:text-md text-emerald-100 leading-relaxed max-w-2xl font-light">
                    {copy.boughtSub}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDrawerProductName("");
                    setIsDrawerOpen(true);
                  }}
                  className="bg-secondary-container hover:bg-[#ffe16d] text-on-secondary-container font-black px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 text-sm md:text-md flex items-center gap-2 tracking-wide cursor-pointer"
                >
                  {copy.submitBtn}
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>
              </div>
            </section>

          </div>
        )}

        {/* VIEW: COMPARE MARKETS */}
        {activeTab === "compare" && (
          <div>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3.5 py-1 rounded-full text-xs font-bold mb-3 tracking-wide">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Compare side-by-side pricing
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Market Price Contrast Engine
                </h2>
                <p className="text-slate-500 text-sm max-w-lg mx-auto">
                  Compare current commodities across major states in Nigeria. Find where it's cheapest & avoid market price hikes.
                </p>
              </div>

              {/* Selection Control Panel */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-auto">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-2 pl-1 tracking-wider">Select Commodity to Compare</label>
                  <select
                    value={compareProduct}
                    onChange={(e) => setCompareProduct(e.target.value)}
                    className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none focus:outline-none"
                  >
                    {distinctCompareProducts.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="w-full md:w-auto flex flex-col md:items-end justify-center">
                  <span className="text-[11px] text-slate-400 font-medium">Standard unit reference</span>
                  <span className="text-lg font-bold text-[#1c1b1b]">
                    {processedReports.find((r) => r.productName === compareProduct)?.unit || "Standard Unit"}
                  </span>
                </div>
              </div>

              {/* Comparison list */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest pl-1">Nigeria Market Reports for "{compareProduct}"</h3>
                
                {processedReports.filter((r) => r.productName === compareProduct).length === 0 ? (
                  <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No logged reports for this commodity across states yet! Click Below to log one.
                    <button 
                      onClick={() => {
                        setDrawerProductName(compareProduct);
                        setIsDrawerOpen(true);
                      }}
                      className="block mx-auto mt-4 text-xs font-bold text-primary underline"
                    >
                      Report pricing for "{compareProduct}"
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500">
                            <th className="px-6 py-4">Market / Location</th>
                            <th className="px-6 py-4">State</th>
                            <th className="px-6 py-4">Status Tag</th>
                            <th className="px-6 py-4 text-right">Reported Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {processedReports
                            .filter((r) => r.productName === compareProduct)
                            .sort((a, b) => a.price - b.price)
                            .map((rep, idx) => (
                              <tr key={rep.id} className="hover:bg-slate-50/40 transition-colors text-sm font-medium text-slate-700">
                                <td className="px-6 py-4.5 flex items-center gap-2">
                                  <span className="text-xs">{idx === 0 ? "🥇" : "📍"}</span>
                                  <div>
                                    <span className="font-bold text-slate-800">{rep.marketName}</span>
                                    {idx === 0 && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">Cheapest</span>}
                                  </div>
                                </td>
                                <td className="px-6 py-4.5 text-slate-500">{rep.state}</td>
                                <td className="px-6 py-4.5">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-bold ${
                                    rep.verified ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600"
                                  }`}>
                                    {rep.verified ? "Verified Log" : "User Report"}
                                  </span>
                                </td>
                                <td className="px-6 py-4.5 text-right font-extrabold text-slate-900 text-base">
                                  ₦{rep.price.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Nigerian Market Intelligence Stats banner */}
              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex items-start gap-3 mt-10">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 space-y-1">
                  <p className="font-extrabold text-amber-900">Volatility Advice Note</p>
                  <p className="leading-relaxed">
                    Agricultural yields and fuel transportation logistics can significantly shift the retail cost score across states by up to 25% weekly. Always confirm the date observed before relying on crowd values.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* VIEW: ADMIN PORTAL */}
        {activeTab === "admin" && (
          <div>
            <div className="max-w-5xl mx-auto">
              
              {/* Header section state */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    NaijaPrice Moderation Dashboard
                    <span className="text-xs px-2 py-0.5 bg-amber-500 text-white rounded-full font-black uppercase">Live Logs</span>
                  </h2>
                  <p className="text-slate-500 text-xs">Simulated admin panel - Approve fresh reports, toggle verified badges, or remove fraud.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      if (confirm("Resetting database will wipe all reports and reload default seeds. Continue?")) {
                        try {
                          // Clear existing reports in Firestore
                          for (const r of reports) {
                            await deleteDoc(doc(db, "reports", r.id));
                          }
                          // Add defaults back
                          for (const r of INITIAL_REPORTS) {
                            await setDoc(doc(db, "reports", r.id), r);
                          }
                          triggerNotification("Successfully reset system database to default seeds!");
                        } catch (error) {
                          handleFirestoreError(error, OperationType.WRITE, "reports/reset");
                        }
                      }
                    }}
                    className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold active:scale-95 transition-all text-center shrink-0"
                    title="Restore Initial System Reports"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset System Reports
                  </button>
                </div>
              </div>

              {/* System metrics widget section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-100 rounded-2.5xl p-5 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Active Community Logs</p>
                  <p className="text-2xl font-black text-slate-800">{processedReports.length}</p>
                  <span className="text-[10px] text-emerald-600 font-bold">Live database sync active</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2.5xl p-5 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Verified Badges</p>
                  <p className="text-2xl font-black text-amber-600">{processedReports.filter(r => r.verified).length}</p>
                  <span className="text-[10px] text-amber-600 font-semibold">Toggled from moderation lists</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2.5xl p-5 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Reported Inflation Index</p>
                  <p className="text-2xl font-black text-red-650 text-red-600 font-bold">32.1%</p>
                  <span className="text-[10px] text-red-500 font-semibold">Calculated from consumer posts</span>
                </div>
                <div className="bg-white border border-slate-100 rounded-2.5xl p-5 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Reputation Score</p>
                  <p className="text-2xl font-black text-[#006b3f]">9.8 / 10</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">High confidence crowd pool</span>
                </div>
              </div>

              {/* List of reports for validation */}
              <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">Moderation Queue & Active Entries</h3>
                </div>

                <div className="divide-y divide-slate-100">
                  {processedReports.map((report) => (
                    <div key={report.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-start gap-3.5">
                        <span className="text-2xl p-2 bg-slate-50 rounded-xl select-none">{report.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{report.productName}</span>
                            <span className="text-xs text-slate-400">({report.unit})</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              report.verified ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-600"
                            }`}>
                              {report.verified ? "Verified" : "Pending Community Checks"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium my-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="semibold text-slate-700">{report.marketName}</span>
                            <span>({report.state})</span>
                            <span className="text-slate-300">|</span>
                            <span>Reported by {report.contributor}</span>
                            <span className="text-slate-300">|</span>
                            <span>{report.dateObserved}</span>
                          </p>
                          {report.comments && <p className="text-xs text-slate-400 italic pl-1 mt-1 border-l-2 border-slate-200">"{report.comments}"</p>}
                        </div>
                      </div>

                      {/* Controls Verification / Delete Actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                        <div className="text-right mr-3 hidden sm:block">
                          <p className="text-xs text-slate-400 font-semibold">Cost Value</p>
                          <p className="text-base font-black text-slate-900">₦{report.price.toLocaleString()}</p>
                        </div>

                        {/* Verified Toggle */}
                        <button
                          onClick={() => toggleVerification(report.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                            report.verified
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50/30"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {report.verified ? "Verified" : "Verify Log"}
                        </button>

                        {/* Delete action */}
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                          title="Delete Erroneous Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* SUBMISSION DRAWER MODAL */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-fade-in"
          onClick={() => setIsDrawerOpen(false)}
          id="submissionDrawer"
        >
          <div 
            className="bg-white rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col translate-y-0 transition-transform duration-350"
            onClick={(e) => e.stopPropagation()}
            id="drawerContent"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/70 select-none">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Submit New Live Price</h3>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5">Crowdsourced verification</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors border border-slate-200"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddReport} className="overflow-y-auto p-6 space-y-6 flex-grow">
              
              {submitSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto scale-110">
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Price Registered</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">This price has been dynamically logged on the NaijaPrice. Live contributors will verify accuracy shortly!</p>
                </div>
              ) : (
                <div className="space-y-5">
                  
                  {/* Select Preset or Free Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Product Name</label>
                      <input
                        type="text"
                        required
                        value={drawerProductName}
                        onChange={(e) => setDrawerProductName(e.target.value)}
                        placeholder="e.g. Garri (White), Yam tuber"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                        list="preset-products"
                      />
                      <datalist id="preset-products">
                        <option value="Crate of Eggs" />
                        <option value="Petrol (PMS)" />
                        <option value="Garri (White)" />
                        <option value="Dangote Cement" />
                        <option value="Yam (Medium Tuber)" />
                        <option value="Tomatoes (Large Basket)" />
                        <option value="Local Rice (50kg)" />
                        <option value="Onions (Small Bag)" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Category</label>
                      <select
                        value={drawerCategory}
                        onChange={(e) => setDrawerCategory(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        <option value="food">🍱 Food Staples</option>
                        <option value="fuel">⛽ Fuel & Power</option>
                        <option value="construction">🧱 Building Materials</option>
                        <option value="other">⚙️ Other Essentials</option>
                      </select>
                    </div>
                  </div>

                  {/* Price and Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Price in Naira (₦)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1c1b1b] font-bold text-base">₦</span>
                        <input
                          type="number"
                          required
                          value={drawerPrice}
                          onChange={(e) => setDrawerPrice(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Unit Observed</label>
                      <select
                        value={drawerUnit}
                        onChange={(e) => setDrawerUnit(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        <option value="Crate">Crate</option>
                        <option value="Per Litre">Per Litre</option>
                        <option value="50kg Bag">50kg Bag</option>
                        <option value="Mudu">Mudu</option>
                        <option value="Medium Tuber">Medium Tuber</option>
                        <option value="Large Basket">Large Basket</option>
                        <option value="Small Basket">Small Basket</option>
                        <option value="Per kg">Per kg</option>
                      </select>
                    </div>
                  </div>

                  {/* Market Location and state */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Market / Location Name</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={drawerMarket}
                          onChange={(e) => setDrawerMarket(e.target.value)}
                          placeholder="e.g. Mile 12 Market, Singer Kano"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">State Location</label>
                      <select
                        value={drawerState}
                        onChange={(e) => setDrawerState(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                      >
                        {NIGERIA_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date and Contributor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Date Observed</label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={drawerDate}
                          onChange={(e) => setDrawerDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Contributor Name</label>
                      <div className="flex flex-col gap-1.5 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="anon-checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded text-primary focus:ring-primary"
                          />
                          <label htmlFor="anon-checkbox" className="text-xs font-bold text-slate-600 select-none">Remain Anonymous</label>
                        </div>
                        {!isAnonymous && (
                          <input
                            type="text"
                            required
                            value={drawerContributor}
                            onChange={(e) => setDrawerContributor(e.target.value)}
                            placeholder="Your Name / business handle"
                            className="bg-white border border-slate-200 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-400"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Extra bargaining Comments */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Extra Bargaining Comments (Optional)</label>
                    <textarea
                      value={drawerComments}
                      onChange={(e) => setDrawerComments(e.target.value)}
                      placeholder="e.g. Quality was fine, can bargain for retail discount, plenty available"
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                </div>
              )}

            </form>

            {/* Footer buttons */}
            {!submitSuccess && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-5 py-3 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-600 text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddReport}
                  className="bg-primary hover:bg-primary-container text-white font-extrabold rounded-xl px-7 py-3 text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Post to NaijaPrice
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
          
          <div className="max-w-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                NaijaPrice
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Empowering Nigerians with transparent live market metrics. Ground truth consumer costs generated exclusively by the people, for the people.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-xs">👋 Community Managed</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs">🟢 100% Verified Nodes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-16">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Marketplaces Hub</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><button onClick={() => { setActiveTab("home"); setSearchQuery("Rice"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Rice Staples Feed</button></li>
                <li><button onClick={() => { setActiveTab("home"); setSearchQuery("Tomatoes"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Basket Tomatoes</button></li>
                <li><button onClick={() => { setActiveTab("home"); setSearchQuery("Fuel"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">PMS fuel (Abuja/Lagos)</button></li>
                <li><button onClick={() => { setActiveTab("home"); setSearchQuery("Cement"); }} className="hover:text-primary hover:underline transition-all font-medium text-left">Cement Bag Cost</button></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Information Node</p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium text-left">About Platform</a></li>
                <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium text-left">Verified Contributor Program</a></li>
                <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium text-left">Report Discrepancy</a></li>
                <li><a href="#" className="hover:text-primary hover:underline transition-all font-medium text-left">Developer Price Feed API</a></li>
              </ul>
            </div>
          </div>

          {/* Special Disclaimer Widget block styled cleanly */}
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 max-w-xs space-y-2">
            <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-primary rounded-full"></span>
              Nigerian Realities Disclaimer
            </h4>
            <p className="text-[11px] text-slate-400 italic leading-relaxed">
              "Prices are community-reported. Always verify before major transactions. NaijaPrice does not transact, sell, or inventory any listed items directly."
            </p>
          </div>

        </div>

        {/* Translation credits bottom bar container */}
        <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <p>© 2026 NaijaPrice Tracker community collaboration, Lagos, Abuja. Created for the proud people of Nigeria.</p>
          <div className="flex gap-4 font-semibold">
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedLanguage("en")}>English</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedLanguage("pidgin")}>Pidgin</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedLanguage("yo")}>Yorùbá</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedLanguage("ig")}>Igbo</span>
            <span className="hover:text-white transition-colors cursor-pointer" onClick={() => setSelectedLanguage("ha")}>Hausa</span>
          </div>
        </div>

      </footer>

      {/* FIXED MOBILE BOTTOM NAVBAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 h-16 flex items-center justify-around px-4 shadow-xl select-none">
        
        <button
          onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
            activeTab === "home" ? "text-primary" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-bold">Feed</span>
        </button>

        <button
          onClick={() => {
            setDrawerProductName("");
            setIsDrawerOpen(true);
          }}
          className="flex flex-col items-center justify-center text-slate-500 hover:text-slate-700"
        >
          <div className="w-10 h-10 bg-primary hover:bg-primary-container text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-800/20 -mt-5 scale-110 active:scale-95 transition-all">
            <Plus className="w-5 h-5 stroke-[3]" />
          </div>
        </button>

        <button
          onClick={() => setActiveTab("compare")}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
            activeTab === "compare" ? "text-primary" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold">Compare</span>
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative ${
            activeTab === "admin" ? "text-primary" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Portal</span>
        </button>

      </nav>

    </div>
  );
}
