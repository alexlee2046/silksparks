import React, { useState, useCallback } from "react";
import { Screen } from "./types";
import { Layout } from "./components/Layouts";
import { Home } from "./pages/Home";
import { BirthChart } from "./pages/BirthChart";
import { AstrologyReport, TarotDaily, TarotSpread } from "./pages/AppFeatures";
import { ShopList, ProductDetail } from "./pages/Commerce";
import { Experts, Booking, Intake, Delivery } from "./pages/Consultation";
import { UserDashboard, Archives, Orders } from "./pages/UserDashboard";
import { Payments, Currency, Shipping, SystemSettings } from "./pages/Admin";
import { UserProvider, useUser } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { AnimatePresence, motion } from "framer-motion";
import { Auth } from "./components/Auth";
import { CartDrawer } from "./components/CartDrawer";

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [showAuth, setShowAuth] = useState(false);
  const [productId, setProductId] = useState<string | undefined>(undefined);
  const [expertId, setExpertId] = useState<string | undefined>(undefined);
  const { session, loading } = useUser();

  // 包装 setScreen，在切换页面时自动滚动到顶部
  const setScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  const getLayoutType = () => {
    switch (currentScreen) {
      case Screen.USER_DASHBOARD:
      case Screen.ARCHIVES:
      case Screen.ORDERS:
        return "user";
      case Screen.ADMIN_PAYMENTS:
      case Screen.ADMIN_CURRENCY:
      case Screen.ADMIN_SHIPPING:
      case Screen.ADMIN_SETTINGS:
        return "admin";
      default:
        return "public";
    }
  };

  const renderScreen = () => {
    const props = {
      currentScreen,
      setScreen,
      productId,
      setProductId,
      expertId,
      setExpertId,
    };

    // 路由保护逻辑
    const protectedScreens = [
      Screen.USER_DASHBOARD,
      Screen.ARCHIVES,
      Screen.ORDERS,
      Screen.ADMIN_PAYMENTS,
      Screen.ADMIN_CURRENCY,
      Screen.ADMIN_SHIPPING,
      Screen.ADMIN_SETTINGS,
    ];

    if (protectedScreens.includes(currentScreen) && !session) {
      return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-6 p-10 text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>
          <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider">
            Access Restricted
          </h2>
          <p className="text-white/40 max-w-sm">
            This area is reserved for seekers. Please sign in to view your
            cosmic space.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-10 py-4 bg-primary text-background-dark font-bold rounded-xl shadow-2xl hover:bg-white transition-all"
          >
            Sign In Now
          </button>
          <button
            onClick={() => setScreen(Screen.HOME)}
            className="text-white/40 text-sm hover:text-white transition-colors"
          >
            Return Home
          </button>
        </div>
      );
    }

    switch (currentScreen) {
      case Screen.HOME:
        return <Home {...props} />;
      case Screen.BIRTH_CHART:
        return <BirthChart {...props} />;
      case Screen.REPORT:
        return <AstrologyReport {...props} />;
      case Screen.TAROT_DAILY:
        return <TarotDaily {...props} />;
      case Screen.TAROT_SPREAD:
        return <TarotSpread {...props} />;
      case Screen.SHOP_LIST:
        return <ShopList {...props} />;
      case Screen.PRODUCT_DETAIL:
        return <ProductDetail {...props} />;
      case Screen.EXPERTS:
        return <Experts {...props} />;
      case Screen.BOOKING:
        return <Booking {...props} />;
      case Screen.INTAKE:
        return <Intake {...props} />;
      case Screen.DELIVERY:
        return <Delivery {...props} />;
      case Screen.USER_DASHBOARD:
        return <UserDashboard {...props} />;
      case Screen.ARCHIVES:
        return <Archives {...props} />;
      case Screen.ORDERS:
        return <Orders {...props} />;
      case Screen.ADMIN_PAYMENTS:
        return <Payments {...props} />;
      case Screen.ADMIN_CURRENCY:
        return <Currency {...props} />;
      case Screen.ADMIN_SHIPPING:
        return <Shipping {...props} />;
      case Screen.ADMIN_SETTINGS:
        return <SystemSettings {...props} />;
      default:
        return <Home {...props} />;
    }
  };

  return (
    <Layout
      setScreen={setScreen}
      type={getLayoutType()}
      onAuthClick={() => setShowAuth(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full h-full"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
      <CartDrawer />
    </Layout>
  );
};

import { Routes, Route } from "react-router-dom";
import { AdminApp } from "./admin/App";

const App: React.FC = () => {
  return (
    <UserProvider>
      <CartProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </CartProvider>
    </UserProvider>
  );
};

export default App;
