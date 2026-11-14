import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { setAndroidNavBarButtonStyle } from '@/lib/androidSystemBars';

export default function SessionLayout() {
  useEffect(() => {
    // Dark call UI → light (white) system nav buttons for contrast.
    setAndroidNavBarButtonStyle('light');
    return () => {
      setAndroidNavBarButtonStyle('dark');
    };
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
