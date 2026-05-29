import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task } from '../types/Task';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';
import TaskCard from '../components/TaskCard';
import AddTaskModal from '../components/AddTaskModal';
import {
  getTasks,
  addTask,
  updateTask,
  deleteTask,
} from '../services/StorageService';
import {
  scheduleTaskNotifications,
  cancelTaskNotification,
} from '../services/NotificationService';

interface Props {
  navigation: any;
}

type FilterTab = 'all' | 'upcoming' | 'completed';

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    const stored = await getTasks();
    setTasks(stored);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleSave = useCallback(async (task: Task) => {
    // Cancel old notifications if editing
    if (editTask) {
      await cancelTaskNotification(task.id);
    }
    // Schedule reminder + alarm notifications
    await scheduleTaskNotifications(task);

    let updated: Task[];
    if (editTask) {
      updated = await updateTask(task);
    } else {
      updated = await addTask(task);
    }
    setTasks(updated);
    setEditTask(null);
  }, [editTask]);

  const handleComplete = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const toggled = { ...task, completed: !task.completed };
    if (toggled.completed) {
      await cancelTaskNotification(id);
    } else {
      await scheduleTaskNotifications(toggled);
    }
    const updated = await updateTask(toggled);
    setTasks(updated);
  }, [tasks]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelTaskNotification(id);
          const updated = await deleteTask(id);
          setTasks(updated);
        },
      },
    ]);
  }, []);

  const handlePressTask = useCallback((task: Task) => {
    setEditTask(task);
    setShowModal(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, [loadTasks]);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const stats = {
    total: tasks.length,
    upcoming: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
          <Text style={styles.headerTitle}>My Tasks</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardAccent]}>
          <Text style={[styles.statNum, styles.statNumAccent]}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: Colors.success }]}>
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {(['all', 'upcoming', 'completed'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}>
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onComplete={handleComplete}
            onDelete={handleDelete}
            onPress={handlePressTask}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>
              {filter === 'completed' ? '🎉' : '📝'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'completed'
                ? 'Nothing completed yet'
                : 'No tasks yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'completed'
                ? 'Complete some tasks to see them here'
                : 'Tap the + button to add your first task'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + Spacing.xl }]}
        onPress={() => {
          setEditTask(null);
          setShowModal(true);
        }}
        activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddTaskModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTask(null);
        }}
        onSave={handleSave}
        editTask={editTask}
      />
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsIcon: {
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardAccent: {
    borderColor: Colors.primaryDark,
    backgroundColor: Colors.bgCardAlt,
  },
  statNum: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statNumAccent: {
    color: Colors.primaryLight,
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    lineHeight: 36,
    fontWeight: '300',
  },
});
