import React, { type ReactNode } from 'react';
import { Modal, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useSheetBottomPadding } from '@/hooks/useSheetBottomPadding';

import { formStyles } from './formStyles';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
};

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  sheetStyle,
}: BottomSheetProps) {
  const bottomPad = useSheetBottomPadding();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={formStyles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[formStyles.sheet, { paddingBottom: bottomPad }, sheetStyle]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={formStyles.sheetHandle} />
          {title ? <Text style={formStyles.sheetTitle}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export { formStyles };
