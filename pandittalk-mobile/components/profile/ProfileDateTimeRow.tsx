import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { GOLD } from '../../constants/Colors';
import {
  formatDateLabel,
  formatTimeLabel,
  toDateInputValue,
  toTimeInputValue,
} from '../../lib/profileUtils';
import { ConfirmableDateTimePicker } from '../ui/ConfirmableDateTimePicker';
import { profileFormStyles as styles } from './profileFormStyles';

type DateTimeRowProps = {
  label: string;
  value: string;
  icon: 'calendar' | 'time-outline';
  onPress?: () => void;
  disabled?: boolean;
  webInput?: React.ReactNode;
};

function DateTimeRow({
  label,
  value,
  icon,
  onPress,
  disabled,
  webInput,
}: DateTimeRowProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {webInput ? (
        <View style={styles.dateTimeField}>
          {webInput}
          <Ionicons name={icon} size={20} color={GOLD} />
        </View>
      ) : (
        <TouchableOpacity
          style={styles.dateTimeField}
          activeOpacity={0.85}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={styles.dateTimeValue}>{value}</Text>
          <Ionicons name={icon} size={20} color={GOLD} />
        </TouchableOpacity>
      )}
    </View>
  );
}

type Props = {
  selectedDate: Date;
  selectedTime: Date;
  showDatePicker: boolean;
  showTimePicker: boolean;
  onOpenDatePicker: () => void;
  onOpenTimePicker: () => void;
  onDateChange: (date: Date) => void;
  onTimeChange: (date: Date) => void;
  onCloseDatePicker: () => void;
  onCloseTimePicker: () => void;
  disabled?: boolean;
  /** When set, clamps DOB picker / web input (e.g. account 18+ gate). */
  maximumDate?: Date;
};

export function ProfileDateTimeFields({
  selectedDate,
  selectedTime,
  showDatePicker,
  showTimePicker,
  onOpenDatePicker,
  onOpenTimePicker,
  onDateChange,
  onTimeChange,
  onCloseDatePicker,
  onCloseTimePicker,
  disabled,
  maximumDate,
}: Props) {
  const maxDateValue = maximumDate
    ? toDateInputValue(maximumDate)
    : undefined;

  return (
    <>
      {Platform.OS === 'web' ? (
        <>
          <DateTimeRow
            label="Date of birth"
            value={formatDateLabel(selectedDate)}
            icon="calendar"
            webInput={React.createElement('input', {
              type: 'date',
              disabled,
              max: maxDateValue,
              value: toDateInputValue(selectedDate),
              onChange: (e: { target?: { value?: string } }) => {
                const dateText = e?.target?.value;
                if (!dateText) return;
                const [y, m, d] = dateText.split('-').map(Number);
                const next = new Date(selectedDate);
                next.setFullYear(y, (m || 1) - 1, d || 1);
                if (maximumDate && next.getTime() > maximumDate.getTime()) {
                  onDateChange(new Date(maximumDate));
                  return;
                }
                onDateChange(next);
              },
              style: styles.webInput,
            })}
          />
          <DateTimeRow
            label="Time of birth"
            value={formatTimeLabel(selectedTime)}
            icon="time-outline"
            webInput={React.createElement('input', {
              type: 'time',
              disabled,
              value: toTimeInputValue(selectedTime),
              onChange: (e: { target?: { value?: string } }) => {
                const timeText = e?.target?.value;
                if (!timeText) return;
                const [h, min] = timeText.split(':').map(Number);
                const next = new Date(selectedTime);
                next.setHours(h || 0, min || 0, 0, 0);
                onTimeChange(next);
              },
              style: styles.webInput,
            })}
          />
        </>
      ) : (
        <>
          <DateTimeRow
            label="Date of birth"
            value={formatDateLabel(selectedDate)}
            icon="calendar"
            onPress={onOpenDatePicker}
            disabled={disabled}
          />
          <DateTimeRow
            label="Time of birth"
            value={formatTimeLabel(selectedTime)}
            icon="time-outline"
            onPress={onOpenTimePicker}
            disabled={disabled}
          />
        </>
      )}

      <ConfirmableDateTimePicker
        visible={showDatePicker}
        value={selectedDate}
        mode="date"
        maximumDate={maximumDate}
        title="Date of birth"
        onCancel={onCloseDatePicker}
        onConfirm={(date) => {
          onDateChange(date);
          onCloseDatePicker();
        }}
      />

      <ConfirmableDateTimePicker
        visible={showTimePicker}
        value={selectedTime}
        mode="time"
        title="Time of birth"
        onCancel={onCloseTimePicker}
        onConfirm={(date) => {
          onTimeChange(date);
          onCloseTimePicker();
        }}
      />
    </>
  );
}
