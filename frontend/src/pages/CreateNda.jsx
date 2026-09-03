import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import PhoneInput from '../components/PhoneInput';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  Building2, 
  Search, 
  Send, 
  ArrowLeft, 
  Check, 
  FileText, 
  ShieldCheck, 
  Loader2,
  Globe,
  DollarSign
} from 'lucide-react';

const ENTITIES = [
  { id: 'India', label: 'India', code: 'IN' },
  { id: 'UAE', label: 'UAE', code: 'AE' },
  { id: 'UK', label: 'UK', code: 'GB' },
  { id: 'USD', label: 'USD', code: 'US' },
];

const CURRENCIES = [
  { id: 'INR', symbol: '₹', label: 'INR' },
  { id: 'AED', symbol: 'د.إ', label: 'AED' },
  { id: 'GBP', symbol: '£', label: 'GBP' },
  { id: 'USD', symbol: 'S', label: 'USD' },
];

const INDUSTRIES = [
  'Information Technology (IT) & Software',
  'Financial Services & Banking',
  'Healthcare & Life Sciences',
  'Retail & E-Commerce',
  'Manufacturing & Logistics',
  'Education & EdTech',
  'Real Estate & Construction',
  'Telecommunications',
  'Other'
];

const DESIGNATIONS = [
  'Project Manager',
  'Managing Director (MD)',
  'Chief Executive Officer (CEO)',
  'Chief Technology Officer (CTO)',
  'Chief Operating Officer (COO)',
  'Chief Financial Officer (CFO)',
  'Director',
  'Vice President (VP)',
  'Assistant Vice President (AVP)',
  'Head of IT / IT Director',
  'IT Manager',
  'General Manager (GM)',
  'Procurement Manager',
  'Operations Manager',
  'Founder / Co-Founder',
  'Partner / Principal',
  'Authorized Signatory',
  'Consultant',
  'Software Engineer / Tech Lead',
  'Finance Manager',
  'Legal Counsel / Legal Head'
];

