import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Mail, Lock, AlertCircle, Shield, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If the broker redirects back to /login instead of /app (e.g. Fyers redirect URI mismatch)
    // we should intercept the auth_code and forward the user to /app to process it.
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get('auth_code') || params.get('code') || params.get('request_token');
    
    if (authCode) {
      // Ensure we have the basic broker mode set so ProtectedRoute doesn't block us
      if (!localStorage.getItem('pp_auth_mode')) {
        const userId = `broker-${Date.now()}`;
        localStorage.setItem('pp_auth_mode', 'broker');
        localStorage.setItem('pp_local_user_id', userId);
        localStorage.setItem('pp_user_id', userId);
        localStorage.setItem('pp_data_source', 'broker');
      }
      
      // Forward to app to process the token exchange
      navigate(`/app${window.location.search}`, { replace: true });
    }
  }, [navigate]);

  const doLogin = async () => {
    setLoading(true);
    setError(null);
    const sb: any = supabase as any;
    if (!sb?.auth?.signInWithPassword) {
      setError('Auth is not configured');
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { 
      navigate('/app');
    }
  };

  const startBrokerOnlyLogin = async (broker: 'fyers' | 'zerodha') => {
    try {
      setError(null);
      setLoading(true);
      const existing = localStorage.getItem('pp_local_user_id');
      const c: any = (globalThis as any)?.crypto;
      const userId = existing || (c && typeof c.randomUUID === 'function' ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
      
      const envUrl = (import.meta as any)?.env?.VITE_API_URL || (import.meta as any)?.env?.VITE_API_BASE_URL;
      const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const defaultUrl = isProd ? 'https://first-nivesh.onrender.com' : 'http://localhost:3001';
      const apiBaseUrl = envUrl && typeof envUrl === 'string' && envUrl.trim() ? envUrl.trim() : defaultUrl;
      
      const res = await fetch(`${apiBaseUrl}/api/broker/${broker}/login-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        throw new Error(data?.error || `Failed to get ${broker} login URL`);
      }
      
      if (data?.loginUrl) {
        localStorage.setItem('pp_auth_mode', 'broker');
        localStorage.setItem('pp_local_user_id', userId);
        localStorage.setItem('pp_user_id', userId);
        localStorage.setItem('pp_broker', broker);
        localStorage.setItem('pp_data_source', 'broker');
        localStorage.setItem('pp_broker_pending', broker);
        
        window.location.href = data.loginUrl;
      } else {
        throw new Error('Missing login URL in response');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to start broker login');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020c07 0%, #031a0e 35%, #051f10 65%, #020c07 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Animated glowing blobs — matches landing page */}
      <div style={{ position:'absolute', top:'-150px', left:'-150px', width:'500px', height:'500px',
        background:'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
        borderRadius:'50%', pointerEvents:'none', animation:'pulse 3s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'-150px', right:'-150px', width:'500px', height:'500px',
        background:'radial-gradient(circle, rgba(5,150,105,0.18) 0%, transparent 70%)',
        borderRadius:'50%', pointerEvents:'none', animation:'pulse 3s ease-in-out infinite 1s' }} />
      <div style={{ position:'absolute', top:'40%', right:'15%', width:'250px', height:'250px',
        background:'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
        borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'440px', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          {/* Back to landing */}
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px',
            color:'rgba(255,255,255,0.4)', fontSize:'13px', textDecoration:'none',
            marginBottom:'1.5rem', transition:'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(16,185,129,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            ← Back to home
          </Link>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
            width:'60px', height:'60px',
            background:'linear-gradient(135deg, #10b981, #059669)',
            borderRadius:'18px',
            boxShadow:'0 0 30px rgba(16,185,129,0.5)',
            margin:'0 auto 1rem' }}>
            <TrendingUp size={30} color="white" />
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', marginBottom:'0.75rem' }}>
            <span style={{ fontSize:'1.75rem', fontWeight:900, color:'#10b981' }}>Paper</span>
            <span style={{ fontSize:'1.75rem', fontWeight:900, color:'#fff' }}>Profit</span>
          </div>

          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px',
            background:'rgba(16,185,129,0.12)',
            border:'1px solid rgba(16,185,129,0.3)',
            borderRadius:'999px', padding:'4px 14px', marginBottom:'1.25rem' }}>
            <Zap size={12} color="#10b981" />
            <span style={{ color:'#10b981', fontSize:'12px', fontWeight:600, letterSpacing:'0.05em' }}>
              NSE & BSE PAPER TRADING
            </span>
          </div>

          <h1 style={{ fontSize:'2rem', fontWeight:800, color:'#fff', margin:'0 0 0.4rem' }}>
            Welcome back
          </h1>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.95rem', margin:0 }}>
            Sign in to your paper trading portfolio
          </p>
        </div>

        {/* Card */}
        <div style={{
          background:'rgba(16,185,129,0.05)',
          backdropFilter:'blur(20px)',
          border:'1px solid rgba(16,185,129,0.2)',
          borderRadius:'24px',
          padding:'2.5rem',
          boxShadow:'0 0 60px rgba(16,185,129,0.08)',
        }}>
          {/* Top accent bar */}
          <div style={{ height:'2px', background:'linear-gradient(90deg, #10b981, #059669, #34d399)',
            borderRadius:'2px', marginBottom:'2rem', marginLeft:'-2.5rem', marginRight:'-2.5rem',
            marginTop:'-2.5rem', borderTopLeftRadius:'24px', borderTopRightRadius:'24px' }} />

          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px',
                background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:'12px', padding:'12px 16px', color:'#fca5a5', fontSize:'14px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display:'block', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:600, marginBottom:'8px' }}>
                Email address
              </label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', zIndex:1 }}>
                  <Mail size={16} color="rgba(16,185,129,0.6)" />
                </div>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={{ width:'100%', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(16,185,129,0.2)',
                    borderRadius:'12px', padding:'13px 14px 13px 42px',
                    color:'#fff', fontSize:'14px', outline:'none', transition:'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:600, marginBottom:'8px' }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <div style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', zIndex:1 }}>
                  <Lock size={16} color="rgba(16,185,129,0.6)" />
                </div>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width:'100%', boxSizing:'border-box',
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(16,185,129,0.2)',
                    borderRadius:'12px', padding:'13px 14px 13px 42px',
                    color:'#fff', fontSize:'14px', outline:'none', transition:'border-color 0.2s' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.7)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px',
                background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(90deg, #10b981, #059669)',
                border:'none', borderRadius:'12px',
                color:'#fff', fontWeight:700, fontSize:'15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 25px rgba(16,185,129,0.4)',
                transition:'all 0.2s', marginTop:'0.25rem', letterSpacing:'0.02em' }}>
              {loading ? 'Signing in…' : '🚀  Sign In to PaperProfit'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'0.25rem' }}>
              <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.08)' }} />
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:12, fontWeight:700 }}>or</div>
              <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.08)' }} />
            </div>

            <div style={{ textAlign:'center', color:'rgba(255,255,255,0.45)', fontSize:13, fontWeight:700, marginTop:'0.25rem' }}>
              Sign in with your Broker Account
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px' }}>
              <button
                type="button"
                disabled
                style={{
                  padding:'12px 10px',
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'12px',
                  color:'rgba(255,255,255,0.45)',
                  fontWeight:800,
                  fontSize:13,
                  cursor:'not-allowed',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <img src="https://t3.gstatic.com/favicon?V=2&client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://dhan.co&size=64" alt="Dhan" style={{ width:18, height:18, borderRadius:4 }} />
                  <span>Dhan</span>
                </div>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => startBrokerOnlyLogin('fyers')}
                style={{
                  padding:'12px 10px',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(16,185,129,0.25)',
                  borderRadius:'12px',
                  color:'rgba(255,255,255,0.9)',
                  fontWeight:900,
                  fontSize:13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <img src="https://t3.gstatic.com/favicon?V=2&client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://fyers.in&size=64" alt="Fyers" style={{ width:18, height:18, borderRadius:4 }} />
                  <span>Fyers</span>
                </div>
              </button>
              <button
                type="button"
                disabled
                style={{
                  padding:'12px 10px',
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:'12px',
                  color:'rgba(255,255,255,0.45)',
                  fontWeight:800,
                  fontSize:13,
                  cursor:'not-allowed',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <img src="https://t3.gstatic.com/favicon?V=2&client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://angelone.in&size=64" alt="Angel One" style={{ width:18, height:18, borderRadius:4 }} />
                  <span>AngelOne</span>
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0 0 0.75rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'#10b981', fontWeight:700, textDecoration:'none' }}>
              Create free account →
            </Link>
          </p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
            color:'rgba(255,255,255,0.25)', fontSize:'12px' }}>
            <Shield size={12} color="rgba(16,185,129,0.5)" />
            <span>100% paper trading · No real money · NSE & BSE stocks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
