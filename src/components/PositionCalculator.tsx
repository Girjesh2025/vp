import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  IndianRupee,
  Info,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

const PositionCalculator: React.FC = () => {
  // --- Inputs ---
  const [capital, setCapital] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPct, setStopLossPct] = useState('2');
  const [targetPct, setTargetPct] = useState('4');
  const [riskPct, setRiskPct] = useState('1'); // % of capital willing to risk
  const [mode, setMode] = useState<'percent' | 'price'>('percent');
  const [slPrice, setSlPrice] = useState('');
  const [tgtPrice, setTgtPrice] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  // --- Derived results ---
  const [results, setResults] = useState<{
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
  } | null>(null);

  const calc = () => {
    const cap = parseFloat(capital);
    const entry = parseFloat(entryPrice);
    const risk = parseFloat(riskPct);

    if (!cap || !entry || !risk || entry <= 0 || cap <= 0) {
      setResults(null);
      return;
    }

    let sl: number;
    let tgt: number;

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
    const investment = entry * quantity;
    const rewardAmount = (tgt - entry) * quantity;
    const netLoss = riskPerShare * quantity;
    const rrRatio = (tgt - entry) / riskPerShare;

    // Approximate brokerage (0.05% each side, capped at ₹20)
    const brokerage = Math.min(investment * 0.0005, 20) * 2;
    const netProfit = rewardAmount - brokerage;
    const breakEven = entry + brokerage / quantity;

    setResults({
      stopLossPrice: sl,
      targetPrice: tgt,
      quantity,
      investment,
      riskAmount: netLoss,
      rewardAmount,
      rrRatio,
      brokerage,
      netProfit,
      netLoss,
      breakEven,
    });
  };

  useEffect(() => { calc(); }, [capital, entryPrice, stopLossPct, targetPct, riskPct, mode, slPrice, tgtPrice]);

  const reset = () => {
    setCapital('');
    setEntryPrice('');
    setStopLossPct('2');
    setTargetPct('4');
    setRiskPct('1');
    setSlPrice('');
    setTgtPrice('');
    setResults(null);
  };

  const fmt = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtRs = (n: number) => `₹${fmt(n)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Position Calculator</h1>
              <p className="text-gray-500 text-sm">Calculate position size, SL & target based on your risk</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* === Input Panel === */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Inputs</h2>
              <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Capital */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <IndianRupee className="w-3.5 h-3.5 inline mr-1" />
                Total Capital (₹)
              </label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Price (₹)
              </label>
              <input
                type="number"
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Risk % of capital */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Risk per Trade (% of Capital)
                <span className="relative group cursor-pointer">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                  <span className="absolute left-5 -top-1 bg-gray-800 text-white text-xs rounded px-2 py-1 w-48 hidden group-hover:block z-10">
                    How much of your total capital are you willing to lose on this trade?
                  </span>
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min="0.5" max="5" step="0.5"
                  value={riskPct}
                  onChange={e => setRiskPct(e.target.value)}
                  className="flex-1 accent-indigo-600"
                />
                <span className="text-indigo-600 font-bold w-12 text-right">{riskPct}%</span>
              </div>
            </div>

            {/* SL / Target Mode Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SL & Target Mode</label>
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                <button
                  onClick={() => setMode('percent')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'percent' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  % from Entry
                </button>
                <button
                  onClick={() => setMode('price')}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'price' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Exact Price
                </button>
              </div>
            </div>

            {mode === 'percent' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-1">Stop Loss %</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={stopLossPct}
                      onChange={e => setStopLossPct(e.target.value)}
                      className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-600 mb-1">Target %</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={targetPct}
                      onChange={e => setTargetPct(e.target.value)}
                      className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-red-600 mb-1">Stop Loss Price (₹)</label>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={e => setSlPrice(e.target.value)}
                    placeholder="e.g. 2450"
                    className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-600 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    value={tgtPrice}
                    onChange={e => setTgtPrice(e.target.value)}
                    placeholder="e.g. 2600"
                    className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* === Results Panel === */}
          <div className="space-y-4">
            {results ? (
              <>
                {/* Key numbers */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
                    <Shield className="w-6 h-6 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-1">Stop Loss</p>
                    <p className="text-xl font-bold text-red-500">{fmtRs(results.stopLossPrice)}</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center">
                    <Target className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500 mb-1">Target</p>
                    <p className="text-xl font-bold text-green-500">{fmtRs(results.targetPrice)}</p>
                  </div>
                </div>

                {/* Position Size */}
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5" />
                    <span className="font-bold text-lg">Position Sizing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-indigo-200 text-xs">Quantity (Shares)</p>
                      <p className="text-3xl font-extrabold">{results.quantity}</p>
                    </div>
                    <div>
                      <p className="text-indigo-200 text-xs">Total Investment</p>
                      <p className="text-2xl font-bold">{fmtRs(results.investment)}</p>
                    </div>
                  </div>
                </div>

                {/* P&L Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Max Profit</p>
                    <p className="font-bold text-green-600">{fmtRs(results.netProfit)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Max Loss</p>
                    <p className="font-bold text-red-500">{fmtRs(results.netLoss)}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <Calculator className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">R:R Ratio</p>
                    <p className={`font-bold ${results.rrRatio >= 2 ? 'text-green-600' : results.rrRatio >= 1 ? 'text-yellow-600' : 'text-red-500'}`}>
                      1 : {results.rrRatio.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown (expandable) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Detailed Breakdown
                    {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showBreakdown && (
                    <div className="px-5 pb-5 space-y-2 text-sm border-t border-gray-100">
                      {[
                        { label: 'Entry Price', value: fmtRs(parseFloat(entryPrice)), color: 'text-gray-900' },
                        { label: 'Stop Loss Price', value: fmtRs(results.stopLossPrice), color: 'text-red-500' },
                        { label: 'Target Price', value: fmtRs(results.targetPrice), color: 'text-green-600' },
                        { label: 'Quantity', value: `${results.quantity} shares`, color: 'text-indigo-600' },
                        { label: 'Total Investment', value: fmtRs(results.investment), color: 'text-gray-900' },
                        { label: 'Risk Amount', value: fmtRs(results.riskAmount), color: 'text-red-500' },
                        { label: 'Reward Amount', value: fmtRs(results.rewardAmount), color: 'text-green-600' },
                        { label: 'Approx Brokerage', value: fmtRs(results.brokerage), color: 'text-gray-500' },
                        { label: 'Break-even Price', value: fmtRs(results.breakEven), color: 'text-blue-600' },
                        { label: 'Risk:Reward', value: `1 : ${results.rrRatio.toFixed(2)}`, color: results.rrRatio >= 2 ? 'text-green-600' : 'text-yellow-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-gray-500">{label}</span>
                          <span className={`font-semibold ${color}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RR Advice */}
                <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${
                  results.rrRatio >= 2 ? 'bg-green-50 text-green-700 border border-green-200' :
                  results.rrRatio >= 1.5 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {results.rrRatio >= 2 ? '✅ Great trade setup! R:R ≥ 2:1 is ideal.' :
                   results.rrRatio >= 1.5 ? '⚠️ Acceptable setup. Try to improve R:R to at least 2:1.' :
                   '❌ Poor R:R. Consider adjusting SL or Target before entering.'}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center py-20 text-center px-6">
                <Calculator className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-gray-600 font-semibold mb-1">Enter your trade details</h3>
                <p className="text-gray-400 text-sm">Fill in Capital, Entry Price, Risk % and SL/Target to see your position size and risk analysis.</p>
              </div>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
          <strong>Disclaimer:</strong> This calculator is for educational purposes only. Brokerage estimates are approximate. Always consult your broker for exact charges. Past performance does not guarantee future results.
        </div>
      </div>
    </div>
  );
};

export default PositionCalculator;
