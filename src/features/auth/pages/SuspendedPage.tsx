import React from 'react';
import { supabase } from '@/core/lib/supabase';

export const SuspendedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 inline-flex p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 italic font-bold text-2xl">
          !
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
        <p className="text-slate-500 mb-8">
          The Intravos workspace for your organization is currently inactive. 
          Please contact your administrator or support@intravos.com to resolve this.
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
