import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AppSettings,
  AutoDeleteRange,
  AutoDeleteTarget,
  AUTO_DELETE_RANGES,
  AUTO_DELETE_TARGETS,
  DEFAULT_SETTINGS,
} from '../types/Settings';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';
import { getSettings, saveSettings } from '../services/StorageService';
import { runAutoDelete, getAutoDeleteLabel } from '../services/AutoDeleteService';

interface Props {
  navigation: any;
}

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
    },
    [settings],
  );

  const handleRunNow = useCallback(async () => {
    setSaving(true);
    try {
      const deleted = await runAutoDelete(settings);
      Alert.alert(
        'Auto-Delete Complete',
        deleted.length > 0
          ? `Deleted ${deleted.length} task${deleted.length > 1 ? 's' : ''}.`
          : 'No tasks matched the criteria.',
      );
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to defaults. Tasks will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSettings(DEFAULT_SETTINGS);
            await saveSettings(DEFAULT_SETTINGS);
          },
        },
      ],
    );
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xxl },
        ]}>

        {/* ─── Auto-Delete Section ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🗑️</Text>
            <View>
              <Text style={styles.sectionTitle}>Auto-Delete</Text>
              <Text style={styles.sectionSub}>
                {getAutoDeleteLabel(settings)}
              </Text>
            </View>
          </View>

          {/* Toggle */}
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>Enable Auto-Delete</Text>
              <Text style={styles.rowSub}>
                Automatically remove old tasks on startup
              </Text>
            </View>
            <Switch
              value={settings.autoDeleteEnabled}
              onValueChange={v => update({ autoDeleteEnabled: v })}
              trackColor={{ false: Colors.bgInput, true: Colors.primaryDark }}
              thumbColor={settings.autoDeleteEnabled ? Colors.primary : Colors.textMuted}
            />
          </View>

          {settings.autoDeleteEnabled && (
            <>
              {/* Delete range */}
              <View style={styles.subSection}>
                <Text style={styles.subSectionLabel}>Delete tasks older than</Text>
                {AUTO_DELETE_RANGES.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionRow,
                      settings.autoDeleteRange === opt.value && styles.optionRowActive,
                    ]}
                    onPress={() => {
                      update({ autoDeleteRange: opt.value as AutoDeleteRange });
                      if (opt.value === 'custom') {
                        setShowCustomDatePicker(true);
                      }
                    }}>
                    <View style={[
                      styles.radio,
                      settings.autoDeleteRange === opt.value && styles.radioActive,
                    ]}>
                      {settings.autoDeleteRange === opt.value && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      settings.autoDeleteRange === opt.value && styles.optionTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                    {opt.value === 'custom' && settings.autoDeleteCustomDate && (
                      <Text style={styles.optionDetail}>
                        {new Date(settings.autoDeleteCustomDate).toLocaleDateString()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}

                {showCustomDatePicker && (
                  <DateTimePicker
                    value={
                      settings.autoDeleteCustomDate
                        ? new Date(settings.autoDeleteCustomDate)
                        : new Date()
                    }
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                      setShowCustomDatePicker(false);
                      if (date) {
                        update({
                          autoDeleteRange: 'custom',
                          autoDeleteCustomDate: date.toISOString(),
                        });
                      }
                    }}
                  />
                )}
              </View>

              {/* Target */}
              <View style={styles.subSection}>
                <Text style={styles.subSectionLabel}>Apply to</Text>
                {AUTO_DELETE_TARGETS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionRow,
                      settings.autoDeleteTarget === opt.value && styles.optionRowActive,
                    ]}
                    onPress={() =>
                      update({ autoDeleteTarget: opt.value as AutoDeleteTarget })
                    }>
                    <View style={[
                      styles.radio,
                      settings.autoDeleteTarget === opt.value && styles.radioActive,
                    ]}>
                      {settings.autoDeleteTarget === opt.value && (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      settings.autoDeleteTarget === opt.value && styles.optionTextActive,
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Run now button */}
              <TouchableOpacity
                style={styles.runNowBtn}
                onPress={handleRunNow}
                disabled={saving}>
                <Text style={styles.runNowText}>
                  {saving ? 'Cleaning...' : '🧹 Run Auto-Delete Now'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ─── About Section ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>ℹ️</Text>
            <View>
              <Text style={styles.sectionTitle}>About</Text>
            </View>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Notify</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDesc}>
              A smart task reminder with local alarms and auto-cleanup.
            </Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetSettings}>
          <Text style={styles.resetBtnText}>Reset All Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.md,
  },
  backIcon: {
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 30,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCardAlt,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  rowInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  rowTitle: {
    fontSize: Fonts.sizes.md,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  rowSub: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  subSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  subSectionLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  optionRowActive: {},
  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.textSecondary,
  },
  optionTextActive: {
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  optionDetail: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primaryLight,
  },
  runNowBtn: {
    margin: Spacing.lg,
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryDark,
  },
  runNowText: {
    color: Colors.primaryLight,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  aboutCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  appName: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 2,
  },
  appVersion: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  appDesc: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resetBtn: {
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.danger,
    marginTop: Spacing.sm,
  },
  resetBtnText: {
    color: Colors.danger,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
});
