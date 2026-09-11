import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  Activity,
  Layers,
  BarChart2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Radio,
  BrainCircuit,
  Crosshair
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const TICKER_DATA = [
  { symbol: 'NIFTY 50', price: '22,547.10', change: '+1.24%', up: true },
  { symbol: 'BANK NIFTY', price: '48,234.55', change: '+0.85%', up: true },
  { symbol: 'SENSEX', price: '74,892.45', change: '+1.12%', up: true },
  { symbol: 'RELIANCE', price: '2,890.45', change: '+2.35%', up: true },
  { symbol: 'TCS', price: '3,420.90', change: '+1.48%', up: true },
  { symbol: 'HDFC BANK', price: '1,720.80', change: '+0.92%', up: true },
  { symbol: 'INFOSYS', price: '1,568.10', change: '-0.38%', up: false },
  { symbol: 'ITC', price: '478.60', change: '+3.15%', up: true },
  { symbol: 'BAJFINANCE', price: '7,340.00', change: '+1.82%', up: true },
  { symbol: 'TATAMOTORS', price: '984.30', change: '+2.10%', up: true }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrollY, setScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<'NIFTY' | 'RELIANCE'>('NIFTY');
  const [hoverTerminal, setHoverTerminal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-emerald-500 selection:text-black font-sans relative overflow-x-hidden">
      {/* Dynamic Background Mesh & Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[600px] bg-emerald-600/8 rounded-full blur-[160px]" />
        
        {/* Subtle Cyber Grid */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* ─── 01. NAVIGATION HEADER ─── */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 30 
            ? 'bg-[#030712]/85 backdrop-blur-xl border-b border-emerald-500/15 py-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Exact Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/30">
              <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="flex items-center text-xl font-black tracking-tight">
              <span className="text-emerald-400">Paper</span>
              <span className="text-white">Profit</span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollTo('features')}
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollTo('features')}
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Guru Scan
            </button>
            <button 
              onClick={() => scrollTo('features')}
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Options Suite
            </button>
            <button 
              onClick={() => scrollTo('how-it-works')}
              className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
            >
              How It Works
            </button>
          </div>

          {/* Nav CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="relative group px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-bold text-sm transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <span>Start Paper Trading</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── 02. HERO SECTION WITH 2.5D TRADING TERMINAL ─── */}
      <section className="relative z-10 pt-32 pb-16 md:pt-40 md:pb-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 text-left space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>India's Premier Paper Trading Ecosystem — NSE & BSE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Master Indian Markets.{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent block mt-1">
                  Without Risking ₹1.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
                Trade real-time equities, F&O options, and practice algorithmic strategies with{' '}
                <span className="text-slate-200 font-semibold">₹50,00,000 virtual capital</span>. Zero capital at risk, institutional grade tools.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={onGetStarted}
                  className="px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-extrabold text-base transition-all duration-300 hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] hover:scale-[1.02] flex items-center gap-2.5"
                >
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>Launch Terminal Free</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  onClick={() => scrollTo('features')}
                  className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-slate-200 font-semibold text-base transition-all duration-300 flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Explore Simulator</span>
                </button>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-medium text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>₹0 Capital at Risk</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Free Forever</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Live NSE/BSE Feed</span>
                </div>
              </div>
            </div>

            {/* Right: 2.5D Angled Dynamic Trading Terminal Showcase */}
            <div className="lg:col-span-6 relative perspective-[1200px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-3xl -z-10 transform -rotate-6 scale-95" />

              {/* Floating Order Execution Toast */}
              <div className="absolute -top-4 -left-4 z-30 bg-[#0c1322]/95 border border-emerald-500/40 rounded-xl px-4 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center gap-3 animate-bounce [animation-duration:4s]">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Executed Paper Order</div>
                  <div className="text-xs font-semibold text-slate-200">BUY 100 TCS @ ₹3,420.90</div>
                </div>
              </div>

              {/* Floating Portfolio HUD Card */}
              <div className="absolute -bottom-6 -right-2 z-30 bg-[#0c1322]/95 border border-emerald-500/35 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8)] backdrop-blur-lg hidden sm:block">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Portfolio Value</div>
                <div className="text-2xl font-black text-emerald-400 tracking-tight mt-0.5">₹52,48,930</div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+₹1,84,320 (+18.4% Lifetime)</span>
                </div>
              </div>

              {/* 3D Tilted Glass Terminal Window */}
              <div 
                onMouseEnter={() => setHoverTerminal(true)}
                onMouseLeave={() => setHoverTerminal(false)}
                className={`relative bg-[#0a0f1d]/90 border border-emerald-500/25 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden transition-transform duration-700 ease-out ${
                  hoverTerminal ? 'rotate-x-0 rotate-y-0 scale-[1.01]' : 'rotate-x-3 rotate-y-[-6deg] rotate-z-1'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Terminal Window Header Bar */}
                <div className="bg-[#0e1628] border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-900 border border-slate-700/60 rounded text-[11px] text-slate-300 font-mono">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>LIVE TERMINAL · NSE REAL-TIME</span>
                    </div>
                  </div>

                  {/* Stock Symbol Selector Tabs */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setActiveTab('NIFTY')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        activeTab === 'NIFTY' 
                          ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      NIFTY 50
                    </button>
                    <button
                      onClick={() => setActiveTab('RELIANCE')}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        activeTab === 'RELIANCE' 
                          ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      RELIANCE
                    </button>
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-5 space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-400">
                        {activeTab === 'NIFTY' ? 'NIFTY 50 INDEX · NSE' : 'RELIANCE INDUSTRIES LTD · NSE'}
                      </div>
                      <div className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mt-0.5">
                        <span>{activeTab === 'NIFTY' ? '₹22,547.10' : '₹2,890.45'}</span>
                        <span className="text-sm font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {activeTab === 'NIFTY' ? '+1.24% ▲' : '+2.35% ▲'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-slate-400">Day Range</div>
                      <div className="text-xs font-semibold text-slate-200">
                        {activeTab === 'NIFTY' ? '22,410.20 — 22,580.90' : '2,845.00 — 2,905.00'}
                      </div>
                    </div>
                  </div>

                  {/* Spline Chart with Area Glow */}
                  <div className="relative h-44 w-full bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 overflow-hidden flex flex-col justify-between">
                    <svg className="w-full h-28 overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                      <defs>
                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,95 Q 40,75 80,82 T 160,55 T 240,68 T 320,35 T 400,42 T 460,18 L 500,12 L 500,120 L 0,120 Z"
                        fill="url(#chartGlow)"
                      />
                      <path
                        d="M 0,95 Q 40,75 80,82 T 160,55 T 240,68 T 320,35 T 400,42 T 460,18 L 500,12"
                        fill="none"
                        stroke="#00E599"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <circle cx="500" cy="12" r="5" fill="#00E599" className="animate-ping" />
                      <circle cx="500" cy="12" r="4" fill="#ffffff" />
                    </svg>

                    <div className="flex items-end gap-1 h-8 w-full pt-1 border-t border-slate-800/60">
                      {[35, 55, 40, 70, 85, 60, 95, 80, 65, 90, 75, 100, 85, 92, 110].map((val, idx) => (
                        <div 
                          key={idx} 
                          className={`flex-1 rounded-t-sm transition-all ${
                            idx % 3 === 0 ? 'bg-red-500/40' : 'bg-emerald-400/50 hover:bg-emerald-400'
                          }`}
                          style={{ height: `${(val / 110) * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Market Depth Order Book */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-between">
                        <span>Bid Depth (Buyers)</span>
                        <span className="text-emerald-400">62%</span>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span>2,890.10</span>
                          <span className="text-emerald-400 font-bold">14,250</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>2,889.50</span>
                          <span className="text-emerald-400/80 font-bold">8,900</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-left">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-between">
                        <span>Ask Depth (Sellers)</span>
                        <span className="text-red-400">38%</span>
                      </div>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between text-slate-300">
                          <span>2,890.90</span>
                          <span className="text-red-400 font-bold">9,410</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>2,891.40</span>
                          <span className="text-red-400/80 font-bold">5,320</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 03. LIVE NSE/BSE MARKET TICKER TAPE ─── */}
      <div className="relative z-20 border-y border-emerald-500/20 bg-[#050b18]/90 backdrop-blur-md py-3 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex w-max animate-marquee space-x-10 items-center">
          {[...TICKER_DATA, ...TICKER_DATA].map((stock, i) => (
            <div key={i} className="flex items-center gap-3 text-xs font-mono tracking-tight">
              <span className="font-bold text-slate-300">{stock.symbol}</span>
              <span className="text-slate-100 font-medium">₹{stock.price}</span>
              <span className={`font-bold ${stock.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {stock.up ? '▲' : '▼'} {stock.change}
              </span>
              <span className="text-slate-700">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 04. KEY STATS & TRUST STRIP ─── */}
      <section className="relative z-10 py-12 px-6 border-b border-slate-800/60 bg-slate-950/40">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">₹0</div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Real Capital at Risk</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">NSE + BSE</div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Full Indian Market Coverage</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-teal-400 tracking-tight">&lt; 100ms</div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Simulated Execution Speed</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl sm:text-4xl font-black text-green-400 tracking-tight">100% Free</div>
            <div className="text-xs sm:text-sm font-medium text-slate-400 mt-1">Zero Brokerage or Demat Needed</div>
          </div>
        </div>
      </section>

      {/* ─── 05. PRO FEATURE SUITE (RICH VISUAL GRAPHIC CARDS MATCHING MOCKUP) ─── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Pro Feature Suite
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Built For The Serious Trader
            </h2>
            <p className="text-slate-400 text-base mt-3">
              Everything you need to master equities, options, and market psychology with institutional-grade visual tools.
            </p>
          </div>

          {/* 3x2 Grid of Rich Illustrated Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* ── CARD 1: GURU SCAN PRO (GOLDEN RADAR SCANNER VISUAL) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(245,158,11,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/15 transition-colors" />
              
              {/* Rich Visual Graphic Area: Golden Radar Sweep */}
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-amber-500/30 mb-5 overflow-hidden flex items-center justify-center p-3">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-amber-500/20" />
                  <div className="w-28 h-28 rounded-full border border-amber-500/25 absolute" />
                  <div className="w-40 h-40 rounded-full border border-amber-500/35 absolute" />
                  <div className="w-full h-[1px] bg-amber-500/20 absolute" />
                  <div className="h-full w-[1px] bg-amber-500/20 absolute" />
                  
                  <div 
                    className="absolute w-36 h-36 rounded-full origin-center animate-spin"
                    style={{
                      animationDuration: '6s',
                      background: 'conic-gradient(from 0deg, rgba(245, 158, 11, 0.4) 0deg, rgba(245, 158, 11, 0.0) 90deg, transparent 90deg)'
                    }}
                  />
                  
                  <div className="absolute top-10 right-14 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/40">TCS (VCP 96%)</span>
                  </div>
                  <div className="absolute bottom-12 left-12 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded border border-amber-500/40">RELIANCE (Buffett 91%)</span>
                  </div>
                </div>

                <div className="relative z-10 w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,1)]" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    Guru Scan Pro
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Autonomous scanner testing 1,850+ NSE/BSE stocks against legendary strategies of Mark Minervini, Warren Buffett, and Peter Lynch.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>VCP Breakouts & Low Debt Moats Screened Live</span>
                </div>
              </div>
            </div>

            {/* ── CARD 2: F&O OPTIONS TERMINAL (PAYOFF CURVE & GREEKS MATRIX) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(168,85,247,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/15 transition-colors" />
              
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-purple-500/30 mb-5 overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-purple-500/20 pb-1.5">
                  <span className="text-purple-300 font-bold">BULL CALL SPREAD</span>
                  <span className="text-emerald-400 font-bold">MAX PROFIT: ₹24,500</span>
                </div>

                <svg className="w-full h-24 overflow-visible my-1" viewBox="0 0 300 80">
                  <defs>
                    <linearGradient id="profitGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="lossGlow" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  <line x1="0" y1="40" x2="300" y2="40" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                  
                  <path d="M 0,65 L 120,65 L 200,15 L 300,15 L 300,40 L 0,40 Z" fill="url(#profitGlow)" />
                  <path d="M 0,65 L 120,65 L 120,40 L 0,40 Z" fill="url(#lossGlow)" />
                  <path d="M 0,65 L 120,65 L 200,15 L 300,15" fill="none" stroke="#a855f7" strokeWidth="2.5" />
                  
                  <circle cx="120" cy="65" r="4" fill="#ef4444" />
                  <circle cx="200" cy="15" r="4" fill="#10b981" />
                  <text x="110" y="78" fill="#94a3b8" fontSize="8" fontFamily="monospace">22,400 CE</text>
                  <text x="190" y="10" fill="#94a3b8" fontSize="8" fontFamily="monospace">22,600 CE</text>
                </svg>

                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-1 border-t border-purple-500/20">
                  <div className="bg-purple-950/40 rounded py-0.5"><span className="text-slate-500">Δ </span><span className="text-purple-300 font-bold">0.52</span></div>
                  <div className="bg-purple-950/40 rounded py-0.5"><span className="text-slate-500">Γ </span><span className="text-purple-300 font-bold">0.08</span></div>
                  <div className="bg-purple-950/40 rounded py-0.5"><span className="text-slate-500">Θ </span><span className="text-red-400 font-bold">-6.2</span></div>
                  <div className="bg-purple-950/40 rounded py-0.5"><span className="text-slate-500">IV </span><span className="text-emerald-400 font-bold">13.4%</span></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                    F&O Options Suite
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Multi-leg strategy builder with live Greeks, visual payoff curves, IV skew heatmap, and strike chain open interest.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>Real Options Greeks & Strike Chain Heatmaps</span>
                </div>
              </div>
            </div>

            {/* ── CARD 3: SWING MOMENTUM TRACKER (CANDLESTICK BREAKOUT VISUAL) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(16,185,129,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/15 transition-colors" />
              
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-emerald-500/30 mb-5 overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-emerald-500/20 pb-1.5">
                  <span className="text-emerald-300 font-bold">RELIANCE · 50 EMA CROSSOVER</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">BREAKOUT BUY</span>
                </div>

                <div className="relative h-28 flex items-end justify-between px-2 pt-2">
                  <div className="absolute top-7 left-0 right-0 border-b border-dashed border-emerald-400/80 z-10 flex justify-end">
                    <span className="text-[9px] font-mono text-emerald-400 bg-[#090e1a] px-1 -mt-2">Res: ₹2,880</span>
                  </div>

                  {[
                    { c: 'red', h: 32, w: 50 },
                    { c: 'green', h: 42, w: 46 },
                    { c: 'red', h: 28, w: 48 },
                    { c: 'green', h: 54, w: 38 },
                    { c: 'green', h: 68, w: 32 },
                    { c: 'green', h: 84, w: 26 },
                    { c: 'green', h: 96, w: 20, breakout: true },
                  ].map((candle, idx) => (
                    <div key={idx} className="relative flex flex-col items-center justify-end h-full w-5">
                      <div className={`w-[1px] ${candle.c === 'green' ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ height: `${candle.w}%` }} />
                      <div 
                        className={`w-3.5 rounded-sm ${candle.c === 'green' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                        style={{ height: `${candle.h}%` }}
                      />
                      {candle.breakout && (
                        <span className="absolute -top-3 w-2 h-2 rounded-full bg-white animate-ping" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-emerald-500/20">
                  <span>Target: ₹3,050 (1:3.2 R:R)</span>
                  <span className="text-emerald-400 font-bold">+5.4% Swing Target</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Swing Momentum Tracker
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Detect high-probability swing trading setups with 20/50 EMA momentum crossovers, volume spikes, and automatic stop-loss calculation.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Technical Breakouts & Automated Risk/Reward Targets</span>
                </div>
              </div>
            </div>

            {/* ── CARD 4: LIVE NSE/BSE DEPTH (ORDER BOOK LADDER VISUAL) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-colors" />
              
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-cyan-500/30 mb-5 overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-cyan-500/20 pb-1.5">
                  <span className="text-cyan-300 font-bold">NIFTY ORDER BOOK · L2 DEPTH</span>
                  <span className="text-emerald-400 font-bold">BUYERS 64% / SELLERS 36%</span>
                </div>

                <div className="space-y-1.5 text-[10px] font-mono my-1">
                  <div className="relative flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/60 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 w-[65%]" />
                    <span className="relative z-10 text-emerald-400 font-bold">18,450 Qty</span>
                    <span className="relative z-10 text-slate-200 font-bold">₹22,547.00</span>
                    <span className="relative z-10 text-red-400">9,200 Qty</span>
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 w-[35%]" />
                  </div>
                  <div className="relative flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/60 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 w-[78%]" />
                    <span className="relative z-10 text-emerald-400 font-bold">24,100 Qty</span>
                    <span className="relative z-10 text-slate-200 font-bold">₹22,546.50</span>
                    <span className="relative z-10 text-red-400">6,150 Qty</span>
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 w-[22%]" />
                  </div>
                  <div className="relative flex items-center justify-between px-2 py-0.5 rounded bg-slate-900/60 overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 w-[55%]" />
                    <span className="relative z-10 text-emerald-400 font-bold">14,200 Qty</span>
                    <span className="relative z-10 text-slate-200 font-bold">₹22,546.00</span>
                    <span className="relative z-10 text-red-400">11,800 Qty</span>
                    <div className="absolute right-0 top-0 bottom-0 bg-red-500/20 w-[45%]" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-cyan-500/20">
                  <span className="text-emerald-400">Institutional Wall: ₹22,540</span>
                  <span className="text-cyan-400 font-bold">Live Bid/Ask Feed</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Live NSE/BSE Depth
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Master market microstructure. Analyze order books, institutional block volume walls, and buyer-seller strength before trading.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Real-Time Level 2 Order Depth & Liquidity Clusters</span>
                </div>
              </div>
            </div>

            {/* ── CARD 5: TRADING PSYCHOLOGY ENGINE (MINDSET GAUGE METER VISUAL) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-pink-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(236,72,153,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/15 transition-colors" />
              
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-pink-500/30 mb-5 overflow-hidden p-3 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="none" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="#ec4899" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset="25" 
                      strokeLinecap="round" 
                      fill="none" 
                      className="transition-all duration-1000"
                    />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <BrainCircuit className="w-6 h-6 text-pink-400 animate-pulse mb-0.5" />
                    <div className="text-xl font-black text-white">94%</div>
                    <div className="text-[9px] font-mono text-emerald-400 font-bold uppercase">Discipline</div>
                  </div>
                </div>

                <div className="w-full flex justify-between text-[10px] font-mono text-slate-400 mt-1 border-t border-pink-500/20 pt-1">
                  <span>Revenge Trades: 0</span>
                  <span className="text-emerald-400 font-bold">Rule Followed: 100%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                    Trading Psychology Engine
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Track emotional discipline, revenge trading triggers, and cognitive biases with automated post-trade mental performance scoring.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                  <span>Emotional Discipline Score & Behavioral Analytics</span>
                </div>
              </div>
            </div>

            {/* ── CARD 6: MULTI-PORTFOLIO LABS (OVERLAPPING SEGREGATED CARDS VISUAL) ── */}
            <div className="group relative bg-[#090e1a]/90 border border-slate-800/80 hover:border-teal-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(20,184,166,0.15)] flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/15 transition-colors" />
              
              <div className="relative h-44 w-full bg-gradient-to-b from-[#0e1628] to-[#080d18] rounded-xl border border-teal-500/30 mb-5 overflow-hidden p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-teal-500/20 pb-1.5">
                  <span className="text-teal-300 font-bold">MULTI-ACCOUNT SANDBOX</span>
                  <span className="text-emerald-400 font-bold">2 ACTIVE ACCOUNTS</span>
                </div>

                <div className="space-y-2 my-1">
                  <div className="bg-[#0a1222] border border-teal-500/30 rounded-lg p-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">S</div>
                      <div>
                        <div className="text-[11px] font-bold text-white">Swing Portfolio</div>
                        <div className="text-[9px] text-slate-400">8 Indian Equities</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-emerald-400">+28.4%</div>
                      <div className="text-[9px] text-slate-400">₹24,80,000</div>
                    </div>
                  </div>

                  <div className="bg-[#0a1222] border border-purple-500/30 rounded-lg p-2 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">O</div>
                      <div>
                        <div className="text-[11px] font-bold text-white">Options Lab</div>
                        <div className="text-[9px] text-slate-400">F&O Iron Condors</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-teal-400">+41.2%</div>
                      <div className="text-[9px] text-slate-400">₹18,50,000</div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1 border-t border-teal-500/20">
                  <span>Isolated Risk Sandboxes</span>
                  <span className="text-teal-400 font-bold">Side-by-Side P&L</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Multi-Portfolio Labs
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Run multiple independent simulated accounts simultaneously. Test long-term value investing vs high-octane intraday options.
                </p>
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  <span>Segregated Strategies & Comparative Performance</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 06. HOW IT WORKS TIMELINE (4 STEPS CONNECTED) ─── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 bg-slate-950/60 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Fast Track Onboarding
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Start in Under 60 Seconds
            </h2>
            <p className="text-slate-400 text-base mt-2">
              No paperwork, zero bank link requirement, straight into simulated live markets.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="relative text-center md:text-left space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                01
              </div>
              <h4 className="text-lg font-bold text-white">Instant Signup</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Create your free paper account in 1 click. No KYC, no demat or Aadhaar required.
              </p>
            </div>

            <div className="relative text-center md:text-left space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                02
              </div>
              <h4 className="text-lg font-bold text-white">Pick Stocks & F&O</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Search over 2,000+ NSE & BSE stocks, NIFTY options, or explore Guru Scan presets.
              </p>
            </div>

            <div className="relative text-center md:text-left space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                03
              </div>
              <h4 className="text-lg font-bold text-white">Execute Paper Trades</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Place market or limit orders with virtual capital. Watch your live P&L respond.
              </p>
            </div>

            <div className="relative text-center md:text-left space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl font-black text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                04
              </div>
              <h4 className="text-lg font-bold text-white">Master Strategy</h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                Analyze win rate, sharpen risk management, and step into the real markets prepared.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 07. FINAL CTA CONVERSION CARD WITH TRADING MENTOR LADY ─── */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0c1626] via-[#091120] to-[#040813] border border-emerald-500/35 p-8 sm:p-12 lg:p-14 shadow-[0_25px_80px_rgba(0,0,0,0.85)] overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Column: Text & CTA Action */}
              <div className="lg:col-span-7 text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Expert Guidance · Zero Financial Stress</span>
                </div>

                <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                  Ready to trade like an{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent">
                    institutional pro?
                  </span>
                </h3>

                <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
                  Join thousands of Indian retail traders practicing daily on PaperProfit. Build confidence, master setups, and test strategies with your virtual <span className="text-emerald-400 font-bold">₹50,00,000 wallet</span>.
                </p>

                {/* Mentor Quote Callout */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/25 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-xs sm:text-sm text-slate-300 leading-snug">
                    <span className="text-emerald-400 font-bold">Mentor's Rule: </span>
                    "Never risk your real hard-earned money until you have proved your trading edge in simulation first."
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <button
                    onClick={onGetStarted}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-slate-950 font-black text-base transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] hover:scale-105 active:scale-95 flex items-center gap-3"
                  >
                    <Sparkles className="w-5 h-5 fill-slate-950" />
                    <span>Get Started in 60 Seconds — 100% Free</span>
                    <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium flex items-center gap-2 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No credit card required · No broker login · 100% simulated paper trading</span>
                </div>
              </div>

              {/* Right Column: Attractive Female Mentor Guiding and Pointing */}
              <div className="lg:col-span-5 relative flex justify-center">
                {/* Glowing border frame around mentor */}
                <div className="relative rounded-2xl p-1 bg-gradient-to-b from-emerald-500/40 via-teal-500/20 to-transparent shadow-[0_15px_45px_rgba(16,185,129,0.25)] group">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 max-w-[360px] sm:max-w-[400px]">
                    <img 
                      src="/mentor_lady.jpg" 
                      alt="Trading Mentor Instruction" 
                      className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Instruction Overlay Tag */}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md border border-emerald-500/35 rounded-xl p-3 shadow-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Trading Instructor</div>
                        <div className="text-xs font-semibold text-slate-200">"Click here & start paper trading today!"</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 08. INSTITUTIONAL FOOTER ─── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#02050c] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center border border-emerald-400/30">
              <TrendingUp className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div className="text-base font-black">
              <span className="text-emerald-400">Paper</span>
              <span className="text-white">Profit</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 max-w-lg text-center md:text-left leading-relaxed">
            PaperProfit is a financial simulator and educational paper trading platform. Market data provided for NSE & BSE stocks is for simulated training purposes only. Not registered with SEBI. No actual financial transactions take place.
          </div>

          <div className="text-xs font-mono text-slate-600">
            © {new Date().getFullYear()} PaperProfit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
