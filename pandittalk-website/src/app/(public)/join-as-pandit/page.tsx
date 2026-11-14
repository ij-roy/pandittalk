import { permanentRedirect } from 'next/navigation';

/** Legacy URL — hash fragments are stripped by server redirects, so use a query flag. */
export default function Page() {
  permanentRedirect('/for-pandits?apply=1');
}
