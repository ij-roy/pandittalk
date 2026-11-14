import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { EntertainmentDisclaimer } from '@/components/EntertainmentDisclaimer';
import { BG, BLOG_CARD_BORDER, DEEP_GREY, BLACK, GOLD, GREY_LABEL, SCRIM_BLACK, SHADOW_BLACK, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { ScreenBackground } from '@/components/ui/ScreenBackground';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ToolsStackWalletButton } from '@/components/ToolsStackWalletButton';
import { isOfflineSubmitError } from '@/lib/toolSubmitError';
import {
  palmNeedsShrink,
  palmUploadFailureCopy,
  palmUploadFailureKind,
} from '@/lib/palmUpload';
import { PALM_OUTLINE_GUIDE } from '@/lib/palmGuide';
import { postPalmReading, type PalmReadingResponse } from '@/lib/toolsApi';
import { buildPalmReadingGuidanceNotes, startGuidanceFromTool } from '@/lib/guidanceFromTool';
import { goToToolsHub } from '@/lib/toolsNavigation';

function parseSavedPalm(raw: string | string[] | undefined): PalmReadingResponse | null {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as PalmReadingResponse;
    if (!parsed?.lifeLine?.description || !parsed.heartLine?.description || !parsed.headLine?.description) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

const INSTRUCTIONS = [
  PALM_OUTLINE_GUIDE,
  'Use good lighting',
  'Avoid shadows on the palm',
] as const;

const PALM_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [3, 4],
  quality: 1,
};

type PalmImage = { uri: string; base64: string };

function responseStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const status = (err as { response?: { status?: unknown } }).response?.status;
  return typeof status === 'number' ? status : null;
}

async function compressAndEncode(
  uri: string,
  width = 800,
  compress = 0.4,
): Promise<PalmImage> {
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    { compress, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );

  let base64 = compressed.base64;
  if (!base64) {
    base64 = await FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  base64 = base64.replace(/^data:image\/\w+;base64,/, '');

  return { uri: compressed.uri, base64 };
}

async function pickAndProcessFromGallery(): Promise<PalmImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync(PALM_PICKER_OPTIONS);

  if (result.canceled || !result.assets?.[0]) return null;

  return compressAndEncode(result.assets[0].uri);
}

type Phase = 'upload' | 'loading' | 'overview' | 'deepReading';
type PalmSide = 'left' | 'right';
type UploadSource = 'camera' | 'gallery';

type PalmHandSpinnerProps = {
  size?: number;
};

