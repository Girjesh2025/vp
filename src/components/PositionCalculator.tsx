import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessionalSidebar from './ProfessionalSidebar';
import ProfessionalHeader from './ProfessionalHeader';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Shield,
  IndianRupee,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  ArrowLeft,
} from 'lucide-react';

interface Results {
  stopLossPrice: number;
  targetPrice: number;
  quantity: number;
  investment: number;
  riskAmount: number;
  rewardAmount: number;
  rrRatio: number;
  brokerage: number;
  netProfit: number;
  netLoss: number;
  breakEven: number;
  slPct: number;
  tgtPct: number;
  capitalUtilized: number;
}

const PositionCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [capital, setCapital] = useState('100000');
  const [entryPrice, setEntryPrice] = useState('2500');
  const [stopLossPct, setStopLossPct] = useState('2');
  const [targetPct, setTargetPct] = useState('4');
  const [riskPct, setRiskPct] = useState('1');
  const [mode, setMode] = useState<'percent' | 'price'>('percent');
  const [slPrice, setSlPrice] = useState('');
  const [tgtPrice, setTgtPrice] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [results, setResults] = useState<Results | null>(null);


  useEffect(() => {
    const cap = parseFloat(capital);
    const entry = parseFloat(entryPrice);
    const risk = parseFloat(riskPct);
    if (!cap || !entry || !risk || entry <= 0 || cap <= 0) { setResults(null); return; }

    let sl: number, tgt: number;
    if (mode === 'percent') {
      const slP = parseFloat(stopLossPct);
      const tgtP = parseFloat(targetPct);
      if (!slP || !tgtP) { setResults(null); return; }
      sl = entry * (1 - slP / 100);
      tgt = entry * (1 + tgtP / 100);
    } else {
      sl = parseFloat(slPrice);
      tgt = parseFloat(tgtPrice);
      if (!sl || !tgt || sl >= entry || tgt <= entry) { setResults(null); return; }
    }

    const riskPerShare = entry - sl;
    const riskAmount = (cap * risk) / 100;
    const quantity = Math.floor(riskAmount / riskPerShare);
    if (quantity <= 0) { setResults(null); return; }
    const investment = entry * quantity;
    const rewardAmount = (tgt - entry) * quantity;
    const netLoss = riskPerShare * quantity;
    const rrRatio = (tgt - entry) / riskPerShare;
    const brokerage = Math.min(investment * 0.0005, 20) * 2;
    const netProfit = rewardAmount - brokerage;
    const breakEven = entry + brokerage / quantity;
    const slPct = ((entry - sl) / entry) * 100;
    const tgtPct = ((tgt - entry) / entry) * 100;
    const capitalUtilized = (investment / cap) * 100;

    setResults({ stopLossPrice: sl, targetPrice: tgt, quantity, investment, riskAmount: netLoss, rewardAmount, rrRatio, brokerage, netProfit, netLoss, breakEven, slPct, tgtPct, capitalUtilized });
  }, [capital, entryPrice, stopLossPct, targetPct, riskPct, mode, slPrice, tgtPrice]);

  const reset = () => { setCapital('100000'); setEntryPrice('2500'); setStopLossPct('2'); setTargetPct('4'); setRiskPct('1'); setSlPrice(''); setTgtPrice(''); };
  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtRs = (n: number) => `₹${fmt(n)}`;

  const rrColor = results ? (results.rrRatio >= 2 ? 'text-emerald-400' : results.rrRatio >= 1.5 ? 'text-yellow-400' : 'text-red-400') : '';
  const rrBg = results ? (results.rrRatio >= 2 ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30' : results.rrRatio >= 1.5 ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30' : 'from-red-500/20 to-red-600/10 border-red-500/30') : '';

  // Price bar positions (SL..Entry..Target scaled 0-100)
  const slPos = results ? Math.max(2, ((results.stopLossPrice - results.stopLossPrice * 0.995) / (results.targetPrice * 1.005 - results.stopLossPrice * 0.995)) * 100) : 10;
  const entryPos = results ? ((parseFloat(entryPrice) - results.stopLossPrice * 0.995) / (results.targetPrice * 1.005 - results.stopLossPrice * 0.995)) * 100 : 40;
  const tgtPos = results ? Math.min(98, ((results.targetPrice - results.stopLossPrice * 0.995) / (results.targetPrice * 1.005 - results.stopLossPrice * 0.995)) * 100) : 85;

  return (
    <div className="flex h-screen bg-[#0a0f1e] overflow-hidden text-white">
      <ProfessionalSidebar activeTab="tools" onTabChange={(tabId) => navigate('/app', { state: { activeTab: tabId } })} portfolioCount={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Precision Sizer</h1>
                  <p className="text-sm text-slate-400">Calculate optimal position sizes with dynamic risk parameters</p>
                </div>
              </div>
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* === Left Input Panel === */}
          <div className="xl:col-span-2 space-y-4">

            {/* Capital */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Total Capital</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Entry Price */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Entry Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Risk Slider */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Risk Per Trade</label>
                <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/40 rounded-full">
                  <span className="text-indigo-300 font-bold text-sm">{riskPct}% of Capital</span>
                </div>
              </div>
              <input
                type="range" min="0.5" max="5" step="0.5"
                value={riskPct}
                onChange={e => setRiskPct(e.target.value)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #6366f1 ${(parseFloat(riskPct) / 5) * 100}%, #1e293b ${(parseFloat(riskPct) / 5) * 100}%)` }}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Conservative 0.5%</span><span>Aggressive 5%</span>
              </div>
              {capital && riskPct && (
                <div className="mt-3 text-sm text-slate-400">
                  Max loss = <span className="text-red-400 font-semibold">{fmtRs(parseFloat(capital) * parseFloat(riskPct) / 100)}</span>
                </div>
              )}
            </div>

            {/* SL & Target Mode */}
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">SL & Target Mode</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-700 mb-4">
                <button onClick={() => setMode('percent')} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'percent' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  % from Entry
                </button>
                <button onClick={() => setMode('price')} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${mode === 'price' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                  Exact Price
                </button>
              </div>

              {mode === 'percent' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-red-400 mb-2">Stop Loss %</label>
                    <div className="relative">
                      <input type="number" value={stopLossPct} onChange={e => setStopLossPct(e.target.value)}
                        className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs font-bold">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-2">Target %</label>
                    <div className="relative">
                      <input type="number" value={targetPct} onChange={e => setTargetPct(e.target.value)}
                        className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 text-xs font-bold">%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-red-400 mb-2">Stop Loss ₹</label>
                    <input type="number" value={slPrice} onChange={e => setSlPrice(e.target.value)} placeholder="e.g. 2450"
                      className="w-full bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-emerald-400 mb-2">Target ₹</label>
                    <input type="number" value={tgtPrice} onChange={e => setTgtPrice(e.target.value)} placeholder="e.g. 2600"
                      className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* === Right Results Panel === */}
          <div className="xl:col-span-3 space-y-4">

            {results ? (
              <>
                {/* Visual Price bar */}
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Price Range Visualizer</p>
                  <div className="relative h-3 bg-slate-800 rounded-full mx-4 my-6">
                    {/* Red zone (SL to Entry) */}
                    <div className="absolute h-full rounded-l-full bg-gradient-to-r from-red-600 to-red-400"
                      style={{ left: `${slPos}%`, width: `${entryPos - slPos}%` }} />
                    {/* Green zone (Entry to Target) */}
                    <div className="absolute h-full rounded-r-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      style={{ left: `${entryPos}%`, width: `${tgtPos - entryPos}%` }} />

                    {/* SL dot */}
                    <div className="absolute -top-4 flex flex-col items-center" style={{ left: `${slPos}%`, transform: 'translateX(-50%)' }}>
                      <span className="text-[10px] font-bold text-red-400 mb-1">SL</span>
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.8)] mt-4" />
                      <span className="text-[10px] text-red-400 mt-1 whitespace-nowrap">{fmtRs(results.stopLossPrice)}</span>
                    </div>
                    {/* Entry dot */}
                    <div className="absolute -top-4 flex flex-col items-center" style={{ left: `${entryPos}%`, transform: 'translateX(-50%)' }}>
                      <span className="text-[10px] font-bold text-indigo-300 mb-1">ENTRY</span>
                      <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 shadow-[0_0_10px_rgba(99,102,241,0.9)] mt-3" />
                      <span className="text-[10px] text-indigo-300 mt-1 whitespace-nowrap">{fmtRs(parseFloat(entryPrice))}</span>
                    </div>
                    {/* Target dot */}
                    <div className="absolute -top-4 flex flex-col items-center" style={{ left: `${tgtPos}%`, transform: 'translateX(-50%)' }}>
                      <span className="text-[10px] font-bold text-emerald-400 mb-1">TARGET</span>
                      <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.8)] mt-4" />
                      <span className="text-[10px] text-emerald-400 mt-1 whitespace-nowrap">{fmtRs(results.targetPrice)}</span>
                    </div>
                  </div>

                  {/* SL / TGT % labels */}
                  <div className="flex justify-between mt-10 text-xs">
                    <div className="flex items-center gap-1 text-red-400">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>SL: -{results.slPct.toFixed(2)}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Target: +{results.tgtPct.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Core Metrics Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/5" />
                    <Zap className="w-5 h-5 text-indigo-400 mx-auto mb-2 relative z-10" />
                    <p className="text-xs text-slate-400 mb-1 relative z-10">Quantity</p>
                    <p className="text-3xl font-extrabold text-white relative z-10">{results.quantity}</p>
                    <p className="text-[10px] text-slate-500 mt-1 relative z-10">shares</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5" />
                    <IndianRupee className="w-5 h-5 text-blue-400 mx-auto mb-2 relative z-10" />
                    <p className="text-xs text-slate-400 mb-1 relative z-10">Investment</p>
                    <p className="text-lg font-extrabold text-white relative z-10">{fmtRs(results.investment)}</p>
                    <p className="text-[10px] text-slate-500 mt-1 relative z-10">{results.capitalUtilized.toFixed(1)}% of capital</p>
                  </div>
                  <div className={`bg-gradient-to-br border rounded-2xl p-4 text-center relative overflow-hidden ${rrBg}`}>
                    <Calculator className={`w-5 h-5 mx-auto mb-2 relative z-10 ${rrColor}`} />
                    <p className="text-xs text-slate-400 mb-1 relative z-10">R : R Ratio</p>
                    <p className={`text-3xl font-extrabold relative z-10 ${rrColor}`}>1:{results.rrRatio.toFixed(1)}</p>
                    <p className={`text-[10px] mt-1 relative z-10 ${rrColor}`}>
                      {results.rrRatio >= 2 ? 'Excellent' : results.rrRatio >= 1.5 ? 'Acceptable' : 'Poor'}
                    </p>
                  </div>
                </div>

                {/* Profit / Loss */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-semibold text-slate-300">Max Profit (at Target)</span>
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-400 relative z-10">+{fmtRs(results.netProfit)}</p>
                    <p className="text-xs text-slate-500 mt-1 relative z-10">After approx. brokerage</p>
                    <div className="mt-3 flex items-center gap-1 relative z-10">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-400 text-xs font-medium">+{results.tgtPct.toFixed(2)}% on trade</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="text-sm font-semibold text-slate-300">Max Loss (at SL)</span>
                    </div>
                    <p className="text-3xl font-extrabold text-red-400 relative z-10">-{fmtRs(results.netLoss)}</p>
                    <p className="text-xs text-slate-500 mt-1 relative z-10">{riskPct}% of capital</p>
                    <div className="mt-3 flex items-center gap-1 relative z-10">
                      <Shield className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-red-400 text-xs font-medium">-{results.slPct.toFixed(2)}% on trade</span>
                    </div>
                  </div>
                </div>

                {/* Trade Quality Advice */}
                <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
                  results.rrRatio >= 2
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : results.rrRatio >= 1.5
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  {results.rrRatio >= 2
                    ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    : results.rrRatio >= 1.5
                    ? <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={`font-semibold text-sm ${results.rrRatio >= 2 ? 'text-emerald-300' : results.rrRatio >= 1.5 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {results.rrRatio >= 2 ? '✅ Great Setup — Take the Trade!' : results.rrRatio >= 1.5 ? '⚠️ Acceptable Setup' : '❌ Poor Setup — Avoid!'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {results.rrRatio >= 2
                        ? `Risking ${fmtRs(results.netLoss)} to gain ${fmtRs(results.netProfit)}. Well-structured trade.`
                        : results.rrRatio >= 1.5
                        ? 'Consider tightening SL or extending target to reach 2:1 R:R.'
                        : 'R:R below 1.5:1. The potential reward does not justify the risk.'}
                    </p>
                  </div>
                </div>

                {/* Detailed breakdown (expandable) */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                  <button onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                    <span className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /> Trade Breakdown</span>
                    {showBreakdown ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {showBreakdown && (
                    <div className="px-5 pb-4 border-t border-slate-800">
                      {[
                        { label: 'Entry Price', value: fmtRs(parseFloat(entryPrice)), color: 'text-white' },
                        { label: 'Stop Loss Price', value: fmtRs(results.stopLossPrice), color: 'text-red-400' },
                        { label: 'Target Price', value: fmtRs(results.targetPrice), color: 'text-emerald-400' },
                        { label: 'Quantity', value: `${results.quantity} shares`, color: 'text-indigo-400' },
                        { label: 'Total Investment', value: fmtRs(results.investment), color: 'text-white' },
                        { label: 'Capital Utilized', value: `${results.capitalUtilized.toFixed(1)}%`, color: 'text-blue-400' },
                        { label: 'Max Risk (₹)', value: fmtRs(results.riskAmount), color: 'text-red-400' },
                        { label: 'Max Reward (₹)', value: fmtRs(results.rewardAmount), color: 'text-emerald-400' },
                        { label: 'Est. Brokerage', value: fmtRs(results.brokerage), color: 'text-slate-400' },
                        { label: 'Break-even Price', value: fmtRs(results.breakEven), color: 'text-blue-300' },
                        { label: 'Risk : Reward', value: `1 : ${results.rrRatio.toFixed(2)}`, color: rrColor },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between items-center py-2.5 border-b border-slate-800 last:border-0 text-sm">
                          <span className="text-slate-500">{label}</span>
                          <span className={`font-semibold ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 h-full flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <Calculator className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-slate-300 font-semibold mb-2">Enter Trade Details</h3>
                <p className="text-slate-500 text-sm max-w-xs">Fill in capital, entry price, risk % and your SL/Target to instantly see your ideal position size.</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-6 text-center">
          Disclaimer: For educational purposes only. Brokerage is approximate. Always verify with your broker.
        </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PositionCalculator;
