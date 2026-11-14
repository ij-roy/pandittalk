import { Tabs } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { GUIDANCE_TAB_LABEL } from '@/lib/guidanceEntry';
import { ActiveChatRejoinBanner } from '@/components/ActiveChatRejoinBanner';
import { CustomTabBar } from '@/components/custom-tab-bar';
import { SideMenu } from '@/components/SideMenu';
import { TabMenuProvider } from '@/contexts/TabMenuContext';
import { ProfileHydrator } from '@/hooks/useUserProfile';

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const openMenu = useCallback(() => setMenuVisible(true), []);
  const menuCtx = useMemo(() => ({ openMenu }), [openMenu]);

  return (
    <TabMenuProvider value={menuCtx}>
      <ProfileHydrator />
      <SideMenu isVisible={menuVisible} onClose={() => setMenuVisible(false)} />
      <View style={{ flex: 1 }}>
        <Tabs
          initialRouteName="index"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'Consult', href: '/' }} />
          <Tabs.Screen name="experts" options={{ title: 'Experts', href: '/experts' }} />
          <Tabs.Screen
            name="guidance"
            options={{
              title: GUIDANCE_TAB_LABEL,
              href: '/guidance',
              tabBarAccessibilityLabel: 'Guidance. Book a session.',
            }}
          />
          <Tabs.Screen name="profile" options={{ title: 'Profile', href: '/profile' }} />
          <Tabs.Screen name="tools" options={{ title: 'Tools', href: '/tools' }} />
          <Tabs.Screen name="home" options={{ href: null }} />
        </Tabs>
        <ActiveChatRejoinBanner />
      </View>
    </TabMenuProvider>
  );
}
