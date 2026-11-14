import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type NativeVideoViewProps = {
  tileId: number;
  mirror?: boolean;
  style?: StyleProp<ViewStyle>;
};

const NativeVideoView = requireNativeViewManager<NativeVideoViewProps>('ExpoPanditChime');

export type VideoSurfaceProps = {
  tileId: number | null;
  mirror?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function VideoSurface({ tileId, mirror = false, style }: VideoSurfaceProps) {
  return (
    <NativeVideoView
      tileId={tileId ?? -1}
      mirror={mirror}
      style={style}
    />
  );
}
