import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Mail, AlertCircle, CheckCircle, Shield, Zap, ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const sb: any = supabase as any;
    if (!sb?.auth?.resetPasswordForEmail) {
      setError('Authentication service is not configured');
      setLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
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

      {/* Animated glowing blobs */}
      <div style={{
        position: 'absolute', top: '-150px', left: '-150px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-150px', right: '-150px', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(5,150,105,0.18) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              color: 'rgba(255,255,255,0.45)', fontSize: '13px', textDecoration: 'none',
              marginBottom: '1.5rem', transition: 'color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(16,185,129,0.9)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '60px', height: '60px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '18px',
            boxShadow: '0 0 30px rgba(16,185,129,0.5)',
            margin: '0 auto 1rem'
          }}>
            <KeyRound size={28} color="white" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10b981' }}>Paper</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff' }}>Profit</span>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '999px', padding: '4px 14px', marginBottom: '1.25rem'
          }}>
            <Zap size={12} color="#10b981" />
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>
              ACCOUNT RECOVERY
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', margin: '0 0 0.4rem' }}>
            {success ? 'Check your email' : 'Forgot password?'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.92rem', margin: 0, lineHeight: '1.5' }}>
            {success
              ? `We sent a recovery link to ${email}`
              : 'Enter your registered email address to receive password reset instructions'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(16,185,129,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: '0 0 60px rgba(16,185,129,0.08)',
        }}>
          {/* Top accent bar */}
          <div style={{
            height: '2px', background: 'linear-gradient(90deg, #10b981, #059669, #34d399)',
            borderRadius: '2px', marginBottom: '2rem', marginLeft: '-2.5rem', marginRight: '-2.5rem',
            marginTop: '-2.5rem', borderTopLeftRadius: '24px', borderTopRightRadius: '24px'
          }} />

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '64px', height: '64px',
                background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: '50%', marginBottom: '1.25rem'
              }}>
                <CheckCircle size={32} color="#34d399" />
              </div>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                Reset Link Sent!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.6', marginBottom: '1.75rem' }}>
                Please check your inbox (and spam folder) for the password recovery link to set your new password.
              </p>
              <Link
                to="/login"
                style={{
                  display: 'block', padding: '14px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: '12px', color: '#fff', fontWeight: 700,
                  fontSize: '15px', textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                }}
              >
                ← Return to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '12px', padding: '12px 16px', color: '#fca5a5', fontSize: '14px'
                }}>
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Registered Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}>
                    <Mail size={16} color="rgba(16,185,129,0.6)" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(16,185,129,0.2)',
                      borderRadius: '12px', padding: '13px 14px 13px 42px',
                      color: '#fff', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.7)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(16,185,129,0.2)')}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(90deg, #10b981, #059669)',
                  border: 'none', borderRadius: '12px',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 0 25px rgba(16,185,129,0.4)',
                  transition: 'all 0.2s', marginTop: '0.25rem', letterSpacing: '0.02em'
                }}
              >
                {loading ? 'Sending recovery link…' : '✉️  Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 0.75rem' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
              Sign in →
            </Link>
          </p>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            color: 'rgba(255,255,255,0.25)', fontSize: '12px'
          }}>
            <Shield size={12} color="rgba(16,185,129,0.5)" />
            <span>Secure Supabase Encrypted Authentication</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;
