import React from 'react';
import { LOGO_MAP } from '../utils/logoMap';

interface StockLogoProps {
  symbol: string;
  className?: string;
}

const getLogoGradient = (symbol: string): string => {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-400 to-teal-600',
    'from-orange-400 to-red-500',
    'from-pink-500 to-rose-600',
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-amber-500 to-orange-600',
  ];
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const StockLogo: React.FC<StockLogoProps> = ({ symbol, className = 'w-7 h-7' }) => {
  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  
  return (
    <div className={`${className} shrink-0 rounded-full bg-[#ffffff] flex items-center justify-center shadow-md ring-1 ring-white/10 overflow-hidden`}>
      {LOGO_MAP[cleanSymbol] ? (
        <img 
          src={`https://assets-netstorage.groww.in/stock-assets/logos/GSTK${LOGO_MAP[cleanSymbol]}.png`} 
          alt={cleanSymbol}
          className="w-full h-full object-cover p-1.5"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.className = `${className} shrink-0 rounded-full bg-gradient-to-br ${getLogoGradient(cleanSymbol)} flex items-center justify-center text-[10px] text-white font-black shadow-md ring-1 ring-white/10`;
              parent.innerText = cleanSymbol.substring(0, 2);
            }
          }}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getLogoGradient(cleanSymbol)} text-[10px] text-white font-black`}>
          {cleanSymbol.substring(0, 2)}
        </div>
      )}
    </div>
  );
};

export default StockLogo;