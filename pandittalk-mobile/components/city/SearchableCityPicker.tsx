import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useKeyboardBottomInset } from '../KeyboardAwareScreen';
import { GOLD, MUTED_GREY } from '../../constants/Colors';
import { INDIAN_CITIES, type IndianCity } from '../../constants/indianCities';
import { useSheetBottomPadding } from '../../hooks/useSheetBottomPadding';
import { cityPickerStyles as styles } from './cityPickerStyles';

type PickerProps = {
  visible: boolean;
  title: string;
  selected: string | null;
  onSelect: (city: IndianCity) => void;
  onClose: () => void;
};

function filterCities(query: string): IndianCity[] {
  const q = query.trim().toLowerCase();
  if (!q) return INDIAN_CITIES;
  return INDIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q),
  );
}

export function SearchableCityPicker({
  visible,
  title,
  selected,
  onSelect,
  onClose,
}: PickerProps) {
  const [query, setQuery] = useState('');
  const keyboardInset = useKeyboardBottomInset();
  const sheetBottomPad = useSheetBottomPadding();

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const results = useMemo(() => filterCities(query), [query]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.sheet,
              {
                marginBottom: keyboardInset,
                paddingBottom: keyboardInset > 0 ? 12 : sheetBottomPad,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <TextInput
              style={styles.sheetSearch}
              placeholder="Search city or state…"
              placeholderTextColor={MUTED_GREY}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="words"
              clearButtonMode="while-editing"
            />
            <FlatList
              data={results}
              keyExtractor={(item) => `${item.name}-${item.state}`}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              style={{ flexGrow: 0, maxHeight: keyboardInset > 0 ? 260 : 420 }}
              initialNumToRender={24}
              maxToRenderPerBatch={32}
              windowSize={8}
              renderItem={({ item }) => {
                const isSelected = selected === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.sheetOption, isSelected && styles.sheetOptionSelected]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <Text style={[styles.sheetOptionName, isSelected && { fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                    <Text style={styles.sheetOptionState}>{item.state}</Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={{ padding: 20, color: MUTED_GREY, textAlign: 'center' }}>
                  No cities found
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

type SelectFieldProps = {
  label?: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
};

export function CitySelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled,
}: SelectFieldProps) {
  const field = (
    <TouchableOpacity
      style={styles.selectField}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.selectValue, !value && styles.selectPlaceholder]}>
        {value ?? placeholder}
      </Text>
      <Ionicons name="chevron-down" size={18} color={GOLD} />
    </TouchableOpacity>
  );

  if (!label) return field;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {field}
    </View>
  );
}
