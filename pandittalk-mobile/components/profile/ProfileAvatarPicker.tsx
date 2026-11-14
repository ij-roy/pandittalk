import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TEXT_PRIMARY_DARK, WHITE } from '../../constants/Colors';
import { useSheetBottomPadding } from '../../hooks/useSheetBottomPadding';
import { messageFromAxiosError } from '../../lib/profileUtils';
import { useToastStore } from '../../store/useToastStore';
import { profileFormStyles as styles } from './profileFormStyles';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

async function compressAvatar(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512, height: 512 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

function isAllowedMimeType(mimeType: string | undefined | null): boolean {
  if (!mimeType) return true;
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}

type Props = {
  avatarUri: string | null;
  onAvatarChange: (uri: string | null) => void;
  disabled?: boolean;
};

export function ProfileAvatarPicker({
  avatarUri,
  onAvatarChange,
  disabled,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const sheetBottomPad = useSheetBottomPadding();

  const prepareImage = useCallback(
    async (localUri: string, mimeType?: string | null) => {
      if (!isAllowedMimeType(mimeType)) {
        showToast('Only JPEG and PNG images are allowed', 'error');
        return;
      }

      setPreparing(true);
      try {
        const compressed = await compressAvatar(localUri);
        const fileInfo = await FileSystem.getInfoAsync(compressed, { size: true });
        if (fileInfo.exists && fileInfo.size != null && fileInfo.size > MAX_AVATAR_BYTES) {
          showToast('Image must be 5 MB or smaller', 'error');
          return;
        }
        onAvatarChange(compressed);
      } catch (err) {
        showToast(
          messageFromAxiosError(err) || 'Could not prepare your photo. Please try again.',
          'error',
        );
      } finally {
        setPreparing(false);
      }
    },
    [onAvatarChange, showToast],
  );

  const pickSource = useCallback(
    async (source: 'camera' | 'library') => {
      setSheetOpen(false);
      try {
        if (source === 'camera') {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take a profile photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            ...PICKER_OPTIONS,
            cameraType: ImagePicker.CameraType.front,
          });
          const asset = result.canceled ? null : result.assets?.[0];
          if (asset?.uri) await prepareImage(asset.uri, asset.mimeType);
        } else {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Gallery access is required to choose a profile photo.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
          const asset = result.canceled ? null : result.assets?.[0];
          if (asset?.uri) await prepareImage(asset.uri, asset.mimeType);
        }
      } catch {
        showToast('Could not select an image. Please try again.', 'error');
      }
    },
    [prepareImage, showToast],
  );

  return (
    <>
      <View style={styles.avatarBlock}>
        <View style={styles.avatarFrame}>
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color={WHITE} />
              </View>
            )}
            {preparing ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="small" color={TEXT_PRIMARY_DARK} />
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.camBtn}
            activeOpacity={0.85}
            onPress={() => !disabled && setSheetOpen(true)}
            disabled={disabled || preparing}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Ionicons name="camera" size={14} color={WHITE} />
          </TouchableOpacity>
        </View>
        <Text style={styles.avatarHint}>Saves with the rest of your profile</Text>
      </View>

      <Modal transparent visible={sheetOpen} animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: sheetBottomPad }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetAction} onPress={() => void pickSource('camera')}>
              <Text style={styles.sheetActionText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetAction} onPress={() => void pickSource('library')}>
              <Text style={styles.sheetActionText}>Choose from library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setSheetOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
