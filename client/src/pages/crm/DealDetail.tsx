import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, ChevronLeft, ChevronRight, Loader2, Trash2, Trophy, TrendingDown,
    Clock, CheckCircle2, Circle, MessageSquare, GitBranch, X, Save, Plus,
    AlertCircle, ListTodo, ChevronRight as ChevRight
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import {
    getCrmDeal, updateCrmDeal, deleteCrmDeal, changeDealStage,
    markDealWon, markDealLost, getDealActivities, createDealActivity, updateDealActivity, deleteDealActivity
} from '../../api';
import { TASK_TYPES, CRM_INPUT, CRM_BTN_PRIMARY, CRM_BTN_SECONDARY } from './crmConstants';
import { StageBadge, StagePipeline, CrmField, CrmSection, MetricTile } from './CrmUi';

interface Deal {
    _id: string;
    name: string;
    stage: string;
    amount?: number;
    currency: string;
    closeDate?: string;
    contact: { name?: string; email?: string; phone?: string };
    company: { name?: string };
    owner: { _id: string; name: string; profilePicture?: string; designation?: string };
    isWon: boolean;
    isLost: boolean;
    lostReason?: string;
    stageHistory?: any[];
    createdAt: string;
    updatedAt: string;
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
    createdBy: { _id: string; name: string; profilePicture?: string };
    createdAt: string;
}

type ActivityModal = 'note' | 'task' | null;

const DealDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deal, setDeal] = useState<Deal | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [prevId, setPrevId] = useState<string | null>(null);
    const [nextId, setNextId] = useState<string | null>(null);
    const [dealIndex, setDealIndex] = useState(0);
    const [dealTotal, setDealTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activityFilter, setActivityFilter] = useState<'all' | 'note' | 'task' | 'stage_change'>('all');
    const [activityModal, setActivityModal] = useState<ActivityModal>(null);

    const [editForm, setEditForm] = useState({
        name: '', amount: '', closeDate: '',
        contactName: '', contactEmail: '', contactPhone: '', companyName: '',
    });
    const [savingDeal, setSavingDeal] = useState(false);
    const [changingStage, setChangingStage] = useState(false);

    const [noteText, setNoteText] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    const [taskForm, setTaskForm] = useState({
        taskType: 'To do', name: '', dueDate: format(new Date(), 'yyyy-MM-dd'), dueTime: '18:00',
    });
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
            const d = dealRes.data.deal;
            setDeal(d);
            setPrevId(dealRes.data.prevId);
            setNextId(dealRes.data.nextId);
            setDealIndex(dealRes.data.index ?? 0);
            setDealTotal(dealRes.data.total ?? 0);
            setActivities(actRes.data);
            setEditForm({
                name: d.name || '',
                amount: d.amount?.toString() || '',
                closeDate: d.closeDate ? format(new Date(d.closeDate), 'yyyy-MM-dd') : '',
                contactName: d.contact?.name || '',
                contactEmail: d.contact?.email || '',
                contactPhone: d.contact?.phone || '',
                companyName: d.company?.name || '',
            });
        } catch {
            toast.error('Deal not found');
            navigate('/business-dev');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => { loadDeal(); }, [loadDeal]);

    const handleSaveDeal = async () => {
        if (!id || !editForm.name.trim()) return toast.error('Deal name is required');
        setSavingDeal(true);
        try {
            const res = await updateCrmDeal(id, {
                name: editForm.name.trim(),
                amount: editForm.amount ? Number(editForm.amount) : undefined,
                closeDate: editForm.closeDate || undefined,
                contact: {
                    name: editForm.contactName,
                    email: editForm.contactEmail,
                    phone: editForm.contactPhone,
                },
                company: { name: editForm.companyName },
            });
            setDeal(prev => prev ? { ...prev, ...res.data } : prev);
            toast.success('Deal updated');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update deal');
        } finally {
            setSavingDeal(false);
        }
    };

    const handleStageChange = async (stage: string) => {
        if (!id || !deal || deal.stage === stage) return;
        setChangingStage(true);
        try {
            const res = await changeDealStage(id, stage);
            setDeal(prev => prev ? { ...prev, ...res.data } : prev);
            const actRes = await getDealActivities(id);
            setActivities(actRes.data);
            toast.success(`Stage updated to ${stage}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change stage');
        } finally {
            setChangingStage(false);
        }
    };

    const handleMarkWon = async () => {
        if (!id || !confirm('Mark this deal as Won?')) return;
        try {
            await markDealWon(id);
            toast.success('Deal marked as Won!');
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
            navigate('/business-dev');
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
            setActivityModal(null);
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
                    hasReminder: false,
                },
            });
            setActivities(prev => [res.data, ...prev]);
            setTaskForm({ taskType: 'To do', name: '', dueDate: format(new Date(), 'yyyy-MM-dd'), dueTime: '18:00' });
            setActivityModal(null);
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
            const res = await updateDealActivity(id, activity._id, {
                taskData: { ...activity.taskData, isDone: !activity.taskData.isDone },
            });
            setActivities(prev => prev.map(a => a._id === activity._id ? res.data : a));
        } catch {
            toast.error('Failed to update task');
        }
    };

    const handleDeleteActivity = async (actId: string) => {
        if (!id || !confirm('Delete this activity?')) return;
        try {
            await deleteDealActivity(id, actId);
            setActivities(prev => prev.filter(a => a._id !== actId));
            toast.success('Activity deleted');
        } catch {
            toast.error('Failed to delete activity');
        }
    };

    const filteredActivities = activities.filter(a => {
        if (activityFilter === 'all') return true;
        return a.type === activityFilter;
    });

    if (loading) {
        return (
            <div className="business-development-page flex h-full min-h-0 flex-1 items-center justify-center bg-[var(--app-bg)]">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!deal) return null;

    const openTasks = activities.filter(a => a.type === 'task' && a.taskData && !a.taskData.isDone);

    return (
        <div className="business-development-page flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--app-bg)]">
            {/* Record header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
                <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <Link to="/business-dev" className="hover:text-emerald-700 font-medium">Business Development</Link>
                    <ChevRight className="w-3 h-3" />
                    <Link to="/business-dev" className="hover:text-emerald-700 font-medium">Deals</Link>
                    <ChevRight className="w-3 h-3" />
                    <span className="text-slate-800 font-semibold truncate max-w-[200px]">{deal.name}</span>
                </nav>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0">
                        <Link to="/business-dev" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 mt-0.5">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-slate-900 truncate">{deal.name}</h1>
                                <StageBadge stage={deal.stage} size="md" />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                {deal.company?.name && <span>{deal.company.name} · </span>}
                                Deal {dealIndex + 1} of {dealTotal}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                            <button disabled={!prevId} onClick={() => prevId && navigate(`/business-dev/deals/${prevId}`)} className="p-2 hover:bg-slate-50 disabled:opacity-30 border-r border-slate-200">
                                <ChevronLeft className="w-4 h-4 text-slate-600" />
                            </button>
                            <button disabled={!nextId} onClick={() => nextId && navigate(`/business-dev/deals/${nextId}`)} className="p-2 hover:bg-slate-50 disabled:opacity-30">
                                <ChevronRight className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
                        {!deal.isWon && !deal.isLost && (
                            <>
                                <button onClick={handleMarkWon} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                                    <Trophy className="w-3.5 h-3.5" /> Mark won
                                </button>
                                <button onClick={() => setShowLostModal(true)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-rose-200 text-rose-600 text-xs font-semibold rounded-lg hover:bg-rose-50">
                                    <TrendingDown className="w-3.5 h-3.5" /> Mark lost
                                </button>
                            </>
                        )}
                        <button onClick={handleDeleteDeal} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete deal">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Stage stepper */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Pipeline stage</p>
                    <StagePipeline
                        currentStage={deal.stage}
                        onStageClick={handleStageChange}
                        disabled={changingStage || deal.isWon || deal.isLost}
                    />
                </div>

                {(deal.isWon || deal.isLost) && (
                    <div className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold ${deal.isWon ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                        {deal.isWon ? <Trophy className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {deal.isWon ? 'Closed won' : 'Closed lost'}
                        {deal.lostReason && <span className="font-normal opacity-80">— {deal.lostReason}</span>}
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 flex gap-5 px-6 py-5 overflow-hidden">
                {/* Activity column */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    <div className="flex gap-3 mb-4 flex-shrink-0 flex-wrap">
                        <MetricTile label="Amount" value={deal.amount ? `$${deal.amount.toLocaleString()}` : '—'} />
                        <MetricTile label="Close date" value={deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '—'} />
                        <MetricTile label="Open tasks" value={openTasks.length} hint={openTasks.length ? 'Needs attention' : undefined} />
                    </div>

                    {/* Activity section */}
                    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 flex-shrink-0 flex-wrap">
                            <div className="flex gap-1 overflow-x-auto">
                                {(['all', 'note', 'task', 'stage_change'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setActivityFilter(f)}
                                        className={`px-3 py-3 text-xs font-semibold capitalize border-b-2 -mb-px transition-colors whitespace-nowrap ${activityFilter === f ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {f === 'stage_change' ? 'History' : f === 'all' ? 'All activity' : f + 's'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 py-2 flex-shrink-0">
                                {(activityFilter === 'all' || activityFilter === 'note') && (
                                    <button
                                        onClick={() => setActivityModal('note')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add note
                                    </button>
                                )}
                                {(activityFilter === 'all' || activityFilter === 'task') && (
                                    <button
                                        onClick={() => setActivityModal('task')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add task
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            {filteredActivities.length === 0 ? (
                                <div className="text-center py-16 border border-dashed border-slate-200 rounded-lg">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                    <p className="text-sm font-medium text-slate-500">No activity yet</p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {activityFilter === 'stage_change'
                                            ? 'Stage changes will appear here as the deal moves through the pipeline'
                                            : activityFilter === 'note'
                                            ? 'Click Add note to log a call, email, or meeting summary'
                                            : activityFilter === 'task'
                                            ? 'Click Add task to schedule a follow-up'
                                            : 'Use Add note or Add task to start tracking this deal'}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative pl-6 space-y-0">
                                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200" />
                                    {filteredActivities.map(activity => (
                                        <ActivityItem
                                            key={activity._id}
                                            activity={activity}
                                            onToggleTask={() => toggleTaskDone(activity)}
                                            onDelete={() => handleDeleteActivity(activity._id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Properties sidebar */}
                <div className="w-[320px] flex-shrink-0 overflow-y-auto custom-scrollbar space-y-4">
                    <CrmSection
                        title="About this deal"
                        action={
                            <button onClick={handleSaveDeal} disabled={savingDeal} className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                                {savingDeal ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save
                            </button>
                        }
                    >
                        <CrmField label="Deal name">
                            <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={CRM_INPUT} />
                        </CrmField>
                        <CrmField label="Amount (USD)">
                            <input type="number" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} className={CRM_INPUT} />
                        </CrmField>
                        <CrmField label="Close date">
                            <input type="date" value={editForm.closeDate} onChange={e => setEditForm(p => ({ ...p, closeDate: e.target.value }))} className={CRM_INPUT} />
                        </CrmField>
                    </CrmSection>

                    <CrmSection title="Contact">
                        <CrmField label="Name">
                            <input value={editForm.contactName} onChange={e => setEditForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Full name" className={CRM_INPUT} />
                        </CrmField>
                        <CrmField label="Email">
                            <input value={editForm.contactEmail} onChange={e => setEditForm(p => ({ ...p, contactEmail: e.target.value }))} placeholder="email@company.com" className={CRM_INPUT} />
                        </CrmField>
                        <CrmField label="Phone">
                            <input value={editForm.contactPhone} onChange={e => setEditForm(p => ({ ...p, contactPhone: e.target.value }))} placeholder="+1..." className={CRM_INPUT} />
                        </CrmField>
                    </CrmSection>

                    <CrmSection title="Company">
                        <CrmField label="Company name">
                            <input value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} className={CRM_INPUT} />
                        </CrmField>
                    </CrmSection>

                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-3">Deal owner</p>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 text-sm font-bold flex items-center justify-center">
                                {deal.owner?.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{deal.owner?.name}</p>
                                {deal.owner?.designation && <p className="text-xs text-slate-500">{deal.owner.designation}</p>}
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
                            Created {format(new Date(deal.createdAt), 'MMM d, yyyy · h:mm a')}
                        </p>
                    </div>
                </div>
            </div>

            {activityModal === 'note' && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-slate-900">Add note</h3>
                            </div>
                            <button onClick={() => setActivityModal(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="px-6 py-5">
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Log a call, email, or meeting summary..."
                                rows={5}
                                autoFocus
                                className={`${CRM_INPUT} resize-none`}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50 rounded-b-xl">
                            <button onClick={() => setActivityModal(null)} className={CRM_BTN_SECONDARY}>Cancel</button>
                            <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()} className={CRM_BTN_PRIMARY}>
                                {addingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                                Save note
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activityModal === 'task' && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <ListTodo className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-slate-900">Add task</h3>
                            </div>
                            <button onClick={() => setActivityModal(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="px-6 py-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <CrmField label="Type">
                                    <select value={taskForm.taskType} onChange={e => setTaskForm(p => ({ ...p, taskType: e.target.value }))} className={CRM_INPUT}>
                                        {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </CrmField>
                                <CrmField label="Due date">
                                    <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className={CRM_INPUT} />
                                </CrmField>
                            </div>
                            <CrmField label="Task title">
                                <input
                                    value={taskForm.name}
                                    onChange={e => setTaskForm(p => ({ ...p, name: e.target.value }))}
                                    placeholder="Follow up on proposal"
                                    autoFocus
                                    className={CRM_INPUT}
                                />
                            </CrmField>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50 rounded-b-xl">
                            <button onClick={() => setActivityModal(null)} className={CRM_BTN_SECONDARY}>Cancel</button>
                            <button onClick={handleAddTask} disabled={addingTask || !taskForm.name.trim()} className={CRM_BTN_PRIMARY}>
                                {addingTask && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create task
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLostModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900">Mark deal as lost</h3>
                            <button onClick={() => setShowLostModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-sm text-slate-600 mb-4">Optionally record why this opportunity was lost.</p>
                            <textarea
                                value={lostReason}
                                onChange={e => setLostReason(e.target.value)}
                                placeholder="Budget, timing, competitor..."
                                rows={3}
                                className={`${CRM_INPUT} resize-none`}
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50/50 rounded-b-xl">
                            <button onClick={() => setShowLostModal(false)} className={CRM_BTN_SECONDARY}>Cancel</button>
                            <button onClick={handleMarkLost} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700">Mark as lost</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ActivityItem: React.FC<{
    activity: Activity;
    onToggleTask: () => void;
    onDelete: () => void;
}> = ({ activity, onToggleTask, onDelete }) => {
    const icon = activity.type === 'task' ? Clock
        : activity.type === 'stage_change' ? GitBranch
        : activity.type === 'note' ? MessageSquare
        : AlertCircle;

    const Icon = icon;
    const taskOverdue = activity.type === 'task' && activity.taskData?.dueDate
        && !activity.taskData.isDone && isPast(new Date(activity.taskData.dueDate));

    const dotColor = activity.type === 'task' ? 'bg-violet-500 ring-violet-100'
        : activity.type === 'stage_change' ? 'bg-indigo-500 ring-indigo-100'
        : activity.type === 'note' ? 'bg-emerald-500 ring-emerald-100'
        : 'bg-slate-400 ring-slate-100';

    return (
        <div className="relative pb-6 group">
            <div className={`absolute -left-6 top-1 w-[10px] h-[10px] rounded-full ring-4 ${dotColor}`} />
            <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'task' ? 'bg-violet-50 text-violet-600'
                        : activity.type === 'stage_change' ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-slate-800 capitalize">
                                {activity.type === 'stage_change' ? 'Stage changed' : activity.type}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">
                                {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">{activity.createdBy?.name}</p>

                        {activity.type === 'note' && activity.content && (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{activity.content}</p>
                        )}

                        {activity.type === 'stage_change' && activity.stageData && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <StageBadge stage={activity.stageData.from || 'New'} />
                                <span className="text-slate-300">→</span>
                                <StageBadge stage={activity.stageData.to} />
                            </div>
                        )}

                        {activity.type === 'task' && activity.taskData && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg border ${taskOverdue ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}>
                                <button onClick={onToggleTask} className="mt-0.5 flex-shrink-0">
                                    {activity.taskData.isDone
                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        : <Circle className="w-4 h-4 text-slate-300 hover:text-emerald-500" />}
                                </button>
                                <div>
                                    <p className={`text-sm font-medium ${activity.taskData.isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                        <span className="text-slate-500">[{activity.taskData.taskType}]</span> {activity.taskData.name}
                                    </p>
                                    {activity.taskData.dueDate && (
                                        <p className={`text-[10px] mt-1 font-medium ${taskOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                            Due {format(new Date(activity.taskData.dueDate), 'MMM d, yyyy')}
                                            {taskOverdue && ' · Overdue'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {activity.type !== 'stage_change' && (
                        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DealDetail;
