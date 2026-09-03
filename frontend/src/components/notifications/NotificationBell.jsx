import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  FileCheck, 
  Trash2, 
  X,
  Clock,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 30) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationBell({ placement = 'sidebar' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'QUOTE' | 'NDA'

  const fetchNotifications = async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/notifications?limit=60');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Error polling notifications:', err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch and 15s interval polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle ESC key to close drawer
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(true);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e?.stopPropagation();
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev =>
          prev.map(n => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setIsOpen(false);

      if (notif.relatedType === 'Quote' || notif.type.includes('QUOTE')) {
        navigate('/quotes');
      } else if (notif.relatedType === 'Nda' || notif.type.includes('NDA')) {
        navigate('/nda');
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const handleDeleteNotification = async (e, notifId) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications(prev => {
        const item = prev.find(n => n._id === notifId);
        if (item && !item.isRead) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(n => n._id !== notifId);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    if (activeFilter === 'QUOTE') return n.relatedType === 'Quote' || n.type.includes('QUOTE');
    if (activeFilter === 'NDA') return n.relatedType === 'Nda' || n.type.includes('NDA');
    return true;
  });

  const quoteCount = notifications.filter(n => n.relatedType === 'Quote' || n.type.includes('QUOTE')).length;
  const ndaCount = notifications.filter(n => n.relatedType === 'Nda' || n.type.includes('NDA')).length;

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.5rem',
          background: isOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
          border: 'none',
          color: unreadCount > 0 ? '#38bdf8' : '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
        className="hover:text-white hover:bg-white/10"
      >
        <Bell size={15} />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '9999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 800,
              lineHeight: '16px',
              textAlign: 'center',
              boxShadow: '0 0 0 2px #0f172a',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Right-Side Slide-Over Drawer Popup */}
      {isOpen &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(5px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Backdrop click area to close */}
            <div
              style={{ position: 'absolute', inset: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-in Drawer Container */}
            <aside
              style={{
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
                maxWidth: '460px',
                background: 'var(--surface-1, #0f172a)',
                borderLeft: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
                color: 'var(--text-primary, #ffffff)',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Drawer Header matching media_1788435947809.png */}
              <header
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  background: 'var(--surface-2, rgba(15, 23, 42, 0.95))'
                }}
              >
                <div
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
                  }}
                >
                  <Bell size={18} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary, #ffffff)', margin: 0 }}>
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '1px 7px',
                          borderRadius: '9999px',
                          border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}
                      >
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-muted, #94a3b8)', margin: '0.2rem 0 0 0' }}>
                    Activity and real-time updates for Quotes & NDAs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
                    background: 'var(--surface-1, rgba(255, 255, 255, 0.05))',
                    color: 'var(--text-muted, #94a3b8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  className="hover:text-white hover:bg-white/10"
                >
                  <X size={15} />
                </button>
              </header>

              {/* Sub-header Filter Tabs & Mark All as Read */}
              <div
                style={{
                  padding: '0.85rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
                  background: 'rgba(255, 255, 255, 0.015)'
                }}
              >
                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeFilter === 'ALL' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: activeFilter === 'ALL' ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('UNREAD')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeFilter === 'UNREAD' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: activeFilter === 'UNREAD' ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    Unread ({unreadCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('QUOTE')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeFilter === 'QUOTE' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: activeFilter === 'QUOTE' ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    Quotes ({quoteCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('NDA')}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeFilter === 'NDA' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: activeFilter === 'NDA' ? '#38bdf8' : '#94a3b8'
                    }}
                  >
                    NDAs ({ndaCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 6px',
                      borderRadius: '0.375rem',
                      transition: 'color 0.15s'
                    }}
                    className="hover:text-sky-400"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification List Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {loading && notifications.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Loading updates...
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div
                    style={{
                      padding: '4rem 1.5rem',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.75rem',
                      color: '#64748b'
                    }}
                  >
                    <div
                      style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '1rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                      }}
                    >
                      <Inbox size={24} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary, #cbd5e1)', margin: 0 }}>
                        {activeFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0 0', maxWidth: '280px' }}>
                        When Quotes or NDAs are created or updated, you will receive real-time notifications here.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredNotifications.map(notif => {
                    const isQuote = notif.relatedType === 'Quote' || notif.type.includes('QUOTE');
                    const isNda = notif.relatedType === 'Nda' || notif.type.includes('NDA');
                    const isCreated = notif.type.includes('CREATED');

                    const badgeBg = isQuote 
                      ? 'rgba(14, 165, 233, 0.12)' 
                      : isNda 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : 'rgba(168, 85, 247, 0.12)';
                    const badgeColor = isQuote ? '#38bdf8' : isNda ? '#34d399' : '#c084fc';
                    const dotColor = isQuote ? '#0284c7' : isNda ? '#10b981' : '#a855f7';

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          padding: '1rem 1.15rem',
                          borderRadius: '0.875rem',
                          background: notif.isRead 
                            ? 'var(--surface-2, rgba(255, 255, 255, 0.02))' 
                            : 'rgba(56, 189, 248, 0.06)',
                          border: notif.isRead 
                            ? '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))' 
                            : '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative'
                        }}
                        className="hover:border-sky-500/40 hover:bg-white/[0.04]"
                      >
                        {/* Top row: Category Badge, Time, and Delete Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: dotColor,
                                display: 'inline-block'
                              }}
                            />
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                padding: '2px 8px',
                                borderRadius: '0.375rem',
                                background: badgeBg,
                                color: badgeColor
                              }}
                            >
                              {isQuote ? 'Quote' : isNda ? 'NDA' : 'Document'}
                            </span>
                            {!notif.isRead && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  color: '#38bdf8',
                                  background: 'rgba(56, 189, 248, 0.2)',
                                  padding: '1px 6px',
                                  borderRadius: '9999px'
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={11} />
                              {timeAgo(notif.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteNotification(e, notif._id)}
                              title="Delete notification"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              className="hover:text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Title & Message */}
                        <div>
                          <h4
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: notif.isRead ? 'var(--text-primary, #f1f5f9)' : '#38bdf8',
                              margin: '0 0 0.25rem 0',
                              lineHeight: 1.3
                            }}
                          >
                            {notif.title}
                          </h4>
                          <p
                            style={{
                              fontSize: '0.8rem',
                              color: notif.isRead ? '#94a3b8' : '#cbd5e1',
                              margin: 0,
                              lineHeight: 1.4
                            }}
                          >
                            {notif.message}
                          </p>
                        </div>

                        {/* Bottom Row: View Document link */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: badgeColor,
                            paddingTop: '0.25rem'
                          }}
                        >
                          <span>Open {isQuote ? 'Quote' : 'NDA'}</span>
                          <ChevronRight size={13} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <footer
                style={{
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
                  background: 'var(--surface-2, rgba(15, 23, 42, 0.95))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 8px #10b981'
                    }}
                  />
                  <span>Live Sync Active</span>
                </div>
                <span>Showing {filteredNotifications.length} updates</span>
              </footer>
            </aside>
          </div>,
          document.body
        )}

      {/* Global Slide-In Animation Style */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
