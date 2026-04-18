import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Loader2, Lock } from 'lucide-react';
import { useSudo } from '@/core/hooks/useSudo';
import { useAuth } from '@/core/hooks/useAuth';

export const SudoModal: React.FC = () => {
  const { isModalOpen, setSudo, cancelSudo } = useSudo();
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      setPassword('');
      setError(null);
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    setError(null);

    try {
      // Endpoint found in auth.routes.js: POST /api/v1/auth/sudo/verify
      const response = await fetch('/api/v1/auth/sudo/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Incorrect password');
      }

      // Backend returns access_token which we use as sudo token
      if (data.data?.access_token) {
        setSudo(data.data.access_token);
      } else {
        throw new Error('Verification successful but no token received');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 italic">
      {/* Backdrop - cannot be clicked to dismiss as per requirements */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-inner ring-4 ring-indigo-50/50">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Sudo Mode Required</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Sensitive Protocol Verification</p>
          </div>

          <p className="text-sm font-bold text-slate-600 text-center mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            This is a high-security administrative action. Please re-enter your identity password to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="password"
                autoFocus
                required
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black italic tracking-widest focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all outline-none"
                placeholder="PASSWORD NODE"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black uppercase text-red-600 tracking-widest animate-in shake-in">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isLoading ? 'Decrypting...' : 'Authenticate Protocol'}
              </button>
              
              <button
                type="button"
                onClick={cancelSudo}
                className="w-full py-3 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors italic"
              >
                Abort Action
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-50 p-4 flex items-center justify-center gap-2 border-t border-slate-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Neural Connection Active</span>
        </div>
      </div>
    </div>
  );
};
