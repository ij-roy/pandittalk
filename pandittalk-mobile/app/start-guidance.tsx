import { Redirect } from 'expo-router';

/** Legacy route: opens the Start Your Guidance flow. */
export default function StartGuidanceScreen() {
  return <Redirect href="/guidance" />;
}
