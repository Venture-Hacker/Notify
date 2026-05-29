export interface AppSettings {
  autoDeleteEnabled: boolean;
  autoDeleteRange: AutoDeleteRange;
  autoDeleteCustomDate: string | null; // ISO date string for cutoff
  autoDeleteTarget: AutoDeleteTarget;
}

export type AutoDeleteRange =
  | '1_month'
  | '2_months'
  | '3_months'
  | '6_months'
  | '1_year'
  | 'custom';

export type AutoDeleteTarget =
  | 'completed_only'
  | 'past_due'
  | 'all';

export const AUTO_DELETE_RANGES: { label: string; value: AutoDeleteRange; ms?: number }[] = [
  { label: '1 Month', value: '1_month', ms: 30 * 24 * 60 * 60 * 1000 },
  { label: '2 Months', value: '2_months', ms: 60 * 24 * 60 * 60 * 1000 },
  { label: '3 Months', value: '3_months', ms: 90 * 24 * 60 * 60 * 1000 },
  { label: '6 Months', value: '6_months', ms: 180 * 24 * 60 * 60 * 1000 },
  { label: '1 Year', value: '1_year', ms: 365 * 24 * 60 * 60 * 1000 },
  { label: 'Custom Date', value: 'custom' },
];

export const AUTO_DELETE_TARGETS: { label: string; value: AutoDeleteTarget }[] = [
  { label: 'Completed tasks only', value: 'completed_only' },
  { label: 'Past-due tasks', value: 'past_due' },
  { label: 'All old tasks', value: 'all' },
];

export const DEFAULT_SETTINGS: AppSettings = {
  autoDeleteEnabled: false,
  autoDeleteRange: '1_month',
  autoDeleteCustomDate: null,
  autoDeleteTarget: 'completed_only',
};
