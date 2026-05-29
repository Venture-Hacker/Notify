import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { AlarmSound, AlarmSoundId, DEFAULT_ALARM_SOUNDS } from '../types/Task';
import { Colors, Spacing, Radius, Fonts } from '../theme/colors';

interface Props {
  selected: AlarmSoundId;
  selectedUri?: string;           // current URI when storage mode is active
  onSelect: (sound: AlarmSound) => void;
  label?: string;
}

const SOUND_ICONS: Record<AlarmSoundId, string> = {
  default: '🔔',
  argon:   '💠',
  helium:  '🫧',
  carbon:  '⚫',
  krypton: '🟣',
  neon:    '🟢',
  oxygen:  '🔵',
  custom:  '✨',
  storage: '📁',
};

export default function AlarmSoundPicker({
  selected,
  selectedUri,
  onSelect,
  label = 'Alarm Sound',
}: Props) {
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);

  async function handlePickFile() {
    try {
      const results = await pick({
        type: [types.audio],
      });

      const result = results[0];
      if (!result) return;

      const uri = result.uri;
      const name = result.name ?? 'Custom Sound';
      setPickedFileName(name);

      onSelect({
        id: 'storage',
        name: name,
        uri: uri ?? undefined,
      });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        // User cancelled — do nothing
        return;
      }
      Alert.alert('Error', 'Could not pick audio file. Please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}>
        {DEFAULT_ALARM_SOUNDS.map(sound => {
          const isSelected = sound.id === selected;
          const isStorage = sound.id === 'storage';

          return (
            <TouchableOpacity
              key={sound.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                if (isStorage) {
                  handlePickFile();
                } else {
                  onSelect(sound);
                }
              }}
              activeOpacity={0.7}>
              <Text style={styles.icon}>{SOUND_ICONS[sound.id]}</Text>

              {/* Show picked filename if storage is selected */}
              <Text
                style={[styles.chipText, isSelected && styles.chipTextSelected]}
                numberOfLines={1}>
                {isStorage && isSelected && pickedFileName
                  ? pickedFileName
                  : sound.name}
              </Text>

              {/* Re-pick button when storage is already chosen */}
              {isStorage && isSelected && (
                <Text style={styles.rePick}>↺</Text>
              )}

              {isSelected && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Show full file path hint when a storage file is selected */}
      {selected === 'storage' && (selectedUri || pickedFileName) && (
        <View style={styles.fileHint}>
          <Text style={styles.fileHintText} numberOfLines={1}>
            🎵 {pickedFileName ?? 'Custom audio file selected'}
          </Text>
          <TouchableOpacity onPress={handlePickFile}>
            <Text style={styles.changeBtn}>Change</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  list: {
    paddingRight: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 72,
    maxWidth: 110,
    gap: 4,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  icon: {
    fontSize: 20,
  },
  chipText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  rePick: {
    fontSize: 12,
    color: Colors.primaryLight,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  fileHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  fileHintText: {
    flex: 1,
    fontSize: Fonts.sizes.xs,
    color: Colors.primaryLight,
  },
  changeBtn: {
    fontSize: Fonts.sizes.xs,
    color: Colors.accent,
    fontWeight: '700',
  },
});
