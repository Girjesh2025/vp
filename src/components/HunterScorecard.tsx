import { ClipboardCheck, Trash2 } from 'lucide-react';
import { JOURNAL_RULES, summarize, type JournalSignal } from '../utils/signalJournal';

const MIN_TRUSTED_TRADES = 30;

const pctClass = (v: number) => (v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-slate-400');
const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

/**
 * Shows how Intraday Hunter signals actually performed, graded on real 5m bars
 * with fixed rules. Nothing here is a forecast: it is the record of past signals.
 */
const HunterScorecard = ({ journal, onClear }: { journal: JournalSignal[]; onClear: () => void }) => {
  const lines = summarize(journal);
  const all = lines[0];
  const open = journal.filter(s => !s.outcome).length;
  const recent = [...journal].sort((a, b) => b.entryTs - a.entryTs).slice(0, 8);
  const { targetPct, stopPct, exitTime, costPct, firstEntry, lastEntry } = JOURNAL_RULES;

  return (
    <div className="relative bg-gradient-to-br from-[#172030] to-[#131b26] border border-slate-700/50 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
      <div className="p-4 sm:p-5 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0f1520] border border-slate-600 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-widest uppercase">Hunter Scorecard</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Every Hunter signal, graded on real 5-min candles · {all.trades} closed · {open} running
            </p>
          </div>
        </div>
        {journal.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Delete the whole Hunter signal record from this browser?')) onClear(); }}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-red-400 border border-slate-700 rounded-lg px-2.5 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset record
          </button>
        )}
      </div>

      <div className="px-4 sm:px-5 py-3 text-[11px] text-slate-400 border-b border-slate-800/60 leading-relaxed">
        Rules (fixed in advance): entry at the price when the signal first appears ({firstEntry}–{lastEntry}),
        target <span className="text-emerald-400 font-bold">+{targetPct}%</span>, stop <span className="text-red-400 font-bold">−{stopPct}%</span>,
        else exit {exitTime}; {costPct}% costs deducted. Recorded only while this page is open on market days, in this browser.
      </div>

      {all.trades < MIN_TRUSTED_TRADES && (
        <div className="mx-4 sm:mx-5 mt-3 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {all.trades === 0
            ? 'No graded signals yet. Keep Market Eye open during market hours to build the record.'
            : `Only ${all.trades} graded signals — need ${MIN_TRUSTED_TRADES}+ before these numbers mean anything.`}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500">
              <th className="text-left font-bold px-5 py-2.5">Signal</th>
              <th className="text-right font-bold px-3 py-2.5">Trades</th>
              <th className="text-right font-bold px-3 py-2.5">Win %</th>
              <th className="text-right font-bold px-3 py-2.5">Avg / trade</th>
              <th className="text-right font-bold px-5 py-2.5">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-mono">
            {lines.map((l, i) => (
              <tr key={l.label} className={i === 0 ? 'bg-slate-800/30 font-black' : ''}>
                <td className="px-5 py-2 font-sans font-bold text-slate-200">{l.label}</td>
                <td className="text-right px-3 py-2 text-slate-300">{l.trades}</td>
                <td className="text-right px-3 py-2 text-slate-300">{l.trades ? `${l.winRate.toFixed(0)}%` : '--'}</td>
                <td className={`text-right px-3 py-2 ${pctClass(l.avgNet)}`}>{l.trades ? fmtPct(l.avgNet) : '--'}</td>
                <td className={`text-right px-5 py-2 ${pctClass(l.totalNet)}`}>{l.trades ? fmtPct(l.totalNet) : '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recent.length > 0 && (
        <div className="border-t border-slate-800/60">
          <div className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-bold">Latest signals</div>
          <div className="divide-y divide-slate-800/40">
            {recent.map(s => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-2 text-xs">
                <span className="w-20 text-slate-500 font-mono">{s.date.slice(5)} {s.entryTime}</span>
                <span className="flex-1 min-w-0 font-bold text-slate-200 truncate">{s.symbol}</span>
                <span className={`w-12 text-[10px] font-black ${s.side === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>{s.side}</span>
                <span className="w-20 text-right font-mono text-slate-400">₹{s.entryPrice.toFixed(2)}</span>
                <span className="w-24 text-right">
                  {s.outcome ? (
                    <span className={`font-mono font-bold ${pctClass(s.outcome.netPct)}`}>
                      {s.outcome.reason === 'NO DATA' ? 'no data' : `${fmtPct(s.outcome.netPct)} ${s.outcome.reason.toLowerCase()}`}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-300">running</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HunterScorecard;
