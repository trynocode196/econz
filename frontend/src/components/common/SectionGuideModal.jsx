import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function SectionGuideModal({ isOpen, onClose, guide }) {
  const { dark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen || !guide || !guide.steps || guide.steps.length === 0) {
    return null;
  }

  const steps = guide.steps;
  const totalSteps = steps.length;
  const step = steps[currentStep] || steps[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(5px)',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: dark ? '#0f172a' : '#ffffff',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: dark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleUp 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem 0.75rem',
          position: 'relative'
        }}>
          {/* Top category label & step counter */}
          <div style={{
            fontSize: '0.725rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: dark ? '#94a3b8' : '#64748b',
            marginBottom: '0.35rem'
          }}>
            {(guide.sectionTitle || 'GUIDE').toUpperCase()} · {currentStep + 1}/{totalSteps}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: dark ? '#f8fafc' : '#0f172a',
            margin: '0 0 0.25rem 0',
            lineHeight: 1.3
          }}>
            {step.title}
          </h3>

          {/* Subtitle */}
          {step.subtitle && (
            <p style={{
              fontSize: '0.85rem',
              color: dark ? '#94a3b8' : '#64748b',
              margin: 0
            }}>
              {step.subtitle}
            </p>
          )}

          {/* Close X Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: dark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: dark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{
          padding: '0.75rem 1.75rem 1.5rem',
          fontSize: '0.9rem',
          color: dark ? '#cbd5e1' : '#334155',
          lineHeight: 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {step.content && (
            <p style={{ margin: 0 }}>
              {step.content}
            </p>
          )}

          {step.bullets && step.bullets.length > 0 && (
            <ul style={{
              margin: 0,
              paddingLeft: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {step.bullets.map((bullet, idx) => (
                <li key={idx} style={{ color: dark ? '#cbd5e1' : '#334155', fontSize: '0.875rem' }}>
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          background: dark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
          borderTop: dark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Skip Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: dark ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
              padding: '0.4rem 0.6rem',
              borderRadius: '0.375rem'
            }}
          >
            Skip
          </button>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {!isFirst && (
              <button
                type="button"
                onClick={handleBack}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: dark ? '#cbd5e1' : '#475569',
                  background: dark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                  border: dark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  borderRadius: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#ffffff',
                background: '#f97316', // Orange button matching screenshot
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{isLast ? 'Done' : 'Next'}</span>
              {isLast ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
