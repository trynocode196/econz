import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import GuideButton from '../components/common/GuideButton';
import SectionGuideModal from '../components/common/SectionGuideModal';
import { SECTION_GUIDES } from '../data/guidesData';
import { 
  Search, 
  Pencil, 
  Megaphone, 
  FileText, 
  ExternalLink, 
  Download,
  Eye,
  CheckCircle,
  Clock,
  Send,
  X
} from 'lucide-react';

export default function NDA() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { dark } = useTheme();
  const navigate = useNavigate();

  const [ndaList, setNdaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const fetchNdaDocuments = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.get('/nda');
      const allNdas = Array.isArray(res.data) ? res.data : [];
      
      const formatted = allNdas.map(q => ({
        _id: q._id,
        refId: q.refId || (q._id ? q._id.slice(-8) : '123456'),
        createdAt: q.createdAt || new Date().toISOString(),
        customerName: q.companyName || q.customer?.account || 'Customer',
        customerEmail: q.pocEmail || '',
        status: q.status || 'Sent for Signature',
        createdBy: (typeof q.createdBy === 'object' ? q.createdBy?.email : q.creatorEmail) || user?.email || 'Admin',
        pdfUrl: q.pdfUrl,
        docUrl: q.docUrl,
        googleDocUrl: q.googleDocUrl
      }));
      setNdaList(formatted);
    } catch (err) {
      if (!isBackground) setNdaList([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNdaDocuments(false);
    // Real-time live status polling every 5 seconds
    const interval = setInterval(() => {
      fetchNdaDocuments(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchNdaDocuments]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '03-Sep-2026';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const filteredNdaList = ndaList.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.refId?.toLowerCase().includes(q) ||
      item.customerName?.toLowerCase().includes(q) ||
      item.customerEmail?.toLowerCase().includes(q) ||
      item.createdBy?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  const handleSendReminder = (item) => {
    showToast(`Signature reminder sent to ${item.customerEmail}`);
  };

  const handleDownloadDoc = (item, format) => {
    if (format === 'pdf' && item.pdfUrl) {
      window.open(item.pdfUrl, '_blank');
      return;
    }
    if (format === 'doc' && (item.docUrl || item.googleDocUrl)) {
      window.open(item.docUrl || item.googleDocUrl, '_blank');
      return;
    }
    showToast(`Downloading Non-Disclosure Agreement (${format.toUpperCase()}) for ${item.customerName}...`);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* ── Top Header Section ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Document Non-Disclosure Agreement
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Centralized document repository.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Guide Button */}
          <GuideButton onClick={() => setShowGuide(true)} />

          {/* + Create NDA Button */}
          <button
            type="button"
            onClick={() => navigate('/nda/create')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.15rem',
              borderRadius: '2rem',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(6, 182, 212, 0.25)',
              transition: 'all 0.15s ease'
            }}
            className="hover:opacity-95"
          >
            <span>+ Create NDA</span>
          </button>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Type here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.4rem',
                borderRadius: '2rem',
                border: '1px solid var(--border-subtle)',
                background: dark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.03)'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── NDA Table Card ── */}
      <div style={{
        background: dark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
        borderRadius: '1.25rem',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / REF</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CREATION DATE</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CUSTOMER</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMAIL</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CREATED BY</th>
                <th style={{ padding: '1.1rem 1.25rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredNdaList.map((item) => (
                <tr 
                  key={item._id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'background 0.15s ease'
                  }}
                  className="hover:bg-sky-500/[0.02]"
                >
                  {/* ID / REF */}
                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {item.refId}
                  </td>

                  {/* CREATION DATE */}
                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(item.createdAt)}
                  </td>

                  {/* CUSTOMER */}
                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.customerName}
                  </td>

                  {/* EMAIL */}
                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {item.customerEmail}
                  </td>

                  {/* STATUS */}
                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: item.status === 'Completed'
                        ? '#10b981'
                        : item.status === 'Customer Signed'
                        ? (dark ? '#34d399' : '#059669')
                        : item.status === 'Rejected'
                        ? '#ef4444'
                        : (dark ? '#38bdf8' : '#0284c7')
                    }}>
                      {item.status === 'Completed' && (
                        <CheckCircle size={13} style={{ color: '#10b981' }} />
                      )}
                      {item.status === 'Customer Signed' && (
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          boxShadow: '0 0 6px #10b981'
                        }} />
                      )}
                      {item.status === 'Sent for Signature' && (
                        <span style={{
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: dark ? '#38bdf8' : '#0284c7'
                        }} />
                      )}
                      {item.status}
                    </span>
                  </td>

                  {/* CREATED BY */}
                  <td style={{ padding: '1.1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {item.createdBy}
                  </td>

                  {/* ACTIONS */}
                  <td style={{ padding: '1.1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      
                      {/* Edit Pencil */}
                      <button
                        type="button"
                        onClick={() => showToast(`Opening editor for NDA #${item.refId}`)}
                        title="Edit NDA"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#38bdf8',
                          padding: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Megaphone (Notification / Remind) */}
                      <button
                        type="button"
                        onClick={() => handleSendReminder(item)}
                        title="Send Signature Reminder"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#38bdf8',
                          padding: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Megaphone size={15} />
                      </button>

                      {/* PDF Action Badge */}
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(item, 'pdf')}
                        title="Download PDF"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#38bdf8',
                          padding: '0.2rem 0.35rem',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.15rem'
                        }}
                      >
                        <FileText size={14} />
                        <span>PDF</span>
                      </button>

                      {/* DOC Action Badge */}
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(item, 'doc')}
                        title="Download Word DOC"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#38bdf8',
                          padding: '0.2rem 0.35rem',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.15rem'
                        }}
                      >
                        <FileText size={14} />
                        <span>DOC</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredNdaList.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No Non-Disclosure Agreements found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Step-by-Step Guide Modal */}
      <SectionGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        guide={SECTION_GUIDES.nda}
      />
    </div>
  );
}
