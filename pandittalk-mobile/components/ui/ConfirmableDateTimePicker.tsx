import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BLOG_CARD_BORDER, GOLD, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';

type Mode = 'date' | 'time';

type Props = {
  visible: boolean;
  value: Date;
  mode: Mode;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  title?: string;
};

/**
 * Android: system dialog (`display="default"`), commit on set / dismiss on cancel.
 * iOS: spinner in a bottom sheet; commit only on Done (#64).
 */
export function ConfirmableDateTimePicker({
  visible,
  value,
  mode,
  onConfirm,
  onCancel,
  maximumDate,
  minimumDate,
  title,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onChange={(event, date) => {
          if (event.type === 'dismissed' || !date) {
            onCancel();
            return;
          }
          onConfirm(date);
        }}
      />
    );
  }

  const heading = title ?? (mode === 'date' ? 'Select date' : 'Select time');

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[styles.sheet, { paddingBottom: 24 + Math.max(insets.bottom, 0) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.toolbar}>
            <TouchableOpacity onPress={onCancel} hitSlop={12} accessibilityRole="button">
              <Text style={styles.toolbarBtn}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.toolbarTitle}>{heading}</Text>
            <TouchableOpacity
              onPress={() => onConfirm(draft)}
              hitSlop={12}
              accessibilityRole="button"
            >
              <Text style={[styles.toolbarBtn, styles.toolbarDone]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={draft}
            mode={mode}
            display="spinner"
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            onChange={(_, date) => {
              if (date) setDraft(date);
            }}
            style={styles.spinner}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderColor: BLOG_CARD_BORDER,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
  },
  toolbarTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
  },
  toolbarBtn: {
    fontSize: 16,
    color: TEXT_PRIMARY_DARK,
    minWidth: 64,
  },
  toolbarDone: {
    color: GOLD,
    fontWeight: '700',
    textAlign: 'right',
  },
  spinner: {
    alignSelf: 'stretch',
  },
});
