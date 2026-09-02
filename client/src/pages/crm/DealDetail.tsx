import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ChevronRight, Loader2, Trash2, Trophy, TrendingDown,
  Clock, CheckCircle2, Circle, MessageSquare, GitBranch, X, Save, Plus,
  AlertCircle, ListTodo, User, Building2, Mail, Phone, Calendar, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getCrmDeal, updateCrmDeal, deleteCrmDeal, changeDealStage,
  markDealWon, markDealLost, getDealActivities, createDealActivity,
  updateDealActivity, deleteDealActivity
} from '../../api';
import { useCrmStages, getStageColor } from './crmStages';

interface Deal {
  _id: string;
  name: string;
  stage: string;
  amount?: number;
  currency: string;
  closeDate?: string;
  contact?: { name?: string; email?: string; phone?: string };
  company?: { name?: string };
  owner?: { _id: string; name: string; profilePicture?: string; designation?: string };
  isWon?: boolean;
  isLost?: boolean;
  lostReason?: string;
  stageHistory?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface Activity {
  _id: string;
  type: 'note' | 'task' | 'stage_change' | 'email' | 'file';
  content?: string;
  taskData?: {
    taskType: string;
    name: string;
    dueDate?: string;
    dueTime?: string;
    isDone: boolean;
    isHighPriority?: boolean;
    notes?: string;
  };
  stageData?: { from: string; to: string };
  createdBy?: { _id: string; name: string; profilePicture?: string };
  createdAt: string;
}

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stages = useCrmStages();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<'all' | 'note' | 'task' | 'stage_change'>('all');

  const [editForm, setEditForm] = useState({
    name: '',
    amount: '',
    closeDate: '',
    stage: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    companyName: '',
  });

