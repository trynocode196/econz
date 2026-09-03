import React from 'react';
import { Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-100 dark:border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 md:hidden sticky top-0 z-30">
      <div className="font-bold text-lg text-slate-900 dark:text-white">Econz Orbit</div>
      <button 
        onClick={onToggleSidebar} 
        className="btn-ghost" 
        style={{ color: 'var(--slate-500)', padding: '0.5rem' }}
      >
        <Menu size={24} />
      </button>
    </header>
  );
}
