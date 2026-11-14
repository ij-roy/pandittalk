import { Redirect, useLocalSearchParams } from 'expo-router';

/** Legacy route — keep old links working by forwarding to the live experts profile. */
export default function LegacyExpertRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const expertId = Array.isArray(id) ? id[0] : id;
  if (!expertId) return <Redirect href="/experts" />;
  return <Redirect href={`/experts/${encodeURIComponent(expertId)}`} />;
}
