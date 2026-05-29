import notifee, {
  AndroidImportance,
  AndroidVisibility,
  TriggerType,
  AndroidCategory,
  EventType,
} from '@notifee/react-native';
import { Task, AlarmSoundId } from '../types/Task';

const CHANNEL_ID_REMINDER = 'notify_reminder';
const CHANNEL_ID_ALARM = 'notify_alarm';

// Maps preset sound IDs to Android res/raw names
const SOUND_MAP: Record<Exclude<AlarmSoundId, 'storage'>, string | undefined> = {
  default: undefined, // uses system default
  argon:   'Argon',
  helium:  'Helium',
  carbon:  'Carbon',
  krypton: 'Krypton',
  neon:    'Neon',
  oxygen:  'Oxygen',
  custom:  'notify_alarm', // bundled in res/raw/notify_alarm.wav
};

// Simple djb2 hash — produces a short stable string from any input (no Node.js Buffer needed)
function shortHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // keep it 32-bit
  }
  return Math.abs(hash).toString(36); // base36 → compact alphanumeric
}

// Returns the channel ID to use for an alarm, creating a custom channel if needed
async function getAlarmChannelId(soundId: AlarmSoundId, soundUri?: string): Promise<string> {
  if (soundId === 'storage' && soundUri) {
    // Unique channel per URI so Android plays the picked file
    const channelId = `notify_alarm_storage_${shortHash(soundUri)}`;
    await notifee.createChannel({
      id: channelId,
      name: 'Alarms (Custom)',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      vibration: true,
      sound: soundUri, // Android accepts content:// URIs here
    });
    return channelId;
  }
  return CHANNEL_ID_ALARM;
}

export async function bootstrapNotifications(): Promise<void> {
  await notifee.requestPermission();

  // Reminder channel — plays notification sound
  await notifee.createChannel({
    id: CHANNEL_ID_REMINDER,
    name: 'Task Reminders',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
  });

  // Alarm channel — max importance, loud sound
  await notifee.createChannel({
    id: CHANNEL_ID_ALARM,
    name: 'Alarms',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: 'notify_alarm',
  });
}

// ─── Schedule reminder (silent notification) ───────────────────────────────
export async function scheduleReminderNotification(task: Task): Promise<string | null> {
  if (task.reminderOffset === null) return null;

  const dueTime = new Date(task.dueDate).getTime();
  const fireAt = dueTime - task.reminderOffset;

  if (fireAt <= Date.now()) return null;

  const id = `reminder_${task.id}`;

  await notifee.createTriggerNotification(
    {
      id,
      title: `📅 Reminder: ${task.title}`,
      body: task.description
        ? task.description
        : `Due ${formatRelative(new Date(task.dueDate))}`,
      android: {
        channelId: CHANNEL_ID_REMINDER,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        pressAction: { id: 'default', launchActivity: 'default' },
        // No explicit sound = Android uses the system default notification tone
        vibrationPattern: [100, 300],
        color: '#7C5CFC',
        smallIcon: 'ic_notification',
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt,
      alarmManager: { allowWhileIdle: true },
    },
  );

  return id;
}

// ─── Schedule alarm (loud ring) ─────────────────────────────────────────────
export async function scheduleAlarmNotification(task: Task): Promise<string | null> {
  if (!task.alarmEnabled) return null;

  const dueTime = new Date(task.dueDate).getTime();

  // Determine alarm fire time
  let fireAt: number;
  if (task.alarmOffset === -1 && task.alarmCustomTime) {
    // Custom exact time
    fireAt = new Date(task.alarmCustomTime).getTime();
  } else if (task.alarmOffset !== null) {
    fireAt = dueTime - task.alarmOffset;
  } else {
    return null;
  }

  if (fireAt <= Date.now()) return null;

  const soundId = task.alarmSound?.id ?? 'default';
  // For 'storage', the sound is baked into the channel — don't set it per-notification
  const soundName = soundId === 'storage'
    ? undefined
    : SOUND_MAP[soundId as Exclude<AlarmSoundId, 'storage'>];
  const channelId = await getAlarmChannelId(soundId, task.alarmSound?.uri);
  const id = `alarm_${task.id}`;

  await notifee.createTriggerNotification(
    {
      id,
      title: `🔔 ALARM: ${task.title}`,
      body: task.description
        ? task.description
        : `Due ${formatRelative(new Date(task.dueDate))}`,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        fullScreenAction: { id: 'default', launchActivity: 'default' },
        pressAction: { id: 'default', launchActivity: 'default' },
        sound: soundName,
        vibrationPattern: [100, 500, 200, 500, 200, 500],
        color: '#C084FC',
        smallIcon: 'ic_notification',
        showTimestamp: true,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt,
      alarmManager: { allowWhileIdle: true },
    },
  );

  return id;
}

// ─── Schedule both for a task ────────────────────────────────────────────────
export async function scheduleTaskNotifications(task: Task): Promise<void> {
  await scheduleReminderNotification(task);
  await scheduleAlarmNotification(task);
}

// ─── Cancel ─────────────────────────────────────────────────────────────────
export async function cancelTaskNotification(taskId: string): Promise<void> {
  try { await notifee.cancelNotification(`reminder_${taskId}`); } catch { }
  try { await notifee.cancelNotification(`alarm_${taskId}`); } catch { }
}

export async function cancelAllNotifications(): Promise<void> {
  await notifee.cancelAllNotifications();
}

export function registerBackgroundHandler(): void {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.DISMISSED || type === EventType.ACTION_PRESS) {
      if (detail.notification?.id) {
        await notifee.cancelNotification(detail.notification.id);
      }
    }
  });
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function formatRelative(date: Date): string {
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
