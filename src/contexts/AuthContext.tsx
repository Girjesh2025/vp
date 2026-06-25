import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

const clearLegacyBrokerState = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('pp_auth_mode');
    localStorage.removeItem('pp_local_user_id');
    localStorage.removeItem('pp_user_id');
    localStorage.removeItem('pp_data_source');
    localStorage.removeItem('pp_broker');
    localStorage.removeItem('pp_broker_pending');
    localStorage.removeItem('pp_broker_session');
    localStorage.removeItem('pp_broker_flow');
    localStorage.removeItem('pp_broker_user_id');
  } catch (e) {}
};

const clearBrokenSupabaseSession = async () => {
  try {
    clearLegacyBrokerState();
    const sb: any = supabase as any;
    if (sb?.auth?.signOut) {
      await sb.auth.signOut({ scope: 'local' });
    }
  } catch (e) {}
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearLegacyBrokerState();

    const sb: any = supabase as any;
    if (!sb || !sb.auth) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(async ({ data: { session }, error }: any) => {
      if (error && /refresh token/i.test(error.message || '')) {
        await clearBrokenSupabaseSession();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(async (error: any) => {
      if (/refresh token/i.test(error?.message || '')) {
        await clearBrokenSupabaseSession();
      }
      setSession(null);
      setUser(null);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!session) clearLegacyBrokerState();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    clearLegacyBrokerState();

    const sb: any = supabase as any;
    if (sb?.auth?.signOut) await sb.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
