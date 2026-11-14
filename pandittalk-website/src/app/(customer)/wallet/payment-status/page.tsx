import Link from 'next/link';
import type { Metadata } from 'next';
import { EscapeBlurNotice } from '@/components/site/EscapeBlurNotice';
import { FocusMainHeading } from '@/components/site/FocusMainHeading';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { PaymentReferenceActions } from './PaymentReferenceActions';

export const metadata: Metadata = {
  title: 'Payment status',
  description: 'Check your Pandit Talk wallet for the final status after a payment attempt. Do not retry the same payment until you have reviewed your balance.',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; paymentId?: string; status?: string; reference?: string }>;
}) {
  const params = await searchParams;
  const reference = params.orderId || params.paymentId || params.reference;
  const knownStatus = typeof params.status === 'string' ? params.status.trim().toLowerCase() : '';
  const statusHint = ['pending', 'failed', 'cancelled', 'canceled', 'success', 'paid', 'captured', 'authorized', 'refunded', 'credited'].includes(knownStatus)
    ? knownStatus
    : null;

  return (
    <main id="main-content" className="page stack">
      <FocusMainHeading id="payment-status-title" />
      <Link className="text-link" href="/wallet">← Your wallet</Link>
      <p className="eyebrow">After a payment attempt</p>
      <h1 id="payment-status-title" tabIndex={-1}>Check your wallet for the final status</h1>
      <p className="lede">
        This page is guidance only — it does not confirm a payment, credit coins, or start a recharge by itself.
        {reference ? <> Reference on this visit: <strong>{reference}</strong>.</> : <> No payment reference was included in this link.</>}
        {' '}Your wallet balance and transaction history are the source of truth. New recharges stay paused.
      </p>
      {reference && <PaymentReferenceActions reference={reference} />}
      {!reference && (
        <EscapeBlurNotice>
          <p>If you have an order ID from your bank or payment email, open your wallet first, then email support with that reference. New recharges are not open yet, so this page is mainly for earlier attempts. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-no-ref-hint">Arrow keys move between recovery links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Payment status without reference" aria-describedby="payment-no-ref-hint">
            <Link className="button" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/contact">Contact support</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/tools">Try free tools →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      {statusHint && ['success', 'paid', 'captured', 'credited', 'refunded'].includes(statusHint) && (
        <EscapeBlurNotice>
          <p><strong>Provider hinted {statusHint}.</strong> That hint is not a wallet credit confirmation. Open your wallet next and confirm the balance and transaction history before assuming coins moved. New recharges stay paused — do not start another payment from this page. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-success-hint">Arrow keys move between next steps. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="After a success hint" aria-describedby="payment-success-hint">
            <Link className="button" href="/wallet">Open wallet and confirm coins</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/help/coins-and-payment-pending">Payment help →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      {statusHint && ['pending', 'authorized'].includes(statusHint) && (
        <EscapeBlurNotice>
          <p><strong>Provider status hint: {statusHint}.</strong>{statusHint === 'authorized' ? ' Authorized does not mean coins are in your wallet yet.' : ''} Wait a few minutes, then refresh your wallet. Do not retry the same payment until you have checked the balance. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-pending-hint">Arrow keys move between pending-payment links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="While payment is pending" aria-describedby="payment-pending-hint">
            <Link className="button secondary" href="/wallet">Refresh wallet</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      {statusHint && ['failed', 'cancelled', 'canceled'].includes(statusHint) && (
        <EscapeBlurNotice>
          <p><strong>Provider status hint: {statusHint}.</strong> Check your wallet to confirm no coins were added, then use payment help or contact support with your reference. Do not retry blindly from this page. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-failed-hint">Arrow keys move between failed-payment links. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="After a failed payment hint" aria-describedby="payment-failed-hint">
            <Link className="button secondary" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      {params.status && !statusHint && (
        <EscapeBlurNotice>
          <p>The status value in this link was not recognized. Check your wallet transaction history for the final result — do not retry a payment based on this page alone, and do not treat this page as a “still waiting” signal. Opening this page never credits coins. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-unrecognized-hint">Arrow keys move between wallet, payment help, support, free tools and draft. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Unrecognized payment status" aria-describedby="payment-unrecognized-hint">
            <Link className="button secondary" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/contact">Contact support</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="text-link" href="/guidance/start">Prepare a draft →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      {reference && !params.status && (
        <EscapeBlurNotice>
          <p><strong>No provider status in this link.</strong> Pending payments can take a few minutes to settle. Check your wallet balance and history before retrying — this page does not confirm coins moved, and new recharges stay paused. Press Escape to leave this notice.</p>
          <p className="sr-only" id="payment-no-provider-hint">Arrow keys move between wallet, payment help, free tools, draft and support. Escape blurs. Skip remains site-content.</p>
          <LinkKeyboardGroup className="actions" aria-label="Payment status without provider status" aria-describedby="payment-no-provider-hint">
            <Link className="button secondary" href="/wallet">Open wallet</Link>
            <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
            <Link className="button secondary" href="/tools">Try free tools</Link>
            <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
            <Link className="text-link" href="/contact">Contact support →</Link>
          </LinkKeyboardGroup>
        </EscapeBlurNotice>
      )}
      <p className="sr-only" id="payment-footer-hint">Arrow keys move between wallet and help links. Escape blurs the focused link. Skip remains site-content.</p>
      <LinkKeyboardGroup className="actions" aria-label="Payment status next steps" aria-describedby="payment-footer-hint">
        <Link className="button" href="/wallet">Open wallet</Link>
        <Link className="button secondary" href="/help/coins-and-payment-pending">Payment help</Link>
        <Link className="button secondary" href="/wallet/recharge">Why recharge is paused</Link>
        <Link className="button secondary" href="/tools">Try free tools</Link>
        <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
        <Link className="text-link" href="/pricing">Pricing terms →</Link>
        <Link className="text-link" href="/contact">Contact support →</Link>
      </LinkKeyboardGroup>
    </main>
  );
}
