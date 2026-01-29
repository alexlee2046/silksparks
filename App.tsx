import React, { useState, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layouts";
import { UserProvider, useUser } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";
import { PerformanceProvider } from "./context/PerformanceContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";
import { Auth } from "./components/Auth";
import { CartDrawer } from "./components/CartDrawer";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import * as m from "./src/paraglide/messages";

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
const LazyShopList = lazy(() => import("./pages/commerce").then(m => ({ default: m.ShopList })));
const LazyProductDetail = lazy(() => import("./pages/commerce").then(m => ({ default: m.ProductDetail })));
const LazyExperts = lazy(() => import("./pages/consultation").then(m => ({ default: m.Experts })));
const LazyExpertProfile = lazy(() => import("./pages/consultation").then(m => ({ default: m.ExpertProfile })));
const LazyBooking = lazy(() => import("./pages/consultation").then(m => ({ default: m.Booking })));
const LazyIntake = lazy(() => import("./pages/consultation").then(m => ({ default: m.Intake })));
const LazyDelivery = lazy(() => import("./pages/consultation").then(m => ({ default: m.Delivery })));
const LazyUserDashboard = lazy(() => import("./pages/dashboard").then(m => ({ default: m.UserDashboard })));
const LazyArchives = lazy(() => import("./pages/dashboard").then(m => ({ default: m.Archives })));
const LazyOrders = lazy(() => import("./pages/dashboard").then(m => ({ default: m.Orders })));
const LazyConsultations = lazy(() => import("./pages/dashboard").then(m => ({ default: m.Consultations })));
const LazyUserSettings = lazy(() => import("./pages/dashboard").then(m => ({ default: m.UserSettings })));
const LazyFavorites = lazy(() => import("./pages/dashboard").then(m => ({ default: m.Favorites })));
const LazyPayments = lazy(() => import("./pages/manage").then(m => ({ default: m.Payments })));
const LazyCurrency = lazy(() => import("./pages/manage").then(m => ({ default: m.Currency })));
const LazyShipping = lazy(() => import("./pages/manage").then(m => ({ default: m.Shipping })));
const LazySystemSettings = lazy(() => import("./pages/manage").then(m => ({ default: m.SystemSettings })));

// 法律页面懒加载
const LazyPrivacy = lazy(() => import("./pages/legal").then(m => ({ default: m.Privacy })));
const LazyTerms = lazy(() => import("./pages/legal").then(m => ({ default: m.Terms })));
const LazyCookies = lazy(() => import("./pages/legal").then(m => ({ default: m.Cookies })));

// 新功能页面懒加载
const LazyRewards = lazy(() => import("./pages/Rewards").then(m => ({ default: m.Rewards })));
const LazyMembership = lazy(() => import("./pages/Membership").then(m => ({ default: m.Membership })));
const LazyYearlyForecast = lazy(() => import("./pages/features/YearlyForecast").then(m => ({ default: m.YearlyForecast })));
const LazyFusionReading = lazy(() => import("./pages/FusionReading").then(m => ({ default: m.FusionReading })));

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
  const { locale } = useLanguage();
  const navigate = useNavigate();
  void locale; // 确保语言切换时重渲染

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
          {m["error.accessRestricted"]()}
        </h2>
        <p className="text-text-muted max-w-sm">
          {m["error.pleaseSignIn"]()}
        </p>
        <button
          onClick={onAuthClick}
          className="px-10 py-4 bg-primary text-background-dark font-bold rounded-xl shadow-2xl hover:bg-white transition-all"
        >
          {m["common.signIn"]()}
        </button>
        <button
          onClick={() => navigate("/")}
          className="text-text-muted text-sm hover:text-foreground transition-colors"
        >
          {m["nav.home"]()}
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
          {m["error.unauthorized"]()}
        </h2>
        <p className="text-text-muted max-w-sm">
          {m["error.pleaseSignIn"]()}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-10 py-4 bg-surface-border/30 text-foreground font-bold rounded-xl hover:bg-white/20 transition-all"
        >
          {m["nav.home"]()}
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
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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

  return (
    <Layout type={getLayoutType()} onAuthClick={() => setShowAuth(true)}>
      <AnimatedPage>
        <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 公开页面 */}
          <Route path="/" element={<Home />} />
          <Route path="/horoscope" element={<BirthChart />} />
          <Route path="/horoscope/report" element={<LazyAstrologyReport />} />
          <Route path="/horoscope/yearly" element={<LazyYearlyForecast />} />
          <Route path="/fusion" element={<LazyFusionReading />} />
          <Route path="/tarot" element={<LazyTarotDaily />} />
          <Route path="/tarot/spread" element={<LazyTarotSpread />} />

          {/* 积分与会员页面 */}
          <Route
            path="/rewards"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyRewards />
              </ProtectedRoute>
            }
          />
          <Route path="/membership" element={<LazyMembership />} />

          {/* 商店页面 */}
          <Route path="/shop" element={<LazyShopList />} />
          <Route path="/shop/:productId" element={<LazyProductDetail />} />

          {/* 专家咨询页面 */}
          <Route path="/experts" element={<LazyExperts />} />
          <Route path="/experts/:expertId" element={<LazyExpertProfile />} />
          <Route path="/booking" element={<LazyBooking />} />
          <Route path="/booking/intake" element={<LazyIntake />} />
          <Route path="/booking/delivery" element={<LazyDelivery />} />

          {/* 用户中心 (受保护) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyUserDashboard />
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
                <LazyArchives />
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
                <LazyOrders />
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
                <LazyConsultations />
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
                <LazyUserSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/favorites"
            element={
              <ProtectedRoute
                requiresAuth={true}
                requiresAdmin={false}
                onAuthClick={() => setShowAuth(true)}
              >
                <LazyFavorites />
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
                <LazyPayments />
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
                <LazyCurrency />
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
                <LazyShipping />
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
                <LazySystemSettings />
              </ProtectedRoute>
            }
          />

          {/* 法律页面 */}
          <Route path="/legal/privacy" element={<LazyPrivacy />} />
          <Route path="/legal/terms" element={<LazyTerms />} />
          <Route path="/legal/cookies" element={<LazyCookies />} />

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
