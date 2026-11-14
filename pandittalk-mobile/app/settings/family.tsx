import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackChevron } from '@/components/BackChevron';
import { BG, GOLD, GREY_LABEL, HEADER_RULE_GREY, TEXT_PRIMARY_DARK, WHITE } from '@/constants/Colors';
import {
  createFamilyMember,
  deleteFamilyMember,
  listFamilyMembers,
  type FamilyMember,
  type FamilyRelation,
} from '@/lib/familyApi';
import { useAuthStore } from '@/store/useAuthStore';

const RELATIONS: { id: FamilyRelation; label: string }[] = [
  { id: 'spouse', label: 'Spouse' },
  { id: 'child', label: 'Child' },
  { id: 'parent', label: 'Parent' },
  { id: 'other', label: 'Other' },
];

export default function FamilyProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [relation, setRelation] = useState<FamilyRelation>('spouse');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setMembers(await listFamilyMembers(accessToken));
    } catch {
      Alert.alert('Could not load family profiles');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const onSave = async () => {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    setSaving(true);
    try {
      await createFamilyMember(accessToken, { relation, name, dob, timeOfBirth, placeOfBirth });
      setName('');
      setDob('');
      setTimeOfBirth('');
      setPlaceOfBirth('');
      await load();
    } catch {
      Alert.alert('Could not save', 'Check the name, date (YYYY-MM-DD), time (HH:mm), and place.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (member: FamilyMember) => {
    if (!accessToken) return;
    Alert.alert('Remove profile', `Remove ${member.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void deleteFamilyMember(accessToken, member.id).then(load).catch(() => {
            Alert.alert('Could not remove that profile');
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backHit}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackChevron />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family profiles</Text>
        <View style={styles.backHit} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lead}>
          Save a spouse, child, or parent so their birth details stay on this account.
        </Text>
        {loading ? <ActivityIndicator color={GOLD} /> : null}
        {members.map((member) => (
          <View key={member.id} style={styles.card}>
            <Text style={styles.cardTitle}>{member.name}</Text>
            <Text style={styles.cardMeta}>
              {member.relation} · {member.dob} · {member.timeOfBirth}
            </Text>
            <Text style={styles.cardMeta}>{member.placeOfBirth}</Text>
            <TouchableOpacity
              onPress={() => onDelete(member)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${member.name}`}
              style={styles.removeHit}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Text style={styles.section}>Add a profile</Text>
        <View style={styles.chips}>
          {RELATIONS.map((item) => {
            const selected = relation === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, selected && styles.chipOn]}
                onPress={() => setRelation(item.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={GREY_LABEL} />
        <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="Date of birth YYYY-MM-DD" placeholderTextColor={GREY_LABEL} autoCapitalize="none" />
        <TextInput style={styles.input} value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder="Time of birth HH:mm" placeholderTextColor={GREY_LABEL} autoCapitalize="none" />
        <TextInput style={styles.input} value={placeOfBirth} onChangeText={setPlaceOfBirth} placeholder="Place of birth" placeholderTextColor={GREY_LABEL} />
        <TouchableOpacity
          style={styles.save}
          onPress={() => void onSave()}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save family profile"
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backHit: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: TEXT_PRIMARY_DARK },
  content: { padding: 20, paddingBottom: 40 },
  lead: { fontSize: 14, lineHeight: 20, color: GREY_LABEL, marginBottom: 16 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY_DARK },
  cardMeta: { fontSize: 13, color: GREY_LABEL, marginTop: 4 },
  removeHit: { minHeight: 44, justifyContent: 'center' },
  removeText: { color: GOLD, fontWeight: '600' },
  section: { marginTop: 12, marginBottom: 8, fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY_DARK },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: GOLD, backgroundColor: GOLD },
  chipText: { color: TEXT_PRIMARY_DARK, fontWeight: '600' },
  chipTextOn: { color: WHITE },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: HEADER_RULE_GREY,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    color: TEXT_PRIMARY_DARK,
  },
  save: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: { color: WHITE, fontWeight: '700', fontSize: 16 },
});
