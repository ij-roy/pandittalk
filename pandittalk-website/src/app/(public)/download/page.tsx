import { PLAY_STORE_URL } from '@/lib/articles/site';
import Image from 'next/image';
import Link from 'next/link';
import { InformationPage } from '../about/InformationPage';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { DownloadPlatform } from './DownloadPlatform';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download the app',
  description: 'Use the same Pandit Talk account on Android today. iOS is not on the App Store yet — join the list for launch updates.',
  alternates: { canonical: '/download' },
  openGraph: {
    title: 'Download the app · Pandit Talk',
    description: 'Android on Google Play today. iOS App Store listing is not available yet.',
    url: '/download',
  },
};

export default function Page() {
  return (
    <InformationPage
      eyebrow="Continue on mobile"
      title="A little room for you. Wherever you are."
      intro="Use the same Pandit Talk account on your phone. Wallet, bookings and reports stay together where supported. The website and Android app use timed booking rules; confirm duration, total and format in the booking flow. iOS is not listed on the App Store yet."
    >
      <DownloadPlatform />
      <figure className="campaign-feature campaign-feature-square">
        <Image src="/media/campaigns/consultation-151-overview.webp" alt="Pandit Talk app consultation campaign overview" width={1264} height={1264} sizes="(max-width: 700px) 100vw, 760px" />
        <figcaption>A visual overview of the Pandit Talk consultation experience.</figcaption>
      </figure>
      <details className="campaign-more panel">
        <summary>See more consultation artwork</summary>
        <div className="campaign-pair">
          <Image src="/media/campaigns/voice-consultation-151-classic.webp" alt="Pandit Talk voice consultation campaign in a classic green style" width={1254} height={1254} sizes="(max-width: 700px) 100vw, 380px" />
          <Image src="/media/campaigns/voice-consultation-151-gen-z.webp" alt="Pandit Talk voice consultation campaign in a colourful Gen Z style" width={1254} height={1254} sizes="(max-width: 700px) 100vw, 380px" />
        </div>
      </details>
      <section className="panel info-card">
        <h2>Need help signing in?</h2>
        <p>Account access, OTP and phone linking tips are in the help centre. The Play Store link opens Google’s listing — it does not create a booking.</p>
        <p className="sr-only" id="download-help-hint">Arrow keys move between account help, Play Store, iOS waitlist, draft and Pandit profiles. Escape blurs the focused link.</p>
        <LinkKeyboardGroup className="actions" aria-label="Download help next steps" aria-describedby="download-help-hint">
          <Link className="text-link" href="/help/account-access">Help with your account →</Link>
          <a className="text-link" href={PLAY_STORE_URL} rel="noopener noreferrer" target="_blank">
            Google Play listing <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <Link className="text-link" href="/download#ios">iPhone App Store waitlist →</Link>
          <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          <Link className="text-link" href="/tools">Try free tools →</Link>
          <Link className="text-link" href="/pandits">Explore Pandits →</Link>
          <Link className="text-link" href="/contact">Contact support →</Link>
        </LinkKeyboardGroup>
      </section>
    </InformationPage>
  );
}
