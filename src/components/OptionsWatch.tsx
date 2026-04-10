import React, { useState, useMemo } from 'react';
import { Lightbulb, Info, Target, Zap, TrendingUp, TrendingDown, ShieldAlert, BarChart3, Activity } from 'lucide-react';

type IndexName = 'NIFTY 50' | 'BANK NIFTY' | 'FINNIFTY' | 'SENSEX';

interface StrikeData {
  strike: number;
  bulls: number;       // Put writers (Support)
  bears: number;       // Call writers (Resistance)
  bullsChange: number; // Daily change in Put OI
  bearsChange: number; // Daily change in Call OI
  isATM?: boolean;
}

// Highly stylized, realistic mock option chain data
const INDEX_DATA: Record<IndexName, StrikeData[]> = {
  'NIFTY 50': [
    { strike: 24700, bulls: 80000,   bears: 550000,  bullsChange: -12000, bearsChange: 45000 },
    { strike: 24650, bulls: 20000,   bears: 90000,   bullsChange: 2000,   bearsChange: 15000 },
    { strike: 24600, bulls: 120000,  bears: 850000,  bullsChange: 5000,   bearsChange: 120000 },
    { strike: 24550, bulls: 45000,   bears: 210000,  bullsChange: 15000,  bearsChange: 35000 },
    { strike: 24500, bulls: 480000,  bears: 1450000, bullsChange: 120000, bearsChange: 250000 }, // Huge Resistance
    { strike: 24450, bulls: 220000,  bears: 410000,  bullsChange: 80000,  bearsChange: 45000 },
    { strike: 24400, bulls: 920000,  bears: 830000,  bullsChange: 350000, bearsChange: -50000, isATM: true }, // Current ATM
    { strike: 24350, bulls: 430000,  bears: 210000,  bullsChange: 140000, bearsChange: -15000 },
    { strike: 24300, bulls: 1450000, bears: 520000,  bullsChange: 420000, bearsChange: -80000 }, // Big Support
    { strike: 24250, bulls: 410000,  bears: 180000,  bullsChange: 80000,  bearsChange: -5000 },
    { strike: 24200, bulls: 1250000, bears: 380000,  bullsChange: 150000, bearsChange: -25000 },
    { strike: 24150, bulls: 380000,  bears: 150000,  bullsChange: 45000,  bearsChange: 10000 },
    { strike: 24100, bulls: 950000,  bears: 250000,  bullsChange: 90000,  bearsChange: 5000 },
    { strike: 24050, bulls: 280000,  bears: 80000,   bullsChange: 10000,  bearsChange: 2000 },
    { strike: 24000, bulls: 1850000, bears: 250000,  bullsChange: 210000, bearsChange: -15000 }, // Max Support
  ],
  'BANK NIFTY': [
    { strike: 52500, bulls: 150000, bears: 850000, bullsChange: 10000, bearsChange: 95000 },
    { strike: 52400, bulls: 40000,  bears: 230000, bullsChange: 5000,  bearsChange: 20000 },
    { strike: 52300, bulls: 60000,  bears: 150000, bullsChange: -2000, bearsChange: 12000 },
    { strike: 52200, bulls: 180000, bears: 420000, bullsChange: 15000, bearsChange: 45000 },
    { strike: 52100, bulls: 95000,  bears: 210000, bullsChange: 8000,  bearsChange: 18000 },
    { strike: 52000, bulls: 1200000,bears: 2150000,bullsChange: 180000,bearsChange: 450000 }, // Huge Resistance
    { strike: 51900, bulls: 420000, bears: 810000, bullsChange: 95000, bearsChange: -120000, isATM: true }, // Current ATM
    { strike: 51800, bulls: 810000, bears: 300000, bullsChange: 250000,bearsChange: -45000 },
    { strike: 51700, bulls: 310000, bears: 120000, bullsChange: 80000, bearsChange: -15000 },
    { strike: 51600, bulls: 800000, bears: 250000, bullsChange: 120000,bearsChange: -5000 },
    { strike: 51500, bulls: 1950000,bears: 450000, bullsChange: 550000,bearsChange: -85000 }, // Huge Support
    { strike: 51400, bulls: 450000, bears: 180000, bullsChange: 45000, bearsChange: -2000 },
    { strike: 51300, bulls: 620000, bears: 210000, bullsChange: 60000, bearsChange: 5000 },
    { strike: 51200, bulls: 310000, bears: 80000,  bullsChange: 15000, bearsChange: 1000 },
    { strike: 51100, bulls: 850000, bears: 120000, bullsChange: 90000, bearsChange: 4000 },
  ],
  'FINNIFTY': [
    { strike: 23400, bulls: 25000,  bears: 280000, bullsChange: -5000, bearsChange: 45000 },
    { strike: 23350, bulls: 12000,  bears: 90000,  bullsChange: 1000,  bearsChange: 12000 },
    { strike: 23300, bulls: 80000,  bears: 350000, bullsChange: 5000,  bearsChange: 85000 },
    { strike: 23250, bulls: 35000,  bears: 125000, bullsChange: 8000,  bearsChange: 25000 },
    { strike: 23200, bulls: 150000, bears: 620000, bullsChange: 25000, bearsChange: 140000 }, // Resistance
    { strike: 23150, bulls: 55000,  bears: 180000, bullsChange: 12000, bearsChange: 45000 },
    { strike: 23100, bulls: 420000, bears: 450000, bullsChange: 150000,bearsChange: -20000, isATM: true }, // Current ATM
    { strike: 23050, bulls: 220000, bears: 140000, bullsChange: 85000, bearsChange: -15000 },
    { strike: 23000, bulls: 820000, bears: 480000, bullsChange: 280000,bearsChange: -55000 }, // Strong Support
    { strike: 22950, bulls: 180000, bears: 110000, bullsChange: 45000, bearsChange: -5000 },
    { strike: 22900, bulls: 350000, bears: 180000, bullsChange: 95000, bearsChange: -2000 },
    { strike: 22850, bulls: 95000,  bears: 45000,  bullsChange: 15000, bearsChange: -1000 },
    { strike: 22800, bulls: 420000, bears: 120000, bullsChange: 80000, bearsChange: 5000 },
    { strike: 22750, bulls: 75000,  bears: 25000,  bullsChange: 5000,  bearsChange: 1000 },
    { strike: 22700, bulls: 280000, bears: 80000,  bullsChange: 25000, bearsChange: 2000 },
  ],
  'SENSEX': [
    { strike: 81500, bulls: 150000, bears: 950000, bullsChange: 25000, bearsChange: 150000 },
    { strike: 81400, bulls: 45000,  bears: 320000, bullsChange: 5000,  bearsChange: 60000 },
    { strike: 81300, bulls: 85000,  bears: 510000, bullsChange: 15000, bearsChange: 95000 },
    { strike: 81200, bulls: 120000, bears: 750000, bullsChange: 25000, bearsChange: 180000 },
    { strike: 81100, bulls: 180000, bears: 480000, bullsChange: 45000, bearsChange: 80000 },
    { strike: 81000, bulls: 850000, bears: 1850000,bullsChange: 120000,bearsChange: 420000 }, // Heavy Resistance
    { strike: 80900, bulls: 410000, bears: 850000, bullsChange: 90000, bearsChange: -50000, isATM: true }, // ATM
    { strike: 80800, bulls: 720000, bears: 280000, bullsChange: 250000,bearsChange: -45000 },
    { strike: 80700, bulls: 450000, bears: 310000, bullsChange: 120000,bearsChange: -15000 },
    { strike: 80600, bulls: 580000, bears: 250000, bullsChange: 150000,bearsChange: -20000 },
    { strike: 80500, bulls: 1450000,bears: 650000, bullsChange: 480000,bearsChange: -90000 }, // Strong Support
    { strike: 80400, bulls: 310000, bears: 120000, bullsChange: 60000, bearsChange: -5000 },
    { strike: 80300, bulls: 480000, bears: 180000, bullsChange: 85000, bearsChange: 15000 },
    { strike: 80200, bulls: 250000, bears: 80000,  bullsChange: 35000, bearsChange: 5000 },
    { strike: 80100, bulls: 850000, bears: 210000, bullsChange: 120000,bearsChange: 25000 },
  ]
};

