import React from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// --- MOCK DATA ---

const sectoralFlowData = [
  { name: 'Defence', value: 12.5 },
  { name: 'PSU Bank', value: 10.2 },
  { name: 'Media', value: 9.8 },
  { name: 'Metal', value: 7.5 },
  { name: 'Realty', value: 6.8 },
  { name: 'IT', value: 6.2 },
  { name: 'Auto', value: 5.9 },
  { name: 'Financials', value: 5.4 },
  { name: 'Pvt Bank', value: 5.1 },
  { name: 'FMCG', value: 4.8 },
  { name: 'Energy', value: 4.2 },
  { name: 'Infra', value: 3.9 },
  { name: 'Pharma', value: -4.2 },
  { name: 'Oil & Gas', value: -5.8 },
].sort((a, b) => a.value - b.value); // Recharts draws from bottom up in horizontal mode

const SectoralFlow: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0f1520] overflow-hidden text-slate-300">
      <ProfessionalSidebar activeTab="tools" onTabChange={() => {}} portfolioCount={0} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-6">
            
            {/* Nav Back */}
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>

            {/* --- 1. Sectorial Flow Bar Chart --- */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sectorial Flow</h2>
                  <p className="text-[10px] text-emerald-500 tracking-widest uppercase mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-2 animate-pulse" />
                    Live Data • Updated 10 sec ago
                  </p>
                </div>
                <div className="flex bg-[#1e293b] rounded-lg p-1 border border-slate-700/50">
                  <button className="px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-700/50 text-white">CHART</button>
                  <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-slate-400 hover:text-white transition-colors">HEATMAP</button>
                </div>
              </div>

              <div className="bg-[#172030] border border-slate-800/60 rounded-xl p-6 h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectoralFlowData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                    <XAxis 
                      type="number" 
                      axisLine={{ stroke: '#334155' }} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      domain={[-10, 15]}
                      ticks={[-10, -5, 0, 5, 10, 15]}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 600 }} 
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: '#1e293b', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}%`, 'Flow']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                      {sectoralFlowData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- 2. Market Heatmap --- */}
            <div className="mt-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">Market Heatmap</h2>
                  <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Component Values by Volatility</p>
                </div>
                <div className="flex bg-[#1e293b] rounded-lg p-1.5 border border-slate-700/50 gap-1.5">
                  <div className="w-4 h-3 rounded-sm bg-red-500" />
                  <div className="w-4 h-3 rounded-sm bg-slate-700" />
                  <div className="w-4 h-3 rounded-sm bg-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { name: 'NIFTY 50 INDEX', val: 5.15 }, { name: 'NIFTY FIN SRV25', val: 3.70 },
                  { name: 'NIFTY INDIA', val: 3.42 }, { name: 'NIFTY INFRA', val: 2.42 },
                  { name: 'NIFTY BANK', val: 2.38 }, { name: 'NIFTY IT', val: 2.16 },
                  { name: 'NIFTY REALTY', val: 2.11 }, { name: 'NIFTY AUTO', val: 1.99 },
                  { name: 'NIFTY FINANCIAL', val: 1.86 }, { name: 'NIFTY PVT BANK', val: 1.81 },
                  { name: 'NIFTY COMMODITIES', val: 1.73 }, { name: 'NIFTY ENERGY', val: 1.59 },
                  { name: 'NIFTY METAL', val: 1.36 }, { name: 'NIFTY MEDIA', val: 1.35 },
                  { name: 'NIFTY PHARMA', val: -0.98 }, { name: 'NIFTY HEALTHCARE', val: -1.02 }
                ].map((idx) => {
                  const isPositive = idx.val >= 0;
                  return (
                    <div 
                      key={idx.name}
                      className={`rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg transition-transform hover:scale-105 ${
                        isPositive ? 'bg-[#3eb665] text-white' : 'bg-[#e74c3c] text-white'
                      }`}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-wider mb-1 opacity-90 leading-tight h-6 flex items-center justify-center">
                        {idx.name}
                      </div>
                      <div className="text-lg font-black tracking-tight drop-shadow-md">
                        {idx.val > 0 ? '+' : ''}{idx.val.toFixed(2)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- 3. Sector Breakdown --- */}
            <div className="mt-8 pb-10">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">Sector Breakdown</h2>
                  <p className="text-[10px] text-slate-500 tracking-widest uppercase mt-1">Component Values</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {[
                  { title: 'NIFTY IND DEFENCE', count: 15, stocks: [
                      { sym: 'MAZAGON', ltp: 2125.50, chg: 122.12 },
                      { sym: 'BEL', ltp: 1200.00, chg: 82.50 },
                      { sym: 'SOLARIND', ltp: 1324.00, chg: 15.30 },
                      { sym: 'HAL', ltp: 3222.10, chg: 12.00 },
                      { sym: 'BDL', ltp: 915.50, chg: 10.80 },
                    ]},
                  { title: 'NIFTY PSU BANK', count: 12, stocks: [
                      { sym: 'PNB', ltp: 112.10, chg: 18.57 },
                      { sym: 'INDIANB', ltp: 41.50, chg: 15.60 },
                      { sym: 'UNIONBANK', ltp: 112.80, chg: 14.70 },
                      { sym: 'BOI', ltp: 885.10, chg: 13.50 },
                      { sym: 'SBIN', ltp: 1245.50, chg: 12.85 },
                      { sym: 'PSB', ltp: 102.50, chg: 11.75 },
                      { sym: 'CANBK', ltp: 115.80, chg: 10.20 },
                    ]},
                  { title: 'NIFTY MEDIA', count: 15, stocks: [
                      { sym: 'NDTV', ltp: 2.10, chg: 18.57 },
                      { sym: 'NETWORK18', ltp: 41.50, chg: 15.60 },
                      { sym: 'HATHWAY', ltp: 9.20, chg: 14.70 },
                      { sym: 'ZEEL', ltp: 24.50, chg: 13.50 },
                      { sym: 'JWL', ltp: 14.20, chg: 12.85 },
                      { sym: 'TIPSIND', ltp: 115.50, chg: 11.75 },
                      { sym: 'PVRINOX', ltp: 144.50, chg: 10.20 },
                    ]},
                  { title: 'NIFTY BANK', count: 12, stocks: [
                      { sym: 'INDUSINDBK', ltp: 112.10, chg: 18.57 },
                      { sym: 'SBIN', ltp: 1245.50, chg: 15.60 },
                      { sym: 'PNB', ltp: 112.50, chg: 14.70 },
                      { sym: 'AUBANK', ltp: 115.80, chg: 13.50 },
                      { sym: 'CANBK', ltp: 125.50, chg: 12.85 },
                      { sym: 'FEDERALBNK', ltp: 245.50, chg: 11.75 },
                      { sym: 'AXISBANK', ltp: 1100.20, chg: 10.20 },
                    ]},
                  { title: 'NIFTY REALTY', count: 15, stocks: [
                      { sym: 'DLF', ltp: 885.10, chg: -2.30 },
                      { sym: 'GODREJPROP', ltp: 1245.50, chg: -4.10 },
                      { sym: 'PHOENIXLTD', ltp: 2115.50, chg: -5.80 },
                      { sym: 'OBEROIRLTY', ltp: 1100.20, chg: -6.20 },
                      { sym: 'PRESTIGE', ltp: 125.50, chg: -7.50 },
                    ]},
                  { title: 'NIFTY METAL', count: 15, stocks: [
                      { sym: 'TATASTEEL', ltp: 145.50, chg: 8.50 },
                      { sym: 'HINDALCO', ltp: 550.20, chg: 6.20 },
                      { sym: 'JSWSTEEL', ltp: 815.50, chg: 5.80 },
                      { sym: 'VEDL', ltp: 265.50, chg: 4.10 },
                      { sym: 'COALINDIA', ltp: 385.10, chg: 2.30 },
                    ]},
                  { title: 'NIFTY IT', count: 10, stocks: [
                      { sym: 'TCS', ltp: 3885.10, chg: 5.30 },
                      { sym: 'INFY', ltp: 1545.50, chg: 4.10 },
                      { sym: 'HCLTECH', ltp: 1415.50, chg: 3.80 },
                      { sym: 'WIPRO', ltp: 485.20, chg: 2.20 },
                      { sym: 'TECHM', ltp: 1255.50, chg: 1.50 },
                    ]},
                  { title: 'NIFTY AUTO', count: 15, stocks: [
                      { sym: 'TATAMOTORS', ltp: 885.10, chg: 3.30 },
                      { sym: 'M&M', ltp: 1745.50, chg: 2.10 },
                      { sym: 'MARUTI', ltp: 10815.50, chg: 1.80 },
                      { sym: 'BAJAJ-AUTO', ltp: 7100.20, chg: 1.20 },
                      { sym: 'EICHERMOT', ltp: 3825.50, chg: 0.50 },
                    ]}
                ].map((sector) => (
                  <div key={sector.title} className="bg-[#172030] border border-slate-800/60 rounded-xl overflow-hidden shadow-lg">
                    <div className="flex justify-between items-center bg-[#1e293b] p-3 border-b border-slate-800/60">
                      <h3 className="font-bold text-[11px] text-white tracking-widest">{sector.title}</h3>
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{sector.count} STOCKS</span>
                    </div>
                    
                    <div className="p-1">
                      {/* Table Header */}
                      <div className="flex text-[8px] font-semibold text-slate-500 uppercase tracking-widest p-2 pb-1 border-b border-slate-800/40 mx-2">
                        <div className="flex-1">SYMBOL</div>
                        <div className="w-16 text-right">LTP</div>
                        <div className="w-16 text-right">%CHG</div>
                      </div>
                      
                      {/* Rows */}
                      <div className="px-1 py-1">
                        {sector.stocks.map((stock, idx) => (
                          <div key={idx} className="flex items-center text-[10px] py-1.5 px-2 hover:bg-slate-800/50 rounded transition-colors group">
                            <div className="flex-1 font-bold text-slate-400 group-hover:text-white transition-colors">
                              {stock.sym} <span className="opacity-40 font-normal">EQ</span>
                            </div>
                            <div className="w-16 text-right font-medium text-slate-300">
                              {stock.ltp.toFixed(2)}
                            </div>
                            <div className={`w-16 text-right font-bold ${stock.chg >= 0 ? 'text-[#3eb665]' : 'text-[#e74c3c]'}`}>
                              {stock.chg > 0 ? '+' : ''}{stock.chg.toFixed(2)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default SectoralFlow;
