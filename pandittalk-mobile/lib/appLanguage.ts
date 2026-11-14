export type AppLanguage = 'en' | 'hi';

export const APP_LANGUAGES: { id: AppLanguage; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'hi', label: 'हिन्दी' },
];

const EN = {
  settings: 'Settings',
  language: 'Language',
  account: 'Account',
  viewProfile: 'View Profile',
  editProfile: 'Edit Profile',
  family: 'Family profiles',
  changePhone: 'Change Phone',
  exportData: 'Export my data',
  notifications: 'Notifications',
  quietHours: 'Quiet hours',
  quietHoursNote:
    'From 10:00 PM to 7:00 AM IST, the daily horoscope stays quiet and the 30-minute session reminder is skipped. A 10-minute reminder, a 5-minute reminder, and chat alerts still arrive.',
  support: 'Support',
  helpCenter: 'Help Center',
  contactUs: 'Contact Us',
  legal: 'Legal',
  privacy: 'Privacy Policy',
  terms: 'Terms of Service',
  refund: 'Refund Policy',
  disclaimer: 'Disclaimer',
  deletionInfo: 'Account Deletion Info',
  app: 'App',
  appVersion: 'App Version',
  buildNumber: 'Build Number',
  danger: 'Danger Zone',
  deleteAccount: 'Delete Account',
  logout: 'Logout',
  back: 'Back',
  logoutTitle: 'Log out?',
  logoutRecovery:
    'Logging out does not delete your account or your coins. Sign in again with the same phone number, Google, or Apple account and your wallet is still there.',
  logoutConfirm: 'Log out',
  logoutCancel: 'Stay signed in',
  deleteTitle: 'Delete account?',
  deleteBody:
    'This is not a full erase of every record. Sign-in stops now, and your name, phone, photo, birth details, and saved reports are removed. Coins and booking records needed for tax or disputes may be kept and are not used for marketing. Chat history is cleared afterward.',
  deleteConfirm: 'Delete my profile',
  deleteCancel: 'Keep my account',
} as const;

const HI: Record<keyof typeof EN, string> = {
  settings: 'सेटिंग्स',
  language: 'भाषा',
  account: 'खाता',
  viewProfile: 'प्रोफ़ाइल देखें',
  editProfile: 'प्रोफ़ाइल बदलें',
  family: 'परिवार की प्रोफ़ाइल',
  changePhone: 'फ़ोन बदलें',
  exportData: 'मेरा डेटा मँगवाएँ',
  notifications: 'सूचनाएँ',
  quietHours: 'शांत घंटे',
  quietHoursNote:
    'रात 10:00 बजे से सुबह 7:00 बजे IST तक दैनिक राशिफल शांत रहता है और 30 मिनट वाला सत्र रिमाइंडर नहीं जाता। 10 मिनट, 5 मिनट, और चैट सूचनाएँ आती रहती हैं।',
  support: 'सहायता',
  helpCenter: 'सहायता केंद्र',
  contactUs: 'हमसे बात करें',
  legal: 'कानूनी',
  privacy: 'गोपनीयता नीति',
  terms: 'सेवा की शर्तें',
  refund: 'रिफ़ंड नीति',
  disclaimer: 'अस्वीकरण',
  deletionInfo: 'खाता हटाने की जानकारी',
  app: 'ऐप',
  appVersion: 'ऐप संस्करण',
  buildNumber: 'बिल्ड नंबर',
  danger: 'सावधानी',
  deleteAccount: 'खाता हटाएँ',
  logout: 'लॉग आउट',
  back: 'वापस',
  logoutTitle: 'लॉग आउट करें?',
  logoutRecovery:
    'लॉग आउट करने से खाता या सिक्के नहीं मिटते। उसी फ़ोन नंबर, Google, या Apple खाते से फिर साइन इन करें, और वॉलेट वहीं रहता है।',
  logoutConfirm: 'लॉग आउट',
  logoutCancel: 'साइन इन रहें',
  deleteTitle: 'खाता हटाएँ?',
  deleteBody:
    'यह हर रिकॉर्ड की पूरी मिटाई नहीं है। साइन-इन अभी रुक जाता है, और नाम, फ़ोन, फ़ोटो, जन्म विवरण, और सेव की गई रिपोर्ट हट जाती हैं। टैक्स या विवाद के लिए ज़रूरी सिक्के और बुकिंग रिकॉर्ड रखे जा सकते हैं, और उनका मार्केटिंग में उपयोग नहीं होता। चैट इतिहास बाद में साफ़ होता है।',
  deleteConfirm: 'मेरी प्रोफ़ाइल हटाएँ',
  deleteCancel: 'मेरा खाता रखें',
};

export type SettingsStringKey = keyof typeof EN;

export function parseAppLanguage(raw: string | null | undefined): AppLanguage {
  return raw === 'hi' ? 'hi' : 'en';
}

export function settingsText(language: AppLanguage, key: SettingsStringKey): string {
  if (language === 'hi') return HI[key];
  return EN[key];
}
