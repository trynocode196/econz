import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function GuideButton({ onClick, label = "Guide" }) {
  const { dark } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.5rem 0.9rem',
        borderRadius: '2rem',
        border: dark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
        background: dark ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        color: dark ? '#e2e8f0' : '#475569',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease'
      }}
      className="hover:border-sky-500 hover:text-sky-500"
      title="View Step-by-Step Guide"
    >
      <HelpCircle size={15} style={{ color: dark ? '#38bdf8' : '#0284c7' }} />
      <span>{label}</span>
    </button>
  );
}
