import { Redirect, useLocalSearchParams } from 'expo-router';

/** Stack alias — keeps bottom tabs by opening the Guidance tab route. */
export default function GuidanceStartRedirect() {
  const params = useLocalSearchParams<{ area?: string; expertId?: string; notes?: string }>();
  return (
    <Redirect
      href={{
        pathname: '/guidance',
        params: {
          area: params.area,
          expertId: params.expertId,
          notes: params.notes,
        },
      }}
    />
  );
}
