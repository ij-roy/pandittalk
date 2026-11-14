import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { GuidanceHubContent } from '../../components/GuidanceHubContent';
import { TabTopHeader } from '../../components/TabTopHeader';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { ScreenEntrance } from '../../components/ui/ScreenEntrance';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ToolCard } from '../../components/ui/ToolCard';
import { GOLD, GOLD_BORDER, TEXT_PRIMARY_DARK, WARM_IVORY } from '../../constants/Colors';
import { PAGE_PAD, SECTION_GAP } from '../../constants/Spacing';
import { useUserProfile } from '../../hooks/useUserProfile';
import { canPurchaseDigitalTools } from '../../lib/iosStorePolicy';
import { visibleRecentTools } from '../../lib/recentTools';
import { readRecentTools } from '../../lib/recentToolsStore';
import { toolHubChip } from '../../lib/toolHubChip';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { EntertainmentDisclaimer } from '../../components/EntertainmentDisclaimer';

type SvgAssetSource = number;

type FreeTool = {
  id: string;
  title: string;
  route: Href;
  icon?: SvgAssetSource;
  ionicon?: keyof typeof Ionicons.glyphMap;
};

type PaidTool = {
  id: string;
  title: string;
  price: string;
  description: string;
  route: Href;
  icon?: SvgAssetSource;
  ionicon?: keyof typeof Ionicons.glyphMap;
};

const FREE_TOOLS: FreeTool[] = [
  {
    id: 'kundli',
    title: 'Free Kundli',
    route: '/tools/kundli' as Href,
    icon: require('../../assets/images/Homepageicons/BasicKundli.png'),
  },
  {
    id: 'horoscope',
    title: 'Daily Horoscope',
    route: '/tools/horoscope' as Href,
    icon: require('../../assets/images/Homepageicons/DailyHoroscope.png'),
  },
  {
    id: 'compatibility',
    title: 'Compatibility Check',
    route: '/tools/compatibility' as Href,
    icon: require('../../assets/images/Homepageicons/CompatibilityCheck.png'),
  },
  {
    id: 'palm-reading',
    title: 'Palm Reading',
    route: '/tools/palm-reading' as Href,
    icon: require('../../assets/images/Homepageicons/Palmistry.png'),
  },
  {
    id: 'tarot',
    title: 'Tarot Insight',
    route: '/tools/tarot' as Href,
    ionicon: 'layers-outline',
  },
];

const PAID_TOOLS: PaidTool[] = [
  {
    id: 'detailed-kundli',
    title: 'Detailed Kundli',
    price: toolHubChip(251),
    description: 'Life reading, doshas, dasha, and remedies',
    route: '/tools/kundli-detailed' as Href,
    icon: require('../../assets/images/Homepageicons/BasicKundli.png'),
  },
  {
    id: 'monthly-horoscope',
    title: 'Month Report',
    price: toolHubChip(101),
    description: 'The whole month. Separate from today\'s horoscope.',
    route: '/tools/monthly-horoscope' as Href,
    ionicon: 'calendar-outline',
  },
];

const GRID_GAP = 12;

export default function ToolsScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const { greetingTitle } = useUserProfile();
  const flags = useFeatureFlags();
  const canBuyPaid = canPurchaseDigitalTools();
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const innerContentWidth = windowWidth - PAGE_PAD * 2;
  const freeCellSize = Math.floor((innerContentWidth - GRID_GAP) / 2);
  const catalog = [...FREE_TOOLS, ...PAID_TOOLS];
  const recent = visibleRecentTools(recentIds, canBuyPaid)
    .map((id) => catalog.find((tool) => tool.id === id))
    .filter((tool): tool is (typeof catalog)[number] => !!tool);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void readRecentTools().then((ids) => {
        if (!cancelled) setRecentIds(ids);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <ScreenBackground>
      <TabTopHeader title={greetingTitle} onWalletPress={() => router.push('/wallet')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ScreenEntrance>
          <EntertainmentDisclaimer compact />
          {recent.length > 0 ? (
            <View style={styles.recentBlock}>
              <SectionHeader title="Recent" first />
              <View style={styles.recentRow}>
                {recent.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    style={styles.recentChip}
                    onPress={() => router.push(tool.route)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${tool.title} again`}
                  >
                    <Text style={styles.recentChipText}>{tool.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
          <SectionHeader title="Optional self-service tools" first={recent.length === 0} />
          <View style={styles.freeGrid}>
            {FREE_TOOLS.map((tool) => (
              <ToolCard
                key={tool.id}
                variant="grid"
                title={tool.title}
                badge={toolHubChip(0)}
                icon={tool.icon}
                iconNode={
                  tool.icon ? undefined : <Ionicons name={tool.ionicon!} size={40} color={GOLD} />
                }
                style={[styles.freeCard, { width: freeCellSize }]}
                onPress={() => router.push(tool.route)}
              />
            ))}
          </View>

          {canBuyPaid && flags.digitalTools ? (
            <View style={styles.deeperZone}>
              <SectionHeader title="Get Deeper Insights" first />
              <View style={styles.paidList}>
                {PAID_TOOLS.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    variant="paid"
                    title={tool.title}
                    price={tool.price}
                    description={tool.description}
                    icon={tool.icon}
                    iconNode={
                      tool.icon ? undefined : (
                        <Ionicons name={tool.ionicon!} size={32} color={GOLD} />
                      )
                    }
                    onPress={() => router.push(tool.route)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <GuidanceHubContent
            blogLayout="horizontal"
            showGuides={false}
            showHowItWorks={false}
            blogSectionTitle="Learn & Explore"
          />
        </ScreenEntrance>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: PAGE_PAD,
    paddingTop: 12,
    paddingBottom: 40,
  },
  recentBlock: {
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SECTION_GAP,
  },
  recentChip: {
    borderWidth: 1.2,
    borderColor: GOLD_BORDER,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: WARM_IVORY,
  },
  recentChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
  },
  freeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: SECTION_GAP,
  },
  freeCard: {
    minHeight: 150,
  },
  deeperZone: {
    marginHorizontal: -PAGE_PAD,
    paddingHorizontal: PAGE_PAD,
    paddingTop: 4,
    paddingBottom: SECTION_GAP,
    marginBottom: SECTION_GAP,
    backgroundColor: WARM_IVORY,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: GOLD_BORDER,
  },
  paidList: {
    gap: 12,
  },
});
