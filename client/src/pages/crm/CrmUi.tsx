import React from 'react';
import { useCrmStages, getStageColor, stageBadgeStyle } from './crmStages';

export const StageBadge: React.FC<{ stage: string; size?: 'sm' | 'md' }> = ({ stage, size = 'sm' }) => {
    useCrmStages(); // re-render when the configurable stage list loads/changes
    return (
        <span
            className={`inline-flex items-center font-semibold border rounded-full whitespace-nowrap ${size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
            style={stageBadgeStyle(getStageColor(stage))}
        >
            {stage}
        </span>
    );
};

export const StagePipeline: React.FC<{
    currentStage: string;
    onStageClick?: (stage: string) => void;
    disabled?: boolean;
}> = ({ currentStage, onStageClick, disabled }) => {
    const stages = useCrmStages();
    const visibleStages = stages.filter(s => s.kind !== 'lost');
    const currentIdx = visibleStages.findIndex(s => s.name === currentStage);
    const isLost = stages.some(s => s.kind === 'lost' && s.name === currentStage);

    return (
        <div className="flex items-center gap-0.5 overflow-x-auto pb-1 nebula-scrollbar">
            {visibleStages.map((stageDoc, idx) => {
                const stage = stageDoc.name;
                const isPast = currentIdx >= 0 && idx < currentIdx;
                const isCurrent = stage === currentStage;

                return (
                    <React.Fragment key={stageDoc._id}>
                        <button
                            type="button"
                            disabled={disabled || !onStageClick}
                            onClick={() => onStageClick?.(stage)}
                            className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                                isCurrent
                                    ? 'nebula-accent-gradient text-white shadow-sm'
                                    : isPast
                                    ? 'bg-[var(--app-active-soft)] text-[var(--app-active-text,var(--app-accent))] hover:bg-[var(--app-accent)]/15'
                                    : 'bg-[var(--app-chip-bg)] text-[var(--app-text-muted)] hover:bg-[var(--app-hover)]'
                            } ${onStageClick && !disabled ? 'cursor-pointer' : 'cursor-default'}`}
                            title={stage}
                        >
                            {stage.length > 14 ? stage.slice(0, 12) + '…' : stage}
                        </button>
                        {idx < visibleStages.length - 1 && (
                            <div className={`w-4 h-px flex-shrink-0 ${isPast ? 'bg-[var(--app-accent)]/40' : 'bg-[var(--app-divider)]'}`} />
                        )}
                    </React.Fragment>
                );
            })}
            {isLost && (
                <span className="ml-2"><StageBadge stage={currentStage} /></span>
            )}
        </div>
    );
};

export const CrmField: React.FC<{
    label: string;
    children: React.ReactNode;
    className?: string;
}> = ({ label, children, className = '' }) => (
    <div className={className}>
        <label className="block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)] mb-1.5">{label}</label>
        {children}
    </div>
);

export const CrmSection: React.FC<{
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}> = ({ title, children, action }) => (
    <div className="bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl overflow-hidden shadow-[var(--app-card-shadow)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--app-divider)] bg-[var(--app-bg-soft)]">
            <h3 className="font-['Sora',sans-serif] text-xs font-bold uppercase tracking-[0.07em] text-[var(--app-text-soft)]">{title}</h3>
            {action}
        </div>
        <div className="p-4 space-y-3">{children}</div>
    </div>
);

export const MetricTile: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
    <div className="bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-2xl px-4 py-3 min-w-[120px] shadow-[var(--app-card-shadow)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)]">{label}</p>
        <p className="font-['Sora',sans-serif] text-lg font-bold text-[var(--app-text)] mt-0.5 tabular-nums">{value}</p>
        {hint && <p className="text-[10px] text-[var(--app-text-muted)] mt-0.5">{hint}</p>}
    </div>
);