function PalmOutline({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Path
        d="M100 28 C72 28 58 52 56 78 L52 118 C50 138 58 158 76 168 C88 174 100 176 112 168 C130 158 138 138 136 118 L132 78 C130 52 116 28 100 28 Z"
        stroke={GOLD}
        strokeWidth={3}
        fill="none"
      />
      <Path
        d="M62 92 C78 86 98 84 118 88"
        stroke={GOLD}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M58 108 C82 102 108 100 132 106"
        stroke={GOLD}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M70 72 C82 110 88 130 96 158"
        stroke={GOLD}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PalmHandSpinner({ size = 200 }: PalmHandSpinnerProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <PalmOutline size={size} />
    </Animated.View>
  );
}

type PalmUploadBoxProps = {
  label: string;
  uri: string | null;
  onPress: () => void;
};

function PalmUploadBox({ label, uri, onPress }: PalmUploadBoxProps) {
  return (
    <View style={styles.uploadSection}>
      <Text style={styles.uploadLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${PALM_OUTLINE_GUIDE}`}
      >
        {uri ? (
          <View style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.uploadThumbnail} contentFit="cover" />
            <View style={styles.outlineOverlay} pointerEvents="none">
              <PalmOutline size={150} />
            </View>
            <Text style={styles.uploadAgainLabel}>Upload again</Text>
          </View>
        ) : (
          <>
            <PalmOutline size={120} />
            <Text style={styles.uploadPrompt}>Fit your palm in the outline</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

type LineSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
};

function LineSection({ icon, title, body }: LineSectionProps) {
  return (
    <PremiumCard style={styles.lineSection}>
      <SectionHeader
        title={title}
        first
        right={<Ionicons name={icon} size={20} color={GOLD} />}
      />
      <Text style={styles.lineSectionBody}>{body}</Text>
    </PremiumCard>
  );
}

type UploadSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: UploadSource) => void;
};

function UploadSourceSheet({ visible, onClose, onSelect }: UploadSourceSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.sheetTitle}>Upload Image from:</Text>
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => onSelect('camera')}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-outline" size={22} color={DEEP_GREY} />
            <Text style={styles.sheetOptionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sheetOption}
            onPress={() => onSelect('gallery')}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={22} color={DEEP_GREY} />
            <Text style={styles.sheetOptionText}>Gallery</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function PalmReadingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ resultJson?: string }>();
  const saved = parseSavedPalm(params.resultJson);

  const [phase, setPhase] = useState<Phase>(saved ? 'overview' : 'upload');
  const [leftPalm, setLeftPalm] = useState<PalmImage | null>(null);
  const [rightPalm, setRightPalm] = useState<PalmImage | null>(null);
  const [uploadTarget, setUploadTarget] = useState<PalmSide | null>(null);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [result, setResult] = useState<PalmReadingResponse | null>(saved);
  const [loadingCaption, setLoadingCaption] = useState<'analyzing' | 'reading'>('analyzing');

  const loadingCancelledRef = useRef(false);

  const bothUploaded = !!leftPalm?.base64 && !!rightPalm?.base64;

  const handleBack = useCallback(() => {
    if (phase === 'upload') {
      router.back();
      return;
    }
    if (phase === 'loading') {
      loadingCancelledRef.current = true;
      setPhase('upload');
      return;
    }
    if (phase === 'overview') {
      setPhase('upload');
      return;
    }
    setPhase('overview');
  }, [phase, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Palm Reading',
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
        phase === 'upload'
          ? () => <ToolsStackWalletButton />
          : () => null,
    });
  }, [phase, navigation, handleBack, router]);

  const openUploadSheet = useCallback((side: PalmSide) => {
    setUploadTarget(side);
    setShowUploadSheet(true);
  }, []);

  const applyPickedImage = useCallback(
    (palm: PalmImage) => {
      if (uploadTarget === 'left') {
        setLeftPalm(palm);
      }
      if (uploadTarget === 'right') {
        setRightPalm(palm);
      }
      setShowUploadSheet(false);
      setUploadTarget(null);
    },
    [uploadTarget],
  );

  const pickImage = useCallback(
    async (source: UploadSource) => {
      setShowUploadSheet(false);

      try {
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take a palm photo.');
            return;
          }
          const pickResult = await ImagePicker.launchCameraAsync({
            ...PALM_PICKER_OPTIONS,
            cameraType: ImagePicker.CameraType.back,
          });
          const asset = pickResult.canceled ? null : pickResult.assets?.[0];
          if (asset?.uri) {
            const palm = await compressAndEncode(asset.uri);
            applyPickedImage(palm);
          }
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery access is required to upload a palm photo.');
            return;
          }
          const palm = await pickAndProcessFromGallery();
          if (palm) {
            applyPickedImage(palm);
          }
        }
      } catch {
        Alert.alert('Upload failed', 'Could not select an image. Please try again.');
      }
    },
    [applyPickedImage],
  );

  const handleAnalyze = useCallback(() => {
    if (!bothUploaded) return;
    setLoadingCaption('analyzing');
    loadingCancelledRef.current = false;
    setPhase('loading');
  }, [bothUploaded]);

  useEffect(() => {
    if (phase !== 'loading') return;

    const captionTimer = setInterval(() => {
      setLoadingCaption((prev) => (prev === 'analyzing' ? 'reading' : 'analyzing'));
    }, 2000);

    return () => clearInterval(captionTimer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'loading' || !leftPalm?.base64 || !rightPalm?.base64) return;

    let cancelled = false;

    void (async () => {
      try {
        if (cancelled || loadingCancelledRef.current) return;

        let leftImage = leftPalm.base64;
        let rightImage = rightPalm.base64;
        if (palmNeedsShrink(leftImage) || palmNeedsShrink(rightImage)) {
          const smallerLeft = await compressAndEncode(leftPalm.uri, 640, 0.35);
          const smallerRight = await compressAndEncode(rightPalm.uri, 640, 0.35);
          if (cancelled || loadingCancelledRef.current) return;
          leftImage = smallerLeft.base64;
          rightImage = smallerRight.base64;
        }

        const data = await postPalmReading({
          leftPalmImage: leftImage,
          rightPalmImage: rightImage,
        });

        if (cancelled || loadingCancelledRef.current) return;

        setResult(data);
        setPhase('overview');
      } catch (err) {
        if (cancelled || loadingCancelledRef.current) return;
        const kind = palmUploadFailureKind({
          offline: isOfflineSubmitError(err),
          status: responseStatus(err),
        });
        if (kind === 'too-large') {
          try {
            const smallerLeft = await compressAndEncode(leftPalm.uri, 480, 0.3);
            const smallerRight = await compressAndEncode(rightPalm.uri, 480, 0.3);
            if (!cancelled && !loadingCancelledRef.current) {
              setLeftPalm(smallerLeft);
              setRightPalm(smallerRight);
            }
          } catch {
            // Keep the photos already on screen.
          }
        }
        if (cancelled || loadingCancelledRef.current) return;
        setPhase('upload');
        const copy = palmUploadFailureCopy(kind);
        Alert.alert(copy.title, copy.message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Try again', onPress: () => setPhase('loading') },
        ]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phase, leftPalm, rightPalm]);

  if (phase === 'loading') {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingTitle}>Analyzing Your Palm</Text>
        <PalmHandSpinner />
        <Text style={styles.loadingSubtitle}>
          {loadingCaption === 'analyzing' ? 'Analyzing Your Palm...' : 'Reading your palm lines...'}
        </Text>
      </View>
    );
  }

  if (phase === 'overview' && result) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          <Text style={styles.pageTitle}>Palm Overview</Text>

          {rightPalm ? (
            <View style={styles.palmImageCard}>
              <Image
                source={{ uri: rightPalm.uri }}
                style={styles.palmImage}
                contentFit="cover"
              />
            </View>
          ) : null}

          <LineSection
            icon="pulse"
            title={result.lifeLine.title}
            body={result.lifeLine.description}
          />
          <LineSection
            icon="heart"
            title={result.heartLine.title}
            body={result.heartLine.description}
          />

          <PremiumButton
            title="Continue"
            size="lg"
            onPress={() => setPhase('deepReading')}
            style={styles.btnSpacing}
          />
        </ScrollView>
      </ScreenBackground>
    );
  }

  if (phase === 'deepReading' && result) {
    return (
      <ScreenBackground>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          <LineSection
            icon="bulb-outline"
            title={result.headLine.title}
            body={result.headLine.description}
          />

          <PremiumButton
            title="Start Guidance Session"
            size="lg"
            onPress={() =>
              startGuidanceFromTool(router, {
                notes: buildPalmReadingGuidanceNotes(),
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
        keyboardShouldPersistTaps="handled"
      >
        <EntertainmentDisclaimer compact />
        <Text style={styles.subtitle}>
          Upload clear photos of your palm to analyze your palm lines.
        </Text>

        <PremiumCard style={styles.instructionCard}>
          <SectionHeader title="Instructions" first />
          {INSTRUCTIONS.map((item) => (
            <View key={item} style={styles.instructionRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.instructionText}>{item}</Text>
            </View>
          ))}
        </PremiumCard>

        <SectionHeader title="Upload Your Palm" />

        <PalmUploadBox
          label="Left Palm"
          uri={leftPalm?.uri ?? null}
          onPress={() => openUploadSheet('left')}
        />

        {leftPalm ? (
          <PalmUploadBox
            label="Right Palm"
            uri={rightPalm?.uri ?? null}
            onPress={() => openUploadSheet('right')}
          />
        ) : null}

        <PremiumButton
          title="Analyze Palm"
          size="lg"
          onPress={handleAnalyze}
          disabled={!bothUploaded}
          style={styles.btnSpacing}
        />
      </ScrollView>

      <UploadSourceSheet
        visible={showUploadSheet}
        onClose={() => {
          setShowUploadSheet(false);
          setUploadTarget(null);
        }}
        onSelect={pickImage}
      />
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
    marginBottom: 24,
    lineHeight: 20,
  },
  instructionCard: {
    marginBottom: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingRight: 8,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginTop: 6,
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: TEXT_PRIMARY_DARK,
    lineHeight: 22,
  },
  uploadHeading: {
    marginTop: 20,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    marginBottom: 10,
  },
  uploadBox: {
    minHeight: 180,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: GOLD,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  uploadPrompt: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
    textAlign: 'center',
  },
  uploadThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  thumbWrap: {
    width: '100%',
    position: 'relative',
  },
  outlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  uploadAgainLabel: {
    fontSize: 13,
    color: GREY_LABEL,
  },
  btnSpacing: {
    marginTop: 8,
    marginBottom: 12,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: SCRIM_BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    paddingVertical: 8,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BLOG_CARD_BORDER,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sheetOptionText: {
    fontSize: 16,
    color: TEXT_PRIMARY_DARK,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingSubtitle: {
    marginTop: 28,
    fontSize: 14,
    color: GREY_LABEL,
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT_PRIMARY_DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  palmImageCard: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: WHITE,
    borderWidth: 1.2,
    borderColor: BLOG_CARD_BORDER,
    marginBottom: 28,
    shadowColor: SHADOW_BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  palmImage: {
    width: '100%',
    height: 280,
  },
  lineSection: {
    marginBottom: 16,
  },
  lineSectionBody: {
    fontSize: 15,
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


