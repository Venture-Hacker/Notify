export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO string

  // ── Reminder: notification (system default sound) ────────────────
  // Fires a standard notification with system sound before due date
  reminderOffset: number | null; // ms before due date; null = disabled

  // ── Alarm: loud ring ───────────────────────────────────────
  // Fires a loud alarm at a separately configured time
  alarmEnabled: boolean;
  alarmOffset: number | null;     // ms before due date (preset options)
  alarmCustomTime: string | null; // ISO string – exact time user picks (custom mode)
  alarmSound: AlarmSound;

  completed: boolean;
  createdAt: string; // ISO string
  reminderNotificationId?: string;
  alarmNotificationId?: string;
}

export type AlarmSoundId =
  | 'default'
  | 'argon'
  | 'helium'
  | 'carbon'
  | 'krypton'
  | 'neon'
  | 'oxygen'
  | 'custom'
  | 'storage'; // user-picked file from device storage

export interface AlarmSound {
  id: AlarmSoundId;
  name: string;
  uri?: string; // content URI for 'storage' type
}

export const DEFAULT_ALARM_SOUNDS: AlarmSound[] = [
  { id: 'default', name: 'Default Alarm' },
  { id: 'argon',   name: 'Argon' },
  { id: 'helium',  name: 'Helium' },
  { id: 'carbon',  name: 'Carbon' },
  { id: 'krypton', name: 'Krypton' },
  { id: 'neon',    name: 'Neon' },
  { id: 'oxygen',  name: 'Oxygen' },
  { id: 'custom',  name: 'Notify Chime' },
  { id: 'storage', name: 'From Storage...' }, // user picks a file
];

// Notification sounds for Reminder (same system sounds, softer context)
export const NOTIFICATION_SOUNDS: AlarmSound[] = [
  { id: 'default', name: 'Default' },
  { id: 'argon',   name: 'Argon' },
  { id: 'helium',  name: 'Helium' },
  { id: 'carbon',  name: 'Carbon' },
  { id: 'krypton', name: 'Krypton' },
  { id: 'neon',    name: 'Neon' },
  { id: 'oxygen',  name: 'Oxygen' },
  { id: 'custom',  name: 'Notify Chime' },
];

// Reminder = silent notification options (relative to due date)
export const REMINDER_OPTIONS = [
  { label: '1 hr before',  value: 60 * 60 * 1000 },
  { label: '3 hrs before', value: 3 * 60 * 60 * 1000 },
  { label: '6 hrs before', value: 6 * 60 * 60 * 1000 },
  { label: '1 day before', value: 24 * 60 * 60 * 1000 },
  { label: '2 days before', value: 2 * 24 * 60 * 60 * 1000 },
  { label: 'Custom', value: -1 }, // user enters hours manually
];

// Alarm = loud ring options (relative to due date)
export const ALARM_OPTIONS = [
  { label: 'At due time',   value: 0 },
  { label: '30 min before', value: 30 * 60 * 1000 },
  { label: '1 hr before',   value: 60 * 60 * 1000 },
  { label: '2 hrs before',  value: 2 * 60 * 60 * 1000 },
  { label: '1 day before',  value: 24 * 60 * 60 * 1000 },
  { label: 'Custom time',   value: -1 }, // user picks exact date+time
];
