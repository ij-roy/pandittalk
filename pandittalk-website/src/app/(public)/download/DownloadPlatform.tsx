'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLAY_STORE_URL } from '@/lib/articles/site';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { NotifyOpenForm } from '@/components/site/NotifyOpenForm';

function detectIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(ua) || touchMac;
}

export function DownloadPlatform() {
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(detectIos());
  }, []);

  useEffect(() => {
    function focusIosSection() {
      if (typeof location === 'undefined' || location.hash !== '#ios') return;
      requestAnimationFrame(() => {
        const target = document.getElementById('ios-download-title');
        if (!target) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        target.focus({ preventScroll: true });
      });
    }
    focusIosSection();
    window.addEventListener('hashchange', focusIosSection);
    // bfcache restore keeps #ios without hashchange — re-focus then.
    window.addEventListener('pageshow', focusIosSection);
    return () => {
      window.removeEventListener('hashchange', focusIosSection);
      window.removeEventListener('pageshow', focusIosSection);
    };
  }, []);

  const android = (
    <section className="panel info-card" key="android">
      <p className="info-label">Android</p>
      <h2>Android app on Google Play</h2>
      <p>Sign in with the same Indian mobile number to open wallet, bookings and reports on Android where supported. Opening the Play Store listing does not create a website booking or charge coins here.</p>
      <p className="expert-meta">The Android app and website use timed Chat Now and Book Session rules. Prices and durations come from the booking service and are shown in the confirmation step.</p>
      <p className="sr-only" id="download-android-hint">Arrow keys move between Play Store, draft, free tools and booking-update links. Escape blurs.</p>
      <LinkKeyboardGroup className="actions" aria-label="Android download next steps" aria-describedby="download-android-hint">
        <a className="button" href={PLAY_STORE_URL} rel="noopener noreferrer" target="_blank">
          Open Google Play <span aria-hidden="true">↗</span>
          <span className="sr-only"> (opens in a new tab; timed in-app packages may still apply)</span>
        </a>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="text-link" href="/pandits">Explore web booking →</Link>
      </LinkKeyboardGroup>
      {ios && (
        <p className="expert-meta" style={{ marginTop: 12 }}>
          On an iPhone? Use the App Store waitlist on this page — there is no iOS listing yet.
        </p>
      )}
    </section>
  );

  const apple = (
    <section className="panel info-card" key="ios" aria-labelledby="ios-download-title">
      <p className="info-label">iPhone · not on the App Store yet</p>
      <h2 id="ios-download-title" tabIndex={-1} onKeyDown={event => {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        (event.currentTarget as HTMLElement).blur();
      }}>{ios ? 'You’re on iPhone — join the waitlist' : 'Coming to the App Store'}</h2>
      <p>
        Pandit Talk is <strong>not available on the App Store yet</strong>. This email list is only for App Store launch updates.
      </p>
      <NotifyOpenForm
        source="website_ios_waitlist"
        submitLabel="Notify me about iOS"
        helpText="App Store launch emails only. Separate from booking or recharge updates. See our"
      />
      <p className="sr-only" id="download-ios-hint">Arrow keys move between waitlist follow-up links. Escape blurs.</p>
      <LinkKeyboardGroup className="actions download-ios-actions" style={{ marginTop: 12 }} aria-label="iOS waitlist follow-up links" aria-describedby="download-ios-hint" as="p">
        <span>Prefer to book now? <Link href="/pandits">Explore Pandits</Link></span>
        <Link href="/guidance/start">Prepare a draft</Link>
        <Link href="/tools">Try free tools</Link>
        {ios ? (
          <>
            <a href={PLAY_STORE_URL} rel="noopener noreferrer" target="_blank">
              Google Play is available now
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </>
        ) : null}
      </LinkKeyboardGroup>
    </section>
  );

  return (
    <div className="info-columns">
      {ios && (
        <p className="sr-only" role="status">
          Showing the App Store waitlist first because this device looks like an iPhone or iPad.
        </p>
      )}
      {ios ? <>{apple}{android}</> : <>{android}{apple}</>}
    </div>
  );
}
