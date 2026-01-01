import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layouts";
import { UserProvider, useUser } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PerformanceProvider } from "./context/PerformanceContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { Auth } from "./components/Auth";
import { CartDrawer } from "./components/CartDrawer";
import { Toaster } from "react-hot-toast";
import { useScreenNavigation } from "./hooks/useAppNavigate";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ============ 页面组件导入 (Lazy Loading) ============
// 首页直接加载 (LCP 关键路径)
import { Home } from "./pages/Home";

// 功能页面懒加载
const BirthChart = lazy(() => import("./pages/BirthChart").then(m => ({ default: m.BirthChart })));

// Admin App (独立应用) - 懒加载
const AdminApp = lazy(() => import("./admin/App").then(m => ({ default: m.AdminApp })));

// 懒加载页面组件
const LazyAstrologyReport = lazy(() => import("./pages/AppFeatures").then(m => ({ default: m.AstrologyReport })));
const LazyTarotDaily = lazy(() => import("./pages/AppFeatures").then(m => ({ default: m.TarotDaily })));
const LazyTarotSpread = lazy(() => import("./pages/AppFeatures").then(m => ({ default: m.TarotSpread })));
const LazyShopList = lazy(() => import("./pages/Commerce").then(m => ({ default: m.ShopList })));
const LazyProductDetail = lazy(() => import("./pages/Commerce").then(m => ({ default: m.ProductDetail })));
const LazyExperts = lazy(() => import("./pages/Consultation").then(m => ({ default: m.Experts })));
const LazyExpertProfile = lazy(() => import("./pages/Consultation").then(m => ({ default: m.ExpertProfile })));
const LazyBooking = lazy(() => import("./pages/Consultation").then(m => ({ default: m.Booking })));
const LazyIntake = lazy(() => import("./pages/Consultation").then(m => ({ default: m.Intake })));
const LazyDelivery = lazy(() => import("./pages/Consultation").then(m => ({ default: m.Delivery })));
const LazyUserDashboard = lazy(() => import("./pages/UserDashboard").then(m => ({ default: m.UserDashboard })));
const LazyArchives = lazy(() => import("./pages/UserDashboard").then(m => ({ default: m.Archives })));
const LazyOrders = lazy(() => import("./pages/UserDashboard").then(m => ({ default: m.Orders })));
const LazyConsultations = lazy(() => import("./pages/UserDashboard").then(m => ({ default: m.Consultations })));
const LazyUserSettings = lazy(() => import("./pages/UserDashboard").then(m => ({ default: m.UserSettings })));
const LazyPayments = lazy(() => import("./pages/Admin").then(m => ({ default: m.Payments })));
const LazyCurrency = lazy(() => import("./pages/Admin").then(m => ({ default: m.Currency })));
const LazyShipping = lazy(() => import("./pages/Admin").then(m => ({ default: m.Shipping })));
const LazySystemSettings = lazy(() => import("./pages/Admin").then(m => ({ default: m.SystemSettings })));

// ============ 加载状态组件 ============
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
    />
  </div>
);

// ============ 路由保护组件 ============
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  onAuthClick: () => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth,
  requiresAdmin,
  onAuthClick,
}) => {
  const { session, user, loading } = useUser();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner />;
  }

  // 需要登录但未登录
  if (requiresAuth && !session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
          <span className="material-symbols-outlined text-4xl">lock</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-foreground uppercase tracking-wider">
          Access Restricted
        </h2>
        <p className="text-text-muted max-w-sm">
          This area is reserved for seekers. Please sign in to view your cosmic
          space.
        </p>
        <button
          onClick={onAuthClick}
          className="px-10 py-4 bg-primary text-background-dark font-bold rounded-xl shadow-2xl hover:bg-white transition-all"
        >
          Sign In Now
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-text-muted text-sm hover:text-foreground transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  // 需要管理员但不是管理员
  if (requiresAdmin && session && !user.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="h-20 w-20 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
          <span className="material-symbols-outlined text-4xl">security</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-foreground uppercase tracking-wider">
          Unauthorized
        </h2>
        <p className="text-text-muted max-w-sm">
          You do not have sufficient permissions to access the Cosmic Control
          Center.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-10 py-4 bg-surface-border/30 text-foreground font-bold rounded-xl hover:bg-white/20 transition-all"
        >
          Return to Safety
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

// ============ 页面动画包装器 ============
const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ============ 主应用内容 ============
const AppContent: React.FC = () => {
  const [showAuth, setShowAuth] = useState(false);
  const { loading } = useUser();
  const { setScreen, currentScreen } = useScreenNavigation();
  const location = useLocation();

  // 根据当前路径确定布局类型
  const getLayoutType = (): "public" | "user" | "admin" => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "user";
    if (path.startsWith("/manage")) return "admin";
    return "public";
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // 创建兼容的 props 对象
  const navProps = {
    currentScreen,
    setScreen,
  };

  return (
    <Layout type={getLayoutType()} onAuthClick={() => setShowAuth(true)}>
      <AnimatedPage>
        <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 公开页面 */}
          <Route path="/" element={<Home {...navProps} />} />
          <Route path="/horoscope" element={<BirthChart {...navProps} />} />
          <Route path="/horoscope/report" element={<LazyAstrologyReport {...navProps} />} />
          <Route path="/tarot" element={<LazyTarotDaily {...navProps} />} />
          <Route path="/tarot/spread" element={<LazyTarotSpread {...navProps} />} />

          {/* 商店页面 */}
          <Route path="/shop" element={<LazyShopList {...navProps} />} />
          <Route path="/shop/:productId" element={<LazyProductDetail {...navProps} />} />

          {/* 专家咨询页面 */}
          <Route path="/experts" element={<LazyExperts {...navProps} />} />
          <Route path="/experts/:expertId" element={<LazyExpertProfile {...navProps} />} />
          <Route path="/booking" element={<LazyBooking {...navProps} />} />
          <Route path="/booking/intake" element={<LazyIntake {...navProps} />} />
          <Route path="/booking/delivery" element={<LazyDelivery {...navProps} />} />

          {/* 用户中心 (受保护) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyUserDashboard {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/archives"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyArchives {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/orders"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyOrders {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/consultations"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyConsultations {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyUserSettings {...navProps} />
              </ProtectedRoute>
            }
          />

          {/* 管理后台 (需要管理员) */}
          <Route
            path="/manage/payments"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={true}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyPayments {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage/currency"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={true}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyCurrency {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage/shipping"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={true}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyShipping {...navProps} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage/settings"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={true}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazySystemSettings {...navProps} />
              </ProtectedRoute>
            }
          />

          {/* 404 重定向到首页 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AnimatedPage>

      <AnimatePresence>
        {showAuth && <Auth onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
      <CartDrawer />
    </Layout>
  );
};

// ============ 根应用 ============
const App: React.FC = () => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to external service in production (e.g., Sentry)
        console.error("[App] Uncaught error:", error.message);
        console.error("[App] Component stack:", errorInfo.componentStack);
      }}
    >
    <ThemeProvider>
      <LanguageProvider>
        <PerformanceProvider>
          <UserProvider>
            <CartProvider>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Refine Admin 独立应用 */}
                  <Route path="/admin/*" element={<AdminApp />} />
                  {/* 主应用 */}
                  <Route path="/*" element={<AppContent />} />
                </Routes>
              </Suspense>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: "rgba(30, 20, 50, 0.95)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                  },
                  success: {
                    iconTheme: {
                      primary: "#a855f7",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: "#ef4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />
            </CartProvider>
          </UserProvider>
        </PerformanceProvider>
      </LanguageProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
