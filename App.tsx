import React, { useState } from 'react';
import { Screen } from './types';
import { Layout } from './components/Layouts';
import { Home } from './pages/Home';
import { BirthChart } from './pages/BirthChart';
import { AstrologyReport, TarotDaily, TarotSpread } from './pages/AppFeatures';
import { ShopList, ProductDetail } from './pages/Commerce';
import { Experts, Booking, Intake, Delivery } from './pages/Consultation';
import { UserDashboard, Archives, Orders } from './pages/UserDashboard';
import { Payments, Currency, Shipping } from './pages/Admin';
import { UserProvider } from './context/UserContext';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const [currentScreen, setScreen] = useState<Screen>(Screen.HOME);

  const getLayoutType = () => {
    switch (currentScreen) {
      case Screen.USER_DASHBOARD:
      case Screen.ARCHIVES:
      case Screen.ORDERS:
        return 'user';
      case Screen.ADMIN_PAYMENTS:
      case Screen.ADMIN_CURRENCY:
      case Screen.ADMIN_SHIPPING:
        return 'admin';
      default:
        return 'public';
    }
  };

  const renderScreen = () => {
    const props = { currentScreen, setScreen };
    switch (currentScreen) {
      case Screen.HOME: return <Home {...props} />;
      case Screen.BIRTH_CHART: return <BirthChart {...props} />;
      case Screen.REPORT: return <AstrologyReport {...props} />;
      case Screen.TAROT_DAILY: return <TarotDaily {...props} />;
      case Screen.TAROT_SPREAD: return <TarotSpread {...props} />;
      case Screen.SHOP_LIST: return <ShopList {...props} />;
      case Screen.PRODUCT_DETAIL: return <ProductDetail {...props} />;
      case Screen.EXPERTS: return <Experts {...props} />;
      case Screen.BOOKING: return <Booking {...props} />;
      case Screen.INTAKE: return <Intake {...props} />;
      case Screen.DELIVERY: return <Delivery {...props} />;
      case Screen.USER_DASHBOARD: return <UserDashboard {...props} />;
      case Screen.ARCHIVES: return <Archives {...props} />;
      case Screen.ORDERS: return <Orders {...props} />;
      case Screen.ADMIN_PAYMENTS: return <Payments {...props} />;
      case Screen.ADMIN_CURRENCY: return <Currency {...props} />;
      case Screen.ADMIN_SHIPPING: return <Shipping {...props} />;
      default: return <Home {...props} />;
    }
  };

  return (
    <UserProvider>
      <Layout setScreen={setScreen} type={getLayoutType()}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom bezier for premium feel
            className="w-full h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      {/* Demo Navigation Helper */}
      <div className="fixed bottom-4 right-4 z-[1000]">
        <select
          className="bg-black text-white text-xs p-2 rounded border border-white/20 opacity-50 hover:opacity-100 transition-opacity"
          value={currentScreen}
          onChange={(e) => setScreen(e.target.value as Screen)}
        >
          {Object.values(Screen).map(screen => (
            <option key={screen} value={screen}>{screen}</option>
          ))}
        </select>
      </div>
    </UserProvider>
  );
};

export default App;