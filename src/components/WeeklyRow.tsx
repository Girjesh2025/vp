import StockLogo from './StockLogo';
import type { WeeklyStatus } from '../utils/weeklyScan';

export interface WeeklySignal {
  symbol: string;
  price: number;
  change: number;           // today's % change
  status: WeeklyStatus;
  level: number;            // 8-week high / low
  breakPct: number;         // + beyond level, − still to go (WATCH)
  weekClosed: boolean;
  daysInWeek: number;
  fresh: boolean;
  volumeRatio: number | null;
  weeklyRsi: number | null;
  sectorSupport?: boolean;
}

const chip = 'px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border';

const fmtLevel = (v: number) => `₹${v >= 1000 ? Math.round(v).toLocaleString('en-IN') : v.toFixed(2)}`;

/** One row of the Weekly Breakout / Breakdown cards. */
const WeeklyRow = ({ b, onClick }: { b: WeeklySignal; onClick: () => void }) => {
  const up = b.status === 'BREAKOUT' || b.status === 'WATCH UP';
  const isWatch = b.status === 'WATCH UP' || b.status === 'WATCH DOWN';

  return (
    <div onClick={onClick} className="flex items-center px-4 py-3 hover:bg-slate-800/30 transition-all duration-200 group/row cursor-pointer relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover/row:opacity-100 transition-opacity ${up ? 'bg-emerald-500' : 'bg-red-500'}`} />

      <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pr-2">
        <StockLogo symbol={b.symbol} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold text-slate-200 group-hover/row:text-white truncate">{b.symbol}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {b.volumeRatio !== null && (
              <span
                className={`${chip} ${b.volumeRatio < 1.5 ? 'bg-white/5 text-slate-400 border-white/10' : up ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25' : 'bg-red-500/10 text-red-300 border-red-500/25'}`}
                title="This week's volume vs the 10-week average, adjusted for days traded"
              >
                Vol {b.volumeRatio.toFixed(1)}x
              </span>
            )}
            {!isWatch && (
              <span className={`${chip} ${b.fresh ? 'bg-blue-500/10 text-blue-300 border-blue-500/25' : 'bg-amber-500/10 text-amber-300 border-amber-500/25'}`}>
                {b.fresh ? 'Fresh break' : '2nd+ week'}
              </span>
            )}
            {b.weeklyRsi !== null && (up ? b.weeklyRsi >= 75 : b.weeklyRsi <= 25) && (
              <span className={`${chip} bg-amber-500/10 text-amber-300 border-amber-500/25`} title={`Weekly RSI ${b.weeklyRsi}`}>
                {up ? 'Overbought' : 'Oversold'}
              </span>
            )}
            {b.sectorSupport && (
              <span className={`${chip} bg-white/5 text-slate-200 border-white/10`}>Sector support</span>
            )}
            <span className={`${chip} bg-white/5 text-slate-400 border-white/10`} title="A running week's close can still change">
              {b.weekClosed ? 'Week closed' : `Week running · ${b.daysInWeek}d`}
            </span>
          </div>
        </div>
      </div>

      <div className="w-[80px] sm:w-[110px] flex justify-center items-center shrink-0">
        <span className={`inline-flex items-center justify-center w-full max-w-[75px] py-1.5 rounded-md text-xs sm:text-sm font-black border ${
          b.change >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {b.change >= 0 ? '+' : ''}{b.change.toFixed(2)}%
        </span>
      </div>

      <div className="w-[80px] sm:w-[110px] flex flex-col items-center shrink-0">
        <span className={`text-xs sm:text-sm font-bold font-mono ${isWatch ? 'text-amber-300' : up ? 'text-emerald-400' : 'text-red-400'}`}>
          {isWatch ? `${Math.abs(b.breakPct).toFixed(2)}% away` : `${up ? '+' : '−'}${b.breakPct.toFixed(2)}%`}
        </span>
        <span className="text-[9px] text-slate-500 font-mono" title={up ? 'Highest high of the previous 8 weeks' : 'Lowest low of the previous 8 weeks'}>
          8W {up ? 'high' : 'low'} {fmtLevel(b.level)}
        </span>
      </div>

      <div className="w-[65px] sm:w-[80px] shrink-0 flex justify-end">
        <span className={`inline-flex items-center justify-center w-full max-w-[65px] py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest border ${
          isWatch
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : up ? 'bg-[#c6f6d5] text-[#14532d] border-[#86efac]' : 'bg-[#fed7d7] text-[#7f1d1d] border-[#fca5a5]'
        }`}>
          {isWatch ? 'WATCH' : up ? 'UP' : 'DOWN'}
        </span>
      </div>
    </div>
  );
};

export default WeeklyRow;
