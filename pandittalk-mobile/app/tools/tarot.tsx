import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { GOLD, GREY_LABEL, TEXT_PRIMARY_DARK, BLACK, WHITE } from '@/constants/Colors';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { presentToolFailure } from '@/lib/presentToolError';
import { postTarot, type TarotResponse } from '@/lib/toolsApi';
import { buildTarotGuidanceNotes, startGuidanceFromTool } from '@/lib/guidanceFromTool';
import { tarotGuideLabel, tarotLesson } from '@/lib/tarotLesson';
import { goToToolsHub } from '@/lib/toolsNavigation';

const CARD_IMAGE_WIDTH = 280;
const CARD_ASPECT = 3 / 2;
const REVEAL_AUTO_ADVANCE_MS = 1500;

function parseSavedTarot(raw: string | string[] | undefined): TarotResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as TarotResponse;
    if (!parsed?.cardName || !parsed.cardMeaning || !parsed.yourInsight) return null;
    return parsed;
  } catch {
    return null;
  }
}

const TAROT_CARD_IMAGES: Record<string, string> = {
  'The Sun': 'https://upload.wikimedia.org/wikipedia/commons/1/17/RWS_Tarot_19_Sun.jpg',
  'The Moon': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/RWS_Tarot_18_Moon.jpg',
  'The Star': 'https://upload.wikimedia.org/wikipedia/commons/d/db/RWS_Tarot_17_Star.jpg',
  'The Tower': 'https://upload.wikimedia.org/wikipedia/commons/5/53/RWS_Tarot_16_Tower.jpg',
  'The Devil': 'https://upload.wikimedia.org/wikipedia/commons/5/55/RWS_Tarot_15_Devil.jpg',
  Temperance: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/RWS_Tarot_14_Temperance.jpg',
  Death: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/RWS_Tarot_13_Death.jpg',
  'The Hanged Man': 'https://upload.wikimedia.org/wikipedia/commons/2/2b/RWS_Tarot_12_Hanged_Man.jpg',
  Justice: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/RWS_Tarot_11_Justice.jpg',
  'Wheel of Fortune':
    'https://upload.wikimedia.org/wikipedia/commons/3/3c/RWS_Tarot_10_Wheel_of_Fortune.jpg',
  'The Hermit': 'https://upload.wikimedia.org/wikipedia/commons/4/4d/RWS_Tarot_09_Hermit.jpg',
  Strength: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/RWS_Tarot_08_Strength.jpg',
  'The Chariot': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/RWS_Tarot_07_Chariot.jpg',
  'The Lovers': 'https://upload.wikimedia.org/wikipedia/commons/3/3a/TheLovers.jpg',
  'The Hierophant': 'https://upload.wikimedia.org/wikipedia/commons/8/8d/RWS_Tarot_05_Hierophant.jpg',
  'The Emperor': 'https://upload.wikimedia.org/wikipedia/commons/c/c3/RWS_Tarot_04_Emperor.jpg',
  'The Empress': 'https://upload.wikimedia.org/wikipedia/commons/d/d2/RWS_Tarot_03_Empress.jpg',
  'The High Priestess':
    'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
  'The Magician': 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
  'The Fool': 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
  Judgement: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/RWS_Tarot_20_Judgement.jpg',
  'The World': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/RWS_Tarot_21_World.jpg',
};

type Phase = 'draw' | 'reveal' | 'meaning';

function tarotImageUrl(cardName: string): string | undefined {
  return TAROT_CARD_IMAGES[cardName];
}

type TarotCardBackProps = {
  x: number;
  y: number;
  rotation: number;
  width?: number;
  height?: number;
};

function TarotCardBack({ x, y, rotation, width = 52, height = 78 }: TarotCardBackProps) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const sunCx = x + width / 2;
  const sunCy = y + height / 2 - 4;

  return (
    <G rotation={rotation} origin={`${cx}, ${cy}`}>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        ry={6}
        fill={WHITE}
        stroke={GOLD}
        strokeWidth={2}
      />
      <Circle cx={sunCx} cy={sunCy} r={10} fill="none" stroke={GOLD} strokeWidth={1.5} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = sunCx + Math.cos(rad) * 12;
        const y1 = sunCy + Math.sin(rad) * 12;
        const x2 = sunCx + Math.cos(rad) * 16;
        const y2 = sunCy + Math.sin(rad) * 16;
        return (
          <Line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={GOLD}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        );
      })}
      <Line
        x1={x + 8}
        y1={y + height - 14}
        x2={x + width - 8}
        y2={y + height - 14}
        stroke={GOLD}
        strokeWidth={1}
        opacity={0.5}
      />
    </G>
  );
}

function TarotFanIllustration() {
  const cards: TarotCardBackProps[] = [
    { x: 18, y: 42, rotation: -28 },
    { x: 48, y: 28, rotation: -14 },
    { x: 78, y: 20, rotation: 0 },
    { x: 108, y: 28, rotation: 14 },
    { x: 138, y: 42, rotation: 28 },
  ];

  return (
    <View style={styles.fanWrap}>
      <Svg width={240} height={180} viewBox="0 0 240 180">
        {cards.map((card, index) => (
          <TarotCardBack key={index} {...card} />
        ))}
      </Svg>
    </View>
  );
}

