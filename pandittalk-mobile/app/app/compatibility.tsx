import { Redirect, useLocalSearchParams } from 'expo-router';

/** https://www.pandittalk.com/app/compatibility?invite= opens the compatibility form. */
export default function CompatibilityInviteLink() {
  const params = useLocalSearchParams<{ invite?: string }>();
  const invite = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  return (
    <Redirect
      href={{
        pathname: '/tools/compatibility',
        params: invite ? { invite } : {},
      }}
    />
  );
}
