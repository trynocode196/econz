import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  FileText, 
  FileCheck, 
  Trash2, 
  X,
  ExternalLink,
  Clock
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
  const popoverRef = useRef(null);

  const fetchNotifications = async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const res = await api.get('/notifications?limit=40');
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

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications(true);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
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

  const isSidebar = placement === 'sidebar';

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '0.5rem',
          background: isOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
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

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(isSidebar
              ? { bottom: 'calc(100% + 10px)', left: '0' }
              : { top: 'calc(100% + 10px)', right: '0' }),
            width: '340px',
            maxHeight: '440px',
            background: 'var(--surface-1, #0f172a)',
            border: '1px solid var(--border-default, rgba(255, 255, 255, 0.12))',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.08)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInScale 0.15s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary, #ffffff)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(56, 189, 248, 0.3)'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
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

          {/* List Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '340px'
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#64748b'
                }}
              >
                <Bell size={24} style={{ opacity: 0.4 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No notifications yet</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                  You'll be notified when Quotes or NDAs are created or updated.
                </span>
              </div>
            ) : (
              notifications.map(notif => {
                const isQuote = notif.relatedType === 'Quote' || notif.type.includes('QUOTE');
                const isNda = notif.relatedType === 'Nda' || notif.type.includes('NDA');
                const isCreated = notif.type.includes('CREATED');

                const iconBg = isQuote 
                  ? 'rgba(14, 165, 233, 0.15)' 
                  : isNda 
                  ? 'rgba(16, 185, 129, 0.15)' 
                  : 'rgba(168, 85, 247, 0.15)';
                const iconColor = isQuote ? '#0284c7' : isNda ? '#10b981' : '#a855f7';

                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: notif.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.05)',
                      transition: 'background 0.15s ease',
                      position: 'relative'
                    }}
                    className="hover:bg-white/5"
                  >
                    {/* Type Icon */}
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.5rem',
                        background: iconBg,
                        color: iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {isQuote ? <FileText size={15} /> : <FileCheck size={15} />}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: notif.isRead ? 600 : 700,
                            color: notif.isRead ? 'var(--text-primary, #e2e8f0)' : '#38bdf8',
                            lineHeight: 1.2
                          }}
                        >
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: '0.775rem',
                          color: notif.isRead ? '#94a3b8' : '#cbd5e1',
                          marginTop: '0.2rem',
                          lineHeight: 1.35,
                          wordBreak: 'break-word'
                        }}
                      >
                        {notif.message}
                      </p>
                    </div>

                    {/* Unread Dot Indicator */}
                    {!notif.isRead && (
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#38bdf8',
                          flexShrink: 0,
                          marginTop: '6px',
                          boxShadow: '0 0 6px rgba(56, 189, 248, 0.8)'
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
