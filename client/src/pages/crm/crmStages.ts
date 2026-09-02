import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { getCrmStages, CrmStageDto } from '../../api';

/**
 * Shared, cached CRM stage registry.
 * Stages are configurable (name, color, order) from the pipeline "Stages" manager;
 * every consumer stays in sync through the subscriber list below.
 */

export const FALLBACK_STAGES: CrmStageDto[] = [
    { _id: 'new-lead', name: 'New Lead', color: '#8A8177', order: 0, kind: 'open' },
    { _id: 'first-email', name: 'First Email Sent', color: '#2AA9C4', order: 1, kind: 'open' },
    { _id: 'meeting-scheduled', name: 'Meeting Scheduled', color: '#8B5CF6', order: 2, kind: 'open' },
    { _id: 'meeting-done', name: 'Meeting done', color: '#4C6FE7', order: 3, kind: 'open' },
    { _id: 'quotation-sent', name: 'Quotation sent', color: '#E8A23D', order: 4, kind: 'open' },
    { _id: 'in-negotiation', name: 'In negotiation', color: '#3B5BDB', order: 5, kind: 'open' },
    { _id: 'won', name: 'Won', color: '#1F8A4C', order: 6, kind: 'won' },
    { _id: 'lost', name: 'Lost', color: '#D84A5B', order: 7, kind: 'lost' },
];

let cache: CrmStageDto[] | null = null;
let inflight: Promise<CrmStageDto[]> | null = null;
const listeners = new Set<(stages: CrmStageDto[]) => void>();

const notify = (stages: CrmStageDto[]) => listeners.forEach(fn => fn(stages));

export const fetchCrmStages = async (force = false): Promise<CrmStageDto[]> => {
    if (cache && !force) return cache;
    if (inflight && !force) return inflight;
    inflight = getCrmStages()
        .then(res => {
            cache = Array.isArray(res.data) && res.data.length > 0 ? res.data : FALLBACK_STAGES;
            notify(cache);
            return cache;
        })
        .catch(() => {
            cache = cache || FALLBACK_STAGES;
            return cache;
        })
        .finally(() => { inflight = null; });
    return inflight;
};

export const refreshCrmStages = () => fetchCrmStages(true);

export const getStageColor = (name: string): string => {
    const list = cache || FALLBACK_STAGES;
    return list.find(s => s.name === name)?.color
        || FALLBACK_STAGES.find(s => s.name === name)?.color
        || '#8A8177';
};

/** Hook that returns the ordered stage list, kept in sync across the app. */
export function useCrmStages(): CrmStageDto[] {
    const [stages, setStages] = useState<CrmStageDto[]>(cache || FALLBACK_STAGES);
    useEffect(() => {
        let mounted = true;
        const listener = (next: CrmStageDto[]) => { if (mounted) setStages(next); };
        listeners.add(listener);
        fetchCrmStages().then(listener).catch(() => {});
        return () => { mounted = false; listeners.delete(listener); };
    }, []);
    return stages;
}

/** Inline styles derived from a stage hex color (works in light + dark theme). */
export const stageBadgeStyle = (color: string): CSSProperties => ({
    backgroundColor: `${color}1a`,
    color,
    borderColor: `${color}40`,
});

export const stageAccentStyle = (color: string): CSSProperties => ({
    borderLeftColor: color,
});

export const stageStripeStyle = (color: string): CSSProperties => ({
    backgroundColor: color,
});
