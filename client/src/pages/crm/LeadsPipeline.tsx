import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, List, Clock, X, GitBranch,
    Loader2, Building2, Calendar, Kanban, Filter, ChevronDown, User, ArrowUpDown
} from 'lucide-react';
import { getCrmDeals, getCrmDealOwners, createCrmDeal, changeDealStage } from '../../api';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';
import {
    CRM_INPUT, CRM_LABEL, CRM_BTN_PRIMARY, CRM_BTN_SECONDARY, TASK_TYPES
} from './crmConstants';
import { StageBadge } from './CrmUi';
import { useCrmStages, getStageColor } from './crmStages';
import CrmStageManagerDrawer from './CrmStageManagerDrawer';

const SORT_OPTIONS = [
    { value: 'createdAt:desc', label: 'Newest first' },
    { value: 'createdAt:asc', label: 'Oldest first' },
    { value: 'owner:asc', label: 'Creator A → Z' },
    { value: 'owner:desc', label: 'Creator Z → A' },
    { value: 'amount:desc', label: 'Amount high → low' },
    { value: 'amount:asc', label: 'Amount low → high' },
    { value: 'closeDate:asc', label: 'Close date soonest' },
    { value: 'closeDate:desc', label: 'Close date latest' },
    { value: 'name:asc', label: 'Deal name A → Z' },
] as const;

interface DealOwner {
    _id: string;
    name: string;
    profilePicture?: string;
}

interface Deal {
    _id: string;
    name: string;
    stage: string;
    amount?: number;
    currency: string;
    closeDate?: string;
    contact: { name?: string; email?: string };
    company: { name?: string };
    owner: { _id: string; name: string; profilePicture?: string };
    nextTask?: any;
    createdAt: string;
}

const DealCard: React.FC<{ deal: Deal; onClick: () => void }> = ({ deal, onClick }) => {
    const taskOverdue =
        deal.nextTask?.taskData?.dueDate &&
        isPast(new Date(deal.nextTask.taskData.dueDate)) &&
        !deal.nextTask.taskData.isDone;

    return (
        <div
            draggable
            onDragStart={e => {
                e.dataTransfer.setData('dealId', deal._id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={onClick}
            className="group bg-[var(--app-card-bg)] border border-[var(--app-card-border)] border-l-[3px] rounded-[13px] p-3.5 shadow-[var(--app-card-shadow)] hover:shadow-md hover:border-[var(--app-accent)]/20 cursor-grab active:cursor-grabbing transition-all"
            style={{ borderLeftColor: getStageColor(deal.stage) }}
        >
            <p className="text-sm font-semibold text-[var(--app-text)] leading-snug line-clamp-2 group-hover:text-[var(--app-active-text,var(--app-accent))] transition-colors">
                {deal.name}
            </p>
            {deal.company?.name && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 flex-shrink-0" /> {deal.company.name}
                </p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--app-divider)]">
                {deal.amount ? (
                    <span className="text-sm font-bold text-[var(--app-text)] tabular-nums">${deal.amount.toLocaleString()}</span>
                ) : (
                    <span className="text-xs text-slate-400">No amount</span>
                )}
                {deal.closeDate && (
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(deal.closeDate), 'MMM d')}
                    </span>
                )}
            </div>
            {deal.contact?.name && (
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-[var(--app-active-soft)] text-[var(--app-active-text,var(--app-accent))] text-[9.5px] font-bold flex items-center justify-center">
                        {deal.contact.name.charAt(0)}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{deal.contact.name}</span>
                </div>
            )}
            {deal.nextTask && (
                <div className={`flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-md text-[10px] font-medium ${taskOverdue ? 'bg-red-50 text-red-700' : 'bg-[var(--app-chip-bg)] text-[var(--app-text-soft)]'}`}>
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{deal.nextTask.taskData?.name || 'Follow up'}</span>
                </div>
            )}
        </div>
    );
};

