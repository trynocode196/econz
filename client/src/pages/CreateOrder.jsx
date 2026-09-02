import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Search,
  AlertTriangle,
  Check,
  Save,
  Send,
  Download,
  Minus,
  ArrowLeft
} from 'lucide-react';
import { applyQuoteToForm, linkCustomerOnQuote } from '../utils/quoteFormHydrate';

const SUBSCRIPTION_PLANS = ['12 Months', '24 Months', '36 Months', 'Flex', 'One-time'];
const PAYMENT_PLANS = ['Yearly', 'Half - Yearly', 'Quarterly', 'Monthly', 'One-time'];
const CREDIT_LIMITS = ['0 Days', '7 Days', '10 Days', '15 Days', '20 Days', '30 Days', '45 Days'];
const INDUSTRIES = ['E-commerce', 'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Education', 'Other'];
const BILL_TO_OPTIONS = ['Direct', 'Reseller', 'Nuclei', 'Agent', 'Customer'];

const todayStr = () => new Date().toISOString().split('T')[0];

const defaultSku = (domain = '') => ({
  domain,
  name: '',
  qty: 1,
  listPrice: 0,
  partnerDiscRate: 0.12,
  partnerDiscAmt: 0,
  priceAfterPartnerDisc: 0,
  googleDiscPct: 0,
  googleDiscAmt: 0,
  buyPrice: 0,
  sellPrice: '',
  profit: 0,
  marginPct: 0,
  custDiscPct: 0,
  subPlan: '12 Months',
  paymentPlan: 'Half - Yearly',
  creditLimit: '7 Days',
  startDate: todayStr(),
  endDate: todayStr(),
  renewalDate: todayStr(),
  isValid: true,
  requiresApproval: false
});

