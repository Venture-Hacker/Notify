import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/Task';
import { AppSettings, DEFAULT_SETTINGS } from '../types/Settings';

const TASKS_KEY = '@notify_tasks';
const SETTINGS_KEY = '@notify_settings';

// ─── Tasks ─────────────────────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export async function addTask(task: Task): Promise<Task[]> {
  const tasks = await getTasks();
  const updated = [task, ...tasks];
  await saveTasks(updated);
  return updated;
}

export async function updateTask(updated: Task): Promise<Task[]> {
  const tasks = await getTasks();
  const next = tasks.map(t => (t.id === updated.id ? updated : t));
  await saveTasks(next);
  return next;
}

export async function deleteTask(id: string): Promise<Task[]> {
  const tasks = await getTasks();
  const next = tasks.filter(t => t.id !== id);
  await saveTasks(next);
  return next;
}

export async function deleteTasks(ids: string[]): Promise<Task[]> {
  const tasks = await getTasks();
  const next = tasks.filter(t => !ids.includes(t.id));
  await saveTasks(next);
  return next;
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
