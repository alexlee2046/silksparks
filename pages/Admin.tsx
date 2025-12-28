import React from 'react';
import { Screen, NavProps } from '../types';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/GlassCard';
import { GlowButton } from '../components/GlowButton';

const AdminLayout: React.FC<{ title: string; children: React.ReactNode; setScreen: (s: Screen) => void }> = ({ title, children, setScreen }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex-1 bg-background-dark p-4 md:p-10 min-h-screen relative overflow-hidden"
  >
    {/* Background Decorative Element */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

    <div className="max-w-[1440px] mx-auto relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary">
            <span className="material-symbols-outlined text-[14px]">shield_person</span> Admin System
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white tracking-tight">
            {title.split(' ').map((word, i) => (
              <span key={i} className={i === 0 ? 'font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200 mr-3' : 'text-white'}>
                {word}{' '}
              </span>
            ))}
          </h1>
        </div>
        <div className="flex gap-4">
          <GlowButton variant="secondary" onClick={() => setScreen(Screen.HOME)} icon="home">Exit Admin</GlowButton>
          <GlowButton variant="primary" icon="save">Save Changes</GlowButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          <GlassCard className="p-6 sticky top-24 border-white/5" intensity="low">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6 px-2">Control Panel</h3>
            <nav className="flex flex-col space-y-2">
              <AdminNavLink active={title === 'Payment Configuration'} onClick={() => setScreen(Screen.ADMIN_PAYMENTS)} icon="payments" label="Payments" />
              <AdminNavLink active={title === 'Currency & Localization'} onClick={() => setScreen(Screen.ADMIN_CURRENCY)} icon="currency_exchange" label="Currency" />
              <AdminNavLink active={title === 'Shipping Rate Templates'} onClick={() => setScreen(Screen.ADMIN_SHIPPING)} icon="local_shipping" label="Shipping" />
            </nav>

            <div className="mt-10 pt-6 border-t border-white/5">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">System Status</p>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-white font-bold text-xs">All Systems Operational</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-9 space-y-8"
        >
          {children}
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const AdminNavLink = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 px-4 py-3.5 text-sm font-bold w-full text-left rounded-xl transition-all duration-300 group ${active ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(244,192,37,0.1)]' : 'text-white/50 hover:bg-white/5 hover:text-white border border-transparent'}`}
  >
    <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="tracking-wide uppercase text-[10px] font-bold">{label}</span>
  </button>
);

export const Payments: React.FC<NavProps> = ({ setScreen }) => (
  <AdminLayout title="Payment Configuration" setScreen={setScreen}>
    <GlassCard className="p-8 border-white/5">
      <div className="flex flex-col md:flex-row items-start justify-between gap-6 pb-8 border-b border-white/5 mb-8">
        <div className="space-y-1">
          <h3 className="text-white font-bold text-xl font-display">Payment Environment</h3>
          <p className="text-white/40 text-sm font-light">Control transaction processing mode across the entire platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-full border border-white/5">
          <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full text-white/40 hover:text-white transition-colors">Test Mode</button>
          <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full bg-primary text-background-dark shadow-lg shadow-primary/20">Live Production</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProviderCard name="Stripe" icon="credit_card" connected />
        <ProviderCard name="PayPal" icon="account_balance_wallet" connected />
      </div>
    </GlassCard>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsMini label="Total Revenue (30d)" value="$42,850" change="+12.5%" />
      <StatsMini label="Successful Tx" value="1,248" change="+5.2%" />
      <StatsMini label="Refund Rate" value="0.8%" change="-1.2%" />
    </div>
  </AdminLayout>
);

const StatsMini = ({ label, value, change }: any) => (
  <GlassCard className="p-6 border-white/5" intensity="low">
    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">{label}</p>
    <div className="flex items-baseline gap-3">
      <span className="text-2xl font-bold text-white font-display">{value}</span>
      <span className={`text-[10px] font-bold ${change.startsWith('+') ? 'text-green-500' : 'text-rose-500'}`}>{change}</span>
    </div>
  </GlassCard>
);

const ProviderCard = ({ name, icon, connected }: any) => (
  <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center group hover:border-primary/20 transition-all duration-300">
    <div className="flex items-center gap-4">
      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <span className="material-symbols-outlined text-white text-[32px] group-hover:text-primary transition-colors">{icon}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h4 className="text-white font-bold text-lg">{name}</h4>
          {connected && <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20 uppercase tracking-widest">Active</span>}
        </div>
        <p className="text-xs text-white/30">Connect your account to accept payments.</p>
      </div>
    </div>
    <button className="h-10 w-10 rounded-xl border border-white/10 flex items-center justify-center text-white/40 hover:bg-primary hover:text-background-dark hover:border-primary transition-all">
      <span className="material-symbols-outlined text-xl">settings</span>
    </button>
  </div>
);

export const Currency: React.FC<NavProps> = ({ setScreen }) => (
  <AdminLayout title="Currency & Localization" setScreen={setScreen}>
    <GlassCard className="p-8 border-white/5">
      <h2 className="text-xl font-bold text-white mb-8 font-display flex items-center gap-2">
        <span className="text-primary">✦</span> General Preferences
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Base Store Currency</label>
          <div className="relative">
            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white appearance-none outline-none focus:border-primary/50 transition-colors cursor-pointer">
              <option>USD - United States Dollar ($)</option>
              <option>EUR - Euro (€)</option>
              <option>GBP - British Pound (£)</option>
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 pointer-events-none">expand_more</span>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest">Primary Language</label>
          <div className="relative">
            <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white appearance-none outline-none focus:border-primary/50 transition-colors cursor-pointer">
              <option>English (Universal)</option>
              <option>Chinese (Simplified)</option>
              <option>French (Standard)</option>
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 pointer-events-none">expand_more</span>
          </div>
        </div>
      </div>
    </GlassCard>

    <GlassCard className="overflow-hidden border-white/5 p-0">
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white font-display">Active Multi-Currencies</h2>
        <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Add Currency
        </button>
      </div>
      <div className="divide-y divide-white/5">
        <CurrencyRow name="United States Dollar" code="USD" rate="1.0000" defaultC />
        <CurrencyRow name="Euro" code="EUR" rate="0.9245" />
        <CurrencyRow name="British Pound" code="GBP" rate="0.7892" />
        <CurrencyRow name="Chinese Yuan" code="CNY" rate="7.2450" />
      </div>
    </GlassCard>
  </AdminLayout>
);

const CurrencyRow = ({ name, code, rate, defaultC }: any) => (
  <div className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-white/5 transition-all duration-300 group">
    <div className="col-span-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-white/40 text-xs">
        {code.substring(0, 2)}
      </div>
      <div>
        <div className="text-white font-bold text-sm flex items-center gap-3">
          {name}
          {defaultC && <span className="px-2 py-0.5 rounded-full text-[8px] bg-primary text-background-dark font-bold uppercase tracking-widest">Main</span>}
        </div>
        <p className="text-[10px] text-white/30 font-mono mt-0.5">{code}</p>
      </div>
    </div>
    <div className="col-span-4 text-white font-mono text-sm tracking-widest">{rate}</div>
    <div className="col-span-3 text-right">
      <button className="text-white/20 hover:text-primary transition-colors h-8 w-8 rounded-lg hover:bg-primary/10 flex items-center justify-center ml-auto">
        <span className="material-symbols-outlined text-lg">edit</span>
      </button>
    </div>
  </div>
);

export const Shipping: React.FC<NavProps> = ({ setScreen }) => (
  <AdminLayout title="Shipping Rate Templates" setScreen={setScreen}>
    <div className="grid grid-cols-1 gap-8">
      <GlassCard className="overflow-hidden border-white/5 p-0">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white font-display">Global Shipping Profile</h2>
            <p className="text-sm text-white/40 font-light flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">inventory_2</span> 42 products active • <span className="material-symbols-outlined text-sm">public</span> 3 shipping zones
            </p>
          </div>
          <GlowButton variant="secondary" className="h-10 text-xs" icon="add">New Profile</GlowButton>
        </div>
        <div className="p-8 space-y-8">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">public</span> Configured Zones
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <ShippingZone name="Domestic - North America" rates={[{ name: 'Standard (3-5 Days)', price: '$8.00' }, { name: 'Express (1-2 Days)', price: 'Free' }]} />
            <ShippingZone name="Mainland China / Asia Pacific" rates={[{ name: 'Intl Saver (2-3 Weeks)', price: '$18.50' }, { name: 'Aramax Direct', price: '$45.00' }]} />
            <ShippingZone name="European Union" rates={[{ name: 'Standard Flat Rate', price: 'Free' }]} />
          </div>
        </div>
      </GlassCard>
    </div>
  </AdminLayout>
);

const ShippingZone = ({ name, rates }: any) => (
  <div className="border border-white/5 rounded-2xl bg-black/20 overflow-hidden group hover:border-primary/20 transition-all duration-300">
    <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{name}</h4>
      </div>
      <button className="text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest">Manage</button>
    </div>
    <div className="divide-y divide-white/5">
      {rates.map((r: any) => (
        <div key={r.name} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{r.name}</span>
            <span className="text-[10px] text-white/30 tracking-wide uppercase mt-0.5">Calculated Rate</span>
          </div>
          <span className="text-sm font-bold text-primary font-mono">{r.price}</span>
        </div>
      ))}
    </div>
  </div>
);