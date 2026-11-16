import Link from 'next/link';
import { LinkKeyboardGroup } from '@/components/site/LinkKeyboardGroup';
import { supportEmail } from '@/content/siteIdentity';
import { InformationPage } from '../about/InformationPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'How Pandit Talk supports keyboard use, assistive technology, reduced motion and reporting accessibility barriers.',
  alternates: { canonical: '/accessibility' },
};

export default function Page() {
  const a11yMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Accessibility issue: [page URL]')}&body=${encodeURIComponent('Page:\nWhat blocked you:\nDevice / browser / assistive technology:\n')}`;

  return (
    <InformationPage
      eyebrow="Accessibility"
      title="Room to use the service."
      intro="A calmer experience should also be an easier one to navigate. Here is what is in place today, and how to tell us when something blocks you."
    >
      <section className="panel info-card">
        <h2>What is already in place</h2>
        <ul>
          <li>Desktop main navigation and the open mobile menu support Arrow / Home / End between links; Escape still closes the menu and returns focus to the Menu control. Skip link remains <code>#site-content</code>.</li>
          <li>Horoscope zodiac chips select with Arrow / Home / End and clear with Escape; daily readings stay free.</li>
          <li>Chat “Jump to latest” focuses the newest message; media device selects reset to system default with Escape.</li>
          <li>Account navigation Escape returns focus to the current section; notification and report load failures include draft or contact recovery.</li>
          <li>Sign-in phone field clears with Escape before Send code (consent still never blocks Send code); Apple/Google without consent focus the consent checkbox.</li>
          <li>Profile birth validation focuses the invalid date or time field; notification preference status dismisses with Escape.</li>
          <li>Legal policy tables blur on Escape; Go back labels refresh after bfcache restore.</li>
          <li>Download Android actions include a prepare-draft path; notify success copy covers journal and article placements (source still required).</li>
          <li>Saved reports, private story, notification preferences, home overview, guidance Pandit step and directory load failures move focus to the alert so keyboard users hear recovery options.</li>
          <li>A skip link in the site header moves keyboard focus to <code>#site-content</code>, with a visible focus outline.</li>
          <li>Deep links to <code>/how-it-works#booking-availability-how</code>, <code>/trust#how-to-check</code>, and the home <code>#booking-availability</code> region scroll and focus those blocks (honouring reduced motion).</li>
          <li>Legal “Skip to document” and on-this-page links focus the document start or section heading after scrolling (honouring reduced motion).</li>
          <li>Contact and For Pandits pages include attributed waitlist forms (<code>website_contact</code>, <code>website_for_pandits</code>).</li>
          <li>About, Our approach, Trust, Editorial, Disclaimer and Pricing policy pages link to the live timed-booking explanation and recovery paths.</li>
          <li>Page landmarks use semantic headings; forms aim for labelled fields and status or alert messages where feedback is shown.</li>
          <li>Escape closes the mobile menu, confirmation dialogs, and open Pandit filter panels (focus returns to the filter control); it also clears focused help or Pandit search fields where noted, and collapses the focused home FAQ item. Home FAQ summaries also support Arrow keys, Home and End between questions.</li>
          <li>Legal on-this-page links keep the current section scrolled into view as you move through long documents.</li>
          <li>Account navigation and journal category chips keep the current item scrolled into view on narrow screens, honouring <code>prefers-reduced-motion</code>. Journal chips and legal policy tabs also support Arrow / Home / End.</li>
          <li>Footer CTA row stacks below tablet widths so large text and zoom do not force sideways scrolling; topic links clamp and wrap.</li>
          <li>Notifications offer Refresh with a busy state; misspelled or empty filters keep recovery links.</li>
          <li>Guidance booking notices use <code>role=&quot;status&quot;</code>; waitlist success copy mentions draft persistence for guidance sources.</li>
          <li>Route and global error pages include draft, Pandits, tools and help recovery links.</li>
          <li>Help centre search uses a dedicated search landmark; Enter or ↓ jumps to the first match and Escape clears the query.</li>
          <li>Chat drafts persist in session storage per booking; Escape clears the draft field.</li>
          <li>Audio/video rooms autofocus Join when ready and Rejoin after leaving; leaving the room keeps a clear rejoin path with join help.</li>
          <li>Bookings filter Escape returns to “All”; missing booking pages focus the recovery heading.</li>
          <li>Journal category chips show a swipe hint when overflowing; Escape returns to All when a category is selected.</li>
          <li>Legal on-this-page lists support Arrow / Home / End between section links.</li>
          <li>Phone-change autofocuses the number field and explains SMS codes.</li>
          <li>Global error recovery includes draft, Pandits, tools, help and booking-update links.</li>
          <li>404 and post-deletion pages move focus to the heading so keyboard and screen-reader users land on recovery options.</li>
          <li>Primary controls target roughly 44×44 CSS pixels where layout allows.</li>
          <li><code>prefers-reduced-motion</code> turns off decorative transitions and scroll animation where we add motion — including focus-on-heading and reading-result scroll.</li>
          <li>Layouts reflow for narrow viewports and larger browser text sizes; the home hero stacks below tablet widths, and story / topic / footer grids wrap earlier so zoomed text does not force sideways scrolling.</li>
          <li>Long policy and article tables may still need horizontal swipe on small screens.</li>
          <li>Waitlist and notify forms announce success or errors and return focus to the status message; Escape clears an incomplete email; you can switch email after joining.</li>
          <li>Footer “Back to top” returns focus to <code>#site-content</code>, matching the skip link.</li>
          <li>Saved reports focus missing or error alerts; wallet refresh announces busy state; recharge focuses its heading.</li>
          <li>Bookings list focuses the empty-state panel when a filter yields no rows; load failures include draft and contact recovery.</li>
          <li>Private story confirmations use Escape and make the editor inert while open; story share booking failures focus the alert; chat and media session dialogs mark action buttons explicitly.</li>
          <li>Customer home overview focuses load failures and offers bookings, wallet, draft and contact recovery.</li>
          <li>Missing Pandit profiles offer draft, directory and waitlist recovery; load failures use an alert role with retry.</li>
          <li>Paused detailed-report pages expose a focusable waitlist region with an attributed notify form.</li>
          <li>Account privacy controls move focus to the page heading on load.</li>
          <li>Guidance notes, preferred date, format radios and Pandit select clear with Escape; Pandit-step load failures include directory and contact recovery.</li>
          <li>Private story drafts clear with Escape; story load failures include draft and contact recovery.</li>
          <li>Pandit application text fields clear with Escape; For Pandits <code>#apply</code> re-focuses after bfcache restore.</li>
          <li>Profile personal and birth fields clear or reset with Escape on the focused control.</li>
          <li>Pandit directory topic, language and sort selects reset with Escape; help search ↑ from the first result returns to the field.</li>
          <li>Review ratings clear with Escape; wallet empty and error panels honour reduced-motion when focused.</li>
          <li>Notify waitlist status Escape returns focus to the email field (source still required).</li>
          <li>Session missing or wrong-format alerts scroll into view with reduced-motion awareness.</li>
          <li>Palm photos clear with Escape; tool print status dismisses with Escape.</li>
          <li>OTP Escape clears a typed code, or returns to phone entry when empty (consent still never blocks Send code).</li>
          <li>Social and auth status messages dismiss with Escape where noted.</li>
          <li>Private story empty state and Pandit profiles with no reviews focus those empty panels.</li>
          <li>Download <code>#ios</code> re-focuses after bfcache restore; cookie inventory tables blur on Escape.</li>
          <li>Account settings cards support Arrow / Home / End; help empty-search Escape clears the query.</li>
          <li>Home story steps and learning cards keep <code>min-width:0</code> so large text does not force sideways scroll.</li>
          <li>Payment reference and Go back controls dismiss or blur with Escape; global-error history labels refresh on <code>pageshow</code>.</li>
          <li>Large-text topic grids use fixed two-column <code>minmax(0,1fr)</code> tracks so 200% browser text does not force sideways scroll; footer link columns also clamp with <code>minmax(0,…)</code>.</li>
          <li>Tool birth fields (name, date, time, city) clear with Escape, matching coordinates.</li>
          <li>Auth status and error messages dismiss with Escape (Send code still unconstrained by consent).</li>
          <li>Route error headings re-focus after bfcache <code>pageshow</code>.</li>
          <li>Contact email shortcuts blur with Escape; footer link columns support Arrow / Home / End / Escape.</li>
          <li>Chat empty conversation panel focuses once when the room is connected with no messages yet.</li>
          <li>Article Share / Copy link support Arrow / Home / End between the two actions.</li>
          <li>Pricing payment-help section includes draft, free-tools and contact recovery.</li>
          <li>Customer home empty overview notice blurs with Escape after focus.</li>
          <li>Saved reports: Escape dismisses print status; Arrow / Home / End move between report cards.</li>
          <li>Notifications empty inbox focuses on first load; status messages dismiss with Escape.</li>
          <li>Phone-change and profile save status dismiss with Escape; profile photo Escape clears a chosen file.</li>
          <li>Guidance deep-link and storage notes dismiss with Escape; media and chat confirmation Escape uses <code>preventDefault</code>.</li>
          <li>Wallet transactions support Arrow / Home / End; payment-reference Escape returns focus to Copy.</li>
          <li>Help empty-search ↑ returns to the field; session wrong-format recovery includes free tools.</li>
          <li><code>FocusMainHeading</code> re-focuses after bfcache <code>pageshow</code>; private story save status dismisses with Escape.</li>
          <li>Grievance page includes attributed waitlist (<code>website_grievance</code>) plus draft and free-tools paths.</li>
          <li>Bookings list, customer home tiles and tools grids support Arrow / Home / End (Escape blurs); verify-without-consent focuses the consent checkbox (Send code still unconstrained).</li>
          <li>Help articles include attributed waitlists (<code>website_help_*</code>) and keyboard-related topic lists; 404 and this page offer attributed notify forms (<code>website_404</code>, <code>website_accessibility</code>).</li>
          <li>Directory empty Escape clears active filters; Pandit reviews-empty and booking status notices dismiss with Escape.</li>
          <li>Payment reference actions support Arrow keys; article Share includes Hide link in the move set when shown.</li>
          <li>Refund policy waitlist uses attributed <code>website_refund_policy</code> (separate from refund replies).</li>
          <li>Footer quick actions and 404 destination lists support Arrow / Home / End / Escape.</li>
          <li>Pandit sticky bar hides with Escape and returns focus to the primary draft CTA.</li>
          <li>Global error re-focuses its heading after bfcache <code>pageshow</code>.</li>
          <li>Home overview and preference load errors blur with Escape; contact recovery links support Arrow keys.</li>
          <li>Auth status Escape returns focus to phone or OTP (Send code still unconstrained by consent).</li>
          <li>Directory cards and notify rows stack earlier under large text so zoom does not force sideways scroll.</li>
          <li>Cookie policy, delete-account, account privacy, and privacy/terms footers include attributed waitlists (<code>source</code> required) and Arrow / Home / End recovery links.</li>
          <li>Reports, notifications, bookings, chat and media errors dismiss with Escape and include free-tools recovery paths.</li>
          <li>Notification cards support Arrow / Home / End between action links; reading next-steps and account shortcuts do the same.</li>
          <li>Kundli house grids keep <code>minmax(0,1fr)</code> and wrap under large text.</li>
          <li>Profile, private story, directory, guidance Pandit-step and bookings-list load errors blur with Escape and use Arrow / Home / End recovery groups.</li>
          <li>Missing Pandit profiles, empty bookings/journal/author states, wallet recharge, download Android actions, route-error recovery, chat/media error and rejoin clusters support Arrow / Home / End / Escape.</li>
          <li>Invalid horoscope zodiac hints dismiss with Escape and return focus to the sign chips (daily readings stay free).</li>
          <li>Session missing / wrong-format / not-resumable / load-error recovery clusters and session help links support Arrow / Home / End / Escape.</li>
          <li>Help empty-search recovery, Pandit application success steps, About / Trust / How it works / Our approach / Editorial / Pricing / Grievance / Disclaimer action rows, and home hero CTAs use Arrow / Home / End / Escape.</li>
          <li>Header account links support Arrow / Home / End / Escape; skip link remains <code>#site-content</code>. Auth help links are keyboard-grouped (Send code still unconstrained by consent).</li>
          <li>Phone-change help and signed-in delete-account before / form / error / confirm actions support Arrow / Home / End / Escape.</li>
          <li><code>LinkKeyboardGroup</code> may render as a paragraph for inline help link rows; NotifyOpenForm / OfferNotice still require <code>source</code>.</li>
          <li>Wallet load/zero-balance recovery, cancelled payment follow-up links, booking cancel/session/review clusters, home Pandit preview, help article CTAs, tools footer, download help, disclaimer/refund/pricing-policy rows, and grace-refund status focus support Arrow / Home / End / Escape.</li>
          <li>Footer help CTA wraps under large text; footer link boxes use <code>box-sizing:border-box</code> to reduce horizontal overflow at 200% zoom.</li>
          <li>Guidance start aside, step strip, Back/Continue/Start fresh and clear-draft confirm use Arrow / Home / End / Escape (<code>NotifyOpenForm</code> still requires <code>source</code>).</li>
          <li>Chat and media live controls plus grace / leave / end confirms use <code>LinkKeyboardGroup</code>; media Join + join-help share one keyboard group.</li>
          <li>Booking cancel confirm, wallet pending/cancelled follow-ups, notification card actions and preference shortcut support Arrow / Home / End / Escape.</li>
          <li>Contact subject shortcuts and recovery links, payment-reference Copy/Email/wallet, phone-updated sign-in row, and footer bottom support/policy links use <code>LinkKeyboardGroup</code> (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent).</li>
          <li>Guidance index/topic CTAs and related-topic rows, private-story pause/form/confirm/edit rows, profile save + inline help, Apple sign-in row, article Share/Copy/Hide, home FAQ footer help, OfferNotice next-step links, and chat/media control hints support Arrow / Home / End / Escape. <code>LinkKeyboardGroup</code> may render as <code>span</code>; OfferNotice/NotifyOpenForm still require <code>source</code>.</li>
          <li>Article related grids and empty-related recovery, Consult CTA “more ways” links, how-it-works find step, contact inbox rows, accessibility report actions, help pause/email rows, download iOS follow-ups, home overview glance links, For Pandits review/next links, and notify error/switch rows support Arrow / Home / End / Escape (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Guidance topic card grid + booking aside, help index pause/contact inboxes, help search Clear/Jump, help-article tools + grievance paths, contact booking alternatives, cookie footer, editorial journal/correction, bookings/tools/customer-home pause asides, wallet recharge + paid-tool lists, home conversation/topics/learning/closing/story groups, AuthForm Send code/Resend keyboard row (consent still never blocks Send code), Pandit sticky draft actions, trust how-to-check/privacy/practitioner/evidence rows, and disclaimer trust links support Arrow / Home / End / Escape. OfferNotice/NotifyOpenForm still require <code>source</code>.</li>
          <li>Saved-report Print/PDF + free-tool row, wallet recharge-pause inline links, profile-setup pause links, tool birth-details next steps, AuthForm Terms/Privacy consent links (Send code still unconstrained by consent), home-overview booking/wallet/updates retry rows, Pandit profile primary draft CTA in the shortcut group, account pause next steps, grievance pause links, pricing wallet/bookings columns, About organization contact row, and directory View profile + draft actions support Arrow / Home / End / Escape (skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Legal policy tabs and document TOC support Escape blur; footer column navs, OfferNotice next steps, guidance index/topic rows, For Pandits apply clusters, tools paused/footer links, pricing help columns, Auth help row, Consult CTA more-ways, Home FAQ help, and Pandit application success steps include keyboard hints (Send code still unconstrained; skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>About / Our approach / Trust / How it works / home hero·conversation·story·closing, reports empty/missing/load/shortcuts, notifications error/invalid/empty/prefs (+ Mark as read <code>aria-busy</code>), directory load/empty/card/preview, wallet load/zero/empty, private-story pause/confirm/load/empty/edit, disclaimer + refund next steps, guidance review, home-overview empty/error (fixed missing empty hint id), and phone-change updated/verify/help (+ Send/Verify <code>aria-busy</code>) use keyboard hints via <code>aria-describedby</code>. Skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Editorial labelling/journal/correction, grievance contact/everyday/policies, help-article pause/next/email, help-index pause, contact booking alternatives + help-centre column, empty journal, download help, 404 destinations, author profile/empty, pricing-policy related nav, disclaimer trust span, and Pandit missing/draft/reviews-empty clusters now expose keyboard hints via <code>aria-describedby</code>. Skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Home overview toolbar (Refresh + free tools + draft), glance wallet/updates/reports/empty-status rows, AuthForm Terms/Privacy consent link hints (Send code still unconstrained), profile help links, customer-home wallet-pause row, article category/byline + related browse/empty-related tools, Pandit application error recovery, footer support/policy distinct hints, and guidance topic pause free-tools link use <code>aria-describedby</code>. Skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Bookings list toolbar + detail recovery/cancel/session/review clusters, wallet recharge-pause/toolbar/transaction follow-ups, notification toolbar + per-card actions, private-story share booking recovery, Pandit bio journal/trust/editorial links, OfferNotice free-tools/draft links, legal privacy/terms footer notify next steps, paid-tool conversation alternatives, tool birth-details next steps, profile/account pause rows, SocialSignIn keyboard hint (Send code still unconstrained), session status bfcache re-focus, and download help free-tools/contact links use Arrow / Home / End / Escape. Skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Article Share/Copy <code>aria-busy</code>, NotifyOpenForm submit <code>aria-busy</code>, Apple sign-in <code>aria-busy</code>, Android download free-tools row, directory filtered-empty + card + home preview recovery, payment-status status clusters + footer free tools, home hero draft + conversation/story/closing free-tools/draft rows, account-privacy pause/manage/offer keyboard groups, wallet footer tools/draft, recharge paused free-tools link, profile help free tools, and desktop nav Escape blur (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Signed-in mobile menu draft/tools/booking pause row, AuthForm pause alternatives + help free-tools/draft, For Pandits trust/how-it-works recovery rows, Pandit application Privacy/Terms keyboard links + how-it-works recovery, Pandit sticky/profile free-tools, reports toolbar + print/shortcuts draft links, private-story pause/empty free tools, disclaimer/404 notify keyboard alternatives, article-share post-status follow-ups, ToolForm after-reading contact, account sign-out free tools, Home FAQ prepare-draft help, and large-text stacking for info-columns / journal-consult / contact-quick / auth-help (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Closed mobile nav stays <code>aria-hidden</code>/<code>inert</code> and clipped from layout; topic / text-link / hero-secondary / learning CTA rows wrap under large text; footer stacks to one column by 900px; profile form grids stack earlier; OfferNotice hint ids stay unique per <code>source</code>; account sign-out / chat / media Escape returns focus; phone OTP empty Escape returns to the number field; customer-nav Escape blurs when already on the current section; tool coordinate and zodiac alerts use labelled names (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Chat ended / grace / reconnect rows, media rejoin / grace, account shortcuts / sign-out / preference-load / phone-updated, booking cancel / review-wait / shortcuts, guidance Pandit-load, help empty-search, PaidTool list, wallet recharge-pause, and directory/phone large-text CSS now include free-tools + draft recovery (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>About approach/trust/next/org, Contact booking/help, For Pandits dashboard/apply/before/after, Trust next, Pricing wallet/bookings, Tools paused/footer, a11y report, story load, directory filter-panel, legal footer, home tiles/wallet-pause, preference checkbox <code>aria-busy</code>, phone Resend <code>aria-busy</code>, route-error skip hint, and large-text stacking for filters-actions / tarot / kundli / legal-footer / profile-top (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Help index pause (+ free tools) and contact inboxes (+ tools/draft), How-it-works find/prepare/after + notify alternatives, Our approach story/boundary/next + notify alternatives, Editorial correction + notify alternatives, Pricing notify alternatives, Refund pause/places/next + notify alternatives, footer CTA hint before actions, NotifyOpenForm follow-up hint, account settings grid hint before cards, ToolForm zodiac/tarot keyboard hints + after-reading source note, chat leave-confirm draft link, and large-text stacking for home-tiles / profile-sticky / journal-filters / zodiac / guidance-steps (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Social sign-in failure recovery (phone Send code / tools / draft), Pandit application error tools+draft, empty journal draft link, chat ended/controls + media controls/join hint order, media camera <code>aria-busy</code>, home-glance/empty-status hint order + draft, bookings pause/empty hint order + filtered-empty tools, footer nav hint order, public/customer/journal/legal loading recovery rows, and large-text stacking for journal-empty / sticky CTA / glance lists (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Profile / profile-setup Suspense + inline profile loading, Pandit profile loading, session / bookings / reports / wallet / notifications / home-overview loading, and directory searching now expose free-tools + draft recovery; home-glance booking/wallet/updates retries include tools+draft; booking Refresh buttons use <code>aria-busy</code>; Help search Clear/Jump row adds tools+draft; Contact recovery adds booking updates with hint-before-actions; PaidTool notify follow-ups; FooterNav hint precedes column headings; guidance-steps stay single-column at phone widths with contact-quick / offer-notice / link-list large-text stacking (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Wallet toolbar + pending/cancelled tx follow-ups and booking session actions include Prepare a draft; notifications toolbar/loading include tools+draft; payment-status clusters use shared Escape-blur notices with draft recovery; Auth help adds booking updates (Send code still unconstrained); recharge notify alternatives keep attributed <code>source</code>; home-glance unread row and guidance Pandit-loading include tools/draft; empty journal Escape-blur shell; reading next steps include disclaimer; customer toolbar stacks earlier under large text; help-search / home-tiles large-text stacking (skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Session / reports / wallet / prefs / profile / story / bookings / directory / guidance / home-overview / notifications Try again (and Retry) controls use <code>aria-busy</code> + disabled while reloading; session recovery/help, reports, bookings, notifications, home empty/error, guidance empty/explore, story share, legal TOC, and chat-error hints note skip remains <code>#site-content</code>; guidance empty Pandit list keeps Stay on draft; large-text stacking for expert-row actions, wallet transactions, journal grid, guidance review <code>dl</code>, and customer toolbar/card headers (Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Bookings prepare-another-draft / cancel-confirm / review-submit clusters, signed-in delete form+final confirm, public delete-done draft+notify alternatives, guidance clear-confirm + start aside, private-story form/card actions, legal Skip-to-document tools/draft, legal-tab Escape-to-current, cookie footer Escape-blur, footer bottom draft link, reading medical/disclaimer Escape-blur, route/global error Try again <code>aria-busy</code>, and large-text stacking for legal-tabs / confirm dialogs / form action rows (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Home-glance booking/wallet/updates Try again use <code>aria-busy</code>+disabled; notifications caught-up + unread-empty add tools/draft keyboard rows; account-privacy manage adds draft; phone Send/Verify rows add tools/draft + skip hints; prefs + private-story loading expose tools/draft; story delete/share confirms add tools/draft; guidance review Stay-on-draft + skip hints; tool reading Clear/Print adds tools/draft; reports empty/print skip hints; bookings toolbar skip hint; For Pandits dashboard skip hint; Auth returnTo notice Escape-blur (Send code still unconstrained); PaidTool/Pandit reviews/birth-details skip notes; large-text stacking for auth actions, filters toolbar, at-a-glance, tool/guidance/report/notification/info-column rows (skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Profile save + Pandit application success add free tools/draft; chat/media live controls and grace/leave/end confirms include tools/draft (+ wallet on grace); notification per-card + prefs shortcuts add tools/draft; directory filter toolbar adds tools/draft and load hint notes skip; 404 primary recovery notes skip remains <code>#site-content</code>; large-text stacking for session/notification/filter/profile action rows (Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Booking error/missing + bookings/reports grids note skip <code>#site-content</code>; chat leave-ended adds booking + draft/tools; account pause/shortcuts, recharge list/footer, PaidTool actions (+ booking updates) and conversation, guidance topic draft/related/pause (+ Prepare a draft), download Android, Consult CTA, directory empty/filtered/card, how-it-works pricing/join/format/story (+ tools/draft), delete-account prep/stay, pricing-policy related, and Home FAQ help hints now note skip; large-text stacking for info-card / tool-flow lists / journal-consult / download actions (Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Chat empty-log Escape blur + tools/draft recovery; Jump-to-latest Escape blur; notifications main <code>aria-busy</code> and Escape on status also clears Unread-only; reports/auth/account/prefs/phone/delete mains announce busy; live vs saved reading next-step hint ids; Pandit published reviews Arrow/Home/End + after-reviews tools/draft; media session/camera status Escape blur + Check-devices keyboard group with tools/draft; customer-home wallet-pause Escape blur; Go back Escape hint (skip remains <code>#site-content</code>); skip-link Escape blur; article Share keyboard hint; large-text stacking for journal-share / chat-empty / media / account-grid / reviews (Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Soft-404 shell Escape + tools/draft/how-booking links beside notify; empty article body recovery; unknown guidance topic uses SoftResourceNotFound (not global 404); home/how-it-works/tools hash waitlist Escape blur; palm replacement errors state previous photo cleared; reading palm note links disclaimer; profile/prefs save + sign-out failures add recovery; payment status without reference adds payment help + contact; tool-form errors add tools help (skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>).</li>
          <li>Soft-404 recovery + notify rows, new-booking alternatives, empty article body, account sign-out/preference pause/save recovery, profile save recovery, Auth sign-in error recovery (Send code still unconstrained), booking detail loading + post-review more-steps, notifications pause, media consultation-ended, and tool-form reading error clusters now expose keyboard hints via <code>aria-describedby</code>. Skip remains <code>#site-content</code>; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Empty private-story / wallet / notifications / Pandit-reviews / article-body / author-articles, closed booking session, chat empty-log, guidance draft-storage, article Share follow-up + clipboard recovery, payment unrecognized / no-provider status, Contact booking-alt + email-subjects + recovery, Trust concern links, OfferNotice next steps (hint id unique per <code>source</code>), and NotifyOpenForm follow-ups now expose keyboard hints via <code>aria-describedby</code>. Skip remains <code>#site-content</code>; Auth Send code still unconstrained by consent; <code>newBookingBlock</code> keeps “No coins will be charged”; NotifyOpenForm/OfferNotice still require <code>source</code>.</li>
          <li>Customer-nav pause links use <code>LinkKeyboardGroup</code>; private-story pause, soft-404 recovery/notify, OfferNotice, disclaimer trust/next/notify, tools free/paused/guidance, guidance-topic pause, home topics/learning, privacy/404 notify, and missing-Pandit recovery hints note skip remains <code>#site-content</code>; global-error recovery gains an <code>aria-describedby</code> keyboard hint; chat-queue error Escape blur + status Escape dismiss; reading palm/general disclaimer links are keyboard-grouped; large-text stacking for pause notes and soft-404/reading wrap (Auth Send code still unconstrained by consent; NotifyOpenForm/OfferNotice still require <code>source</code>; <code>newBookingBlock</code> keeps “No coins will be charged”).</li>
        </ul>
      </section>
      <aside className="notice offer-notice" role="status" aria-label="Booking availability">
        <p>
          <strong>Need help using timed bookings?</strong> This guidance is separate from accessibility reports.{' '}
          <span className="sr-only" id="a11y-offer-hint">Arrow keys move between how booking works, free tools and draft. Escape blurs. NotifyOpenForm still requires source.</span>
          <LinkKeyboardGroup as="span" aria-label="Accessibility page booking updates" aria-describedby="a11y-offer-hint">
            <Link href="/how-it-works#booking-availability-how">How booking will work</Link>
            {' · '}
            <Link href="/tools">Try free tools</Link>
            {' · '}
            <Link href="/guidance/start">Prepare a draft</Link>
          </LinkKeyboardGroup>
        </p>
      </aside>
      <section className="panel info-card">
        <h2>What we are still improving</h2>
        <ul>
          <li>Deeper testing with screen readers across every journey — we do not claim a full WCAG audit result yet.</li>
          <li>Long Hindi and bilingual text layouts on very narrow screens.</li>
          <li>Clearer empty, loading and error states across remaining account tools.</li>
        </ul>
      </section>
      <section className="panel info-card">
        <h2>Tell us what blocked you.</h2>
        <p>Email <a href={a11yMailto}>{supportEmail}<span className="sr-only"> (opens your email app)</span></a> with the page you were using and the difficulty you encountered. Details about your device, browser or assistive technology can help us understand the issue.</p>
        <p className="sr-only" id="a11y-report-keys">Arrow keys move between report actions. Escape blurs the focused control. Skip remains site-content.</p>
        <LinkKeyboardGroup className="actions" aria-label="Report an accessibility issue" aria-describedby="a11y-report-keys">
          <a className="button" href={a11yMailto}>Report an accessibility issue <span aria-hidden="true">↗</span><span className="sr-only"> (opens your email app)</span></a>
          <Link className="button secondary" href="/contact">Contact support</Link>
          <Link className="button secondary" href="/tools">Try free tools</Link>
          <Link className="button secondary" href="/guidance/start">Prepare a draft</Link>
          <Link className="text-link" href="/help">Help centre →</Link>
        </LinkKeyboardGroup>
      </section>
    </InformationPage>
  );
}
