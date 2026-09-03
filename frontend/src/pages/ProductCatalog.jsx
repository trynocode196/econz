import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  Plus, 
  Mail, 
  Cloud, 
  Layout, 
  ArrowLeft,
  ChevronRight,
  Save,
  Check,
  Edit2,
  Briefcase,
  Globe,
  Layers,
  Shield
} from 'lucide-react';

export default function ProductCatalog() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  
  // Navigation level states
  const [level, setLevel] = useState(1); // 1: Products, 2: Families, 3: SKUs
  const [selectedProductKey, setSelectedProductKey] = useState(null);
  const [selectedFamilyIndex, setSelectedFamilyIndex] = useState(null);

  // Fetch product catalog
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      showToast('Error loading product catalog', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenProduct = (key) => {
    setSelectedProductKey(key);
    setLevel(2);
  };

  const handleOpenFamily = (index) => {
    setSelectedFamilyIndex(index);
    setLevel(3);
  };

  const handleReset = () => {
    setLevel(1);
    setSelectedProductKey(null);
    setSelectedFamilyIndex(null);
  };

  const handleBackToProduct = () => {
    setLevel(2);
    setSelectedFamilyIndex(null);
  };

  // Add a new product family
  const handleAddFamily = async () => {
    const name = window.prompt('Enter new Product Family Name:');
    if (!name) return;
    const desc = window.prompt('Enter a short description:') || '';

    try {
      const familyPayload = {
        name,
        desc,
        skus: []
      };
      const res = await api.post(`/products/${selectedProductKey}/families`, familyPayload);
      
      // Update local state
      setProducts(prev => prev.map(p => p.key === selectedProductKey ? res.data : p));
      showToast('Product Family added successfully!');
    } catch (err) {
      showToast('Failed to add product family', true);
    }
  };

  // Add a new SKU row
  const handleAddSku = async () => {
    const code = window.prompt('Enter new SKU Code:');
    if (!code) return;
    const name = window.prompt('Enter new SKU Name:') || 'New SKU Name';

    try {
      const skuPayload = {
        name,
        code: code.toUpperCase(),
        prices: {
          INR: { commit: 0, flexi: 0 },
          USD: { commit: 0, flexi: 0 },
          AED: { commit: 0, flexi: 0 },
          GBP: { commit: 0, flexi: 0 }
        }
      };

      const res = await api.post(`/products/${selectedProductKey}/families/${selectedFamilyIndex}/skus`, skuPayload);
      
      // Update local state
      setProducts(prev => prev.map(p => p.key === selectedProductKey ? res.data : p));
      showToast('New SKU added. Prices may be set inline.');
    } catch (err) {
      showToast('Failed to add SKU', true);
    }
  };

  // Update SKU fields (inline editing)
  const handleUpdateSkuInline = async (skuIndex, field, value, priceCurrency, priceType) => {
    const currentProduct = products.find(p => p.key === selectedProductKey);
    const sku = currentProduct.families[selectedFamilyIndex].skus[skuIndex];
    
    let updatedSku = { ...sku };

    if (priceCurrency && priceType) {
      updatedSku.prices = {
        ...sku.prices,
        [priceCurrency]: {
          ...sku.prices[priceCurrency],
          [priceType]: parseFloat(value) || 0
        }
      };
    } else {
      updatedSku[field] = value;
    }

    try {
      const res = await api.put(
        `/products/${selectedProductKey}/families/${selectedFamilyIndex}/skus/${skuIndex}`, 
        updatedSku
      );
      // Update local state
      setProducts(prev => prev.map(p => p.key === selectedProductKey ? res.data : p));
      showToast('SKU settings updated');
    } catch (err) {
      showToast('Failed to update SKU configuration', true);
    }
  };

  const selectedProduct = products.find(p => p.key === selectedProductKey);
  const selectedFamily = selectedProduct?.families?.[selectedFamilyIndex];

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Querying global SKU directory...</p>
      </div>
    );
  }

  // Icon mapping
  const getProductIcon = (key) => {
    switch(key) {
      case 'GWS': return <Mail size={32} className="text-rose-500" />;
      case 'GCP': return <Cloud size={32} className="text-sky-500" />;
      case 'MICROSOFT': return <Layout size={32} className="text-indigo-500" />;
      case 'GWS_SERVICES': return <Briefcase size={32} className="text-emerald-500" />;
      case 'APPSHEET': return <Layers size={32} className="text-amber-500" />;
      case 'OTHER': return <Globe size={32} className="text-purple-500" />;
      default: return <Layout size={32} className="text-sky-500" />;
    }
  };

  const getProductBg = (key) => {
    switch(key) {
      case 'GWS': return 'rgba(244, 63, 94, 0.08)';
      case 'GCP': return 'rgba(14, 165, 233, 0.08)';
      case 'MICROSOFT': return 'rgba(99, 102, 241, 0.08)';
      case 'GWS_SERVICES': return 'rgba(16, 185, 129, 0.08)';
      case 'APPSHEET': return 'rgba(245, 158, 11, 0.08)';
      case 'OTHER': return 'rgba(168, 85, 247, 0.08)';
      default: return 'rgba(14, 165, 233, 0.08)';
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header and Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="section-title">Product Catalog</h1>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, marginTop: '0.25rem' }}>
            <button 
              onClick={handleReset} 
              className="btn-ghost" 
              style={{ padding: 0, color: level === 1 ? 'var(--slate-800)' : 'var(--slate-400)', fontWeight: level === 1 ? 700 : 500 }}
            >
              All Products
            </button>
            
            {level > 1 && (
              <>
                <ChevronRight size={14} style={{ color: 'var(--slate-300)' }} />
                <button 
                  onClick={handleBackToProduct} 
                  className="btn-ghost"
                  style={{ padding: 0, color: level === 2 ? 'var(--slate-800)' : 'var(--slate-400)', fontWeight: level === 2 ? 700 : 500 }}
                >
                  {selectedProduct?.name}
                </button>
              </>
            )}

            {level > 2 && (
              <>
                <ChevronRight size={14} style={{ color: 'var(--slate-300)' }} />
                <span style={{ color: 'var(--slate-800)', fontWeight: 700 }}>
                  {selectedFamily?.name}
                </span>
              </>
            )}
          </nav>
        </div>

        <GuideButton onClick={() => setShowGuide(true)} />
      </div>

      {/* ── LEVEL 1: PRODUCTS LIST ── */}
      {level === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="grid-3">
          {products.map(p => (
            <div 
              key={p._id}
              onClick={() => handleOpenProduct(p.key)}
              className="card card-p"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid transparent' }}
            >
              <div style={{
                height: '3.5rem', width: '3.5rem', borderRadius: '1rem',
                background: getProductBg(p.key), display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getProductIcon(p.key)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">
                  {p.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.25rem' }}>
                  {p.category || 'Subscription'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── LEVEL 2: PRODUCT FAMILIES ── */}
      {level === 2 && selectedProduct && (
        <div className="card">
          <div className="orbit-table-card-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">Product Families</h2>
            {user.role === 'Admin' && (
              <button onClick={handleAddFamily} className="btn-brand-sm">
                <Plus size={12} />
                Add Family
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="orbit-table">
              <tbody>
                {selectedProduct.families?.map((fam, idx) => (
                  <tr key={idx} onClick={() => handleOpenFamily(idx)}>
                    <td style={{ fontWeight: 700, color: 'var(--brand-600)', width: '30%' }} className="dark:text-brand-400">
                      {fam.name}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {fam.desc}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 700, width: '15%' }}>
                      {fam.skus ? fam.skus.length : 0} SKUs
                    </td>
                    <td style={{ textAlign: 'right', width: '10%' }}>
                      <button className="btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.7rem' }}>
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEVEL 3: SKU MASTER PRICING GRID ── */}
      {level === 3 && selectedProduct && selectedFamily && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-p dark:border-slate-700" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--slate-100)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)' }} className="dark:text-white">SKU Master Pricing Grid</h2>
            {user.role === 'Admin' && (
              <button onClick={handleAddSku} className="btn-brand-sm">
                <Plus size={12} />
                Add SKU
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto', padding: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ padding: '0.75rem', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-100)', textAlign: 'left', fontWeight: 'bold', color: 'var(--slate-400)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:border-slate-700">SKU Description</th>
                  <th rowSpan={2} style={{ padding: '0.75rem', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-100)', textAlign: 'left', fontWeight: 'bold', color: 'var(--slate-400)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:border-slate-700">Code</th>
                  <th colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', fontWeight: 'bold', color: 'var(--slate-700)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-700">🇮🇳 INR</th>
                  <th colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', fontWeight: 'bold', color: 'var(--slate-700)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:text-slate-300 dark:border-slate-700">🇺🇸 USD</th>
                  <th colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', fontWeight: 'bold', color: 'var(--slate-700)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-700">🇦🇪 AED</th>
                  <th colSpan={2} style={{ padding: '0.5rem', textAlign: 'center', borderBottom: '1px solid var(--slate-200)', fontWeight: 'bold', color: 'var(--slate-700)', fontSize: '0.625rem', textTransform: 'uppercase' }} className="dark:border-slate-700">🇬🇧 GBP</th>
                </tr>
                <tr>
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', background: 'var(--slate-50)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--brand-600)' }} className="dark:bg-slate-700/30 dark:border-slate-700 dark:text-brand-400">Commit</th>
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', background: 'var(--slate-50)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#10b981' }} className="dark:bg-slate-700/30 dark:border-slate-700 dark:text-emerald-400">Flexi</th>
                  
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--brand-600)' }} className="dark:border-slate-700 dark:text-brand-400">Commit</th>
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#10b981' }} className="dark:border-slate-700 dark:text-emerald-400">Flexi</th>
                  
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', background: 'var(--slate-50)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--brand-600)' }} className="dark:bg-slate-700/30 dark:border-slate-700 dark:text-brand-400">Commit</th>
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', borderRight: '1px solid var(--slate-200)', background: 'var(--slate-50)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#10b981' }} className="dark:bg-slate-700/30 dark:border-slate-700 dark:text-emerald-400">Flexi</th>
                  
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: 'var(--brand-600)' }} className="dark:border-slate-700 dark:text-brand-400">Commit</th>
                  <th style={{ padding: '0.375rem', borderBottom: '1px solid var(--slate-200)', textAlign: 'center', fontSize: '0.55rem', fontWeight: 'bold', color: '#10b981' }} className="dark:border-slate-700 dark:text-emerald-400">Flexi</th>
                </tr>
              </thead>
              <tbody>
                {selectedFamily.skus?.map((s, skuIdx) => (
                  <tr key={skuIdx} style={{ borderBottom: '1px solid var(--slate-100)' }} className="dark:border-slate-700">
                    
                    {/* SKU Name Input */}
                    <td style={{ padding: '0.5rem', borderRight: '1px solid var(--slate-50)', minWidth: '180px' }} className="dark:border-slate-700">
                      <input 
                        type="text" 
                        value={s.name} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, 'name', e.target.value)}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid transparent' }}
                      />
                    </td>

                    {/* SKU Code Input */}
                    <td style={{ padding: '0.5rem', borderRight: '1px solid var(--slate-100)', minWidth: '100px' }} className="dark:border-slate-700">
                      <input 
                        type="text" 
                        value={s.code} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, 'code', e.target.value)}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', background: 'transparent', border: '1px solid transparent' }}
                      />
                    </td>

                    {/* INR Commit */}
                    <td style={{ padding: '0.5rem', background: 'var(--slate-50)/50' }} className="dark:bg-slate-700/10">
                      <input 
                        type="number" 
                        value={s.prices.INR.commit} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'INR', 'commit')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>
                    {/* INR Flexi */}
                    <td style={{ padding: '0.5rem', borderRight: '1px solid var(--slate-200)', background: 'var(--slate-50)/50' }} className="dark:bg-slate-700/10 dark:border-slate-700">
                      <input 
                        type="number" 
                        value={s.prices.INR.flexi} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'INR', 'flexi')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>

                    {/* USD Commit */}
                    <td style={{ padding: '0.5rem' }}>
                      <input 
                        type="number" 
                        value={s.prices.USD.commit} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'USD', 'commit')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>
                    {/* USD Flexi */}
                    <td style={{ padding: '0.5rem', borderRight: '1px solid var(--slate-200)' }} className="dark:border-slate-700">
                      <input 
                        type="number" 
                        value={s.prices.USD.flexi} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'USD', 'flexi')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>

                    {/* AED Commit */}
                    <td style={{ padding: '0.5rem', background: 'var(--slate-50)/50' }} className="dark:bg-slate-700/10">
                      <input 
                        type="number" 
                        value={s.prices.AED.commit} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'AED', 'commit')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>
                    {/* AED Flexi */}
                    <td style={{ padding: '0.5rem', borderRight: '1px solid var(--slate-200)', background: 'var(--slate-50)/50' }} className="dark:bg-slate-700/10 dark:border-slate-700">
                      <input 
                        type="number" 
                        value={s.prices.AED.flexi} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'AED', 'flexi')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>

                    {/* GBP Commit */}
                    <td style={{ padding: '0.5rem' }}>
                      <input 
                        type="number" 
                        value={s.prices.GBP.commit} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'GBP', 'commit')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>
                    {/* GBP Flexi */}
                    <td style={{ padding: '0.5rem' }}>
                      <input 
                        type="number" 
                        value={s.prices.GBP.flexi} 
                        onChange={(e) => handleUpdateSkuInline(skuIdx, null, e.target.value, 'GBP', 'flexi')}
                        disabled={user.role !== 'Admin'}
                        className="input-orbit"
                        style={{ padding: '0.375rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, background: 'transparent', border: '1px solid transparent', width: '4.5rem' }}
                      />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card-p dark:border-slate-700" style={{ display: 'flex', justifyContent: 'flex-start', borderTop: '1px solid var(--slate-100)' }}>
            <button onClick={handleBackToProduct} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
              <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} />
              Back to Families
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.productCatalog}
      />
    </div>
  );
}
