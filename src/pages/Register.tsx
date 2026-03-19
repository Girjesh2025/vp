import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Mail, Lock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      if (data.session) navigate('/app');
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    padding: '13px 14px 13px 42px',
    color: '#fff', fontSize: '14px',
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 35%, #1e3a5f 65%, #0f2027 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-150px', right: '-150px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            borderRadius: '16px',
            boxShadow: '0 0 30px rgba(139,92,246,0.5)',
            marginBottom: '1rem',
          }}>
            <TrendingUp size={28} color="white" />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '999px', padding: '4px 14px',
            marginBottom: '1rem',
          }}>
            <Zap size={12} color="#a78bfa" />
            <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
              PORTFOLIO PRO
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
            {success ? 'You\'re almost in!' : 'Create your account'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem' }}>
            {success ? 'Check your email to confirm your account' : 'Start trading smarter today — it\'s free'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '24px',
          padding: '2.5rem',
        }}>
          {success ? (
            /* Success State */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '50%', marginBottom: '1.25rem',
              }}>
                <CheckCircle size={32} color="#34d399" />
              </div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Registration successful!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                Please check your email to confirm your account, or sign in if no confirmation is required.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'block', padding: '14px',
                  background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                  borderRadius: '12px', color: '#fff', fontWeight: 700,
                  fontSize: '15px', textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 0 20px rgba(139,92,246,0.5)',
                }}
              >
                → Go to Sign In
              </Link>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: '12px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px',
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    <User size={16} color="rgba(255,255,255,0.4)" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Mail size={16} color="rgba(255,255,255,0.4)" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.75)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Lock size={16} color="rgba(255,255,255,0.4)" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = 'rgba(139,92,246,0.7)')}
                    onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.5)',
                  transition: 'all 0.2s',
                  marginTop: '0.25rem',
                }}
              >
                {loading ? 'Creating account…' : '→  Create Account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer link */}
        {!success && (
          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
