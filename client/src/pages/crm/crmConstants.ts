export const DEAL_STAGES = [
    'New Lead',
    'First Email Sent',
    'Meeting Scheduled',
    'Meeting done',
    'Quotation sent',
    'In negotiation',
    'Won',
    'Lost',
] as const;

export type DealStage = typeof DEAL_STAGES[number];

/** Badge styles for stage pills */
export const STAGE_COLORS: Record<string, string> = {
    'New Lead': 'bg-[#8A8177]/10 text-[#6B6258] border-[#8A8177]/20',
    'First Email Sent': 'bg-[#2AA9C4]/10 text-[#21859A] border-[#2AA9C4]/20',
    'Meeting Scheduled': 'bg-[#8B5CF6]/10 text-[#7450C5] border-[#8B5CF6]/20',
    'Meeting done': 'bg-[#4C6FE7]/10 text-[#3F5DC2] border-[#4C6FE7]/20',
    'Quotation sent': 'bg-[#E8A23D]/10 text-[#A86F18] border-[#E8A23D]/20',
    'In negotiation': 'bg-[#D9642F]/10 text-[#B94F21] border-[#D9642F]/20',
    'Won': 'bg-[#1F8A4C]/10 text-[#1F8A4C] border-[#1F8A4C]/20',
    'Lost': 'bg-[#D84A5B]/10 text-[#B83A4A] border-[#D84A5B]/20',
};

/** Left accent bar on pipeline cards */
export const STAGE_ACCENT: Record<string, string> = {
    'New Lead': 'border-l-[#8A8177]',
    'First Email Sent': 'border-l-[#2AA9C4]',
    'Meeting Scheduled': 'border-l-[#8B5CF6]',
    'Meeting done': 'border-l-[#4C6FE7]',
    'Quotation sent': 'border-l-[#E8A23D]',
    'In negotiation': 'border-l-[#D9642F]',
    'Won': 'border-l-[#1F8A4C]',
    'Lost': 'border-l-[#D84A5B]',
};

/** Column header top stripe */
export const STAGE_HEADER: Record<string, string> = {
    'New Lead': 'bg-[#8A8177]',
    'First Email Sent': 'bg-[#2AA9C4]',
    'Meeting Scheduled': 'bg-[#8B5CF6]',
    'Meeting done': 'bg-[#4C6FE7]',
    'Quotation sent': 'bg-[#E8A23D]',
    'In negotiation': 'bg-[#D9642F]',
    'Won': 'bg-[#1F8A4C]',
    'Lost': 'bg-[#D84A5B]',
};

export const TASK_TYPES = ['To do', 'Call', 'Email', 'Meeting', 'Follow Up'] as const;

export const CRM_INPUT =
    'w-full px-3 py-2 text-sm text-[var(--app-text)] bg-[var(--app-input-bg)] border border-[var(--app-card-border)] rounded-[11px] placeholder:text-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-active-soft)] focus:border-[var(--app-accent)] transition-colors';

export const CRM_LABEL = 'block text-[11px] font-bold uppercase tracking-[0.07em] text-[var(--app-text-muted)] mb-1.5';

export const CRM_BTN_PRIMARY =
    'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold font-[Sora] text-white nebula-accent-gradient rounded-[11px] shadow-lg hover:brightness-105 disabled:opacity-50 transition-all';

export const CRM_BTN_SECONDARY =
    'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--app-text-soft)] bg-[var(--app-card-bg)] border border-[var(--app-card-border)] rounded-[11px] hover:bg-[var(--app-hover)] disabled:opacity-50 transition-colors';
