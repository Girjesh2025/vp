import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import AdminDashboard from './AdminDashboard';

type AccessState = 'checking' | 'signed-out' | 'denied' | 'not-setup' | 'ok';

/**
 * Admin access = signed in to PaperProfit (Supabase) AND the email is in public.app_admins.
 * The check runs in the database (is_admin()), and the same function guards every admin read,
 * so a user cannot unlock admin data by editing browser storage.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<AccessState>('checking');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState('signed-out');
      return;
    }
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setState('not-setup');
      else setState(data === true ? 'ok' : 'denied');
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (state === 'ok') return <AdminDashboard />;

  if (state === 'checking') {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const message: Record<Exclude<AccessState, 'ok' | 'checking'>, { title: string; body: string }> = {
    'signed-out': { title: 'Sign in first', body: 'Admin uses your PaperProfit login. Sign in, then open /admin again.' },
    denied: { title: 'Not an admin', body: `${user?.email ?? 'This account'} is not on the admin list.` },
    'not-setup': {
      title: 'Admin database not set up',
      body: 'Run supabase/migrations/20261116_user_activity.sql in the Supabase SQL editor and add your email to app_admins.',
    },
  };
  const m = message[state];

  return (
    <div className="min-h-screen bg-[#070a0f] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0c1017] border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h1 className="text-lg font-bold text-white">{m.title}</h1>
        <p className="text-sm text-slate-400">{m.body}</p>
        <Link
          to={state === 'signed-out' ? '/login' : '/app'}
          className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold"
        >
          {state === 'signed-out' ? 'Go to login' : 'Back to app'}
        </Link>
      </div>
    </div>
  );
}
