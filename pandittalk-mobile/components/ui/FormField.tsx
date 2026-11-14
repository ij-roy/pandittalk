import React, { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { formStyles } from './formStyles';

type FormFieldProps = {
  label: string;
  children: ReactNode;
  error?: string | null;
};

export function FormField({ label, children, error }: FormFieldProps) {
  return (
    <View style={formStyles.fieldBlock}>
      <Text style={formStyles.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={formStyles.submitError}>{error}</Text> : null}
    </View>
  );
}

export { formStyles };
