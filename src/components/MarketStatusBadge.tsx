import type { NseMarketStatus } from '../utils/intradayHunter';

type Tone = 'emerald' | 'blue' | 'red';

const LIVE_TONE: Record<Tone, string> = {
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  red: 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]',
};

/** LIVE while NSE is open, MARKET OPENING during 09:00-09:15 pre-open, MARKET CLOSED otherwise. */
const MarketStatusBadge = ({ status, tone = 'emerald' }: { status: NseMarketStatus; tone?: Tone }) => {
  const base = 'flex items-center gap-1.5 border px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider';
  if (status === 'OPEN') {
    return (
      <span className={`${base} ${LIVE_TONE[tone]}`}>
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_5px_currentColor]" /> LIVE
      </span>
    );
  }
  if (status === 'OPENING') {
    return (
      <span className={`${base} bg-amber-500/10 border-amber-500/30 text-amber-400`}>
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> MARKET OPENING
      </span>
    );
  }
  return (
    <span className={`${base} bg-slate-700/30 border-slate-600/50 text-slate-300`}>
      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" /> MARKET CLOSED
    </span>
  );
};

export default MarketStatusBadge;