const KanbanColumn: React.FC<{
    stage: string;
    deals: Deal[];
    onDealClick: (id: string) => void;
    onDropDeal: (dealId: string, stage: string) => void;
    isDragOver?: boolean;
}> = ({ stage, deals, onDealClick, onDropDeal }) => {
    const [dragOver, setDragOver] = useState(false);
    const totalRevenue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

    return (
        <div className="flex-shrink-0 w-[290px] flex flex-col max-h-full">
            <div className="rounded-t-2xl h-[3px]" style={{ backgroundColor: getStageColor(stage) }} />
            <div className={`flex-1 flex flex-col rounded-b-2xl border border-t-0 border-[var(--app-card-border)] ${dragOver ? 'bg-[var(--app-accent)]/5 ring-2 ring-[var(--app-active-soft)]' : 'bg-[var(--app-bg-soft)]'} min-h-[200px]`}>
                <div className="px-3 py-3 border-b border-[var(--app-divider)] bg-[var(--app-card-bg)]">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-['Sora',sans-serif] text-xs font-bold text-[var(--app-text)] uppercase tracking-wide truncate">{stage}</h3>
                        <span className="text-[11px] font-bold text-[var(--app-text-muted)] bg-[var(--app-card-bg)] px-2 py-0.5 rounded-full tabular-nums">{deals.length}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 tabular-nums">${totalRevenue.toLocaleString()}</p>
                </div>
                <div
                    className="flex-1 overflow-y-auto p-2 space-y-2 nebula-scrollbar min-h-[120px]"
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                        e.preventDefault();
                        setDragOver(false);
                        const dealId = e.dataTransfer.getData('dealId');
                        if (dealId) onDropDeal(dealId, stage);
                    }}
                >
                    {deals.map(deal => (
                        <DealCard key={deal._id} deal={deal} onClick={() => onDealClick(deal._id)} />
                    ))}
                    {deals.length === 0 && (
                        <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-[var(--app-card-border)] text-[11px] text-[var(--app-text-muted)] font-medium">
                            Drop deals here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CreateDealModal: React.FC<{ onClose: () => void; onCreated: (deal: Deal) => void }> = ({ onClose, onCreated }) => {
    const stages = useCrmStages();
    const [form, setForm] = useState({
        name: '', stage: stages.find(s => s.kind === 'open')?.name || 'New Lead', amount: '', closeDate: '',
        contactName: '', contactEmail: '', companyName: '',
        createTask: true, taskType: 'To do', taskName: 'Follow up',
        taskDueDate: format(new Date(), 'yyyy-MM-dd'), taskDueTime: '18:00',
    });
    const [saving, setSaving] = useState(false);
    const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

    const handleSubmit = async () => {
        if (!form.name.trim()) return toast.error('Deal name is required');
        setSaving(true);
        try {
            const payload: any = {
                name: form.name, stage: form.stage,
                amount: form.amount ? Number(form.amount) : undefined,
                closeDate: form.closeDate || undefined,
                contact: { name: form.contactName, email: form.contactEmail },
                company: { name: form.companyName },
                createTask: form.createTask,
            };
            if (form.createTask) {
                payload.taskData = {
                    taskType: form.taskType, name: form.taskName,
                    dueDate: form.taskDueDate, dueTime: form.taskDueTime,
                };
            }
            const res = await createCrmDeal(payload);
            toast.success('Deal created');
            onCreated(res.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create deal');
        } finally {
            setSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end bg-black/50 backdrop-blur-[2px]">
            <div className="h-full w-full max-w-[620px] flex flex-col border-l border-[var(--app-card-border)] bg-[var(--app-card-bg-strong)] shadow-[-24px_0_70px_rgba(0,0,0,.28)]">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--app-divider)]">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--app-active-text,var(--app-accent))]">New opportunity</p>
                        <h2 className="mt-1 font-['Sora',sans-serif] text-xl font-bold text-[var(--app-text)]">Create deal</h2>
                        <p className="text-xs text-[var(--app-text-muted)] mt-1">Add a new opportunity to your pipeline</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--app-hover)] rounded-xl text-[var(--app-text-muted)]"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    <div>
                        <label className={CRM_LABEL}>Deal name <span className="text-red-500">*</span></label>
                        <input className={CRM_INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Website redesign — Acme Corp" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={CRM_LABEL}>Stage</label>
                            <select className={CRM_INPUT} value={form.stage} onChange={e => set('stage', e.target.value)}>
                                {stages.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={CRM_LABEL}>Amount (USD)</label>
                            <input type="number" className={CRM_INPUT} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" />
                        </div>
                    </div>
                    <div>
                        <label className={CRM_LABEL}>Expected close date</label>
                        <input type="date" className={CRM_INPUT} value={form.closeDate} onChange={e => set('closeDate', e.target.value)} />
                    </div>
                    <div className="border-t border-[var(--app-divider)] pt-4">
                        <p className="font-['Sora',sans-serif] text-xs font-bold text-[var(--app-text)] mb-3">Contact &amp; company</p>
                        <div className="space-y-3">
                            <input className={CRM_INPUT} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Contact name" />
                            <input className={CRM_INPUT} value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="Email" />
                            <input className={CRM_INPUT} value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Company name" />
                        </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                        <input type="checkbox" checked={form.createTask} onChange={e => set('createTask', e.target.checked)} className="rounded border-[var(--app-card-border)] text-[var(--app-active-text,var(--app-accent))] focus:ring-[var(--app-active-soft)]" />
                        <span className="text-sm text-[var(--app-text-soft)]">Schedule a follow-up task</span>
                    </label>
                    {form.createTask && (
                        <div className="grid grid-cols-2 gap-3 pl-6 border-l-2 border-[var(--app-accent)]/25">
                            <select className={CRM_INPUT} value={form.taskType} onChange={e => set('taskType', e.target.value)}>
                                {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input className={CRM_INPUT} value={form.taskName} onChange={e => set('taskName', e.target.value)} placeholder="Task title" />
                            <input type="date" className={CRM_INPUT} value={form.taskDueDate} onChange={e => set('taskDueDate', e.target.value)} />
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-[var(--app-divider)] flex justify-end gap-2 bg-[var(--app-bg-soft)]">
                    <button onClick={onClose} className={CRM_BTN_SECONDARY}>Cancel</button>
                    <button onClick={handleSubmit} disabled={saving || !form.name.trim()} className={CRM_BTN_PRIMARY}>
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create deal
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ListView: React.FC<{ deals: Deal[]; onDealClick: (id: string) => void }> = ({ deals, onDealClick }) => (
    <div className="bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-[18px] overflow-hidden shadow-[var(--app-card-shadow)]">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
                <thead>
                    <tr className="bg-[var(--app-bg-soft)] border-b border-[var(--app-divider)]">
                        {['Deal', 'Company', 'Contact', 'Stage', 'Created', 'Close date', 'Amount', 'Owner'].map(h => (
                            <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wide text-[var(--app-text-muted)] px-4 py-2.5">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--app-divider)]">
                    {deals.map(deal => (
                        <tr key={deal._id} onClick={() => onDealClick(deal._id)} className="hover:bg-[var(--app-hover)] cursor-pointer transition-colors">
                            <td className="px-4 py-2.5"><span className="text-[13px] font-semibold text-[var(--app-text)]">{deal.name}</span></td>
                            <td className="px-4 py-2.5 text-[13px] text-[var(--app-text-muted)]">{deal.company?.name || '—'}</td>
                            <td className="px-4 py-2.5 text-[13px] text-[var(--app-text-muted)]">{deal.contact?.name || '—'}</td>
                            <td className="px-4 py-2.5"><StageBadge stage={deal.stage} /></td>
                            <td className="px-4 py-2.5 text-[13px] text-[var(--app-text-muted)] tabular-nums">{deal.createdAt ? format(new Date(deal.createdAt), 'MMM d, yyyy') : '—'}</td>
                            <td className="px-4 py-2.5 text-[13px] text-[var(--app-text-muted)] tabular-nums">{deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '—'}</td>
                            <td className="px-4 py-2.5 text-[13px] font-semibold text-[var(--app-text)] tabular-nums">{deal.amount ? `$${deal.amount.toLocaleString()}` : '—'}</td>
                            <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#1F8A4C]/15 text-[#1F8A4C] text-[10px] font-bold flex items-center justify-center">{deal.owner?.name?.charAt(0)}</div>
                                    <span className="text-[13px] text-[var(--app-text-muted)]">{deal.owner?.name}</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {deals.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-16 text-[var(--app-text-muted)] text-sm">No deals match your filters</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const LeadsPipeline: React.FC = () => {
    const navigate = useNavigate();
    const stages = useCrmStages();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [showStageManager, setShowStageManager] = useState(false);
    const [owners, setOwners] = useState<DealOwner[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'cards' | 'list'>('cards');
    const [search, setSearch] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [ownerFilter, setOwnerFilter] = useState('');
    const [sortValue, setSortValue] = useState('createdAt:desc');
    const [dateField, setDateField] = useState<'createdAt' | 'closeDate'>('createdAt');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);

    useEffect(() => {
        getCrmDealOwners()
            .then(res => setOwners(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!showFilterDrawer) return undefined;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowFilterDrawer(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showFilterDrawer]);

    const fetchDeals = useCallback(async () => {
        const [sortBy, sortOrder] = sortValue.split(':') as [string, 'asc' | 'desc'];
        try {
            setLoading(true);
            const res = await getCrmDeals({
                search: search.trim() || undefined,
                stage: stageFilter || undefined,
                ownerId: ownerFilter || undefined,
                sortBy: sortBy as any,
                sortOrder,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                dateField: startDate || endDate ? dateField : undefined,
            });
            setDeals(res.data);
        } catch {
            toast.error('Failed to load pipeline');
        } finally {
            setLoading(false);
        }
    }, [search, stageFilter, ownerFilter, sortValue, startDate, endDate, dateField]);

    useEffect(() => { fetchDeals(); }, [fetchDeals]);

    const hasAdvancedFilters = Boolean(ownerFilter || startDate || endDate || sortValue !== 'createdAt:desc' || dateField !== 'createdAt');
    const hasAnyFilters = Boolean(hasAdvancedFilters || stageFilter);
    const activeFilterCount = [
        stageFilter,
        ownerFilter,
        startDate || endDate,
        sortValue !== 'createdAt:desc',
        dateField !== 'createdAt',
    ].filter(Boolean).length;

    const clearAdvancedFilters = () => {
        setOwnerFilter('');
        setStartDate('');
        setEndDate('');
        setSortValue('createdAt:desc');
        setDateField('createdAt');
    };

    const clearAllFilters = () => {
        clearAdvancedFilters();
        setStageFilter('');
    };

    const filterFieldClass = `${CRM_INPUT} pl-8 pr-8 py-1.5 text-xs font-medium w-full appearance-none cursor-pointer`;

    const handleDropDeal = async (dealId: string, stage: string) => {
        const deal = deals.find(d => d._id === dealId);
        if (!deal || deal.stage === stage) return;
        try {
            await changeDealStage(dealId, stage);
            setDeals(prev => prev.map(d => d._id === dealId ? { ...d, stage } : d));
            toast.success(`Moved to ${stage}`);
        } catch {
            toast.error('Failed to update stage');
        }
    };

    const stageNames = stages.map(s => s.name);
    const wonNames = stages.filter(s => s.kind === 'won').map(s => s.name);
    const closedNames = stages.filter(s => s.kind !== 'open').map(s => s.name);
    const openDeals = deals.filter(d => !closedNames.includes(d.stage));
    const totalPipeline = openDeals.reduce((s, d) => s + (d.amount || 0), 0);
    const wonValue = deals.filter(d => wonNames.includes(d.stage)).reduce((s, d) => s + (d.amount || 0), 0);
    const visibleStages = stageFilter ? [stageFilter] : stageNames;

    return (
        <div className="bd-leads-pipeline h-full min-h-0 flex flex-col overflow-hidden bg-transparent">
            <div className="flex-shrink-0 space-y-2 max-md:space-y-1.5">
            {/* Pipeline summary — 2 KPIs on phones, all 4 from sm up */}
            <div className="bd-kpi-scroll flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] nebula-scrollbar max-md:gap-1.5 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0">
                <div className="flex w-[calc(50%-0.375rem)] flex-none flex-col bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-3 py-2 shadow-[var(--app-card-shadow)] max-md:rounded-xl max-md:px-2.5 max-md:py-1.5 sm:w-auto sm:px-4 sm:py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)] max-md:text-[9px]">Open deals</p>
                    <p className="font-['Sora',sans-serif] text-[1.15rem] font-bold text-[var(--app-text)] tabular-nums max-md:text-base">{openDeals.length}</p>
                </div>
                <div className="flex w-[calc(50%-0.375rem)] flex-none flex-col bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-3 py-2 shadow-[var(--app-card-shadow)] max-md:rounded-xl max-md:px-2.5 max-md:py-1.5 sm:w-auto sm:px-4 sm:py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)] max-md:text-[9px]">Pipeline value</p>
                    <p className="font-['Sora',sans-serif] text-[1.15rem] font-bold text-[var(--app-text)] tabular-nums max-md:text-base">${totalPipeline.toLocaleString()}</p>
                </div>
                <div className="hidden w-[calc(50%-0.375rem)] flex-none flex-col bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-4 py-3 shadow-[var(--app-card-shadow)] sm:flex sm:w-auto">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)]">Won revenue</p>
                    <p className="font-['Sora',sans-serif] text-[1.15rem] font-bold text-[#1F8A4C] tabular-nums">${wonValue.toLocaleString()}</p>
                </div>
                <div className="hidden w-[calc(50%-0.375rem)] flex-none flex-col bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-4 py-3 shadow-[var(--app-card-shadow)] sm:flex sm:w-auto">
                    <p className="text-[10px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)]">Total deals</p>
                    <p className="font-['Sora',sans-serif] text-[1.15rem] font-bold text-[var(--app-text)] tabular-nums">{deals.length}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="space-y-2 max-md:space-y-1.5">
                <div className="flex flex-col gap-2 bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-3 py-2.5 shadow-[var(--app-card-shadow)] max-md:rounded-xl max-md:px-2.5 max-md:py-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
                    {/* Mobile: Board/List + Filters + New deal on one row */}
                    <div className="flex items-center gap-1.5 sm:contents">
                        <div className="flex rounded-[11px] p-0.5 bg-[var(--app-chip-bg)] max-md:rounded-[9px]">
                            <button onClick={() => setView('cards')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-semibold transition-all max-md:px-2.5 max-md:py-1 max-md:text-[11px] ${view === 'cards' ? 'bg-[var(--app-card-bg)] shadow-sm text-[var(--app-active-text,var(--app-accent))]' : 'text-[var(--app-text-muted)]'}`}>
                                <Kanban className="w-3.5 h-3.5" /> Board
                            </button>
                            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-semibold transition-all max-md:px-2.5 max-md:py-1 max-md:text-[11px] ${view === 'list' ? 'bg-[var(--app-card-bg)] shadow-sm text-[var(--app-active-text,var(--app-accent))]' : 'text-[var(--app-text-muted)]'}`}>
                                <List className="w-3.5 h-3.5" /> List
                            </button>
                        </div>

                        <div className="relative hidden sm:block">
                            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            <select
                                value={stageFilter}
                                onChange={e => setStageFilter(e.target.value)}
                                className={`${CRM_INPUT} pl-8 pr-8 py-1.5 text-xs font-medium w-full sm:w-[180px] appearance-none cursor-pointer`}
                            >
                                <option value="">All stages</option>
                                {stageNames.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowFilterDrawer(true)}
                            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors max-md:ml-auto max-md:px-2.5 max-md:py-1 max-md:text-[11px] sm:hidden ${
                                hasAnyFilters
                                    ? 'bg-[var(--app-accent)]/10 border-[var(--app-accent)]/20 text-[var(--app-active-text,var(--app-accent))]'
                                    : 'bg-[var(--app-card-bg)] border-[var(--app-card-border)] text-[var(--app-text-soft)]'
                            }`}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-accent)] px-1 text-[8px] font-bold text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFilters(v => !v)}
                            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                showFilters || hasAdvancedFilters
                                    ? 'bg-[var(--app-accent)]/10 border-[var(--app-accent)]/20 text-[var(--app-active-text,var(--app-accent))]'
                                    : 'bg-[var(--app-card-bg)] border-[var(--app-card-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-hover)]'
                            }`}
                        >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            Sort & dates
                            {hasAdvancedFilters && <span className="w-1.5 h-1.5 rounded-full bg-[var(--app-accent)]" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowStageManager(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border bg-[var(--app-card-bg)] border-[var(--app-card-border)] text-[var(--app-text-soft)] hover:bg-[var(--app-hover)] transition-colors"
                            title="Add, edit and reorder pipeline stages"
                        >
                            <GitBranch className="w-3.5 h-3.5" />
                            Stages
                        </button>

                        <button
                            onClick={() => setShowModal(true)}
                            className={`${CRM_BTN_PRIMARY} flex-shrink-0 max-md:h-8 max-md:gap-1 max-md:px-2.5 max-md:text-[11px] sm:hidden`}
                            aria-label="New deal"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:flex-none sm:justify-end">
                        <div className="relative flex-1 sm:w-56 max-w-none sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 max-md:left-2.5 max-md:w-3.5 max-md:h-3.5" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deals, contacts..." className={`${CRM_INPUT} pl-9 max-md:h-8 max-md:pl-8 max-md:text-xs`} />
                        </div>
                        <button onClick={() => setShowModal(true)} className={`${CRM_BTN_PRIMARY} flex-shrink-0 hidden sm:inline-flex`}>
                            <Plus className="w-4 h-4" /> New deal
                        </button>
                    </div>
                </div>

                {/* Sort & timeline filters — desktop collapsible only */}
                {showFilters && (
                    <div className="hidden sm:block bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-4 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            <div className="relative">
                                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={sortValue}
                                    onChange={e => setSortValue(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={ownerFilter}
                                    onChange={e => setOwnerFilter(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    <option value="">All creators</option>
                                    {owners.map(o => (
                                        <option key={o._id} value={o._id}>{o.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={dateField}
                                    onChange={e => setDateField(e.target.value as 'createdAt' | 'closeDate')}
                                    className={filterFieldClass}
                                >
                                    <option value="createdAt">Created date</option>
                                    <option value="closeDate">Close date</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className={`${CRM_INPUT} py-1.5 text-xs w-[140px] max-w-full`}
                                title="Start date"
                            />
                            <span className="text-xs text-slate-400">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className={`${CRM_INPUT} py-1.5 text-xs w-[140px] max-w-full`}
                                title="End date"
                            />
                            {hasAdvancedFilters && (
                                <button
                                    type="button"
                                    onClick={clearAdvancedFilters}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden mt-2 max-md:mt-1.5">
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--app-active-text,var(--app-accent))]" />
                </div>
            ) : view === 'cards' ? (
                <div className="flex gap-[14px] overflow-x-auto pb-4 min-h-[260px] items-stretch nebula-scrollbar max-md:min-h-[200px] max-md:gap-2.5 max-md:pb-3">
                    {visibleStages.map(stage => (
                        <KanbanColumn
                            key={stage}
                            stage={stage}
                            deals={deals.filter(d => d.stage === stage)}
                            onDealClick={id => navigate(`/business-dev/deals/${id}`)}
                            onDropDeal={handleDropDeal}
                        />
                    ))}
                </div>
            ) : (
                <div className="pb-4 max-md:pb-3"><ListView deals={deals} onDealClick={id => navigate(`/business-dev/deals/${id}`)} /></div>
            )}
            </div>

            {showModal && (
                <CreateDealModal
                    onClose={() => setShowModal(false)}
                    onCreated={deal => { setDeals(prev => [deal, ...prev]); navigate(`/business-dev/deals/${deal._id}`); }}
                />
            )}

            {showFilterDrawer && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-stretch justify-end bg-black/55 backdrop-blur-[3px] sm:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default"
                        onClick={() => setShowFilterDrawer(false)}
                        aria-label="Close filters"
                    />
                    <aside
                        className="relative z-10 flex h-full w-full max-w-[360px] flex-col overflow-hidden border-l shadow-2xl nebula-surface nebula-divider"
                        aria-label="Deal filters"
                    >
                        <header className="flex flex-none items-center gap-3 border-b px-4 py-3.5 nebula-divider">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-active-soft)] text-[var(--app-active-text,var(--app-accent))]">
                                <Filter className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="font-['Sora',sans-serif] text-[14px] font-bold nebula-text">Filters</h2>
                                <p className="mt-0.5 text-[10px] nebula-text-muted">Stage, sort, creator and dates</p>
                            </div>
                            {hasAnyFilters && (
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="text-[11px] font-bold text-[var(--app-accent)]"
                                >
                                    Clear all
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowFilterDrawer(false)}
                                className="rounded-[10px] border p-2 nebula-divider nebula-text-muted"
                                aria-label="Close filter drawer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 nebula-scrollbar">
                            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Stage</p>
                            <div className="relative mb-4">
                                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={stageFilter}
                                    onChange={e => setStageFilter(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    <option value="">All stages</option>
                                    {stageNames.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Sort</p>
                            <div className="relative mb-4">
                                <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={sortValue}
                                    onChange={e => setSortValue(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Creator</p>
                            <div className="relative mb-4">
                                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={ownerFilter}
                                    onChange={e => setOwnerFilter(e.target.value)}
                                    className={filterFieldClass}
                                >
                                    <option value="">All creators</option>
                                    {owners.map(o => (
                                        <option key={o._id} value={o._id}>{o.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>

                            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Date range</p>
                            <div className="relative mb-2">
                                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                <select
                                    value={dateField}
                                    onChange={e => setDateField(e.target.value as 'createdAt' | 'closeDate')}
                                    className={filterFieldClass}
                                >
                                    <option value="createdAt">Created date</option>
                                    <option value="closeDate">Close date</option>
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                            </div>
                            <div className="mb-4 flex flex-col gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className={`${CRM_INPUT} py-1.5 text-xs w-full`}
                                    title="Start date"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className={`${CRM_INPUT} py-1.5 text-xs w-full`}
                                    title="End date"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowFilterDrawer(false);
                                    setShowStageManager(true);
                                }}
                                className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border bg-[var(--app-card-bg)] border-[var(--app-card-border)] text-[var(--app-text-soft)]"
                            >
                                <GitBranch className="w-3.5 h-3.5" />
                                Manage stages
                            </button>
                        </div>

                        <footer className="flex flex-none gap-2 border-t px-4 py-3 nebula-divider">
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="h-10 flex-1 rounded-[10px] border px-4 text-[11px] font-bold nebula-divider nebula-text"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowFilterDrawer(false)}
                                className="h-10 flex-1 rounded-[10px] nebula-accent-gradient px-4 text-[11px] font-bold text-white"
                            >
                                Apply
                            </button>
                        </footer>
                    </aside>
                </div>,
                document.body,
            )}

            <CrmStageManagerDrawer
                isOpen={showStageManager}
                onClose={() => setShowStageManager(false)}
                onChanged={fetchDeals}
            />
        </div>
    );
};

export default LeadsPipeline;
