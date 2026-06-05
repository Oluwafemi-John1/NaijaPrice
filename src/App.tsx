import React, { useState, useEffect, FormEvent } from "react";
import { Plus, SlidersHorizontal, Sparkles, User } from "lucide-react";
import { PriceReport, SupportedLanguage } from "./types";
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
import Navbar from "./components/Navbar";
import MobileMenu from "./components/MobileMenu";
import HomeFeed from "./components/HomeFeed";
import CompareView from "./components/CompareView";
import AdminPortal from "./components/AdminPortal";
import SubmitDrawer from "./components/SubmitDrawer";
import Footer from "./components/Footer";

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

  const handleOpenDrawer = (product?: string) => {
    setDrawerProductName(product || "");
    setIsDrawerOpen(true);
  };

  const handleResetSystem = async () => {
    if (confirm("Resetting database will wipe all reports and reload default seeds. Continue?")) {
      try {
        for (const r of reports) {
          await deleteDoc(doc(db, "reports", r.id));
        }
        for (const r of INITIAL_REPORTS) {
          await setDoc(doc(db, "reports", r.id), r);
        }
        triggerNotification("Successfully reset system database to default seeds!");
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "reports/reset");
      }
    }
  };

  return (
    <div className="min-h-screen bg-naija-background text-[#1c1b1b] font-sans flex flex-col selection:bg-primary/20 selection:text-primary pb-16 md:pb-0">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-4 z-[100] bg-zinc-900 text-white px-5 py-3 rounded-xl shadow-xl border border-zinc-800 text-sm font-medium flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-secondary-container" />
          {notification}
        </div>
      )}

      <Navbar
        user={user}
        activeTab={activeTab}
        selectedLanguage={selectedLanguage}
        isMobileMenuOpen={isMobileMenuOpen}
        onLogoClick={() => { setActiveTab("home"); setSearchQuery(""); }}
        onTabChange={(tab) => { setActiveTab(tab); if (tab === "home") setSearchQuery(""); }}
        onOpenDrawer={() => handleOpenDrawer()}
        onLanguageChange={(lang) => { setSelectedLanguage(lang); triggerNotification("Language switched successfully!"); }}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {isMobileMenuOpen && (
        <MobileMenu
          user={user}
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }}
          onOpenDrawer={() => { setIsMobileMenuOpen(false); handleOpenDrawer(); }}
          onClose={() => setIsMobileMenuOpen(false)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      {/* Stats Strip */}
      <div className="bg-emerald-950 text-white text-[11px] py-1.5 text-center font-medium tracking-wide">
        ⚡ Live: Nigeria Market Inflation Index tracked dynamically. Estimated daily crowd-activity score: <span className="text-secondary-container font-black">94.8% (Accurate)</span>
      </div>

      {/* Main Content */}
      <div className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
        {activeTab === "home" && (
          <HomeFeed
            filteredReports={filteredReports}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            copy={copy}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onVote={handleVote}
            onOpenDrawer={handleOpenDrawer}
            onNotify={triggerNotification}
          />
        )}

        {activeTab === "compare" && (
          <CompareView
            processedReports={processedReports}
            compareProduct={compareProduct}
            onProductChange={setCompareProduct}
            onOpenDrawer={handleOpenDrawer}
          />
        )}

        {activeTab === "admin" && (
          <AdminPortal
            processedReports={processedReports}
            onToggleVerification={toggleVerification}
            onDeleteReport={deleteReport}
            onResetSystem={handleResetSystem}
          />
        )}
      </div>

      {isDrawerOpen && (
        <SubmitDrawer
          submitSuccess={submitSuccess}
          drawerProductName={drawerProductName}
          drawerCategory={drawerCategory}
          drawerPrice={drawerPrice}
          drawerUnit={drawerUnit}
          drawerMarket={drawerMarket}
          drawerState={drawerState}
          drawerDate={drawerDate}
          drawerContributor={drawerContributor}
          isAnonymous={isAnonymous}
          drawerComments={drawerComments}
          onClose={() => setIsDrawerOpen(false)}
          onSubmit={handleAddReport}
          setDrawerProductName={setDrawerProductName}
          setDrawerCategory={setDrawerCategory}
          setDrawerPrice={setDrawerPrice}
          setDrawerUnit={setDrawerUnit}
          setDrawerMarket={setDrawerMarket}
          setDrawerState={setDrawerState}
          setDrawerDate={setDrawerDate}
          setDrawerContributor={setDrawerContributor}
          setIsAnonymous={setIsAnonymous}
          setDrawerComments={setDrawerComments}
        />
      )}

      <Footer
        onTabChange={(tab) => { setActiveTab(tab); }}
        onSearchChange={setSearchQuery}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Fixed Mobile Bottom Nav */}
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
          onClick={() => handleOpenDrawer()}
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
