import { useNavigation } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

import { TEXT_PRIMARY_DARK, WARM_IVORY } from '@/constants/Colors';
import { goToToolsHub } from '@/lib/toolsNavigation';
import { toolIdFromPath } from '@/lib/recentTools';
import { recordRecentTool } from '@/lib/recentToolsStore';

export default function ToolsLayout() {
  const navigation = useNavigation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = toolIdFromPath(pathname);
    if (id) void recordRecentTool(id);
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prefer popping within the tools stack (form → result, etc.).
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      // At the first tools screen: leave the tools group, never exit the app.
      try {
        if (router.canDismiss()) {
          router.dismiss();
          return true;
        }
      } catch {
        // fall through
      }
      goToToolsHub(router);
      return true;
    });

    return () => sub.remove();
  }, [navigation, router]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: WARM_IVORY },
        headerTintColor: TEXT_PRIMARY_DARK,
        headerTitleStyle: { color: TEXT_PRIMARY_DARK, fontWeight: '700', fontSize: 17 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="kundli" options={{ title: 'Free Kundli' }} />
      <Stack.Screen name="kundli-result" options={{ title: 'Your Birth Chart' }} />
      <Stack.Screen name="kundli-detailed" options={{ title: 'Detailed Kundli' }} />
      <Stack.Screen name="kundli-detailed-result" options={{ title: 'Detailed Kundli Report' }} />
      <Stack.Screen name="horoscope" options={{ title: 'Daily Horoscope' }} />
      <Stack.Screen name="horoscope-result" options={{ title: 'Daily Horoscope' }} />
      <Stack.Screen name="compatibility" options={{ title: 'Compatibility Check' }} />
      <Stack.Screen name="compatibility-result" options={{ title: 'Compatibility Check' }} />
      <Stack.Screen name="compatibility-detailed-result" options={{ title: 'Detailed Compatibility Report' }} />
      <Stack.Screen name="palm-reading" options={{ title: 'Palm Reading' }} />
      <Stack.Screen name="tarot" options={{ title: 'Tarot Insight' }} />
      <Stack.Screen name="monthly-horoscope" options={{ title: 'Month Report' }} />
    </Stack>
  );
}
