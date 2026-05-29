import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Task,
  AlarmSound,
  AlarmSoundId,
  REMINDER_OPTIONS,
  ALARM_OPTIONS,
  DEFAULT_ALARM_SOUNDS,
} from '../types/Task';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';
import AlarmSoundPicker from './AlarmSoundPicker';
// @ts-ignore
import uuid from 'react-native-uuid';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  editTask?: Task | null;
}

const DEFAULT_SOUND: AlarmSound = DEFAULT_ALARM_SOUNDS[0];

// ─── Helper to build a default due date (next hour, 0 min) ──────────────────
function defaultDueDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

export default function AddTaskModal({ visible, onClose, onSave, editTask }: Props) {
  // ── Basic fields ──────────────────────────────────────────────────────────
  const [title, setTitle] = useState(editTask?.title ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');

  // ── Due date ──────────────────────────────────────────────────────────────
  const [dueDate, setDueDate] = useState<Date>(
    editTask ? new Date(editTask.dueDate) : defaultDueDate(),
  );
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);

  // ── Reminder (notification — system default sound) ─────────────────
  const [reminderOffset, setReminderOffset] = useState<number | null>(
    editTask?.reminderOffset ?? null,
  );
  const [reminderCustomHours, setReminderCustomHours] = useState('24');
  const [isCustomReminder, setIsCustomReminder] = useState(false);

  // ── Alarm (loud ring) ────────────────────────────────────────────────────
  const [alarmEnabled, setAlarmEnabled] = useState(editTask?.alarmEnabled ?? false);
  const [alarmOffset, setAlarmOffset] = useState<number | null>(
    editTask?.alarmOffset ?? 0,
  );
  const [isCustomAlarm, setIsCustomAlarm] = useState(false);
  // Custom alarm date/time picker states
  const [alarmCustomDate, setAlarmCustomDate] = useState<Date>(
    editTask?.alarmCustomTime ? new Date(editTask.alarmCustomTime) : defaultDueDate(),
  );
  const [showAlarmDatePicker, setShowAlarmDatePicker] = useState(false);
  const [showAlarmTimePicker, setShowAlarmTimePicker] = useState(false);
  const [alarmSound, setAlarmSound] = useState<AlarmSound>(
    editTask?.alarmSound ?? DEFAULT_SOUND,
  );

  // ─────────────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setTitle('');
    setDescription('');
    setDueDate(defaultDueDate());
    setReminderOffset(null);
    setReminderCustomHours('24');
    setIsCustomReminder(false);
    setAlarmEnabled(false);
    setAlarmOffset(0);
    setIsCustomAlarm(false);
    setAlarmCustomDate(defaultDueDate());
    setAlarmSound(DEFAULT_SOUND);
  }, []);

  // Re-populate all fields whenever the modal opens or editTask changes
  useEffect(() => {
    if (visible && editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setDueDate(new Date(editTask.dueDate));
      setReminderOffset(editTask.reminderOffset);
      setIsCustomReminder(false);
      setReminderCustomHours('24');
      setAlarmEnabled(editTask.alarmEnabled);
      setAlarmOffset(editTask.alarmOffset ?? 0);
      setIsCustomAlarm(editTask.alarmOffset === -1);
      setAlarmCustomDate(
        editTask.alarmCustomTime ? new Date(editTask.alarmCustomTime) : defaultDueDate(),
      );
      setAlarmSound(editTask.alarmSound ?? DEFAULT_SOUND);
    } else if (visible && !editTask) {
      // Opening for a new task — reset to blank
      reset();
    }
  }, [visible, editTask, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a task title.');
      return;
    }

    // Resolve reminder offset
    let finalReminderOffset: number | null = reminderOffset;
    if (isCustomReminder) {
      const hrs = parseFloat(reminderCustomHours);
      if (isNaN(hrs) || hrs <= 0) {
        Alert.alert('Invalid reminder', 'Enter a valid number of hours.');
        return;
      }
      finalReminderOffset = Math.round(hrs * 60 * 60 * 1000);
    }

    // Resolve alarm offset / custom time
    let finalAlarmOffset: number | null = null;
    let finalAlarmCustomTime: string | null = null;
    if (alarmEnabled) {
      if (isCustomAlarm) {
        finalAlarmCustomTime = alarmCustomDate.toISOString();
        finalAlarmOffset = -1; // sentinel for "custom"
      } else {
        finalAlarmOffset = alarmOffset;
      }
    }

    const task: Task = {
      id: editTask?.id ?? (uuid.v4() as string),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate.toISOString(),

      reminderOffset: finalReminderOffset,

      alarmEnabled,
      alarmOffset: finalAlarmOffset,
      alarmCustomTime: finalAlarmCustomTime,
      alarmSound,

      completed: editTask?.completed ?? false,
      createdAt: editTask?.createdAt ?? new Date().toISOString(),
    };

    onSave(task);
    reset();
    onClose();
  }, [
    title, description, dueDate,
    reminderOffset, isCustomReminder, reminderCustomHours,
    alarmEnabled, alarmOffset, isCustomAlarm, alarmCustomDate, alarmSound,
    editTask, onSave, onClose, reset,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}>
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {editTask ? '✏️ Edit Task' : '✨ New Task'}
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">

              {/* ── Title ── */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What's the task?"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              {/* ── Notes ── */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Add details..."
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              </View>

              {/* ── Due Date & Time ── */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>📅 Due Date & Time</Text>
                <View style={styles.dateTimeRow}>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowDueDatePicker(true)}>
                    <Text style={styles.dateBtnText}>
                      {dueDate.toLocaleDateString([], {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateBtn, styles.timeBtnNarrow]}
                    onPress={() => setShowDueTimePicker(true)}>
                    <Text style={styles.dateBtnText}>
                      {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDueDatePicker && (
                <DateTimePicker
                  value={dueDate} mode="date" display="default"
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    setShowDueDatePicker(false);
                    if (d) {
                      const u = new Date(dueDate);
                      u.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                      setDueDate(u);
                    }
                  }}
                />
              )}
              {showDueTimePicker && (
                <DateTimePicker
                  value={dueDate} mode="time" display="default"
                  onChange={(_, d) => {
                    setShowDueTimePicker(false);
                    if (d) {
                      const u = new Date(dueDate);
                      u.setHours(d.getHours(), d.getMinutes());
                      setDueDate(u);
                    }
                  }}
                />
              )}

              {/* ════════════════════════════════════════════════════
                  SECTION A — REMINDER (silent notification)
                  ════════════════════════════════════════════════════ */}
              <View style={styles.sectionBox}>
                <View style={styles.sectionTitleRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Reminder</Text>
                  </View>
                </View>

                <ScrollView
                  horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipList}>
                  {/* No reminder option */}
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      reminderOffset === null && !isCustomReminder && styles.chipSelected,
                    ]}
                    onPress={() => { setIsCustomReminder(false); setReminderOffset(null); }}>
                    <Text style={[styles.chipText,
                    reminderOffset === null && !isCustomReminder && styles.chipTextSel]}>
                      Off
                    </Text>
                  </TouchableOpacity>

                  {REMINDER_OPTIONS.map(opt => {
                    const isCustomOpt = opt.value === -1;
                    const isSelected = isCustomOpt
                      ? isCustomReminder
                      : !isCustomReminder && reminderOffset === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => {
                          if (isCustomOpt) {
                            setIsCustomReminder(true);
                            setReminderOffset(null);
                          } else {
                            setIsCustomReminder(false);
                            setReminderOffset(opt.value);
                          }
                        }}>
                        <Text style={[styles.chipText, isSelected && styles.chipTextSel]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Custom reminder: enter hours */}
                {isCustomReminder && (
                  <View style={styles.customRow}>
                    <TextInput
                      style={styles.customInput}
                      placeholder="e.g. 36"
                      placeholderTextColor={Colors.textMuted}
                      value={reminderCustomHours}
                      onChangeText={setReminderCustomHours}
                      keyboardType="decimal-pad"
                      maxLength={6}
                    />
                    <Text style={styles.customUnit}>hours before due date</Text>
                  </View>
                )}

                {(reminderOffset !== null || isCustomReminder) && (() => {
                  const hrs = isCustomReminder
                    ? parseFloat(reminderCustomHours) || 0
                    : reminderOffset! / (60 * 60 * 1000);
                  const fireAt = new Date(dueDate.getTime() - hrs * 3600000);
                  return (
                    <View style={styles.previewBox}>
                      <Text style={styles.previewLabel}>📬 Notification at:</Text>
                      <Text style={styles.previewTime}>
                        {fireAt.toLocaleString([], {
                          weekday: 'short', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  );
                })()}
                {/* Notification sound picker removed — reminder uses system default sound */}
              </View>

              {/* ════════════════════════════════════════════════════
                  SECTION B — ALARM (loud ring)
                  ════════════════════════════════════════════════════ */}
              <View style={[styles.sectionBox, styles.sectionBoxAlarm]}>
                {/* Toggle */}
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionEmoji}>🔔</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Alarm</Text>
                    <Text style={styles.sectionSub}>
                      Loud alarm ring at a separate time
                    </Text>
                  </View>
                  <Switch
                    value={alarmEnabled}
                    onValueChange={v => setAlarmEnabled(v)}
                    trackColor={{ false: Colors.bgInput, true: Colors.primaryDark }}
                    thumbColor={alarmEnabled ? Colors.primary : Colors.textMuted}
                  />
                </View>

                {alarmEnabled && (
                  <>
                    {/* Alarm time presets */}
                    <ScrollView
                      horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipList}>
                      {ALARM_OPTIONS.map(opt => {
                        const isCustomOpt = opt.value === -1;
                        const isSelected = isCustomOpt
                          ? isCustomAlarm
                          : !isCustomAlarm && alarmOffset === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.label}
                            style={[styles.chip, styles.chipAlarm,
                            isSelected && styles.chipAlarmSelected]}
                            onPress={() => {
                              if (isCustomOpt) {
                                setIsCustomAlarm(true);
                                setAlarmOffset(null);
                              } else {
                                setIsCustomAlarm(false);
                                setAlarmOffset(opt.value);
                              }
                            }}>
                            <Text style={[styles.chipText,
                            isSelected && styles.chipTextAlarmSel]}>
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Custom alarm: exact date + time picker */}
                    {isCustomAlarm && (
                      <View style={styles.customAlarmBox}>
                        <Text style={styles.fieldLabel}>Pick exact alarm time</Text>
                        <View style={styles.dateTimeRow}>
                          <TouchableOpacity
                            style={styles.dateBtn}
                            onPress={() => setShowAlarmDatePicker(true)}>
                            <Text style={styles.dateBtnText}>
                              {alarmCustomDate.toLocaleDateString([], {
                                weekday: 'short', month: 'short', day: 'numeric',
                              })}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.dateBtn, styles.timeBtnNarrow]}
                            onPress={() => setShowAlarmTimePicker(true)}>
                            <Text style={styles.dateBtnText}>
                              {alarmCustomDate.toLocaleTimeString([], {
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {showAlarmDatePicker && (
                      <DateTimePicker
                        value={alarmCustomDate} mode="date" display="default"
                        minimumDate={new Date()}
                        onChange={(_, d) => {
                          setShowAlarmDatePicker(false);
                          if (d) {
                            const u = new Date(alarmCustomDate);
                            u.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                            setAlarmCustomDate(u);
                          }
                        }}
                      />
                    )}
                    {showAlarmTimePicker && (
                      <DateTimePicker
                        value={alarmCustomDate} mode="time" display="default"
                        onChange={(_, d) => {
                          setShowAlarmTimePicker(false);
                          if (d) {
                            const u = new Date(alarmCustomDate);
                            u.setHours(d.getHours(), d.getMinutes());
                            setAlarmCustomDate(u);
                          }
                        }}
                      />
                    )}

                    {/* Preview alarm fire time */}
                    {(() => {
                      let fireAt: Date | null = null;
                      if (isCustomAlarm) {
                        fireAt = alarmCustomDate;
                      } else if (alarmOffset !== null) {
                        fireAt = new Date(dueDate.getTime() - alarmOffset);
                      }
                      if (!fireAt) return null;
                      return (
                        <View style={[styles.previewBox, styles.previewBoxAlarm]}>
                          <Text style={styles.previewLabelAlarm}>🔔 Alarm rings at:</Text>
                          <Text style={styles.previewTimeAlarm}>
                            {fireAt.toLocaleString([], {
                              weekday: 'short', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      );
                    })()}

                    {/* Sound picker */}
                    <View style={{ marginTop: Spacing.md }}>
                      <AlarmSoundPicker
                        selected={alarmSound.id as AlarmSoundId}
                        selectedUri={alarmSound.uri}
                        onSelect={setAlarmSound}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Save button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editTask ? 'Update Task' : 'Add Task'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: Spacing.xxl }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  kav: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bgModal,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '94%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.md,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  timeBtnNarrow: {
    flex: 0,
    minWidth: 100,
  },
  dateBtnText: {
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
  },

  // ── Section boxes ──────────────────────────────────────────
  sectionBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  sectionBoxAlarm: {
    borderColor: Colors.primaryDark,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionEmoji: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },

  // ── Chips ──────────────────────────────────────────────────
  chipList: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  chipAlarm: {
    borderColor: Colors.borderLight,
  },
  chipAlarmSelected: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(192, 132, 252, 0.18)',
  },
  chipText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSel: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  chipTextAlarmSel: {
    color: Colors.accent,
    fontWeight: '700',
  },

  // ── Custom inputs ──────────────────────────────────────────
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  customInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: Fonts.sizes.md,
    width: 100,
    textAlign: 'center',
  },
  customUnit: {
    color: Colors.textSecondary,
    fontSize: Fonts.sizes.sm,
  },
  customAlarmBox: {
    gap: Spacing.sm,
  },

  // ── Preview boxes ──────────────────────────────────────────
  previewBox: {
    backgroundColor: 'rgba(124, 92, 252, 0.1)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  previewBoxAlarm: {
    backgroundColor: 'rgba(192, 132, 252, 0.1)',
    borderColor: Colors.accent,
  },
  previewLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  previewLabelAlarm: {
    fontSize: Fonts.sizes.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  previewTime: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  previewTimeAlarm: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // ── Save button ────────────────────────────────────────────
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
