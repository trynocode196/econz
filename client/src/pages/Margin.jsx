import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { ChevronUp, ChevronDown } from 'lucide-react';

const COUNTRIES = [
  { code: 'India', name: 'India', flag: '🇮🇳' },
  { code: 'UAE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'USA', name: 'United States', flag: '🇺🇸' }
];

export default function Margin() {
  const { showToast } = useToast();

  const [country, setCountry] = useState('India');
  const [psnb, setPsnb] = useState(12);
  const [bt, setBt] = useState(3);
  const [renewal, setRenewal] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch margins for selected country
  const fetchMargins = async (selectedCountry = country) => {
    try {
      setLoading(true);
      const res = await api.get(`/margins?country=${selectedCountry}`);
      if (res.data) {
        setPsnb(res.data.psnb !== undefined ? res.data.psnb : 12);
        setBt(res.data.bt !== undefined ? res.data.bt : 3);
        setRenewal(res.data.renewal !== undefined ? res.data.renewal : 7);
      }
    } catch (err) {
      showToast('Error loading margin configuration', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMargins(country);
  }, [country]);

  // Save updated margin value
  const updateMargin = async (newPsnb, newBt, newRenewal) => {
    try {
      setSaving(true);
      await api.put('/margins', {
        country,
        psnb: newPsnb,
        bt: newBt,
        renewal: newRenewal
      });
      showToast(`Margins for ${country} saved successfully`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save margins', true);
    } finally {
      setSaving(false);
    }
  };

  // Stepper handlers
  const handlePsnbChange = (delta) => {
    const nextVal = Math.max(0, psnb + delta);
    setPsnb(nextVal);
    updateMargin(nextVal, bt, renewal);
  };

  const handleBtChange = (delta) => {
    const nextVal = Math.max(0, bt + delta);
    setBt(nextVal);
    updateMargin(psnb, nextVal, renewal);
  };

  const handleRenewalChange = (delta) => {
    const nextVal = Math.max(0, renewal + delta);
    setRenewal(nextVal);
    updateMargin(psnb, bt, nextVal);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginBottom: '0.25rem' }}>
            Margin
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Business Margin for {country} Country
          </p>
        </div>

        {/* Optional Country Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-default)',
              background: 'var(--surface-1)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Margin Items Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '100%' }}>
        
        {/* PSNB Card */}
        <div 
          style={{
            background: 'var(--surface-1)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem 2.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            PSNB
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '68px',
                height: '42px',
                borderRadius: '0.625rem',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#0369a1'
              }}
            >
              {loading ? '-' : psnb}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handlePsnbChange(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Increase PSNB"
              >
                <ChevronUp size={18} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => handlePsnbChange(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Decrease PSNB"
              >
                <ChevronDown size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* BT Card */}
        <div 
          style={{
            background: 'var(--surface-1)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem 2.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            BT
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '68px',
                height: '42px',
                borderRadius: '0.625rem',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#0369a1'
              }}
            >
              {loading ? '-' : bt}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handleBtChange(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Increase BT"
              >
                <ChevronUp size={18} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => handleBtChange(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Decrease BT"
              >
                <ChevronDown size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Renewal Card */}
        <div 
          style={{
            background: 'var(--surface-1)',
            borderRadius: '1.25rem',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem 2.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Renewal
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '68px',
                height: '42px',
                borderRadius: '0.625rem',
                background: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: '#0369a1'
              }}
            >
              {loading ? '-' : renewal}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <button
                type="button"
                onClick={() => handleRenewalChange(1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Increase Renewal"
              >
                <ChevronUp size={18} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => handleRenewalChange(-1)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s ease'
                }}
                title="Decrease Renewal"
              >
                <ChevronDown size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
