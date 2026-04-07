import React, { useState, useEffect } from 'react';
import { fetchStockPrice } from '../utils/priceApi';

const TICKER_INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^NSEBANK', name: 'NIFTY BANK' },
  { symbol: '^CNXIT', name: 'NIFTY IT' },
  { symbol: '^CNXAUTO', name: 'NIFTY AUTO' },
  { symbol: '^CNXFMCG', name: 'NIFTY FMCG' },
  { symbol: '^CNXMETAL', name: 'NIFTY METAL' },
  { symbol: '^CNXPHARMA', name: 'NIFTY PHARMA' },
  { symbol: '^NSMIDCP', name: 'NIFTY MIDCAP' },
  { symbol: '^CNXENERGY', name: 'NIFTY ENERGY' },
  { symbol: '^BSESN', name: 'SENSEX' }
];

export const MarketTicker: React.FC = () => {
  const [tickerData, setTickerData] = useState<{ name: string; price: number; change: number }[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTicker = async () => {
      try {
        const tickerResults = await Promise.allSettled(
          TICKER_INDICES.map(async (idx) => {
            const data = await fetchStockPrice(idx.symbol);
            if (data) {
              return { name: idx.name, price: data.price, change: data.change || 0 };
            }
            throw new Error(`Failed to fetch ${idx.symbol}`);
          })
        );
        if (isMounted) {
          const validTickerData = tickerResults
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);
          setTickerData(validTickerData);
        }
      } catch (e) {
        console.warn("Failed to fetch ticker data", e);
      }
    };
    
    fetchTicker();
    
    // Optional: Refresh ticker every 1 minute
    const interval = setInterval(fetchTicker, 60000);
    
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, []);

  if (tickerData.length === 0) return null;

  return (
    <div className="relative flex overflow-x-hidden bg-[#131b26] border border-slate-800 rounded-xl py-2 mb-6 shadow-md">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#131b26] to-transparent z-10 pointer-events-none rounded-l-xl" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#131b26] to-transparent z-10 pointer-events-none rounded-r-xl" />
      <div className="animate-marquee whitespace-nowrap flex items-center gap-8 px-4 cursor-pointer">
        {/* Duplicate array for seamless looping */}
        {[...tickerData, ...tickerData].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{item.name}</span>
            <span className="text-sm font-black text-white">{item.price.toFixed(2)}</span>
            <span className={`flex items-center text-xs font-bold ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
            </span>
            {i !== tickerData.length * 2 - 1 && <div className="w-1 h-1 rounded-full bg-slate-700 ml-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};
