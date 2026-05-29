import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Task } from '../types/Task';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (task: Task) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

  if (days === 0) return `Today at ${timeStr}`;
  if (days === 1) return `Tomorrow at ${timeStr}`;
  if (days === -1) return `Yesterday at ${timeStr}`;
  if (days < 0) return `${dateStr} (Overdue)`;
  return `${dateStr} at ${timeStr}`;
}

function offsetLabel(ms: number | null): string {
  if (ms === null || ms < 0) return '';
  if (ms === 0) return 'at due time';
  const h = ms / (1000 * 60 * 60);
  if (h < 1) return `${Math.round(ms / 60000)}m before`;
  if (h < 24) return `${h % 1 === 0 ? h : h.toFixed(1)}h before`;
  const d = h / 24;
  return `${d % 1 === 0 ? d : d.toFixed(1)} day${d !== 1 ? 's' : ''} before`;
}

export default function TaskCard({ task, onComplete, onDelete, onPress }: Props) {
  const isOverdue =
    !task.completed && new Date(task.dueDate).getTime() < Date.now();

  return (
    <TouchableOpacity
      style={[styles.card, task.completed && styles.cardCompleted]}
      onPress={() => onPress(task)}
      activeOpacity={0.75}>
      {/* Left accent bar */}
      <View
        style={[
          styles.accentBar,
          task.completed && styles.accentBarDone,
          isOverdue && styles.accentBarOverdue,
        ]}
      />

      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              task.completed && styles.titleDone,
            ]}
            numberOfLines={1}>
            {task.title}
          </Text>
          {task.alarmEnabled && (
            <Text style={styles.alarmBadge}>🔔</Text>
          )}
        </View>

        {/* Description */}
        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}

        {/* Footer row */}
        <View style={styles.footer}>
          <View style={styles.dateRow}>
            <Text style={[styles.dateText, isOverdue && styles.dateOverdue]}>
              {isOverdue ? '⚠ ' : '📅 '}
              {formatDate(task.dueDate)}
            </Text>
            {task.reminderOffset !== null && (
              <View style={styles.reminderBadge}>
                <Text style={styles.reminderText}>
                  🎗️ {offsetLabel(task.reminderOffset)}
                </Text>
              </View>
            )}
            {task.alarmEnabled && (
              <View style={styles.alarmBadgeInline}>
                <Text style={styles.alarmBadgeText}>
                  🔔 alarm {task.alarmCustomTime
                    ? new Date(task.alarmCustomTime).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : offsetLabel(task.alarmOffset)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onComplete(task.id)}
              style={[
                styles.actionBtn,
                task.completed ? styles.actionBtnDone : styles.actionBtnCheck,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.actionIcon}>
                {task.completed ? '↩' : '✓'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(task.id)}
              style={[styles.actionBtn, styles.actionBtnDelete]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.actionIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    elevation: 3,
  },
  cardCompleted: {
    opacity: 0.55,
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.primary,
  },
  accentBarDone: {
    backgroundColor: Colors.success,
  },
  accentBarOverdue: {
    backgroundColor: Colors.danger,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  alarmBadge: {
    fontSize: 14,
  },
  description: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dateRow: {
    flex: 1,
    gap: Spacing.xs,
  },
  dateText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
  },
  dateOverdue: {
    color: Colors.danger,
  },
  reminderBadge: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  reminderText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primaryLight,
  },
  alarmBadgeInline: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  alarmBadgeText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnCheck: {
    backgroundColor: Colors.successBg,
  },
  actionBtnDone: {
    backgroundColor: Colors.bgInput,
  },
  actionBtnDelete: {
    backgroundColor: Colors.dangerBg,
  },
  actionIcon: {
    fontSize: 14,
  },
});
