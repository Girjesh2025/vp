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

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLocal = (() => {
    try {
      if (typeof window === 'undefined') return null;
      const mode = localStorage.getItem('pp_auth_mode');
      const localId = localStorage.getItem('pp_local_user_id');
      if (mode === 'broker' && localId) return { user: { id: localId } as any, session: null as any };
      return null;
    } catch (e) {
      return null;
    }
  })();

  const [user, setUser] = useState<User | null>(initialLocal?.user ?? null);
  const [session, setSession] = useState<Session | null>(initialLocal?.session ?? null);
  const [loading, setLoading] = useState(initialLocal ? false : true);

  useEffect(() => {
    const mode = (() => {
      try {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('pp_auth_mode');
      } catch (e) {
        return null;
      }
    })();

    if (mode === 'broker') {
      try {
        const localId = localStorage.getItem('pp_local_user_id');
        if (localId) {
          setUser({ id: localId } as any);
          setSession(null);
        }
      } catch (e) {}
      setLoading(false);
      return;
    }

    const sb: any = supabase as any;
    if (!sb || !sb.auth) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const mode = (() => {
      try {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('pp_auth_mode');
      } catch (e) {
        return null;
      }
    })();

    if (mode === 'broker') {
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
      setUser(null);
      setSession(null);
      return;
    }

    const sb: any = supabase as any;
    if (sb?.auth?.signOut) await sb.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
