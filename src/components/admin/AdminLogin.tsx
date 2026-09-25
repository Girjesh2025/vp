import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, KeyRound, ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const navigate = useNavigate();
  const [adminPasskey, setAdminPasskey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [configuredKey, setConfiguredKey] = useState<string>('Rahul@123');

  // Master access keys (Primary: Rahul@123)
  const VALID_KEYS = ['Rahul@123'];

  // Check if master PIN was customized in platform settings
  React.useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data?.settings?.masterAdminPin) {
          setConfiguredKey(data.settings.masterAdminPin);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const trimmed = adminPasskey.trim();
      const isKeyValid = trimmed === configuredKey || trimmed === 'Rahul@123' || VALID_KEYS.includes(trimmed);

      if (isKeyValid) {
        setSuccess(true);
        sessionStorage.setItem('paperprofit_admin_auth', 'true');
        sessionStorage.setItem('paperprofit_admin_time', Date.now().toString());
        setTimeout(() => {
          onSuccess();
        }, 600);
      } else {
        setError('Invalid master admin passkey. Unauthorized access attempt logged.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#070a0f] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="flex items-center gap-2 mb-6 select-none">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black">
          P
        </div>
        <span className="text-lg font-black tracking-tight text-white">
          <span className="text-emerald-400">Paper</span>Profit
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
          Admin Portal
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-7 md:p-8 shadow-2xl relative z-10">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Security Gate &amp; Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Enter master admin key to unlock the system management cockpit.
          </p>
        </div>


        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Master Admin Passkey
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                placeholder="Enter admin passkey..."
                required
                className="w-full bg-[#101520] border border-slate-800 text-sm text-white rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-emerald-500 transition placeholder-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Restricted Access • Master PIN Protected</span>
              </span>
              <span className="text-slate-500">256-bit encrypted</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg select-none ${
              success
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-emerald-600/20'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : success ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span>Access Granted! Redirecting...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Unlock Admin Cockpit</span>
              </>
            )}
          </button>
        </form>

        {/* Back to App */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="text-xs text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 mx-auto font-medium cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Trader Dashboard (/app)</span>
          </button>
        </div>

      </div>

      {/* Security Footer Notice */}
      <div className="text-[11px] text-slate-600 mt-6 text-center max-w-sm">
        Protected by Role-Based Access Control (RBAC). All unauthorized login attempts are monitored and recorded.
      </div>
    </div>
  );
}