const OptionsWatch: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<IndexName>('NIFTY 50');
  const [timeProgress, setTimeProgress] = useState<number>(100);

  // --- Formatters ---
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatRaw = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // --- Data Crunching ---
  const rawData = INDEX_DATA[selectedIndex];
  
  // Scale the data chronologically based on the time slider (20% to 100%)
  const timeScale = 0.2 + (timeProgress / 100) * 0.8; 
  
  const currentData = useMemo(() => {
    return rawData.map(d => {
       // Deterministic pseudo-randomness for organic growth variance (+/- 6% and 10%)
       const vBulls = 1 + (((d.strike % 7) - 3) * 0.02); 
       const vBears = 1 + (((d.strike % 11) - 5) * 0.02);
       return {
         ...d,
         bulls: Math.floor(d.bulls * timeScale * vBulls),
         bears: Math.floor(d.bears * timeScale * vBears),
         bullsChange: Math.floor(d.bullsChange * (timeProgress / 100)),
         bearsChange: Math.floor(d.bearsChange * (timeProgress / 100)),
       };
    });
  }, [rawData, timeProgress, timeScale]);
  
  // Keep the horizontal chart scale stable while scrubbing by finding max from raw fixed data
  const maxBarValue = Math.max(...rawData.map(d => Math.max(d.bulls, d.bears)));

  const totalBulls = currentData.reduce((acc, curr) => acc + curr.bulls, 0);
  const totalBears = currentData.reduce((acc, curr) => acc + curr.bears, 0);
  const totalBullsChg = currentData.reduce((acc, curr) => acc + curr.bullsChange, 0);
  const totalBearsChg = currentData.reduce((acc, curr) => acc + curr.bearsChange, 0);

  const atmStrikeData = currentData.find(d => d.isATM) || currentData[Math.floor(currentData.length / 2)];
  
  // Find strongest zones dynamically as they shift over time
  const maxSupport = currentData.reduce((prev, curr) => (curr.bulls > prev.bulls ? curr : prev));
  const maxResistance = currentData.reduce((prev, curr) => (curr.bears > prev.bears ? curr : prev));
  
  // --- Analytics Derivations ---
  const pcr = totalBears > 0 ? (totalBulls / totalBears).toFixed(2) : '0.00';
  const pcrVal = parseFloat(pcr);
  
  let marketBias = 'Neutral';
  let biasColor = 'text-yellow-400';
  let biasBg = 'bg-yellow-500/10 border-yellow-500/20';
  
  // Momentum logic based on today's change vs absolute PCR
  if (pcrVal > 1.2 || (pcrVal > 1.0 && totalBullsChg > totalBearsChg * 1.5)) {
    marketBias = 'Bullish';
    biasColor = 'text-emerald-400';
    biasBg = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (pcrVal < 0.8 || (pcrVal < 1.0 && totalBearsChg > totalBullsChg * 1.5)) {
    marketBias = 'Bearish';
    biasColor = 'text-rose-400';
    biasBg = 'bg-rose-500/10 border-rose-500/20';
  }

  // --- Visuals ---
  // Freeze maximum possible capacity for Net charts so vertical bars visibly grow instead of reshaping axes
  const maxPossibleTotalBulls = rawData.reduce((acc, curr) => acc + curr.bulls, 0);
  const maxPossibleTotalBears = rawData.reduce((acc, curr) => acc + curr.bears, 0);
  const totalNet = Math.max(maxPossibleTotalBulls, maxPossibleTotalBears);

  const yTicksNet = [1.0, 0.8, 0.6, 0.4, 0.2, 0].map(val => totalNet * val);
  const bullPct = (totalBulls / (totalBulls + totalBears)) * 100;
  const bearPct = 100 - bullPct;
  const times = ['9:15', '10:00', '11:00', '12:00', '13:00', '14:00', '15:30'];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#111111] p-6 text-slate-300">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Top Navigation & Filters ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2">
            {(Object.keys(INDEX_DATA) as IndexName[]).map(idx => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                  selectedIndex === idx
                    ? 'bg-[#60a5fa]/20 text-[#60a5fa] border-2 border-[#60a5fa]/50 shadow-[0_0_12px_rgba(37,99,235,0.25)]'
                    : 'bg-[#1a1a1a] text-[#888] border-2 border-[#2a2a2a] hover:bg-[#222] hover:text-[#bbb]'
                }`}
              >
                {idx}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <div className="text-xs text-[#666] font-mono tracking-widest uppercase">
                Live Data Connected
             </div>
          </div>
        </div>

        {/* ── Trader Insights Panel (NEW AI/ANALYTICS BAR) ─────────────────── */}
        <div className={`rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl transition-colors duration-500 ${biasBg}`}>
           <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-black/30 backdrop-blur-md">
                 <Zap className={`w-5 h-5 ${biasColor}`} />
              </div>
              <div>
                 <div className="text-[10px] text-[#888] tracking-widest font-black uppercase mb-0.5">Trader Insight • {selectedIndex}</div>
                 <div className="text-sm font-medium text-slate-200">
                    Market bias is currently <span className={`font-black uppercase tracking-wide ${biasColor}`}>{marketBias}</span>. 
                    Immediate Support lies at <strong className="text-emerald-400 font-mono">{maxSupport.strike}</strong> while Resistance is fierce at <strong className="text-rose-400 font-mono">{maxResistance.strike}</strong>.
                 </div>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-4 items-center shrink-0">
              {/* Micro-stat blocks */}
              <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-center shadow-inner">
                 <div className="text-[9px] text-[#666] uppercase font-bold">ATM Strike</div>
                 <div className="text-sky-400 font-mono font-bold text-sm tracking-wide">{atmStrikeData.strike}</div>
              </div>
              <div className="bg-black/20 border border-white/5 rounded-lg px-4 py-2 text-center shadow-inner">
                 <div className="text-[9px] text-[#666] uppercase font-bold">Today's OI Shift</div>
                 <div className="text-sm font-mono font-bold tracking-wide flex gap-2">
                    <span className={totalBullsChg > 0 ? 'text-emerald-400' : 'text-[#888]'}>{totalBullsChg > 0 ? '+' : ''}{formatNumber(totalBullsChg)} Puts</span>
                    <span className={totalBearsChg > 0 ? 'text-rose-400' : 'text-[#888]'}>{totalBearsChg > 0 ? '+' : ''}{formatNumber(totalBearsChg)} Calls</span>
                 </div>
              </div>
           </div>
        </div>

        {/* ── Top Time Slider Panel ────────────────────────────────────────── */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <BarChart3 className="w-48 h-48 -mt-10 -mr-10" />
          </div>
          
          <div className="relative w-full h-8 flex items-center z-10 group">
            {/* Hitbox Input for absolute scrubbing precision */}
            <input 
               type="range" 
               min="0" max="100" 
               value={timeProgress}
               onChange={(e) => setTimeProgress(Number(e.target.value))}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
            />

            {/* Base Track */}
            <div className="absolute w-full h-1.5 bg-[#2a2a2a] rounded-full"></div>
            
            {/* Filled Glow Track */}
            <div 
               className="absolute left-0 h-1.5 bg-gradient-to-r from-[#0f1520] via-sky-500/80 to-sky-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)] pointer-events-none"
               style={{ width: `${timeProgress}%` }}
            ></div>
            
            {/* Ticks visually overlaid on the track */}
            <div className="absolute w-full flex justify-between px-1 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="w-[1px] h-2.5 bg-[#444] z-0"></div>
              ))}
            </div>

            {/* Custom Interactive Thumb */}
            <div 
               className="absolute w-6 h-6 bg-[#1a1a1a] rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] z-20 border-2 border-sky-400 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform"
               style={{ left: `calc(${timeProgress}% - 12px)` }}
            >
               <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,189,248,1)]"></div>
            </div>
          </div>
          
          {/* Time Labels */}
          <div className="flex justify-between mt-4 text-[11px] font-bold text-[#555] pointer-events-none select-none relative z-10 uppercase tracking-wider">
            {times.map((t, i) => {
               // Approximately mapping labels to percentages: 9:15=0%, 15:30=100%
               const threshold = i * (100 / (times.length - 1));
               const isActive = timeProgress >= threshold;
               return (
                 <div key={t} className={`transition-colors duration-300 ${isActive ? 'text-sky-400' : ''}`}>
                    {t}
                 </div>
               );
            })}
          </div>
        </div>

        {/* ── Main Dashboard Layout ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: OI Clock Chart (Spans 2 columns) */}
          <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#333] rounded-xl p-5 shadow-2xl flex flex-col relative overflow-hidden">
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-2">
                <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                   <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-200 tracking-wide">Live OI Clock </h2>
              </div>
              <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-wider bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-rose-400 rounded-sm shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                  <span className="text-[#aaa]">Calls (Resistance)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-sm shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                  <span className="text-[#aaa]">Puts (Support)</span>
                </div>
              </div>
            </div>

            <div className="flex-1 relative pr-4 z-10">
              {/* Absolute Center Y-Axis Line */}
              <div className="absolute left-[calc(50%+24px)] top-0 bottom-6 w-px bg-gradient-to-b from-transparent via-[#444] to-transparent z-0"></div>
              
              <div className="w-full flex flex-col space-y-2.5 min-h-[400px]">
                {currentData.map((row) => {
                  const isMaxSupport = row.strike === maxSupport.strike;
                  const isMaxResist  = row.strike === maxResistance.strike;

                  return (
                    <div key={row.strike} className={`flex flex-row items-center relative group text-[10px] py-1 ${row.isATM ? 'bg-sky-500/5 rounded-lg -mx-2 px-2 border border-sky-500/10' : ''}`}>
                      
                      {/* Strike Label */}
                      <div className="w-14 flex items-center justify-end pr-3 shrink-0 relative">
                         {row.isATM && <span className="absolute -left-1 text-[8px] bg-sky-500 text-black font-black px-1 rounded uppercase tracking-wider">ATM</span>}
                         <span className={`font-mono text-[11px] ${row.isATM ? 'text-sky-300 font-bold' : 'text-[#888] font-medium'}`}>
                           {row.strike}
                         </span>
                      </div>
                      
                      {/* Bars Container */}
                      <div className="flex-1 flex flex-row items-center relative z-10 h-6">
                        
                        {/* Bears (Call Writers) - Extending Left */}
                        <div className="w-1/2 flex justify-end pr-1 h-full relative">
                          {/* Inner bar representing total OI */}
                          <div 
                            className="bg-gradient-to-l from-rose-500 to-red-600 h-full flex items-center justify-start relative shadow-[0_0_15px_rgba(244,63,94,0.15)] opacity-90 rounded-l cursor-crosshair hover:opacity-100 transition-all border border-red-500/50 hover:border-red-400" 
                            style={{ width: `${(row.bears / maxBarValue) * 100}%` }}
                          >
                             {/* Change indicator inside or next to the bar */}
                             <span className="absolute -left-12 text-[#666] group-hover:text-rose-300 font-mono text-[8px] transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                               {row.bearsChange > 0 ? '+' : ''}{formatNumber(row.bearsChange)} chg
                             </span>
                             {isMaxResist && (
                                <span className="absolute -top-3 right-0 text-[8px] font-bold text-rose-400 tracking-wider">MAX RESISTANCE</span>
                             )}
                          </div>
                          {/* Raw Volume Text fixed near center */}
                          <div className="absolute right-2 pt-1.5 text-white font-mono text-[9px] drop-shadow-md z-20 pointer-events-none opacity-80 group-hover:opacity-100">
                            {formatNumber(row.bears)}
                          </div>
                        </div>
                        
                        {/* Bulls (Put Writers) - Extending Right */}
                        <div className="w-1/2 flex justify-start pl-1 h-full relative">
                          <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-400 h-full flex items-center justify-end relative shadow-[0_0_15px_rgba(52,211,153,0.15)] opacity-90 rounded-r cursor-crosshair hover:opacity-100 transition-all border border-emerald-500/50 hover:border-emerald-300" 
                            style={{ width: `${(row.bulls / maxBarValue) * 100}%` }}
                          >
                             {/* Change indicator */}
                             <span className="absolute -right-12 text-[#666] group-hover:text-emerald-300 font-mono text-[8px] transition-colors whitespace-nowrap opacity-0 group-hover:opacity-100">
                               {row.bullsChange > 0 ? '+' : ''}{formatNumber(row.bullsChange)} chg
                             </span>
                             {isMaxSupport && (
                                <span className="absolute -top-3 left-0 text-[8px] font-bold text-emerald-400 tracking-wider">MAX SUPPORT</span>
                             )}
                          </div>
                           {/* Raw Volume Text fixed near center */}
                           <div className="absolute left-2 pt-1.5 text-black font-semibold font-mono text-[9px] drop-shadow-md z-20 pointer-events-none opacity-80 group-hover:opacity-100">
                            {formatNumber(row.bulls)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between items-center text-[#555] text-[9px] font-mono mt-4 ml-12 px-2 border-t border-[#333] pt-3">
                <span>-3.0M <span className="text-[8px] uppercase tracking-wider text-rose-500/50">Calls</span></span>
                <span>-1.5M</span>
                <span className="text-white bg-[#222] px-2 py-0.5 rounded border border-[#444]">0</span>
                <span>1.5M</span>
                <span>3.0M <span className="text-[8px] uppercase tracking-wider text-emerald-500/50">Puts</span></span>
              </div>
            </div>
          </div>

          {/* Right Layout: Stacked Analytical Charts */}
          <div className="flex flex-col gap-6">
            
            {/* Net Position (Top Right) */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl flex-1 flex flex-col min-h-[260px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                   <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-slate-200 tracking-wide">Net Position</h2>
              </div>
              
              <div className="flex-1 relative flex flex-col z-10">
                
                {/* Top Section: Y-Axis & Chart Flex Row */}
                <div className="flex-1 relative flex">
                  {/* Y-Axis Ticks */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-[9px] text-[#666] font-mono select-none z-10">
                    {yTicksNet.map((tick, i) => (
                      <span key={i} className="leading-none">{formatNumber(tick)}</span>
                    ))}
                  </div>
                  
                  {/* Chart Area */}
                  <div className="flex-1 ml-10 flex items-end justify-around relative border-b border-[#444] pb-0 pt-2 px-8">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between -z-0 pointer-events-none pb-0">
                      {yTicksNet.map((_, i) => (
                        <div key={i} className="w-full h-px bg-[#2a2a2a] border-b border-dashed border-[#111]"></div>
                      ))}
                    </div>
                    
                    {/* Bulls Bar */}
                    <div className="w-16 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-6 bg-black/80 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                         {formatRaw(totalBulls)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 opacity-90 rounded-t shadow-[0_0_20px_rgba(52,211,153,0.2)] group-hover:opacity-100 group-hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-all origin-bottom border-t-2 border-emerald-300"
                        style={{ height: `${(totalBulls / totalNet) * 95}%` }}
                      />
                    </div>
                    
                    {/* Bears Bar */}
                    <div className="w-16 flex flex-col items-center group z-10 h-full justify-end relative cursor-crosshair">
                      <div className="absolute -top-6 bg-black/80 border border-rose-500/30 text-rose-400 font-mono text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                         {formatRaw(totalBears)}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-red-600 to-rose-400 opacity-80 rounded-t shadow-[0_0_20px_rgba(244,63,94,0.15)] group-hover:opacity-100 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] transition-all origin-bottom border-t-2 border-rose-300"
                        style={{ height: `${(totalBears / totalNet) * 95}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Bottom Section: X-Axis Labels in normal flow */}
                <div className="ml-10 flex justify-around px-8 pt-3 pb-1">
                   <div className="flex flex-col items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]"></span>
                      <span className="text-[9px] text-[#888] font-bold tracking-wider uppercase">Put Writers</span>
                   </div>
                   <div className="flex flex-col items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_#f43f5e]"></span>
                      <span className="text-[9px] text-[#888] font-bold tracking-wider uppercase">Call Writers</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Distribution (Bottom Right) */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 shadow-2xl flex-1 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-2">
                   <div className="bg-white/5 p-1.5 rounded-md border border-white/10">
                     <Target className="w-4 h-4 text-violet-400" />
                   </div>
                   <h2 className="text-sm font-bold text-slate-200 tracking-wide">Distribution</h2>
                </div>
                {/* Micro PCR pill */}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${biasBg} ${biasColor}`}>
                  PCR {pcr}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center py-6 relative w-full z-10">
                
                {/* Donut Chart SVG completely upgraded */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  
                  {/* Decorative faint outer rings */}
                  <div className="absolute inset-2 border border-white/5 rounded-full pointer-events-none"></div>
                  <div className="absolute inset-4 border border-white/5 rounded-full pointer-events-none"></div>

                  {/* Donut labels */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-emerald-400 text-sm font-bold drop-shadow-md">{bullPct.toFixed(1)}%</span>
                  </div>
                  <div className="absolute -right-6 top-1/2 -translate-y-1/2 font-mono flex flex-col items-center">
                    <span className="text-rose-400 text-sm font-bold drop-shadow-md">{bearPct.toFixed(1)}%</span>
                  </div>
                  
                  <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90 drop-shadow-2xl">
                    <circle 
                      cx="50"  cy="50" r="40" 
                      fill="transparent" 
                      stroke="#f43f5e" 
                      strokeWidth="12" 
                      className="opacity-90 transition-all duration-700"
                    />
                    <circle 
                      cx="50"  cy="50" r="40" 
                      fill="transparent" 
                      stroke="#10b981" 
                      strokeWidth="12" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (bullPct / 100) * 251.2}
                      strokeLinecap="round"
                      className="transition-all duration-700 hover:stroke-[14px]"
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 rounded-full m-4 backdrop-blur-[2px] shadow-inner">
                    <div className="text-[9px] text-[#888] uppercase tracking-widest mb-1">TOTAL OI</div>
                    <div className="text-sm text-white font-mono font-bold tracking-wider">
                       {formatNumber(totalBulls + totalBears)}
                    </div>
                  </div>
                </div>

                {/* Info Text Area */}
                <div className="mt-8 text-center bg-black/20 p-3 rounded-lg border border-white/5 w-full">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Based on market distribution, <strong className={bullPct > bearPct ? "text-emerald-400" : "text-rose-400"}>{Math.max(bullPct, bearPct).toFixed(1)}%</strong> of options writers are positioned for a <strong className="text-white uppercase">{marketBias}</strong> trend.
                  </p>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OptionsWatch;
