import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#302725] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#C5A46D]/40 animate-in slide-in-from-bottom-5 duration-300">
      {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
      {toast.type === 'info' && <Info className="w-5 h-5 text-[#C5A46D] shrink-0" />}
      <span className="text-xs font-medium">{toast.message}</span>
    </div>
  );
};
