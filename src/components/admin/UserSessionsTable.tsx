import { LogIn } from 'lucide-react';
import { formatDuration, formatIst, ACTIVITY_WINDOW_DAYS, type SessionSummary } from '../../utils/adminActivity';

/** One row per real session: when it started (IST), active time, device, pages opened and searches. */
export default function UserSessionsTable({ sessions }: { sessions?: SessionSummary[] }) {
  const list = sessions ?? [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <LogIn className="w-3.5 h-3.5 text-emerald-500" />
          Login Sessions (last {ACTIVITY_WINDOW_DAYS} days)
        </span>
        <span className="text-[10px] font-mono text-slate-400">{list.length} sessions</span>
      </div>
      {list.length === 0 ? (
        <p className="text-[11px] text-slate-400">No sessions recorded yet. Tracking starts after the next visit.</p>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-[11px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 uppercase text-[9px] tracking-wider sticky top-0">
              <tr>
                <th className="text-left py-1.5 px-2">Login (IST)</th>
                <th className="text-left py-1.5 px-2">Active</th>
                <th className="text-left py-1.5 px-2">Pages</th>
                <th className="text-left py-1.5 px-2">Searched</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {list.slice(0, 20).map(s => (
                <tr key={s.sessionId} className="align-top">
                  <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                    {formatIst(s.start)}
                    <div className="text-[9px] text-slate-400 font-sans">{s.device}</div>
                  </td>
                  <td className="py-1.5 px-2 font-mono whitespace-nowrap">
                    {formatDuration(s.durationSec)}
                    <div className="text-[9px] text-slate-400">till {formatIst(s.end).split(', ').pop()}</div>
                  </td>
                  <td className="py-1.5 px-2">{s.pages.join(' → ') || '—'}</td>
                  <td className="py-1.5 px-2 font-mono">{s.searches.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
