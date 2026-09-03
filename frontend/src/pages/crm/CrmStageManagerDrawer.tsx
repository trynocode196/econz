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
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.45rem' }}>
      {PALETTE.map(color => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: color,
            border: value === color ? '2px solid #0f172a' : '2px solid transparent',
            boxShadow: value === color ? '0 0 0 2px rgba(14, 165, 233, 0.4)' : 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          aria-label={`Use ${color}`}
        />
      ))}
    </div>
  );

  const renderStageRow = (stage: CrmStageDto, index: number, isTerminal: boolean) => (
    <div
      key={stage._id}
      style={{
        borderRadius: '0.75rem',
        border: editingId === stage._id ? '1px solid #0ea5e9' : '1px solid var(--border-subtle)',
        padding: '0.75rem 0.875rem',
        background: 'var(--surface-1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {stage.name}
        </span>
        
        {isTerminal ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '0.375rem',
            background: 'var(--surface-3)',
            color: 'var(--text-muted)',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <Lock size={10} /> {stage.kind === 'won' ? 'Won stage' : 'Lost stage'}
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <button
              type="button"
              disabled={busy || index === 0}
              onClick={() => handleMove(index, -1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center' }}
              title="Move Up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              disabled={busy || index === openStages.length - 1}
              onClick={() => handleMove(index, 1)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center' }}
              title="Move Down"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => (editingId === stage._id ? setEditingId(null) : startEdit(stage))}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center' }}
          title="Edit Stage"
        >
          <Pencil size={14} />
        </button>

        {!isTerminal && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDelete(stage)}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.25rem', display: 'flex', alignItems: 'center' }}
            title="Delete Stage"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {editingId === stage._id && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Edit stage
          </p>
          <input
            autoFocus
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(stage); }}
            className="input-orbit"
            style={{ width: '100%', height: '2.25rem', fontSize: '0.85rem' }}
          />
          <div>{colorPicker(editColor, setEditColor)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.25rem' }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setEditingId(null)}
              className="btn-secondary"
              style={{ height: '2.25rem', fontSize: '0.8rem', padding: '0' }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleSaveEdit(stage)}
              className="btn-primary"
              style={{ height: '2.25rem', fontSize: '0.8rem', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'flex-end',
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(3px)'
    }}>
      <div
        style={{ position: 'absolute', inset: 0, cursor: 'default' }}
        onClick={() => !busy && onClose()}
      />
      <aside
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          maxWidth: '460px',
          background: 'var(--surface-1)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.2)'
        }}
      >
        {/* Drawer Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-2)'
        }}>
          <div style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.75rem',
            background: 'var(--brand-50)',
            color: 'var(--brand-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GitBranch size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Manage Pipeline Stages
            </h2>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
              Add, rename, recolor, and reorder deal stages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-1)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={15} />
          </button>
        </header>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Changes apply immediately across the pipeline board, deal details and reports. Renaming a stage
            also updates every deal currently sitting in it.
          </p>

          {/* Open Stages */}
          <div>
            <p style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Pipeline order
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {openStages.map((stage, index) => renderStageRow(stage, index, false))}
            </div>
          </div>

          {/* Terminal / Closing Stages */}
          <div>
            <p style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
              Closing stages
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {terminalStages.map((stage, index) => renderStageRow(stage, index, true))}
            </div>
          </div>

          {/* Add New Stage Card */}
          <div style={{
            borderRadius: '0.875rem',
            border: '1px solid var(--border-subtle)',
            padding: '1rem',
            background: 'var(--surface-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <p style={{ fontSize: '0.725rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', margin: 0 }}>
              Add new stage
            </p>
            {colorPicker(newColor, setNewColor)}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder="Stage name…"
                className="input-orbit"
                style={{ flex: 1, height: '2.5rem', fontSize: '0.85rem' }}
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={busy || !newName.trim()}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: '2.5rem', padding: '0 1rem', fontSize: '0.825rem', fontWeight: 700 }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add
              </button>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
              New stages are inserted just before Won / Lost.
            </p>
          </div>
        </div>
      </aside>
    </div>,
    document.body
  );
};

export default CrmStageManagerDrawer;