type TarotCardImageProps = {
  cardName: string;
};

function TarotCardImage({ cardName }: TarotCardImageProps) {
  const url = tarotImageUrl(cardName);
  const height = CARD_IMAGE_WIDTH * CARD_ASPECT;

  if (!url) {
    return (
      <View style={[styles.cardImagePlaceholder, { width: CARD_IMAGE_WIDTH, height }]}>
        <Ionicons name="layers-outline" size={48} color={GOLD} />
        <Text style={styles.cardImagePlaceholderText}>{cardName}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: CARD_IMAGE_WIDTH, height }}
      contentFit="contain"
      accessibilityLabel={`Tarot card: ${cardName}`}
    />
  );
}

export default function TarotScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resultJson?: string }>();
  const saved = parseSavedTarot(params.resultJson);

  const [phase, setPhase] = useState<Phase>(saved ? 'meaning' : 'draw');
  const [result, setResult] = useState<TarotResponse | null>(saved);
  const [drawing, setDrawing] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const handleBack = useCallback(() => {
    if (phase === 'draw') {
      router.back();
      return;
    }
    if (phase === 'reveal') {
      setResult(null);
      setPhase('draw');
      return;
    }
    setPhase('reveal');
  }, [phase, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Tarot Insight',
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={BLACK} />
        </TouchableOpacity>
      ),
      headerRight:
        phase === 'draw'
          ? () => <ToolsStackWalletButton />
          : () => null,
    });
  }, [phase, navigation, handleBack, router]);

  useEffect(() => {
    if (phase !== 'reveal' || !result || reduceMotion) return;
    const timer = setTimeout(() => setPhase('meaning'), REVEAL_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [phase, result, reduceMotion]);

  const handleDrawCard = useCallback(async () => {
    if (drawing) return;
    setDrawing(true);
    try {
      const data = await postTarot();
      setResult(data);
      setPhase(reduceMotion ? 'meaning' : 'reveal');
    } catch (err) {
      presentToolFailure(err, () => void handleDrawCard());
    } finally {
      setDrawing(false);
    }
  }, [drawing, reduceMotion]);

  if (phase === 'reveal' && result) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, styles.revealContent]}
        >
          <Text style={styles.revealTitle}>Your Card: {result.cardName}</Text>
          <View style={styles.cardImageWrap}>
            <TarotCardImage cardName={result.cardName} />
          </View>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => setPhase('meaning')}
            accessibilityRole="button"
            accessibilityLabel="Skip to the card meaning"
          >
            <Text style={styles.skipBtnText}>Skip to meaning</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenBackground>
    );
  }

  if (phase === 'meaning' && result) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          <PremiumCard style={styles.contentCard}>
            <SectionHeader title="In plain words" first />
            <Text style={styles.sectionBody}>{tarotLesson(result.cardName).about}</Text>
            <Text style={styles.lessonQuestion}>{tarotLesson(result.cardName).question}</Text>
          </PremiumCard>

          <PremiumCard style={styles.contentCard}>
            <SectionHeader title="Card Meaning" first />
            <Text style={styles.sectionBody}>{result.cardMeaning}</Text>
          </PremiumCard>

          <PremiumCard style={styles.contentCard}>
            <SectionHeader title="Your Insight" first />
            <Text style={styles.sectionBody}>{result.yourInsight}</Text>
          </PremiumCard>

          <PremiumButton
            title={tarotGuideLabel(result.cardName)}
            size="lg"
            onPress={() =>
              startGuidanceFromTool(router, {
                notes: buildTarotGuidanceNotes(result.cardName),
              })
            }
            style={styles.btnSpacing}
          />

          <TouchableOpacity
            onPress={() => goToToolsHub(router)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Explore Astrology Tools"
          >
            <Text style={styles.exploreLink}>Explore Astrology Tools</Text>
          </TouchableOpacity>
        </ScrollView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <EntertainmentDisclaimer compact />
        <Text style={styles.subtitle}>Focus on your question and draw a tarot card.</Text>

        <PremiumCard style={styles.fanCard}>
          <TarotFanIllustration />
          <Text style={styles.hintText}>
            Think about a question in your mind before drawing your card.
          </Text>
        </PremiumCard>

        <PremiumButton
          title="Draw a Card"
          size="lg"
          onPress={handleDrawCard}
          loading={drawing}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerBackBtn: {
    paddingLeft: 4,
    paddingRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  fanCard: {
    alignItems: 'center',
    marginBottom: 28,
  },
  fanWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hintText: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  contentCard: {
    marginBottom: 16,
  },
  btnSpacing: {
    marginTop: 4,
    marginBottom: 12,
  },
  revealContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  revealTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 28,
  },
  cardImageWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  skipBtn: {
    marginTop: 20,
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: GOLD,
  },
  cardImagePlaceholder: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  cardImagePlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
  },
  sectionBody: {
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  lessonQuestion: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  exploreLink: {
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});


