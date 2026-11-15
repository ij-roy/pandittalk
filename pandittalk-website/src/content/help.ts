export type HelpArticle = {

  title: string;

  summary: string;

  steps: string[];

  tip: string;

};



export const helpArticles: Record<string, HelpArticle> = {

  'first-consultation': {

    title: 'Preparing for a consultation',

    summary: 'New No Timer bookings are not open yet. You can browse without an account, prepare a private draft, and review how a future booking will work — nothing here creates a charge.',

    steps: [

      'Explore Pandit introductions and choose a language that feels comfortable — browsing does not open a booking.',

      'Prepare a private draft with the area and notes you want to bring (it does not notify a Pandit).',

      'When booking opens later, confirm the person, format, total and cancellation terms before any payment.',

      'Bring only what feels relevant — you do not need a perfect question.',

    ],

    tip: 'New No Timer bookings are not open yet. Preparing a draft or exploring profiles does not create a consultation or charge coins.',

  },

  'preparing-a-draft': {

    title: 'Preparing a private draft',

    summary: 'A draft saves the area, format and notes you want to bring. It does not create a booking, charge coins or notify a Pandit.',

    steps: [

      'Choose the life area that feels closest, or start without one.',

      'Pick a preferred format (chat, audio or video) as a preference only.',

      'Write a short note — even one sentence is enough.',

      'Save the draft in this browser, or sign in later to manage bookings and story notes.',

    ],

    tip: 'Clearing a draft removes it from this browser only. It never opens a conversation by itself.',

  },

  'tools-and-readings': {

    title: 'Free tools and paid reports',

    summary: 'Free tools offer automated reflection. Detailed paid reports are paused; existing purchases stay in your saved reports.',

    steps: [

      'Open a free tool such as Kundli, horoscope, compatibility, palm or tarot.',

      'Enter only details you have permission to use. Birth calculations currently support Indian Standard Time.',

      'Treat the result as a starting point for your own judgement, not a guaranteed prediction.',

      'Sign in to open any detailed reports you already purchased — new purchases stay paused.',

    ],

    tip: 'Automated tools are labelled separately from a live Pandit consultation.',

  },

  'coins-and-payment-pending': {

    title: 'Coins and payment pending',

    summary: 'Use this for an existing payment reference. Website recharge cannot be started from help while top-ups stay paused.',

    steps: [

      'Open payment status and refresh for the reference you already have — do not start a new top-up from the website.',

      'Check your wallet history for the same reference.',

      'Do not pay again while the outcome is unknown.',

      'Contact support with the payment reference if the status stays pending.',

    ],

    tip: 'New top-ups are paused on the website. This help covers existing pending payments only — leave your email on the recharge page if you want a note when top-ups reopen.',

  },

  'booking-cancellation': {

    title: 'Booking and cancellation',

    summary: 'For an existing booking only — new No Timer bookings are not open yet. Check that booking’s status and the cancellation terms that apply to it.',

    steps: [

      'Open the existing booking and read the current status.',

      'Review the cancellation terms shown for that booking.',

      'If a request fails, read the error before trying again.',

      'Keep your booking reference if you need support.',

    ],

    tip: 'Existing bookings keep the terms agreed when they were made. This guide does not open a new consultation or charge coins.',

  },

  'joining-audio-video': {

    title: 'Joining audio or video',

    summary: 'For an existing eligible booking only — new No Timer bookings are not open yet. Allow the browser microphone or camera only after reviewing the waiting room.',

    steps: [

      'Join from the booking page for that existing conversation.',

      'Check permissions for microphone (and camera for video).',

      'Stay on the waiting screen until the session is ready.',

      'If a camera is unavailable, the format does not silently change.',

    ],

    tip: 'Use a stable connection and keep your booking page open while reconnecting. Joining help never starts a new unpaid booking.',

  },

  'chat-reconnect': {

    title: 'Chat reconnect',

    summary: 'Return to an existing booking and refresh to reconnect and load conversation history. New No Timer bookings are not open yet — reconnect never starts a new unpaid chat.',

    steps: [

      'Open the same booking from your bookings list.',

      'Refresh the page if the chat looks disconnected.',

      'Wait for history to load before sending a new message.',

      'Contact support with the booking reference if you cannot return.',

    ],

    tip: 'Losing your browser connection does not necessarily mean your session has ended. Reconnecting does not create a new booking or charge coins.',

  },

  'account-access': {

    title: 'Account and phone access',

    summary: 'Use the same Indian mobile number as the app. Never share an OTP with support.',

    steps: [

      'Sign in with your 10-digit Indian mobile number.',

      'Enter the four-digit code from SMS.',

      'If the code expires, request a new one after the cooldown.',

      'Use Google or Apple sign-in only after accepting terms, then link your phone if asked.',

    ],

    tip: 'Support will never ask you to share an OTP.',

  },

  'refunds-and-complaints': {

    title: 'Refunds and complaints',

    summary: 'Keep your payment or booking reference so support can review the recorded status.',

    steps: [

      'Gather the payment or booking reference.',

      'Note what happened and when.',

      'Email support with a short description — leave private conversation text out of the first email.',

      'Ask for a formal grievance review if you need an accountable escalation.',

    ],

    tip: 'Support will explain whether a coin or original-payment refund applies under the relevant policy.',

  },

};



/** Bidirectional related-topic map — every slug lists only existing articles. */

export const relatedHelp: Record<string, string[]> = {

  'first-consultation': ['preparing-a-draft', 'booking-cancellation', 'joining-audio-video'],

  'preparing-a-draft': ['first-consultation', 'tools-and-readings', 'account-access'],

  'tools-and-readings': ['preparing-a-draft', 'coins-and-payment-pending', 'first-consultation'],

  'coins-and-payment-pending': ['refunds-and-complaints', 'booking-cancellation', 'tools-and-readings'],

  'booking-cancellation': ['first-consultation', 'refunds-and-complaints', 'coins-and-payment-pending'],

  'joining-audio-video': ['chat-reconnect', 'first-consultation', 'booking-cancellation'],

  'chat-reconnect': ['joining-audio-video', 'booking-cancellation', 'account-access'],

  'account-access': ['first-consultation', 'refunds-and-complaints', 'coins-and-payment-pending'],

  'refunds-and-complaints': ['coins-and-payment-pending', 'booking-cancellation', 'account-access'],

};



export const helpTopicIndex = Object.entries(helpArticles).map(([slug, article]) => ({

  slug,

  label: article.title,

  description: article.summary,

  keywords: {

    'first-consultation': 'book draft prepare first session',

    'preparing-a-draft': 'draft guidance question notes prepare conversation',

    'tools-and-readings': 'kundli horoscope tarot palm free tool paid report',

    'coins-and-payment-pending': 'wallet coins payment pending recharge',

    'booking-cancellation': 'cancel refund booking status',

    'joining-audio-video': 'mic camera join video audio webrtc',

    'chat-reconnect': 'disconnect reconnect chat message draft',

    'account-access': 'login otp phone google apple sign in',

    'refunds-and-complaints': 'refund grievance complaint support',

  }[slug] || '',

}));



export function relatedHelpFor(slug: string): string[] {

  const mapped = (relatedHelp[slug] || []).filter(key => key !== slug && helpArticles[key]);

  if (mapped.length > 0) return mapped;

  return Object.keys(helpArticles).filter(key => key !== slug).slice(0, 3);

}


