import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { DEEP_GREY, GOLD, MUTED_GREY, WHITE } from '@/constants/Colors';

type Props = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

export const SearchBar = forwardRef<TextInput, Props>(function SearchBar(
  { value, onChangeText, placeholder, style, ...rest },
  ref,
) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={16} color={MUTED_GREY} style={styles.icon} />
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={MUTED_GREY}
        style={[styles.input, style]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        {...rest}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    height: 44,
    backgroundColor: WHITE,
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: DEEP_GREY,
    fontSize: 14,
    paddingVertical: 0,
  },
});
