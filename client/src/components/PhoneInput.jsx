import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const COUNTRY_DIAL_CODES = [
  { code: 'IN', name: 'India', dialCode: '+91', placeholder: '91234 56789' },
  { code: 'AE', name: 'UAE', dialCode: '+971', placeholder: '50 000 0000' },
  { code: 'GB', name: 'UK', dialCode: '+44', placeholder: '7911 123456' },
  { code: 'US', name: 'USA', dialCode: '+1', placeholder: '(555) 000-0000' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', placeholder: '50 123 4567' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', placeholder: '8123 4567' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', placeholder: '3312 3456' },
  { code: 'OM', name: 'Oman', dialCode: '+968', placeholder: '9123 4567' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', placeholder: '9123 4567' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', placeholder: '3600 1234' },
  { code: 'CA', name: 'Canada', dialCode: '+1', placeholder: '(555) 000-0000' },
  { code: 'AU', name: 'Australia', dialCode: '+61', placeholder: '412 345 678' },
  { code: 'DE', name: 'Germany', dialCode: '+49', placeholder: '151 12345678' },
];

export function CountryFlag({ code, alt, width = 22, height = 15 }) {
  const [hasError, setHasError] = useState(false);
  const countryCode = (code || 'in').toLowerCase();

  const emojiMap = {
    in: '🇮🇳', ae: '🇦🇪', gb: '🇬🇧', us: '🇺🇸', sa: '🇸🇦',
    sg: '🇸🇬', qa: '🇶🇦', om: '🇴🇲', kw: '🇰🇼', bh: '🇧🇭',
    ca: '🇨🇦', au: '🇦🇺', de: '🇩🇪'
  };

  if (hasError) {
    return <span style={{ fontSize: '1rem', lineHeight: 1 }}>{emojiMap[countryCode] || code}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode}.png 2x`}
      alt={alt || code}
      width={width}
      height={height}
      loading="lazy"
      onError={() => setHasError(true)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'cover',
        borderRadius: '2px',
        boxShadow: '0 0 1px rgba(0,0,0,0.3)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0
      }}
    />
  );
}

export default function PhoneInput({
  value = '',
  onChange,
  defaultCountryCode = 'IN',
  placeholder,
  required = false,
  className = '',
  style = {}
}) {
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_DIAL_CODES[0];
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Sync when defaultCountryCode prop changes (e.g. when Econz entity changes)
  useEffect(() => {
    if (defaultCountryCode) {
      const match = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode);
      if (match) {
        setSelectedCountry(match);
      }
    }
  }, [defaultCountryCode]);

  // Extract phone number without dial code
  const getDisplayNumber = () => {
    if (!value) return '';
    const dial = selectedCountry.dialCode;
    if (value.startsWith(dial)) {
      return value.slice(dial.length).trim();
    }
    // Check if starts with another known dial code
    for (const c of COUNTRY_DIAL_CODES) {
      if (value.startsWith(c.dialCode)) {
        return value.slice(c.dialCode.length).trim();
      }
    }
    return value.trim();
  };

  const [localNumber, setLocalNumber] = useState(getDisplayNumber());

  useEffect(() => {
    setLocalNumber(getDisplayNumber());
  }, [value, selectedCountry]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    const cleaned = localNumber.trim();
    if (cleaned) {
      onChange(`${country.dialCode} ${cleaned}`);
    } else {
      onChange('');
    }
  };

  const handleNumberChange = (e) => {
    const num = e.target.value;
    setLocalNumber(num);
    if (num.trim()) {
      onChange(`${selectedCountry.dialCode} ${num.trim()}`);
    } else {
      onChange('');
    }
  };

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--input-bg, #fff)',
        border: '1px solid var(--input-border, #cbd5e1)',
        borderRadius: '9999px',
        padding: '0.25rem 0.75rem',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        ...style
      }}
      className={`phone-input-container ${className}`}
    >
      {/* Country Selector Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'transparent',
          border: 'none',
          padding: '0.35rem 0.5rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          fontWeight: 600,
          borderRadius: '9999px',
          userSelect: 'none',
          flexShrink: 0
        }}
        className="hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <CountryFlag code={selectedCountry.code} alt={selectedCountry.name} width={22} height={15} />
        <ChevronDown size={13} style={{ color: 'var(--text-muted)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: '0.15rem' }}>
          {selectedCountry.dialCode}
        </span>
      </button>

      <span style={{ height: '1.25rem', width: '1px', background: 'var(--border-subtle, #e2e8f0)', margin: '0 0.5rem' }}></span>

      {/* Phone Number Input */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder || selectedCountry.placeholder}
        required={required}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          padding: '0.45rem 0.25rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--text-primary, #0f172a)',
          minWidth: 0
        }}
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            background: 'var(--surface-1, #ffffff)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '230px',
            overflowY: 'auto',
            width: '270px',
            padding: '0.4rem 0'
          }}
          className="dark:bg-slate-900 dark:border-slate-700"
        >
          {COUNTRY_DIAL_CODES.map((c) => {
            const isSelected = c.code === selectedCountry.code;
            return (
              <div
                key={c.code}
                onClick={() => handleCountrySelect(c)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.85rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--brand-50, #f0f9ff)' : 'transparent',
                  color: isSelected ? 'var(--brand-600, #0284c7)' : 'var(--text-primary)',
                  transition: 'background 0.12s ease'
                }}
                className="hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CountryFlag code={c.code} alt={c.name} width={20} height={14} />
                  <span>{c.name}</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {c.dialCode}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
