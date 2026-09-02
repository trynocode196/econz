import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowDown, ArrowUp, Check, GitBranch, Loader2, Lock, Pencil, Plus, Trash2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CrmStageDto, createCrmStage, updateCrmStage, deleteCrmStage, reorderCrmStages } from '../../api';
import { useCrmStages, refreshCrmStages } from './crmStages';

const PALETTE = [
    '#8A8177', '#2AA9C4', '#8B5CF6', '#4C6FE7',
    '#E8A23D', '#D9642F', '#1F8A4C', '#D84A5B',
    '#0EA5E9', '#F43F5E', '#10B981', '#64748B',
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onChanged?: () => void;
}

const CrmStageManagerDrawer: React.FC<Props> = ({ isOpen, onClose, onChanged }) => {
    const stages = useCrmStages();
    const [busy, setBusy] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(PALETTE[5]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState(PALETTE[5]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !busy) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, busy]);

    if (!isOpen) return null;

    const openStages = stages.filter(s => s.kind === 'open');
    const terminalStages = stages.filter(s => s.kind !== 'open');

    const run = async (action: () => Promise<any>, successMessage?: string) => {
        setBusy(true);
        try {
            await action();
            await refreshCrmStages();
            onChanged?.();
            if (successMessage) toast.success(successMessage);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Stage update failed');
        } finally {
            setBusy(false);
        }
    };

    const handleAdd = () => {
        const name = newName.trim();
        if (!name) return;
        run(() => createCrmStage({ name, color: newColor }), `"${name}" added`)
            .then(() => setNewName(''));
    };

    const startEdit = (stage: CrmStageDto) => {
        setEditingId(stage._id);
        setEditName(stage.name);
        setEditColor(stage.color);
    };

    const handleSaveEdit = (stage: CrmStageDto) => {
        const name = editName.trim();
        if (!name) return toast.error('Stage name is required');
        run(() => updateCrmStage(stage._id, { name, color: editColor }), 'Stage updated')
            .then(() => setEditingId(null));
    };

    const handleDelete = (stage: CrmStageDto) => {
        if (!confirm(`Delete stage "${stage.name}"? Deals must be moved out of it first.`)) return;
        run(() => deleteCrmStage(stage._id), 'Stage deleted');
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= openStages.length) return;
        const next = [...openStages];
        [next[index], next[target]] = [next[target], next[index]];
        const orderedIds = [...next.map(s => s._id), ...terminalStages.map(s => s._id)];
        run(() => reorderCrmStages(orderedIds));
    };

    const colorPicker = (value: string, onPick: (color: string) => void) => (
        <div className="flex flex-wrap items-center gap-1.5">
            {PALETTE.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onPick(color)}
                    className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: color, borderColor: value === color ? 'var(--app-text)' : 'transparent' }}
                    aria-label={`Use ${color}`}
                />
            ))}
            <label className="relative h-5 w-5 cursor-pointer overflow-hidden rounded-full border nebula-divider">
                <input
                    type="color"
                    value={value}
                    onChange={event => onPick(event.target.value)}
                    className="absolute -inset-2 h-10 w-10 cursor-pointer border-0 p-0"
                />
            </label>
        </div>
    );

    const renderStageRow = (stage: CrmStageDto, index: number, isTerminal: boolean) => (
        <div
            key={stage._id}
            className={`rounded-xl border p-3 nebula-divider ${editingId === stage._id ? 'border-[var(--app-accent)]/50' : ''}`}
            style={{ background: 'var(--app-input-bg)' }}
        >
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 flex-none rounded-full ring-2 ring-black/5" style={{ background: stage.color }} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-wide nebula-text">{stage.name}</span>
                {isTerminal ? (
                    <span className="flex items-center gap-1 rounded-md bg-[var(--app-chip-bg)] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide nebula-text-muted">
                        <Lock className="h-2.5 w-2.5" /> {stage.kind === 'won' ? 'Won stage' : 'Lost stage'}
                    </span>
                ) : (
                    <>
                        <button type="button" disabled={busy || index === 0} onClick={() => handleMove(index, -1)}
                            className="p-1 nebula-text-muted hover:nebula-text disabled:opacity-20" aria-label={`Move ${stage.name} up`}>
                            <ArrowUp className="h-3 w-3" />
                        </button>
                        <button type="button" disabled={busy || index === openStages.length - 1} onClick={() => handleMove(index, 1)}
                            className="p-1 nebula-text-muted hover:nebula-text disabled:opacity-20" aria-label={`Move ${stage.name} down`}>
                            <ArrowDown className="h-3 w-3" />
                        </button>
                    </>
                )}
                <button type="button" disabled={busy} onClick={() => (editingId === stage._id ? setEditingId(null) : startEdit(stage))}
                    className="p-1 nebula-text-muted hover:text-[var(--app-active-text,var(--app-accent))]" aria-label={`Edit ${stage.name}`}>
                    <Pencil className="h-3 w-3" />
                </button>
                {!isTerminal && (
                    <button type="button" disabled={busy} onClick={() => handleDelete(stage)}
                        className="rounded p-1 text-rose-500 hover:bg-rose-500/10" aria-label={`Delete ${stage.name}`}>
                        <Trash2 className="h-3 w-3" />
                    </button>
                )}
            </div>
            {editingId === stage._id && (
                <div className="mt-3 border-t pt-3 nebula-divider">
                    <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Edit stage</p>
                    <input
                        autoFocus
                        value={editName}
                        onChange={event => setEditName(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Enter') handleSaveEdit(stage); }}
                        className="h-9 w-full rounded-lg border px-3 text-[11px] font-semibold outline-none focus:border-[var(--app-accent)] nebula-input"
                    />
                    <div className="mt-2.5">{colorPicker(editColor, setEditColor)}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" disabled={busy} onClick={() => setEditingId(null)}
                            className="h-8 rounded-lg border text-[10px] font-bold nebula-divider nebula-text-muted">Cancel</button>
                        <button type="button" disabled={busy} onClick={() => handleSaveEdit(stage)}
                            className="flex h-8 items-center justify-center gap-1 rounded-lg bg-[var(--app-accent)] text-[10px] font-bold text-white disabled:opacity-60">
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-stretch justify-end bg-black/55 backdrop-blur-[3px]">
            <button
                type="button"
                className="absolute inset-0 cursor-default"
                onClick={() => !busy && onClose()}
                aria-label="Close stage manager"
            />
            <aside className="relative z-10 flex h-full w-full max-w-[480px] flex-col overflow-hidden border-l shadow-2xl nebula-surface nebula-divider" aria-label="Manage pipeline stages">
                <header className="flex flex-none items-center gap-3 border-b px-5 py-4 nebula-divider">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-active-soft)] text-[var(--app-active-text,var(--app-accent))]">
                        <GitBranch className="h-[18px] w-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="font-['Sora',sans-serif] text-[15px] font-bold nebula-text">Manage Pipeline Stages</h2>
                        <p className="mt-0.5 text-[11px] nebula-text-muted">Add, rename, recolor, and reorder deal stages.</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={busy}
                        className="rounded-[10px] border p-2 nebula-divider nebula-text-muted hover:nebula-text disabled:opacity-50" aria-label="Close drawer">
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 nebula-scrollbar">
                    <p className="mb-4 text-[10px] leading-relaxed nebula-text-muted">
                        Changes apply immediately across the pipeline board, deal details and reports. Renaming a stage
                        also updates every deal currently sitting in it.
                    </p>

                    <p className="mb-2 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Pipeline order</p>
                    <div className="space-y-2.5">
                        {openStages.map((stage, index) => renderStageRow(stage, index, false))}
                    </div>

                    <p className="mb-2 mt-5 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Closing stages</p>
                    <div className="space-y-2.5">
                        {terminalStages.map((stage, index) => renderStageRow(stage, index, true))}
                    </div>

                    <section className="mt-6 rounded-xl border p-4 nebula-divider" style={{ background: 'var(--app-bg-soft)' }}>
                        <p className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.1em] nebula-text-muted">Add new stage</p>
                        {colorPicker(newColor, setNewColor)}
                        <div className="mt-3 flex gap-2">
                            <input
                                value={newName}
                                onChange={event => setNewName(event.target.value)}
                                onKeyDown={event => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        handleAdd();
                                    }
                                }}
                                placeholder="Stage name…"
                                className="h-10 min-w-0 flex-1 rounded-[10px] border px-3 text-xs outline-none focus:border-[var(--app-accent)] nebula-input"
                            />
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={busy || !newName.trim()}
                                className="flex h-10 items-center gap-1.5 rounded-[10px] nebula-accent-gradient px-3.5 text-xs font-bold text-white shadow-lg shadow-[color-mix(in_srgb,var(--app-accent)_20%,transparent)] disabled:opacity-40"
                            >
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add
                            </button>
                        </div>
                        <p className="mt-2 text-[9.5px] nebula-text-muted">New stages are inserted just before Won / Lost.</p>
                    </section>
                </div>
            </aside>
        </div>,
        document.body,
    );
};

export default CrmStageManagerDrawer;
