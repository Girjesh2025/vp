import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';

export interface PremiumStockCardProps {
  type?: string;
  category?: string;
  symbol: string;
  exchange?: string;
  name: string;
  provider?: string;
  isVerified?: boolean;
  isNew?: boolean;
  entryDate?: string;
  estimatedGains: number;
  status?: string;
  stopLoss: number;
  target: number;
  logo?: string;
  onTrade?: () => void;
  onAlert?: () => void;
}

const PremiumStockCard: React.FC<PremiumStockCardProps> = ({
  type = 'Short Swing',
  category = 'Equity Cash',
  symbol,
  exchange = 'NSE',
  name,
  provider = 'StockWiz Technologies',
  isVerified = true,
  isNew = true,
  entryDate = '21 May\n02:17 PM',
  estimatedGains,
  status = 'In Buying Range',
  stopLoss,
  target,
  logo,
  onTrade,
  onAlert,
}) => {
  return (
    <div className="relative w-full max-w-sm font-sans mx-auto mt-6 transition-transform hover:-translate-y-1 duration-300">
      {/* Floating Top Tags */}
      <div className="absolute -top-3.5 left-4 flex space-x-2 z-10 w-[calc(100%-2rem)] justify-between">
        <div className="px-3 py-1 text-xs font-bold text-white shadow-lg shadow-pink-500/30"
          style={{
            background: 'linear-gradient(90deg, #ff4d85 0%, #ff758c 100%)',
            borderRadius: '16px'
          }}>
          {type}
        </div>
        <div className="px-3 py-1 text-xs font-bold text-gray-900 shadow-lg shadow-cyan-400/30 mr-2 -mt-0.5"
          style={{
            background: 'linear-gradient(90deg, #48dbfb 0%, #0abde3 100%)',
            borderTopLeftRadius: '0px',
            borderBottomLeftRadius: '12px',
            borderTopRightRadius: '12px',
            borderBottomRightRadius: '12px'
          }}>
          {category}
        </div>
      </div>

      {/* Main Card */}
      <div className="relative bg-[#0d1b0d] rounded-3xl p-5 pt-8 overflow-hidden text-gray-300"
        style={{
          border: '1px solid rgba(74, 222, 128, 0.2)',
          boxShadow: '0 0 25px rgba(34,197,94,0.1)'
        }}>
        
        {/* Glow Effects at the top */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 blur-[50px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/5 blur-[40px] pointer-events-none rounded-full" />

        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              {logo ? (
                <img src={logo} alt={symbol} className="w-full h-full object-contain rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-[#c49b47] font-bold text-[10px] leading-tight text-center bg-white border border-gray-200">
                  <span className="text-[12px]">{symbol.substring(0,2)}</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">{symbol}</h3>
                <span className="flex items-center text-[9px] font-bold px-1.5 py-0.5 bg-[#1f1f1f] text-gray-300 rounded-full border border-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f26522] mr-1" />
                  {exchange}
                </span>
                {isNew && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-yellow-400/20 text-yellow-400 rounded-full border border-yellow-400/30">
                    New
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm mt-0.5">{name}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span>By: {provider}</span>
                {isVerified && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1 fill-green-500/20" />}
              </div>
            </div>
          </div>

          <button onClick={onAlert} className="text-yellow-500 hover:text-yellow-400 transition-colors p-1 z-10">
            <Bell className="w-6 h-6 fill-yellow-500" />
          </button>
        </div>

        {/* Progress Tracker Slider */}
        <div className="px-2 mt-8 mb-6 relative">
          <div className="flex justify-between items-end mb-1 w-full text-center relative z-10">
            <div className="absolute left-0 -translate-y-6">
              <span className="text-sm font-bold text-gray-300">SL</span>
            </div>
            
            <div className="absolute left-[35%] -translate-x-1/2 -translate-y-8 flex flex-col items-center">
              <span className="text-[13px] font-bold text-white mb-0.5">Entry</span>
              <span className="text-[9px] font-bold text-white bg-red-500/90 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" /> Live
              </span>
            </div>
            
            <div className="absolute right-0 -translate-y-6">
              <span className="text-sm font-bold text-white">Target</span>
            </div>
          </div>
          
          {/* Progress Bar Line */}
          <div className="relative h-1 w-full flex items-center mt-8">
            <div className="absolute w-[35%] h-[2px] bg-red-600 top-1/2 -translate-y-1/2 rounded-l-full" />
            <div className="absolute left-[35%] w-[65%] h-[2px] bg-white top-1/2 -translate-y-1/2 rounded-r-full" />
            
            {/* Dots */}
            <div className="absolute left-[35%] w-3 h-3 rounded-full bg-transparent border-2 border-white -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
              <div className="w-[4px] h-[4px] bg-white rounded-full" />
            </div>
            <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-white top-1/2 -translate-y-1/2" />
          </div>
          
          {/* Entry Date Label */}
          {entryDate && (
             <div className="absolute left-[35%] -translate-x-1/2 mt-3 text-center w-24">
              <span className="text-[10px] text-gray-400 block whitespace-pre-line leading-snug">
                {entryDate}
              </span>
            </div>
          )}
        </div>

        {/* Grid Stats */}
        <div className="grid grid-cols-2 mt-14 mb-8 relative">
          {/* Vertical and horizontal dividers */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-800/60 -translate-x-1/2" />
          <div className="absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gray-800/60 -translate-y-1/2" />

          <div className="text-center p-3 pb-4">
            <p className="text-[11px] text-gray-400 mb-1 font-medium">Estimated Gains</p>
            <p className="text-xl font-bold text-green-400">+{estimatedGains.toFixed(2)}%</p>
          </div>
          
          <div className="text-center p-3 pb-4">
            <p className="text-[11px] text-gray-400 mb-1 font-medium">Status</p>
            <p className="text-[16px] font-bold text-green-400 truncate tracking-tight">{status}</p>
          </div>
          
          <div className="text-center p-3 pt-5">
            <p className="text-[11px] text-gray-400 mb-1 font-medium">Stop Loss</p>
            <p className="text-lg font-bold text-white">₹{stopLoss.toLocaleString()}</p>
          </div>
          
          <div className="text-center p-3 pt-5">
            <p className="text-[11px] text-gray-400 mb-1 font-medium">Target</p>
            <p className="text-lg font-bold text-white">₹{target.toLocaleString()}</p>
          </div>
        </div>

        {/* Trade Button */}
        <button 
          onClick={onTrade}
          className="w-full bg-[#5ade50] hover:bg-[#4bcc40] text-[#0a180a] font-bold text-lg py-3.5 rounded-[12px] transition-all"
          style={{
            boxShadow: '0 0 15px rgba(90, 222, 80, 0.4)'
          }}
        >
          Trade Now
        </button>
      </div>
    </div>
  );
};

export default PremiumStockCard;