export default function CreateNda() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { dark } = useTheme();
  const navigate = useNavigate();

  // Form State
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [entity, setEntity] = useState('India');
  const [currency, setCurrency] = useState('INR');
  const [companyName, setCompanyName] = useState('');
  const [companyShortName, setCompanyShortName] = useState('');
  const [taxIdType, setTaxIdType] = useState('PAN');
  const [gstOrPan, setGstOrPan] = useState('');
  const [vat, setVat] = useState('');
  const [taxIdVerified, setTaxIdVerified] = useState(false);
  const [verifyingTaxId, setVerifyingTaxId] = useState(false);
  const [industry, setIndustry] = useState('Information Technology (IT) & Software');
  const [companyAddress, setCompanyAddress] = useState('');

  const isIndiaAndInr = entity === 'India' && currency === 'INR';

  const handleVerifyTaxId = async () => {
    if (isIndiaAndInr) {
      if (!gstOrPan.trim()) {
        showToast(`Enter a ${taxIdType} number first`, true);
        return;
      }
      try {
        setVerifyingTaxId(true);
        const res = await api.post('/kyc/verify', {
          id_no: gstOrPan.trim(),
          type: taxIdType,
          unique_request_id: `REQ_${Date.now()}`
        });

        if (res.data && res.data.verified) {
          setTaxIdVerified(true);
          if (!companyName && res.data.legalName) {
            setCompanyName(res.data.legalName);
          }
          if (!companyAddress && res.data.address) {
            setCompanyAddress(res.data.address);
          }
          showToast(res.data.message || `${taxIdType} verified successfully!`);
        } else {
          showToast(res.data?.message || `Failed to verify ${taxIdType}`, true);
        }
      } catch (err) {
        const msg = err.response?.data?.message || `Failed to verify ${taxIdType}`;
        showToast(msg, true);
      } finally {
        setVerifyingTaxId(false);
      }
    } else {
      if (!vat.trim()) {
        showToast('Enter a VAT number first', true);
        return;
      }
      setTaxIdVerified(true);
      showToast('VAT recorded');
    }
  };

  // Signing Authority
  const [pocName, setPocName] = useState('');
  const [pocEmail, setPocEmail] = useState('');
  const [pocMobile, setPocMobile] = useState('');
  const [pocDesignation, setPocDesignation] = useState('');
  const [ccEmail, setCcEmail] = useState('');

  // UI States
  const [accountQuery, setAccountQuery] = useState('');
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customers for auto-complete
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers');
        setExistingCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        // silent
      }
    };
    fetchCustomers();
  }, []);

  // Filter accounts
  useEffect(() => {
    if (!accountQuery.trim()) {
      setFilteredCustomers([]);
      setShowDropdown(false);
      return;
    }
    const matches = existingCustomers.filter(c => 
      c.account?.toLowerCase().includes(accountQuery.toLowerCase()) ||
      c.companyShortName?.toLowerCase().includes(accountQuery.toLowerCase())
    );
    setFilteredCustomers(matches.slice(0, 5));
    setShowDropdown(matches.length > 0);
  }, [accountQuery, existingCustomers]);

  const handleSelectCustomer = (c) => {
    setCompanyName(c.account || '');
    setCompanyShortName(c.companyShortName || '');
    setGstOrPan(c.pan || '');
    setCompanyAddress(c.address || '');
    if (c.industry) setIndustry(c.industry);
    if (c.entity) setEntity(c.entity);
    if (c.contacts && c.contacts.length > 0) {
      setPocName(c.contacts[0].name || '');
      setPocEmail(c.contacts[0].email || '');
      setPocMobile(c.contacts[0].phone || '');
      setPocDesignation(c.contacts[0].role || '');
    }
    setAccountQuery(c.account || '');
    setShowDropdown(false);
    showToast(`Loaded account details for ${c.account}`);
  };

  const handleEntityChange = (newEntity) => {
    setEntity(newEntity);
    if (newEntity === 'India') setCurrency('INR');
    else if (newEntity === 'UAE') setCurrency('AED');
    else if (newEntity === 'UK') setCurrency('GBP');
    else if (newEntity === 'USD') setCurrency('USD');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!entity) {
      setErrorMessage('Please select econz entity');
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Customer Company Name is required.');
      return;
    }
    if (!pocName.trim()) {
      setErrorMessage('POC Name is required.');
      return;
    }
    if (!pocEmail.trim()) {
      setErrorMessage('POC Email is required.');
      return;
    }

    try {
      setLoading(true);
      const fullMobile = pocMobile ? pocMobile.trim() : '';

      const payload = {
        entity,
        currency,
        companyName: companyName.trim(),
        companyShortName: companyShortName.trim(),
        gstOrPan: gstOrPan.trim(),
        industry,
        companyAddress: companyAddress.trim(),
        pocName: pocName.trim(),
        pocEmail: pocEmail.trim(),
        pocMobile: fullMobile,
        pocDesignation: pocDesignation.trim() || 'Project Manager',
        ccEmail: ccEmail.trim(),
        adminName: 'Moby K Babu',
        adminEmail: 'shaista.a@econz.net'
      };

      const res = await api.post('/nda', payload);
      showToast('Mutual Non-Disclosure Agreement created and sent for signature!');
      navigate('/nda');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Error generating NDA');
      showToast(err.response?.data?.message || 'Failed to create NDA', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '2rem' }}>
      
      {/* ── Top Header Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Create Non-Disclosure Agreement Order Form
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
            Generate a unified contract ready for customer signature.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <GuideButton onClick={() => setShowGuide(true)} />

          <button
            type="button"
            onClick={() => navigate('/nda')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              background: dark ? 'rgba(255,255,255,0.05)' : 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to NDA List</span>
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div style={{ width: '100%', height: '3px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: '35%', height: '100%', background: '#38bdf8', borderRadius: '2px' }} />
      </div>

      {/* ── Main Form Card ── */}
      <form onSubmit={handleSubmit} style={{
        background: dark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
        borderRadius: '1.25rem',
        border: '1px solid var(--border-subtle)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.02)'
      }}>

        {/* 1. Deal Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Deal Settings
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Search an existing account to auto-fill, or type a new name.
              </p>
            </div>

            {/* Account Search */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search Accounts..."
                value={accountQuery}
                onChange={(e) => setAccountQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.25rem',
                  borderRadius: '2rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.04)' : 'var(--surface-2)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '0.35rem',
                  background: 'var(--surface-1)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-default)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  zIndex: 50,
                  overflow: 'hidden'
                }}>
                  {filteredCustomers.map(c => (
                    <div
                      key={c._id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{
                        padding: '0.65rem 1rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                      className="hover:bg-sky-500/10"
                    >
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{c.account}</p>
                      {c.companyShortName && <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>{c.companyShortName}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-2">
            {/* ECONZ ENTITY */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                ECONZ ENTITY*
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {ENTITIES.map(ent => (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => handleEntityChange(ent.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '2rem',
                      border: entity === ent.id ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: entity === ent.id ? 'rgba(56, 189, 248, 0.12)' : (dark ? 'rgba(255,255,255,0.03)' : 'var(--surface-2)'),
                      color: entity === ent.id ? '#38bdf8' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{ent.code}</span>
                    <span>{ent.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CURRENCY */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                CURRENCY*
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {CURRENCIES.map(curr => (
                  <button
                    key={curr.id}
                    type="button"
                    onClick={() => setCurrency(curr.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '2rem',
                      border: currency === curr.id ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: currency === curr.id ? 'rgba(56, 189, 248, 0.12)' : (dark ? 'rgba(255,255,255,0.03)' : 'var(--surface-2)'),
                      color: currency === curr.id ? '#38bdf8' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem' }}>{curr.symbol}</span>
                    <span>{curr.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* 2. Customer Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Customer
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
            {/* Customer Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                CUSTOMER COMPANY NAME *
              </label>
              <input
                type="text"
                placeholder="Type here..."
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Company Short Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                COMPANY SHORT NAME *
              </label>
              <input
                type="text"
                placeholder="Type here..."
                value={companyShortName}
                onChange={(e) => setCompanyShortName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {isIndiaAndInr ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
              <div className="field-stack">
                <div className="field-stack-header-row">
                  <div className="tax-id-radios">
                    {['PAN', 'GST'].map(t => (
                      <label key={t}>
                        <input
                          type="radio"
                          name="taxIdType"
                          value={t}
                          checked={taxIdType === t}
                          onChange={() => {
                            setTaxIdType(t);
                            setTaxIdVerified(false);
                          }}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={verifyingTaxId}
                    className={`verify-pan-btn ${taxIdVerified ? 'verified' : ''}`}
                    onClick={handleVerifyTaxId}
                  >
                    {verifyingTaxId ? 'Verifying...' : taxIdVerified ? `Verified ${taxIdType}` : `Verify ${taxIdType}`}
                  </button>
                </div>
                <input
                  type="text"
                  value={gstOrPan}
                  onChange={(e) => {
                    setGstOrPan(e.target.value);
                    setTaxIdVerified(false);
                  }}
                  className="input-orbit"
                  placeholder={taxIdType === 'PAN' ? 'e.g. ABCDE1234F' : 'e.g. 29ABCDE1234F1Z5'}
                  required
                />
              </div>

              <div className="field-stack">
                <div className="field-stack-header-row">
                  <label className="field-label field-required" style={{ margin: 0 }}>INDUSTRY</label>
                </div>
                <input
                  type="text"
                  list="industries-list"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="input-orbit"
                  placeholder="Start typing..."
                  required
                />
                <datalist id="industries-list">
                  {INDUSTRIES.map(i => <option key={i} value={i} />)}
                </datalist>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
              <div className="field-stack">
                <div className="field-stack-header-row">
                  <label className="field-label field-required" style={{ margin: 0 }}>VAT</label>
                </div>
                <input
                  type="text"
                  value={vat}
                  onChange={(e) => {
                    setVat(e.target.value);
                    setGstOrPan(e.target.value);
                  }}
                  className="input-orbit"
                  placeholder="Type here..."
                  required
                />
              </div>

              <div className="field-stack">
                <div className="field-stack-header-row">
                  <label className="field-label field-required" style={{ margin: 0 }}>INDUSTRY</label>
                </div>
                <input
                  type="text"
                  list="industries-list"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="input-orbit"
                  placeholder="Start typing..."
                  required
                />
                <datalist id="industries-list">
                  {INDUSTRIES.map(i => <option key={i} value={i} />)}
                </datalist>
              </div>
            </div>
          )}

          {/* Customer Company Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              CUSTOMER COMPANY ADDRESS *
            </label>
            <textarea
              rows={2}
              placeholder="Type here..."
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-subtle)',
                background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* 3. Signing Authority Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Signing Authority
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
            {/* POC Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                POC NAME *
              </label>
              <input
                type="text"
                placeholder="Type here..."
                required
                value={pocName}
                onChange={(e) => setPocName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* POC Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                POC EMAIL *
              </label>
              <input
                type="email"
                placeholder="Type here..."
                required
                value={pocEmail}
                onChange={(e) => setPocEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
            {/* POC Mobile Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                POC MOBILE NUMBER *
              </label>
              <PhoneInput
                value={pocMobile}
                onChange={setPocMobile}
                defaultCountryCode={entity === 'UAE' ? 'AE' : (entity === 'UK' ? 'GB' : (entity === 'US' ? 'US' : 'IN'))}
                required
              />
            </div>

            {/* Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                DESIGNATION *
              </label>
              <input
                type="text"
                list="designations-list"
                placeholder="Start typing..."
                value={pocDesignation}
                onChange={(e) => setPocDesignation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--border-subtle)',
                  background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <datalist id="designations-list">
                {DESIGNATIONS.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>

          {/* CC Email */}
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              CC EMAIL
            </label>
            <input
              type="email"
              placeholder="Type here..."
              value={ccEmail}
              onChange={(e) => setCcEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-subtle)',
                background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>
            {errorMessage}
          </p>
        )}

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.85rem 1.75rem',
              borderRadius: '0.85rem',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)',
              transition: 'all 0.15s ease'
            }}
            className="hover:opacity-95 hover:shadow-lg"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            <span>{loading ? 'Creating NDA & Dispatching...' : 'Generate NDA & Dispatch for Signature'}</span>
          </button>
        </div>

      </form>

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.createNda}
      />
    </div>
  );
}