export default function CreateOrder() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { quoteId } = useParams();
  const isEditMode = Boolean(quoteId);

  const [step, setStep] = useState(1);
  const [loadingQuote, setLoadingQuote] = useState(isEditMode);
  const [editingRefId, setEditingRefId] = useState('');
  const [editingStatus, setEditingStatus] = useState('Draft');
  const [editingTitle, setEditingTitle] = useState('Standard Order');

  const [customers, setCustomers] = useState([]);
  const [flatSkus, setFlatSkus] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [accountSearch, setAccountSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [companyShortName, setCompanyShortName] = useState('');
  const [taxIdType, setTaxIdType] = useState('PAN');
  const [dealType, setDealType] = useState('Renewal');
  const [currency, setCurrency] = useState('INR');
  const [entity, setEntity] = useState('India');
  const [billTo, setBillTo] = useState('Direct');
  const [domain, setDomain] = useState('');
  const [pan, setPan] = useState('');
  const [taxIdVerified, setTaxIdVerified] = useState(false);
  const [industry, setIndustry] = useState('');
  const [vat, setVat] = useState('');
  const [address, setAddress] = useState('');

  const [pocName, setPocName] = useState('');
  const [pocEmail, setPocEmail] = useState('');
  const [pocMobile, setPocMobile] = useState('');
  const [pocDesignation, setPocDesignation] = useState('');
  const [ccEmail, setCcEmail] = useState('');

  const [orderSkus, setOrderSkus] = useState([defaultSku()]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const isManager = user?.role === 'Manager' || user?.role === 'Admin';

  useEffect(() => {
    let cancelled = false;

    const initWizard = async () => {
      if (isEditMode) setLoadingQuote(true);

      try {
        const requests = [
          api.get('/customers'),
          api.get('/products'),
          api.get('/templates'),
          ...(quoteId ? [api.get(`/quotes/${quoteId}`)] : []),
        ];

        const results = await Promise.all(requests);
        if (cancelled) return;

        const custRes = results[0];
        const prodRes = results[1];
        const tempRes = results[2];
        const quoteRes = quoteId ? results[3] : null;

        setCustomers(custRes.data);
        setTemplates(tempRes.data);

        const catalogSkus = [];
        prodRes.data.forEach((p) => {
          p.families.forEach((f) => {
            f.skus.forEach((s) => {
              catalogSkus.push({ name: s.name, code: s.code, prices: s.prices });
            });
          });
        });
        setFlatSkus(catalogSkus);

        const formSetters = {
          setCustomerName,
          setCompanyShortName,
          setTaxIdType,
          setDealType,
          setCurrency,
          setEntity,
          setBillTo,
          setDomain,
          setPan,
          setTaxIdVerified,
          setIndustry,
          setVat,
          setAddress,
          setPocName,
          setPocEmail,
          setPocMobile,
          setPocDesignation,
          setCcEmail,
          setSelectedTemplate,
          setOrderSkus,
        };

        if (quoteId && quoteRes?.data) {
          const quoteForForm = linkCustomerOnQuote(quoteRes.data, custRes.data);
          const meta = applyQuoteToForm(quoteForForm, formSetters);
          setEditingRefId(meta.refId);
          setEditingStatus(meta.status);
          setEditingTitle(meta.title);
        } else if (tempRes.data.length > 0) {
          setSelectedTemplate(tempRes.data[0].name);
        }
      } catch (err) {
        if (!cancelled) {
          if (quoteId) {
            showToast('Could not load this order for editing', true);
            navigate('/quotes');
          } else {
            showToast('Error configuring order wizard assets', true);
          }
        }
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    };

    initWizard();
    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  const filteredCustomers = accountSearch
    ? customers.filter(c => c.account.toLowerCase().includes(accountSearch.toLowerCase()))
    : customers;

  const handleCustomerChange = (val) => {
    setCustomerName(val);
    const existing = customers.find(c => c.account.toLowerCase() === val.toLowerCase());
    if (existing) {
      setDomain(existing.domain || '');
      setPan(existing.pan || '');
      setAddress(existing.address || '');
      setCompanyShortName(existing.account?.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase() || '');
      if (existing.contacts?.length > 0) {
        setPocName(existing.contacts[0].name || '');
        setPocEmail(existing.contacts[0].email || '');
        setPocMobile(existing.contacts[0].phone || '');
        setPocDesignation(existing.contacts[0].role || '');
      }
    }
  };

  const handleAccountSelect = (account) => {
    setAccountSearch('');
    handleCustomerChange(account);
  };

  const handleVerifyTaxId = () => {
    const isIndiaAndInr = entity === 'India' && currency === 'INR';
    if (isIndiaAndInr) {
      if (!pan.trim()) {
        showToast(`Enter a ${taxIdType} number first`, true);
        return;
      }
      setTaxIdVerified(true);
      showToast(`${taxIdType} verified successfully`);
    } else {
      if (!vat.trim()) {
        showToast('Enter a VAT number first', true);
        return;
      }
      setTaxIdVerified(true);
      showToast('VAT verified successfully');
    }
  };

  const getCurrencySymbol = (curr) => {
    const symbols = { INR: '₹', USD: '$', AED: 'د.إ', GBP: '£' };
    return symbols[curr] || '$';
  };

  const isFlexPlan = (plan) => plan === 'Flex' || plan === 'Flexi';

  const calculateSkuMath = (sku, skuName, qtyInput, discountPct, sellingPrice, plan, currentCurrency, currentDealType) => {
    const qty = parseInt(qtyInput) || 0;
    const gPct = parseFloat(discountPct) || 0;
    const sell = parseFloat(sellingPrice) || 0;

    let listPrice = 0;
    const matchedMaster = flatSkus.find(s => s.name === skuName);
    if (matchedMaster) {
      const priceRecord = matchedMaster.prices[currentCurrency];
      listPrice = isFlexPlan(plan) ? (priceRecord?.flexi || 0) : (priceRecord?.commit || 0);
    }

    let partnerDiscRate = 0.20;
    if (currentDealType === 'BT') partnerDiscRate = 0.05;
    else if (currentDealType === 'Renewal') partnerDiscRate = 0.12;

    const partnerDiscAmt = listPrice * partnerDiscRate;
    const priceAfterPartnerDisc = listPrice - partnerDiscAmt;
    const googleDiscAmt = priceAfterPartnerDisc * (gPct / 100);
    const buyPrice = priceAfterPartnerDisc - googleDiscAmt;

    const profit = (sell - buyPrice) * qty;
    const marginPct = sell > 0 ? ((sell - buyPrice) / sell) * 100 : 0;
    const custDiscPct = listPrice > 0 ? ((listPrice - sell) / listPrice) * 100 : 0;
    const requiresApproval = sell > 0 && sell < buyPrice;

    return {
      ...sku,
      name: skuName,
      qty,
      listPrice,
      partnerDiscRate,
      partnerDiscAmt,
      priceAfterPartnerDisc,
      googleDiscPct: discountPct,
      googleDiscAmt,
      buyPrice,
      sellPrice: sellingPrice,
      profit,
      marginPct,
      custDiscPct,
      subPlan: plan,
      requiresApproval
    };
  };

  const handleSkuFieldChange = (index, field, value) => {
    setOrderSkus(prev => {
      const updated = [...prev];
      const target = updated[index];
      target[field] = value;

      const nameVal = field === 'name' ? value : target.name;
      const qtyVal = field === 'qty' ? value : target.qty;
      const discVal = field === 'googleDiscPct' ? value : target.googleDiscPct;
      const sellVal = field === 'sellPrice' ? value : target.sellPrice;
      const planVal = field === 'subPlan' ? value : target.subPlan;

      updated[index] = calculateSkuMath(target, nameVal, qtyVal, discVal, sellVal, planVal, currency, dealType);
      return updated;
    });
  };

  useEffect(() => {
    setOrderSkus(prev => prev.map(s =>
      calculateSkuMath(s, s.name, s.qty, s.googleDiscPct, s.sellPrice, s.subPlan, currency, dealType)
    ));
  }, [currency, dealType, flatSkus]);

  const addSkuCard = () => {
    setOrderSkus(prev => [...prev, defaultSku(domain)]);
  };

  const removeSkuCard = (index) => {
    if (orderSkus.length === 1) {
      showToast('Order must contain at least one product term', true);
      return;
    }
    setOrderSkus(prev => prev.filter((_, idx) => idx !== index));
  };

  const adjustQty = (index, delta) => {
    const current = orderSkus[index];
    const next = Math.max(1, (parseInt(current.qty) || 1) + delta);
    handleSkuFieldChange(index, 'qty', next);
  };

  const isBlank = (val) => !val || !String(val).trim();
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

  const validateStep1 = () => {
    if (isBlank(customerName)) return 'Customer company name is required';
    if (isBlank(companyShortName)) return 'Company short name is required';
    const isIndiaAndInr = entity === 'India' && currency === 'INR';
    if (isIndiaAndInr) {
      if (isBlank(pan)) return `${taxIdType} number is required`;
      if (!taxIdVerified) return `Please verify ${taxIdType} before continuing`;
    } else {
      if (isBlank(vat)) return 'VAT number is required';
      if (!taxIdVerified) return 'Please verify VAT before continuing';
    }
    if (isBlank(industry)) return 'Industry is required';
    if (isBlank(address)) return 'Customer company address is required';
    if (isBlank(pocName)) return 'POC name is required';
    
    if (isBlank(pocEmail)) return 'POC email is required';
    if (!isValidEmail(pocEmail)) return 'Please enter a valid POC email address';
    
    if (isBlank(pocMobile)) return 'POC mobile number is required';
    if (!pocMobile.trim().startsWith('+')) {
      return 'POC mobile number must include country code (e.g. +91)';
    }
    
    if (isBlank(pocDesignation)) return 'Designation is required';
    return null;
  };

  const validateStep2 = () => {
    for (let i = 0; i < orderSkus.length; i++) {
      const s = orderSkus[i];
      const n = i + 1;
      if (isBlank(s.domain)) return `Domain is required for Product ${n}`;
      if (isBlank(s.name)) return `SKU is required for Product ${n}`;
      if (!s.qty || parseInt(s.qty, 10) < 1) return `Quantity must be greater than 0 for Product ${n}`;
      
      const sellPriceNum = parseFloat(s.sellPrice);
      if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
        return `Selling price must be greater than 0 for Product ${n}`;
      }
      
      if (isBlank(s.startDate)) return `Start date is required for Product ${n}`;
      if (isBlank(s.endDate)) return `End date is required for Product ${n}`;
      if (new Date(s.startDate) > new Date(s.endDate)) {
        return `Start date cannot be after end date for Product ${n}`;
      }
      if (isBlank(s.renewalDate)) return `Renewal date is required for Product ${n}`;
    }
    return null;
  };

  const handleNextStep = () => {
    const error = validateStep1();
    if (error) {
      showToast(error, true);
      return;
    }
    setOrderSkus(prev => prev.map(s => s.domain ? s : { ...s, domain }));
    setStep(2);
  };

  const handlePreviewDocuments = () => {
    const step1Error = validateStep1();
    if (step1Error) {
      showToast(step1Error, true);
      return;
    }
    const error = validateStep2();
    if (error) {
      showToast(error, true);
      return;
    }
    setStep(3);
  };

  const handlePrevStep = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const isIndiaAndInr = entity === 'India' && currency === 'INR';
  const isIndiaEntity = isIndiaAndInr;

  // Tax and Grand Total Maths
  const subtotal = orderSkus.reduce((sum, s) => sum + ((parseFloat(s.sellPrice) || 0) * (s.qty || 0)), 0);
  
  const isIndiaTax = currency === 'INR' || entity === 'India';
  const isUKTax = currency === 'GBP' || entity === 'UK';
  const taxRate = isIndiaTax ? 0.18 : (isUKTax ? 0.05 : 0.0);
  const taxName = isIndiaTax ? 'GST (18%)' : (isUKTax ? 'VAT (5%)' : 'Tax (0%)');
  const taxAmount = subtotal * taxRate;
  const finalContractValue = subtotal + taxAmount;

  // Margin Approval Threshold Checks
  const isExceptionDeal = orderSkus.some(s => s.requiresApproval);
  const approvalRequired = isExceptionDeal && !isManager;
  const progressPct = step === 1 ? 50 : 100;

  const mapProductLines = () =>
    orderSkus.map((s) => {
      const master = flatSkus.find((f) => f.name === s.name);
      return {
        ...s,
        code: master?.code || s.code || '',
      };
    });

  const buildPayload = (status, title) => {
    const productLines = mapProductLines();
    return {
      refId: isEditMode ? editingRefId : 'ORD-' + Math.floor(1000 + Math.random() * 9000),
      customerName,
      title: title || editingTitle,
      value: finalContractValue, // Store Grand Total ACV (with Tax)
      subtotal: subtotal,
      taxAmount: taxAmount,
      taxRate: taxRate * 100,
      currency,
      status,
      template: selectedTemplate,
      entity,
      billTo,
      dealType,
      companyShortName,
      taxIdType: isIndiaAndInr ? taxIdType : 'VAT',
      industry,
      pocName,
      pocEmail,
      pocMobile,
      pocDesignation,
      ccEmail,
      orderIndustry: industry,
      orderAddress: address,
      orderPan: isIndiaAndInr ? pan : vat,
      products: productLines,
      skus: productLines,
      requiresApproval: approvalRequired,
    };
  };

  const validateBeforeSubmit = () => {
    const step1Error = validateStep1();
    if (step1Error) return step1Error;
    const step2Error = validateStep2();
    if (step2Error) return step2Error;
    if (!selectedTemplate) return 'Please select a legal template';
    return null;
  };

  const persistQuote = async (status, title, successMessage) => {
    const error = validateBeforeSubmit();
    if (error) {
      showToast(error, true);
      return false;
    }
    try {
      const payload = buildPayload(status, title);
      if (isEditMode) {
        await api.put(`/quotes/${quoteId}`, payload);
      } else {
        await api.post('/quotes', payload);
      }
      showToast(successMessage);
      navigate('/quotes', { state: { refresh: true } });
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save order', true);
      return false;
    }
  };

  const handleSaveDraft = async () => {
    const status = isEditMode ? editingStatus : 'Draft';
    await persistQuote(status, editingTitle, isEditMode ? 'Order updated successfully' : 'Order saved as Draft!');
  };

  const handleSendDocuSign = async () => {
    await persistQuote('Sent for Signature', 'Signed Order Form', 'Contract sent via DocuSign workflow!');
  };

  const handleRequestApproval = async () => {
    await persistQuote('Pending Approval', 'Exception Order', 'Exception approval requested. Manager notified.');
  };

  const handleDownloadPDF = () => {
    showToast('PDF compilation generated. Opening print dialog...');
    window.print();
  };

  const entityOptions = [
    { value: 'India', label: 'IN India' },
    { value: 'UAE', label: 'AE UAE' },
    { value: 'UK', label: 'GB UK' },
    { value: 'US', label: 'US USD' }
  ];

  const currencyOptions = [
    { value: 'INR', label: '₹ INR' },
    { value: 'AED', label: 'د.إ AED' },
    { value: 'GBP', label: '£ GBP' },
    { value: 'USD', label: '$ USD' }
  ];

  const dealTypeOptions = [
    { value: 'PSNB', label: 'PSNB (20%)' },
    { value: 'BT', label: 'BT (5%)' },
    { value: 'Renewal', label: 'Renewal (12%)' }
  ];

  if (loadingQuote) {
    return (
      <div className="fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading order…
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

      {/* Header */}
      <div className="order-form-header">
        <div>
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="btn-back-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              Back to Documents
            </button>
          )}
          <h1 className="section-title">{isEditMode ? 'Edit Order Form' : 'Create Order Form'}</h1>
          <p className="section-sub">
            {isEditMode
              ? `Update deal settings, customer, SKUs, and contract for ${editingRefId}.`
              : 'Generate a unified contract ready for customer signature.'}
          </p>
        </div>
        {step <= 2 && (
          <span className="order-step-badge">
            {isEditMode ? `${editingRefId} · Step ${step} / 2` : `Step ${step} / 2`}
          </span>
        )}
      </div>

      {step <= 2 && (
        <div className="order-progress-track">
          <div className="order-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* ── STEP 1: Customer & Deal Information ── */}
      {step === 1 && (
        <div className="card card-p-lg order-form-card">
          {/* Deal Settings */}
          <div className="order-form-section">
            <div className="order-section-header">
              <h3 className="order-section-title">Deal Settings</h3>
              <div className="account-search-wrap">
                <Search size={16} />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="input-orbit"
                  placeholder="Search Accounts..."
                />
                {accountSearch && filteredCustomers.length > 0 && (
                  <div className="card" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                    marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem'
                  }}>
                    {filteredCustomers.slice(0, 8).map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => handleAccountSelect(c.account)}
                        className="btn-ghost"
                        style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        {c.account}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div>
                  <label className="field-label field-required">Econz Entity</label>
                  <div className="chip-group">
                    {entityOptions.map(opt => (
                      <React.Fragment key={opt.value}>
                        <input
                          type="radio"
                          id={`entity-${opt.value}`}
                          name="entity"
                          value={opt.value}
                          checked={entity === opt.value}
                          onChange={() => {
                            setEntity(opt.value);
                            setTaxIdVerified(false);
                          }}
                        />
                        <label htmlFor={`entity-${opt.value}`}>{opt.label}</label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label field-required">Deal Type</label>
                  <div className="chip-group">
                    {dealTypeOptions.map(opt => (
                      <React.Fragment key={opt.value}>
                        <input type="radio" id={`deal-${opt.value}`} name="dealType" value={opt.value} checked={dealType === opt.value} onChange={() => setDealType(opt.value)} />
                        <label htmlFor={`deal-${opt.value}`}>{opt.label}</label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div>
                  <label className="field-label field-required">Currency</label>
                  <div className="chip-group">
                    {currencyOptions.map(opt => (
                      <React.Fragment key={opt.value}>
                        <input 
                          type="radio" 
                          id={`curr-${opt.value}`} 
                          name="currency" 
                          value={opt.value} 
                          checked={currency === opt.value} 
                          onChange={() => {
                            setCurrency(opt.value);
                            setTaxIdVerified(false);
                          }} 
                        />
                        <label htmlFor={`curr-${opt.value}`}>{opt.label}</label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label field-required">Bill To</label>
                  <div className="chip-scroll">
                    {BILL_TO_OPTIONS.map(b => (
                      <React.Fragment key={b}>
                        <input type="radio" id={`bill-${b}`} name="billTo" value={b} checked={billTo === b} onChange={() => setBillTo(b)} />
                        <label htmlFor={`bill-${b}`}>{b}</label>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="order-section-divider" />

          {/* Customer */}
          <div className="order-form-section">
            <h3 className="order-section-title" style={{ marginBottom: '1.25rem' }}>Customer</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
              <div>
                <label className="field-label field-required">CUSTOMER COMPANY NAME</label>
                <input
                  type="text"
                  list="customers-list"
                  value={customerName}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="input-orbit"
                  placeholder="Type here..."
                  required
                />
                <datalist id="customers-list">
                  {customers.map(c => <option key={c._id} value={c.account} />)}
                </datalist>
              </div>
              <div>
                <label className="field-label field-required">COMPANY SHORT NAME</label>
                <input
                  type="text"
                  value={companyShortName}
                  onChange={(e) => setCompanyShortName(e.target.value)}
                  className="input-orbit"
                  placeholder="Type here..."
                  required
                />
              </div>
            </div>

            {isIndiaAndInr ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem' }} className="grid-2">
                <div className="field-stack">
                  <div className="field-stack-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      className={`verify-pan-btn ${taxIdVerified ? 'verified' : ''}`}
                      onClick={handleVerifyTaxId}
                    >
                      {taxIdVerified ? `Verified ${taxIdType}` : `Verify ${taxIdType}`}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => {
                      setPan(e.target.value);
                      setTaxIdVerified(false);
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
            ) : (
              <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div className="field-stack">
                  <div className="field-stack-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="field-label field-required" style={{ margin: 0 }}>VAT</label>
                    <button
                      type="button"
                      className={`verify-pan-btn ${taxIdVerified ? 'verified' : ''}`}
                      onClick={handleVerifyTaxId}
                    >
                      {taxIdVerified ? 'Verified VAT' : 'Verify VAT'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={vat}
                    onChange={(e) => {
                      setVat(e.target.value);
                      setTaxIdVerified(false);
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

            <div style={{ marginTop: '1.25rem' }}>
              <label className="field-label field-required">CUSTOMER COMPANY ADDRESS</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-orbit"
                placeholder="Type here..."
                required
              />
            </div>
          </div>

          <hr className="order-section-divider" />

          {/* Signing Authority */}
          <div className="order-form-section">
            <h3 className="order-section-title" style={{ marginBottom: '1.25rem' }}>Signing Authority</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div>
                  <label className="field-label field-required">POC NAME</label>
                  <input type="text" value={pocName} onChange={(e) => setPocName(e.target.value)} className="input-orbit" placeholder="Type here..." required />
                </div>
                <div>
                  <label className="field-label field-required">POC EMAIL</label>
                  <input type="email" value={pocEmail} onChange={(e) => setPocEmail(e.target.value)} className="input-orbit" placeholder="Type here..." required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div>
                  <label className="field-label field-required">POC MOBILE NUMBER</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--input-bg)', border: '1px solid var(--input-border)', borderRadius: '9999px', padding: '0.25rem 1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>🇮🇳 +91</span>
                    <input 
                      type="tel" 
                      value={pocMobile} 
                      onChange={(e) => setPocMobile(e.target.value)} 
                      style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, padding: '0.5rem 0', color: 'var(--input-text)' }} 
                      placeholder="81234 56789" 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label field-required">DESIGNATION</label>
                  <input type="text" value={pocDesignation} onChange={(e) => setPocDesignation(e.target.value)} className="input-orbit" placeholder="Start typing..." required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="grid-2">
                <div>
                  <label className="field-label">CC EMAIL</label>
                  <input type="email" value={ccEmail} onChange={(e) => setCcEmail(e.target.value)} className="input-orbit" placeholder="Type here..." />
                </div>
              </div>
            </div>
          </div>

          <div className="order-form-footer" style={{ justifyContent: 'flex-end', borderTop: 'none', paddingTop: '2rem' }}>
            <button onClick={handleNextStep} className="btn-primary">
              <span>Next Step</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Commercials & SKUs ── */}
      {step === 2 && (
        <div>
          <div className="commercials-header">
            <h3 className="order-section-title" style={{ fontSize: '1.125rem' }}>Commercials & SKUs</h3>
            <div className="total-acv-display">
              <div className="total-acv-label">Subtotal ACV</div>
              <div className="total-acv-value">
                {getCurrencySymbol(currency)} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {orderSkus.map((sku, idx) => {
            const curSym = getCurrencySymbol(currency);
            const isCardException = sku.requiresApproval;

            return (
              <div key={idx} className={`sku-card ${isCardException ? 'exception' : ''}`} style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => removeSkuCard(idx)}
                  className="btn-ghost"
                  style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#ef4444' }}
                >
                  <Trash2 size={16} />
                </button>

                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--slate-800)' }}>
                  Financial Terms - Product {idx + 1}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1.5fr', gap: '1rem', marginBottom: '1rem' }} className="grid-3">
                  <div>
                    <label className="field-label field-required">Domain</label>
                    <input type="text" value={sku.domain} onChange={(e) => handleSkuFieldChange(idx, 'domain', e.target.value)} className="input-orbit" placeholder="domain.com" required />
                  </div>
                  <div>
                    <label className="field-label field-required">SKU</label>
                    <input
                      type="text"
                      list="skus-list"
                      value={sku.name}
                      onChange={(e) => handleSkuFieldChange(idx, 'name', e.target.value)}
                      className="input-orbit"
                      placeholder="Select SKU"
                      required
                    />
                    <datalist id="skus-list">
                      {flatSkus.map((s, sIdx) => <option key={sIdx} value={s.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="field-label field-required">Quantity</label>
                    <div className="qty-stepper">
                      <button type="button" onClick={() => adjustQty(idx, -1)}><Minus size={14} /></button>
                      <input type="number" value={sku.qty} onChange={(e) => handleSkuFieldChange(idx, 'qty', e.target.value)} min="1" required />
                      <button type="button" onClick={() => adjustQty(idx, 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }} className="grid-2">
                  <div>
                    <label className="field-label">List Price</label>
                    <div className="input-readonly font-mono">{curSym}{sku.listPrice?.toFixed(2)}</div>
                  </div>
                  <div>
                    <label className="field-label">Partner Discount</label>
                    <div className="input-readonly font-mono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{curSym}{sku.partnerDiscAmt?.toFixed(2)}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>
                        {(sku.partnerDiscRate * 100).toFixed(0)} % * {dealType}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="field-label">Google Discount (%)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      value={sku.googleDiscPct}
                      onChange={(e) => handleSkuFieldChange(idx, 'googleDiscPct', e.target.value)}
                      className="input-orbit"
                      placeholder="0.00"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', fontWeight: 700 }}>%</span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '0.375rem', marginLeft: '0.25rem' }}>
                    Enter extra discount % to calculate the buy price
                  </p>
                </div>

                <div className="sku-pricing-row grid-3">
                  <div>
                    <label className="field-label">Buy Price / Net</label>
                    <div className="font-mono" style={{ fontWeight: 800, fontSize: '0.9375rem', marginTop: '0.25rem' }}>
                      {curSym}{sku.buyPrice?.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="field-label field-required">Selling Price</label>
                    <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', fontWeight: 700, fontSize: '0.8125rem' }}>{curSym}</span>
                      <input
                        type="number"
                        value={sku.sellPrice}
                        onChange={(e) => handleSkuFieldChange(idx, 'sellPrice', e.target.value)}
                        className="input-orbit"
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        style={{
                          paddingLeft: '2rem',
                          fontWeight: 700,
                          borderColor: isCardException ? '#fb923c' : undefined,
                          background: isCardException ? 'rgba(251,146,60,0.05)' : 'white'
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Total Profit</label>
                    <div className={`font-mono ${sku.profit >= 0 ? 'profit-positive' : 'profit-negative'}`} style={{ marginTop: '0.25rem' }}>
                      {curSym}{sku.profit?.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }} className="grid-2">
                  <div>
                    <span className="field-label">Margin %</span>
                    <strong className="font-mono" style={{ color: sku.marginPct < 0 ? '#ef4444' : 'var(--slate-800)', paddingLeft: '0.25rem' }}>
                      {sku.marginPct?.toFixed(2)}%
                    </strong>
                  </div>
                  <div>
                    <span className="field-label">Customer Discount</span>
                    <span className="font-mono" style={{ paddingLeft: '0.25rem' }}>{sku.custDiscPct?.toFixed(2)}%</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }} className="grid-3">
                  <div>
                    <label className="field-label field-required">Subscription Plan</label>
                    <select value={sku.subPlan} onChange={(e) => handleSkuFieldChange(idx, 'subPlan', e.target.value)} className="input-orbit" style={{ cursor: 'pointer' }} required>
                      {SUBSCRIPTION_PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label field-required">Payment Plan</label>
                    <select value={sku.paymentPlan} onChange={(e) => handleSkuFieldChange(idx, 'paymentPlan', e.target.value)} className="input-orbit" style={{ cursor: 'pointer' }} required>
                      {PAYMENT_PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label field-required">Credit Limit</label>
                    <select value={sku.creditLimit} onChange={(e) => handleSkuFieldChange(idx, 'creditLimit', e.target.value)} className="input-orbit" style={{ cursor: 'pointer' }} required>
                      {CREDIT_LIMITS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="grid-3">
                  <div>
                    <label className="field-label field-required">Start Date</label>
                    <input type="date" value={sku.startDate} onChange={(e) => handleSkuFieldChange(idx, 'startDate', e.target.value)} className="input-orbit" required />
                  </div>
                  <div>
                    <label className="field-label field-required">End Date</label>
                    <input type="date" value={sku.endDate} onChange={(e) => handleSkuFieldChange(idx, 'endDate', e.target.value)} className="input-orbit" required />
                  </div>
                  <div>
                    <label className="field-label field-required">Renewal Date</label>
                    <input type="date" value={sku.renewalDate} onChange={(e) => handleSkuFieldChange(idx, 'renewalDate', e.target.value)} className="input-orbit" required />
                  </div>
                </div>
              </div>
            );
          })}

          <button type="button" onClick={addSkuCard} className="add-product-btn">
            <Plus size={18} />
            Add Another Product
          </button>

          <div className="order-form-footer">
            <button onClick={handlePrevStep} className="btn-back-link">Back</button>
            <button onClick={handlePreviewDocuments} className="btn-primary">
              <FileText size={16} />
              <span>Preview Documents</span>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Contract Preview ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card card-p">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }} className="dark:text-white">
              Choose Legal Template
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }} className="grid-4">
              {templates.map(t => (
                <label key={t._id} className="radio-pill" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="legal-template"
                    value={t.name}
                    checked={selectedTemplate === t.name}
                    onChange={() => setSelectedTemplate(t.name)}
                  />
                  <div style={{
                    padding: '1rem', borderRadius: '1rem', border: '2px solid',
                    borderColor: selectedTemplate === t.name ? 'var(--brand-600)' : 'var(--slate-200)',
                    background: selectedTemplate === t.name ? 'var(--brand-50)' : 'white'
                  }} className={selectedTemplate === t.name ? 'dark:bg-brand-500/10 dark:border-brand-500' : 'dark:bg-slate-800 dark:border-slate-700'}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700 }} className="dark:text-white">{t.name}</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card card-p-lg" style={{ background: '#f8fafc', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'white', padding: '3.5rem', width: '100%', maxWidth: '650px',
              fontFamily: 'Times New Roman, serif', color: 'black',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '20px', color: '#0f172a' }}>ECONZ IT SERVICES</h2>
                  <p style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic', fontFamily: 'Plus Jakarta Sans' }}>Unified Cloud Operations Partner</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '9px', color: '#475569', fontFamily: 'Plus Jakarta Sans' }}>
                  <p>Ref: <strong>ORD-TEMP</strong></p>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '10px', color: '#334155' }}>
                <div>
                  <p style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Bill To Customer:</p>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>{customerName}</p>
                  <p>{address}</p>
                  {isIndiaEntity && pan && <p>{taxIdType}: {pan}</p>}
                  <p>POC: {pocName} ({pocDesignation})</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Order Details:</p>
                  <p>Entity: Econz {entity}</p>
                  <p>Deal Type: {dealType}</p>
                  <p>Billing Type: {billTo}</p>
                  <p>Currency: {currency}</p>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginTop: '1rem', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: 'bold' }}>SKU Description</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>Price</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderSkus.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.5rem' }}>
                        <strong>{s.name}</strong><br />
                        <span style={{ fontSize: '8px', color: '#64748b' }}>Plan: {s.subPlan} | Qty: {s.qty}</span>
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>{getCurrencySymbol(currency)}{parseFloat(s.sellPrice || 0)?.toFixed(2)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold' }}>
                        {getCurrencySymbol(currency)}{(s.sellPrice * s.qty)?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                    <td colSpan={2} style={{ padding: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Subtotal ACV</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>
                      {getCurrencySymbol(currency)}{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <td colSpan={2} style={{ padding: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{taxName}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '10px', color: '#0f172a' }}>
                      {getCurrencySymbol(currency)}{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #0f172a' }}>
                    <td colSpan={2} style={{ padding: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11px' }}>Grand Total (Final Value)</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', fontSize: '11px', color: '#0f172a' }}>
                      {getCurrencySymbol(currency)}{finalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', fontSize: '10px', color: '#475569', textAlign: 'justify', lineHeight: '1.4' }}>
                <h4 style={{ fontWeight: 'bold', color: '#0f172a', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                  Jurisdiction Clauses ({selectedTemplate})
                </h4>
                <p>
                  This agreement is governed by the laws of {entity === 'UAE' ? 'Dubai, UAE (DIFC)' : (entity === 'UK' ? 'London, UK' : entity === 'US' ? 'Delaware, USA' : 'New Delhi, India')}.
                  Tax rates of {taxName} shall be added at invoicing.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: approvalRequired ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
            padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid',
            borderColor: approvalRequired ? '#fdba74' : '#a7f3d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {approvalRequired ? (
                <>
                  <AlertTriangle className="text-orange-500" />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#c2410c' }}>Exception Detected</h4>
                    <p style={{ fontSize: '0.75rem', color: '#9a3412' }}>Margin below unit cost requires Manager approval before signing.</p>
                  </div>
                </>
              ) : isExceptionDeal ? (
                <>
                  <Check className="text-blue-500" style={{ background: '#dbeafe', padding: '2px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#1e40af' }}>Manager Authorization</h4>
                    <p style={{ fontSize: '0.75rem', color: '#1e3a8a' }}>Margin below unit cost is pre-approved by Manager credentials.</p>
                  </div>
                </>
              ) : (
                <>
                  <Check className="text-emerald-500" style={{ background: '#a7f3d0', padding: '2px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ fontWeight: 700, color: '#065f46' }}>Standard Pricing</h4>
                    <p style={{ fontSize: '0.75rem', color: '#047857' }}>All items satisfy margins. Ready for direct signature dispatch.</p>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleDownloadPDF} className="btn-secondary">
                <Download size={16} />
                PDF Preview
              </button>
              
              {approvalRequired ? (
                <button onClick={handleRequestApproval} className="btn-primary" style={{ background: '#f97316' }}>
                  <Send size={16} />
                  Request Manager Approval
                </button>
              ) : (
                <>
                  <button onClick={handleSaveDraft} className="btn-secondary">
                    <Save size={16} />
                    {isEditMode ? 'Save Changes' : 'Save Draft'}
                  </button>
                  <button onClick={handleSendDocuSign} className="btn-primary" style={{ background: '#0284c7' }}>
                    <Send size={16} />
                    Send via DocuSign
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={handlePrevStep} className="btn-back-link">
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
