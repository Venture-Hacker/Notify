import { Task } from '../types/Task';
import { AppSettings, AUTO_DELETE_RANGES } from '../types/Settings';
import { getTasks, deleteTasks } from './StorageService';
import { cancelTaskNotification } from './NotificationService';

export async function runAutoDelete(settings: AppSettings): Promise<string[]> {
  if (!settings.autoDeleteEnabled) return [];

  const tasks = await getTasks();
  const now = Date.now();

  // Calculate cutoff time
  let cutoffMs: number | null = null;

  if (settings.autoDeleteRange === 'custom' && settings.autoDeleteCustomDate) {
    cutoffMs = new Date(settings.autoDeleteCustomDate).getTime();
  } else {
    const rangeOption = AUTO_DELETE_RANGES.find(r => r.value === settings.autoDeleteRange);
    if (rangeOption?.ms) {
      cutoffMs = now - rangeOption.ms;
    }
  }

  if (cutoffMs === null) return [];

  // Filter tasks to delete
  const toDelete = tasks.filter(task => {
    const taskDate = new Date(task.dueDate || task.createdAt).getTime();
    if (taskDate > cutoffMs!) return false; // not old enough

    switch (settings.autoDeleteTarget) {
      case 'completed_only':
        return task.completed;
      case 'past_due':
        return new Date(task.dueDate).getTime() < now;
      case 'all':
        return true;
      default:
        return false;
    }
  });

  if (toDelete.length === 0) return [];

  // Cancel notifications for deleted tasks
  await Promise.all(toDelete.map(t => cancelTaskNotification(t.id)));

  // Delete from storage
  const deletedIds = toDelete.map(t => t.id);
  await deleteTasks(deletedIds);

  return deletedIds;
}

export function getAutoDeleteLabel(settings: AppSettings): string {
  if (!settings.autoDeleteEnabled) return 'Off';
  if (settings.autoDeleteRange === 'custom' && settings.autoDeleteCustomDate) {
    const d = new Date(settings.autoDeleteCustomDate);
    return `Before ${d.toLocaleDateString()}`;
  }
  const opt = AUTO_DELETE_RANGES.find(r => r.value === settings.autoDeleteRange);
  return `After ${opt?.label ?? '—'}`;
}
