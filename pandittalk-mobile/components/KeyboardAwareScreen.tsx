import React, { ReactNode, useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  type FlatListProps,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { KeyboardAwareScrollView, KeyboardAvoidingView } from 'react-native-keyboard-controller';

const DEFAULT_HEADER_OFFSET = 56;

export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return visible;
}

/** Keyboard height in px; 0 when hidden. Use to pad fixed footers (e.g. chat input bar). */
export function useKeyboardBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setInset(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return inset;
}

function effectiveBottomInset(bottomInset: number, keyboardVisible: boolean): number {
  if (bottomInset <= 0) return 0;
  return keyboardVisible ? 0 : bottomInset;
}

type KeyboardAvoidingProps = {
  /** Offset for fixed headers (e.g. TabTopHeader). iOS KeyboardAvoidingView only. */
  headerOffset?: number;
  style?: StyleProp<ViewStyle>;
};

type ScreenProps = KeyboardAvoidingProps & {
  children: ReactNode;
  /** Added to scroll content paddingBottom (safe area + tab bar). Cleared while keyboard is open. */
  bottomInset?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
} & Pick<
  ScrollViewProps,
  | 'showsVerticalScrollIndicator'
  | 'keyboardShouldPersistTaps'
  | 'refreshControl'
  | 'onScroll'
  | 'scrollEventThrottle'
>;

/**
 * Keyboard handling without double-inset (ghost bar) or hidden fields:
 * KeyboardAwareScrollView scrolls the focused input above the IME on iOS and
 * Android, including overlay-keyboard / edge-to-edge devices where OS resize
 * does not shrink the window.
 */
export function KeyboardAwareScreen({
  children,
  headerOffset: _headerOffset = DEFAULT_HEADER_OFFSET,
  bottomInset = 0,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  ...scrollProps
}: ScreenProps) {
  const keyboardVisible = useKeyboardVisible();
  const padBottom = effectiveBottomInset(bottomInset, keyboardVisible);

  return (
    <View style={[styles.flex, style]}>
      <KeyboardAwareScrollView
        {...scrollProps}
        style={styles.flex}
        bottomOffset={24}
        extraKeyboardSpace={0}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={[
          styles.content,
          padBottom > 0 ? { paddingBottom: padBottom } : null,
          contentContainerStyle,
        ]}
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}

/** Avoids keyboard for non-scrolling layouts (sheets, footers). */
export function KeyboardAvoidingContainer({
  children,
  headerOffset = DEFAULT_HEADER_OFFSET,
  style,
}: KeyboardAvoidingProps & { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior="padding"
      keyboardVerticalOffset={headerOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

type FlatListAwareProps<ItemT> = KeyboardAvoidingProps & {
  bottomInset?: number;
} & FlatListProps<ItemT>;

export const KeyboardAwareFlatList = React.forwardRef(function KeyboardAwareFlatList<ItemT>(
  {
    headerOffset: _headerOffset = DEFAULT_HEADER_OFFSET,
    bottomInset = 0,
    style,
    contentContainerStyle,
    keyboardShouldPersistTaps = 'handled',
    showsVerticalScrollIndicator = false,
    ...flatListProps
  }: FlatListAwareProps<ItemT>,
  ref: React.Ref<FlatList<ItemT>>,
) {
  const keyboardVisible = useKeyboardVisible();
  const padBottom = effectiveBottomInset(bottomInset, keyboardVisible);

  return (
    <View style={[styles.flex, style]}>
      <FlatList
        ref={ref}
        {...flatListProps}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[
          padBottom > 0 ? { paddingBottom: padBottom } : null,
          contentContainerStyle,
        ]}
      />
    </View>
  );
}) as <ItemT>(
  props: FlatListAwareProps<ItemT> & { ref?: React.Ref<FlatList<ItemT>> },
) => React.ReactElement;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