  const [savingDeal, setSavingDeal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const [taskForm, setTaskForm] = useState({
    taskType: 'To do',
    name: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    dueTime: '18:00',
  });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [addingTask, setAddingTask] = useState(false);

  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const loadDeal = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [dealRes, actRes] = await Promise.all([
        getCrmDeal(id),
        getDealActivities(id),
      ]);

      const d: Deal = dealRes.data?.deal || dealRes.data;
      if (!d || !d._id) {
        toast.error('Deal not found');
        navigate('/crm');
        return;
      }

      setDeal(d);
      setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      setEditForm({
        name: d.name || '',
        amount: d.amount !== undefined && d.amount !== null ? String(d.amount) : '',
        closeDate: d.closeDate ? format(new Date(d.closeDate), 'yyyy-MM-dd') : '',
        stage: d.stage || 'New Lead',
        contactName: d.contact?.name || '',
        contactEmail: d.contact?.email || '',
        contactPhone: d.contact?.phone || '',
        companyName: d.company?.name || '',
      });
    } catch (err) {
      toast.error('Failed to load deal');
      navigate('/crm');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  const handleSaveDeal = async () => {
    if (!id || !editForm.name.trim()) return toast.error('Deal name is required');
    setSavingDeal(true);
    try {
      const res = await updateCrmDeal(id, {
        name: editForm.name.trim(),
        amount: editForm.amount ? Number(editForm.amount) : 0,
        closeDate: editForm.closeDate || undefined,
        stage: editForm.stage,
        contact: {
          name: editForm.contactName,
          email: editForm.contactEmail,
          phone: editForm.contactPhone,
        },
        company: { name: editForm.companyName },
      });
      const updated = res.data?.deal || res.data;
      setDeal(prev => (prev ? { ...prev, ...updated } : prev));
      toast.success('Deal details saved successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update deal');
    } finally {
      setSavingDeal(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!id || !deal || deal.stage === newStage) return;
    try {
      const res = await changeDealStage(id, newStage);
      const updated = res.data?.deal || res.data;
      setDeal(prev => (prev ? { ...prev, ...updated, stage: newStage } : prev));
      setEditForm(prev => ({ ...prev, stage: newStage }));
      const actRes = await getDealActivities(id);
      setActivities(Array.isArray(actRes.data) ? actRes.data : []);
      toast.success(`Stage updated to ${newStage}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change stage');
    }
  };

  const handleMarkWon = async () => {
    if (!id || !confirm('Mark this deal as Won?')) return;
    try {
      await markDealWon(id);
      toast.success('Deal marked as Won 🎉');
      loadDeal();
    } catch {
      toast.error('Failed to mark deal as won');
    }
  };

  const handleMarkLost = async () => {
    if (!id) return;
    try {
      await markDealLost(id, lostReason.trim() || undefined);
      toast.success('Deal marked as Lost');
      setShowLostModal(false);
      setLostReason('');
      loadDeal();
    } catch {
      toast.error('Failed to mark deal as lost');
    }
  };

  const handleDeleteDeal = async () => {
    if (!id || !confirm('Delete this deal permanently? All activities will be removed.')) return;
    try {
      await deleteCrmDeal(id);
      toast.success('Deal deleted');
      navigate('/crm');
    } catch {
      toast.error('Failed to delete deal');
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }
    setAddingNote(true);
    try {
      const res = await createDealActivity(id, { type: 'note', content: noteText.trim() });
      setActivities(prev => [res.data, ...prev]);
      setNoteText('');
      setIsNoteModalOpen(false);
      setActivityFilter('note');
      toast.success('Note added');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleAddTask = async () => {
    if (!id || !taskForm.name.trim()) return toast.error('Task name is required');
    setAddingTask(true);
    try {
      const res = await createDealActivity(id, {
        type: 'task',
        taskData: {
          taskType: taskForm.taskType,
          name: taskForm.name.trim(),
          dueDate: taskForm.dueDate,
          dueTime: taskForm.dueTime,
          isDone: false,
          isHighPriority: false,
        },
      });
      setActivities(prev => [res.data, ...prev]);
      setTaskForm({ taskType: 'To do', name: '', dueDate: format(new Date(), 'yyyy-MM-dd'), dueTime: '18:00' });
      setIsTaskModalOpen(false);
      setActivityFilter('task');
      toast.success('Task created');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTaskDone = async (activity: Activity) => {
    if (!id || activity.type !== 'task' || !activity.taskData) return;
    try {
      const res = await updateDealActivity(activity._id, {
        taskData: { ...activity.taskData, isDone: !activity.taskData.isDone },
      });
      setActivities(prev => prev.map(a => (a._id === activity._id ? res.data : a)));
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteActivity = async (actId: string) => {
    if (!id || !confirm('Delete this activity?')) return;
    try {
      await deleteDealActivity(actId);
      setActivities(prev => prev.filter(a => a._id !== actId));
      toast.success('Activity deleted');
    } catch {
      toast.error('Failed to delete activity');
    }
  };

  const formatCurrency = (amount?: number, curr: string = 'USD') => {
    if (amount === undefined || amount === null) return '$0.00';
    const sym = curr === 'INR' ? '₹' : curr === 'AED' ? 'د.إ' : '$';
    if (curr === 'AED') {
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${sym}`;
    }
    return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const filteredActivities = activities.filter(a => {
    if (activityFilter === 'all') return true;
    return a.type === activityFilter;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
        <Loader2 className="animate-spin text-sky-500" size={32} />
      </div>
    );
  }

  if (!deal) return null;

  const currentStageColor = getStageColor(deal.stage);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/crm')}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            title="Back to CRM Pipeline"
          >
            <ArrowLeft size={16} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Link to="/crm" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600 }}>
                CRM Pipeline
              </Link>
              <ChevronRight size={13} />
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{deal.name}</span>
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginTop: '0.15rem' }}>
              {deal.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {!deal.isWon && (
            <button
              type="button"
              onClick={handleMarkWon}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#10b981',
                borderColor: '#10b981',
                padding: '0.5rem 1.15rem',
                fontSize: '0.85rem'
              }}
            >
              <Trophy size={15} />
              <span>Mark Won</span>
            </button>
          )}

          {!deal.isLost && (
            <button
              type="button"
              onClick={() => setShowLostModal(true)}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#ef4444',
                padding: '0.5rem 1.15rem',
                fontSize: '0.85rem'
              }}
            >
              <TrendingDown size={15} />
              <span>Mark Lost</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDeleteDeal}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Delete Deal"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stage Progression Bar */}
      <div style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '1.25rem',
        padding: '1rem 1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            Pipeline Stage
          </span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.25rem 0.85rem',
            borderRadius: '9999px',
            background: `${currentStageColor}1a`,
            color: currentStageColor,
            fontSize: '0.8rem',
            fontWeight: 800,
            border: `1px solid ${currentStageColor}40`
          }}>
            {deal.stage}
          </span>
        </div>

        {/* Stage step chips */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {stages.filter(s => s.kind === 'open').map(stage => {
            const isCurrent = stage.name === deal.stage;
            return (
              <button
                key={stage._id || stage.name}
                type="button"
                onClick={() => handleStageChange(stage.name)}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.75rem',
                  border: isCurrent ? `2px solid ${stage.color}` : '1px solid var(--border-subtle)',
                  background: isCurrent ? `${stage.color}15` : 'var(--surface-2)',
                  color: isCurrent ? stage.color : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: isCurrent ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                {stage.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Column: Deal & Company Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Deal Overview Card */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Deal Details
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Deal Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Deal Amount ($)
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={e => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-orbit"
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Close Date
                </label>
                <input
                  type="date"
                  value={editForm.closeDate}
                  onChange={e => setEditForm(prev => ({ ...prev, closeDate: e.target.value }))}
                  className="input-orbit"
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Stage
              </label>
              <select
                value={editForm.stage}
                onChange={e => setEditForm(prev => ({ ...prev, stage: e.target.value }))}
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                {stages.map(s => (
                  <option key={s._id || s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Company & Contact Info Card */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Company & Contact
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Company Name
              </label>
              <input
                type="text"
                value={editForm.companyName}
                onChange={e => setEditForm(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Contact Name
              </label>
              <input
                type="text"
                value={editForm.contactName}
                onChange={e => setEditForm(prev => ({ ...prev, contactName: e.target.value }))}
                placeholder="e.g. John Doe"
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={editForm.contactEmail}
                onChange={e => setEditForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="john@example.com"
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={editForm.contactPhone}
                onChange={e => setEditForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+1 555 0199"
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <button
              type="button"
              onClick={handleSaveDeal}
              disabled={savingDeal}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', height: '2.5rem', marginTop: '0.5rem', fontWeight: 700 }}
            >
              {savingDeal ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          minHeight: '600px'
        }}>
          {/* Activity Header with Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Activity & History
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '2.25rem', padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <MessageSquare size={13} />
                <span>Add Note</span>
              </button>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(true)}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '2.25rem', padding: '0 0.85rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <Plus size={14} />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Activity Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            background: 'var(--surface-3)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
            border: '1px solid var(--border-subtle)'
          }}>
            {(['all', 'note', 'task', 'stage_change'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActivityFilter(tab)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activityFilter === tab ? 'var(--surface-1)' : 'transparent',
                  color: activityFilter === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: activityFilter === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'stage_change' ? 'Stage Logs' : `${tab}s`}
              </button>
            ))}
          </div>

          {/* Activity Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
            {filteredActivities.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No activities recorded yet.
              </div>
            ) : (
              filteredActivities.map(act => {
                const isTask = act.type === 'task';
                const isNote = act.type === 'note';
                const isStage = act.type === 'stage_change';

                return (
                  <div
                    key={act._id}
                    style={{
                      background: 'var(--surface-2)',
                      borderRadius: '0.875rem',
                      border: '1px solid var(--border-subtle)',
                      padding: '1rem',
                      display: 'flex',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    {/* Icon Column */}
                    <div style={{ marginTop: '0.1rem' }}>
                      {isTask ? (
                        <button
                          type="button"
                          onClick={() => toggleTaskDone(act)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {act.taskData?.isDone ? (
                            <CheckCircle2 size={18} className="text-emerald-500" />
                          ) : (
                            <Circle size={18} className="text-slate-400" />
                          )}
                        </button>
                      ) : isNote ? (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageSquare size={12} />
                        </div>
                      ) : (
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--brand-50)', color: 'var(--brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <GitBranch size={12} />
                        </div>
                      )}
                    </div>

                    {/* Content Column */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isTask ? act.taskData?.name : isNote ? 'Note' : 'Stage Transition'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {format(new Date(act.createdAt), 'dd MMM yyyy, HH:mm')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(act._id)}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.1rem' }}
                            title="Delete Activity"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Detail Text */}
                      {isTask && (
                        <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '0.25rem', background: 'var(--surface-3)', color: 'var(--text-secondary)' }}>
                            {act.taskData?.taskType}
                          </span>
                          {act.taskData?.dueDate && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} /> Due: {act.taskData.dueDate}
                            </span>
                          )}
                        </div>
                      )}

                      {isNote && act.content && (
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                          {act.content}
                        </p>
                      )}

                      {isStage && act.stageData && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                          Moved from <span style={{ fontWeight: 700 }}>{act.stageData.from}</span> to <span style={{ fontWeight: 700, color: '#0ea5e9' }}>{act.stageData.to}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {isNoteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface-1)', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>Add Activity Note</h3>
            <textarea
              autoFocus
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Type your notes or update here..."
              className="input-orbit"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setIsNoteModalOpen(false)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Cancel</button>
              <button type="button" onClick={handleAddNote} disabled={addingNote} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontWeight: 700 }}>
                {addingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface-1)', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Add Follow-up Task</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Task Type</label>
              <select
                value={taskForm.taskType}
                onChange={e => setTaskForm(prev => ({ ...prev, taskType: e.target.value }))}
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              >
                <option value="To do">To do</option>
                <option value="Call">Call</option>
                <option value="Email">Email</option>
                <option value="Meeting">Meeting</option>
                <option value="Follow Up">Follow Up</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Task Description</label>
              <input
                type="text"
                value={taskForm.name}
                onChange={e => setTaskForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Follow up on proposal email"
                className="input-orbit"
                style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={e => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input-orbit"
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Due Time</label>
                <input
                  type="time"
                  value={taskForm.dueTime}
                  onChange={e => setTaskForm(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="input-orbit"
                  style={{ width: '100%', height: '2.5rem', fontSize: '0.875rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Cancel</button>
              <button type="button" onClick={handleAddTask} disabled={addingTask} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontWeight: 700 }}>
                {addingTask ? 'Saving...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Lost Modal */}
      {showLostModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--surface-1)', borderRadius: '1.25rem', width: '100%', maxWidth: '480px', padding: '1.5rem', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>Mark Deal as Lost</h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>Please provide a reason for losing this deal.</p>
            <textarea
              rows={3}
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              placeholder="e.g. Budget constraints, chose another vendor..."
              className="input-orbit"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setShowLostModal(false)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>Cancel</button>
              <button type="button" onClick={handleMarkLost} className="btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', padding: '0.5rem 1.5rem', fontWeight: 700 }}>
                Mark as Lost
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
