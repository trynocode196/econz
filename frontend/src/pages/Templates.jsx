import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  Plus, 
  FileText, 
  Trash2,
  Edit,
  Cloud,
  Globe,
  Briefcase
} from 'lucide-react';

export default function Templates() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      showToast('Error loading legal templates', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddTemplate = async () => {
    if (user.role !== 'Admin') {
      showToast('Only administrators can modify legal templates', true);
      return;
    }

    const name = window.prompt("Enter new Agreement Template Name (e.g., 'NDA Standard'):");
    if (!name) return;
    const desc = window.prompt("Enter template description:");

    try {
      const payload = {
        name,
        desc: desc || 'Custom master agreement template.',
        icon: 'file-text',
        color: 'brand',
        entity: 'India'
      };

      const res = await api.post('/templates', payload);
      setTemplates(prev => [...prev, res.data]);
      showToast("New Template Added!");
    } catch (err) {
      showToast('Failed to add template', true);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (user.role !== 'Admin') {
      showToast('Only administrators can delete templates', true);
      return;
    }

    if (!window.confirm("Are you sure you want to remove this master template?")) {
      return;
    }

    try {
      await api.delete(`/templates/${id}`);
      setTemplates(prev => prev.filter(t => t._id !== id));
      showToast("Template removed.", true);
    } catch (err) {
      showToast('Failed to delete template', true);
    }
  };

  const getTemplateIcon = (iconName) => {
    switch (iconName) {
      case 'cloud': return <Cloud size={20} />;
      case 'globe': return <Globe size={20} />;
      case 'briefcase': return <Briefcase size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getThemeColors = (color) => {
    switch (color) {
      case 'blue': return { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb' };
      case 'emerald': return { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669' };
      case 'purple': return { bg: 'rgba(139, 92, 246, 0.1)', text: '#7c3aed' };
      default: return { bg: 'var(--brand-50)', text: 'var(--brand-600)' };
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <p className="animate-pulse font-bold text-slate-500">Querying template library...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Row */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Templates</h1>
          <p className="section-sub">Standard master agreement contract forms library</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <GuideButton onClick={() => setShowGuide(true)} />
          {user.role === 'Admin' && (
            <button onClick={handleAddTemplate} className="btn-brand-sm" style={{ padding: '0.75rem 1.25rem' }}>
              <Plus size={14} style={{ marginRight: '0.25rem' }} />
              New Template
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }} className="grid-4">
        {templates.map(t => {
          const colors = getThemeColors(t.color);
          return (
            <div 
              key={t._id} 
              className="card card-p"
              style={{ display: 'flex', flexDirection: 'column', transition: 'var(--transition)' }}
            >
              <div 
                className="icon-box"
                style={{ 
                  background: colors.bg, 
                  color: colors.text,
                  marginBottom: '1rem',
                  borderRadius: '50%'
                }}
              >
                {getTemplateIcon(t.icon)}
              </div>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }} className="dark:text-white">
                {t.name}
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', flex: 1 }} className="dark:text-slate-400">
                {t.desc}
              </p>
              
              <div 
                style={{ 
                  marginTop: '1.5rem', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--slate-100)',
                  paddingTop: '1rem'
                }}
                className="dark:border-slate-700"
              >
                <button 
                  onClick={() => showToast('Terms editor coming in Phase 5')} 
                  className="btn-ghost" 
                  style={{ padding: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-400)' }}
                >
                  Edit Terms
                </button>
                {user.role === 'Admin' && (
                  <button 
                    onClick={() => handleDeleteTemplate(t._id)} 
                    className="btn-ghost" 
                    style={{ padding: 0, fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.templates}
      />
    </div>
  );
}
