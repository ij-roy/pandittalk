import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { panditAvatarCdnUrl } from '../src/avatar/avatar-storage.interface';

export type GuidanceAreaKey =
  | 'career'
  | 'love'
  | 'family'
  | 'marriage'
  | 'education'
  | 'health'
  | 'business'
  | 'finance'
  | 'spiritual_protection';

/** List/API session price must match checkout: standard depth + chat format. */
export const PUBLIC_STANDARD_CHAT_PRICE = 251;

export type PanditMeta = {
  phone: string;
  displayName: string;
  headline: string;
  specialty: string;
  category: string;
  guidanceAreas: GuidanceAreaKey[];
  /** Coins for a standard chat session — keep aligned with bookings DEPTH+FORMAT. */
  pricePerSession: number;
  isPremium: boolean;
  imageSlug: string;
  /** Always seed 0 — public APIs use live filtered aggregates only. */
  rating: number;
  totalReviews: number;
};

export type PanditSeedRow = PanditMeta & {
  bio: string;
  languages: string[];
  experience: number;
};

const PANDIT_XLSX_RELATIVE = join('data', 'Pandits Backend Data.xlsx');

/** PLACEHOLDER — add +91 phones here to show online for demos */
export const DEMO_ONLINE_PHONES: string[] = [];

export const PANDIT_IMAGE_BASE_URL =
  process.env.PANDIT_SEED_IMAGE_BASE_URL ??
  'http://localhost:3001/static/avatars/seed';

export const SEED_REVIEWER_PHONE = '+919999999001';

export const AVAILABILITY_WINDOW_START = '08:00';
export const AVAILABILITY_WINDOW_END = '20:00';
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

/** Fixed pandit row IDs — S3 keys and portrait filenames use these UUIDs (valid UUID v4). */
export const PANDIT_STABLE_IDS: Record<string, string> = {
  '+918898615327': 'c40d952e-0290-4548-8472-a41ceffe8139',
  '+919594899347': '5c08795d-3fc0-40c6-b596-c9080646e755',
  '+917045895918': '233ec30a-b8a7-4343-9439-cde3e9d324d4',
  '+919359611524': '4d1d298d-8a49-40b0-93ca-85bb42a7f754',
  '+919015078297': '87be82ae-8436-4299-9de3-36a61b547438',
  '+919592609275': 'fe08379b-84f4-4a8b-b13b-ba074c559e7b',
  '+919810985097': 'a0d9a11d-c6c0-4a75-8d45-f8a632668b68',
  '+919871176764': '9ba68d64-e817-40d4-b39f-2f9650c0550d',
  '+919899990741': '9c4e2210-eb28-43c6-b9fb-d0083fb4900b',
  '+919599368991': '7c1151ff-099e-4092-964e-7587f93bf7d5',
  '+919882060030': 'a5d34056-c896-424a-bcd1-4529ca167b73',
  '+919717899598': '0452d451-5274-47ac-af5a-2e2561dd2c98',
};

export const PANDIT_META_BY_PHONE: Record<string, Omit<PanditMeta, 'phone'>> = {
  '+918898615327': {
    displayName: 'Shri Rahul Nandkumar Joshi',
    headline: 'Experienced guidance for career, business & life decisions',
    specialty: 'Career growth, financial clarity & business timing',
    category: 'Career & Business',
    guidanceAreas: ['career', 'finance', 'business'],
    pricePerSession: 251,
    isPremium: true,
    imageSlug: 'rahul-nandkumar-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919594899347': {
    displayName: 'Shri Rahul Suresh Ghogare Joshi',
    headline: 'Dedicated counsel for relationships, marriage & wellbeing',
    specialty: 'Love compatibility, marriage matching & family harmony',
    category: 'Love & Relationships',
    guidanceAreas: ['love', 'marriage', 'family'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'rahul-suresh-ghogare-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+917045895918': {
    displayName: 'Shri Hemanshu Tirupati Joshi',
    headline: 'Practical guidance for students and early-career seekers',
    specialty: 'Education paths & early career direction',
    category: 'Career & Business',
    guidanceAreas: ['education', 'career'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'hemanshu-tirupati-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919359611524': {
    displayName: 'Shri Akshay Rajkumar Joshi',
    headline: 'Personalized guidance for marriage, home & prosperity',
    specialty: 'Marriage readiness, family balance & financial stability',
    category: 'Marriage & Family',
    guidanceAreas: ['marriage', 'family', 'finance'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'akshay-rajkumar-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919015078297': {
    displayName: 'Shri Sridhar Joshi',
    headline: 'Guidance for career, health & life challenges',
    specialty: 'Career transitions, wellbeing & prosperity planning',
    category: 'Health & Wellbeing',
    guidanceAreas: ['career', 'health', 'finance'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'sridhar-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919592609275': {
    displayName: 'Pandita Soniya Bajaj',
    headline: 'Insightful guidance for relationships & home harmony',
    specialty: 'Love, marriage & family counselling',
    category: 'Love & Relationships',
    guidanceAreas: ['love', 'marriage', 'family'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'soniya-bajaj',
    rating: 0,
    totalReviews: 0,
  },
  '+919810985097': {
    displayName: 'Shri Srinath Joshi',
    headline: 'Holistic guidance for health, growth & prosperity',
    specialty: 'Wellness insights, learning paths & business timing',
    category: 'Career & Business',
    guidanceAreas: ['health', 'education', 'business'],
    pricePerSession: 251,
    isPremium: true,
    imageSlug: 'srinath-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919871176764': {
    displayName: 'Shri Mahendra Joshi',
    headline: 'Practical counsel for business, finances & relationships',
    specialty: 'Business decisions, wealth planning & relationship clarity',
    category: 'Finance & Wealth',
    guidanceAreas: ['business', 'finance', 'love'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'mahendra-joshi',
    rating: 0,
    totalReviews: 0,
  },
  '+919899990741': {
    displayName: 'Shri Sudhakarji',
    headline: 'Steady counsel for career turns and family questions',
    specialty: 'Career direction, family harmony & everyday decisions',
    category: 'Career & Business',
    guidanceAreas: ['career', 'love', 'family', 'health'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'sudhakarji',
    rating: 0,
    totalReviews: 0,
  },
  '+919599368991': {
    displayName: 'Shri Raju ji',
    headline: 'Practical reflection for relationships and work stress',
    specialty: 'Relationships, work pressure & personal clarity',
    category: 'Love & Relationships',
    guidanceAreas: ['career', 'love', 'family', 'health'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'raju-ji',
    rating: 0,
    totalReviews: 0,
  },
  '+919882060030': {
    displayName: 'Shri Priyaansh Prakash Thakur',
    headline: 'Thoughtful guidance for students and early decisions',
    specialty: 'Education paths, early career & family support',
    category: 'Career & Business',
    guidanceAreas: ['career', 'love', 'family', 'health'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'priyaansh-prakash-thakur',
    rating: 0,
    totalReviews: 0,
  },
  '+919717899598': {
    displayName: 'Shri Himanshu Ji',
    headline: 'Calm listening for health worries and life balance',
    specialty: 'Wellbeing reflection, family balance & life path',
    category: 'Health & Wellbeing',
    guidanceAreas: ['career', 'love', 'family', 'health', 'spiritual_protection'],
    pricePerSession: 251,
    isPremium: false,
    imageSlug: 'himanshu-ji',
    rating: 0,
    totalReviews: 0,
  },
};

/** Distinct intros for code-added pandits — never reuse one generic blurb. */
const EXTRA_PANDIT_BIOS: Record<string, string> = {
  '+919899990741':
    'I listen first, then help you sort career pressure, family expectations and the next practical step. Conversations are in Hindi or English, at a pace that leaves room to explain.',
  '+919599368991':
    'I work with people who feel stuck between relationships and work stress. Sessions stay grounded: what is happening, what you can influence, and what to leave aside for now — in Hindi or English.',
  '+919882060030':
    'I support students and early-career seekers who want clearer priorities without fear-based predictions. We talk through options, timing and family context in Hindi or English.',
  '+919717899598':
    'I offer calm reflection when health worries or family balance feel heavy. Guidance here is spiritual support, not medical advice, and we speak in Hindi or English as you prefer.',
};

/** Pandits added in code (not in the original xlsx). Safe to upsert without touching xlsx rows. */
export const EXTRA_PANDIT_SEEDS: PanditSeedRow[] = (
  ['+919899990741', '+919599368991', '+919882060030', '+919717899598'] as const
).map((phone) => {
  const meta = PANDIT_META_BY_PHONE[phone];
  const bio = EXTRA_PANDIT_BIOS[phone];
  if (!meta) {
    throw new Error(`Missing PANDIT_META for extra pandit ${phone}`);
  }
  if (!bio) {
    throw new Error(`Missing unique bio for extra pandit ${phone}`);
  }
  return {
    phone,
    ...meta,
    bio,
    languages: ['Hindi', 'English'],
    experience: 0, // unknown until verified
  };
});

// Dev-only sample blurbs — never write into production-shaped DBs (seedPlaceholderReviews is a no-op).
export const PLACEHOLDER_REVIEW_COMMENTS: string[] = [
  'Clear and practical guidance. Felt reassured after the session.',
  'Thoughtful remedies and a calm pace. Would consult again.',
  'Patient listener with deep knowledge. Will consult again.',
];

function titleCaseWords(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatDisplayName(rawName: string, phone: string): string {
  const meta = PANDIT_META_BY_PHONE[phone];
  if (meta) return meta.displayName;
  if (rawName.toLowerCase().includes('soniya')) {
    return `Pandita ${titleCaseWords(rawName)}`;
  }
  return `Shri ${titleCaseWords(rawName)}`;
}

function parseLanguages(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== 'other');
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length !== 10) {
    throw new Error(`Invalid phone number in xlsx: "${raw}"`);
  }
  return `+91${last10}`;
}

export function resolvePanditXlsxPath(backendRoot: string): string {
  const path = join(backendRoot, PANDIT_XLSX_RELATIVE);
  if (!existsSync(path)) {
    throw new Error(`Pandit xlsx not found at ${path}`);
  }
  return path;
}

export function loadPanditSeedsFromXlsx(backendRoot: string): PanditSeedRow[] {
  const workbook = XLSX.readFile(resolvePanditXlsxPath(backendRoot));
  const sheet = workbook.Sheets[workbook.SheetNames[0]!];
  const rows = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
  });

  const dataRows = rows.slice(1).filter((row) => row[0]);
  const seeds: PanditSeedRow[] = [];

  for (const row of dataRows) {
    const rawName = String(row[0] ?? '').trim();
    const bio = String(row[2] ?? '').trim();
    const languages = parseLanguages(String(row[3] ?? ''));
    const experience = Number.parseInt(String(row[4] ?? '0'), 10);
    const phone = normalizePhone(String(row[8] ?? row[7] ?? ''));

    const meta = PANDIT_META_BY_PHONE[phone];
    if (!meta) {
      throw new Error(`No PANDIT_META for phone ${phone} (${rawName})`);
    }
    if (!bio) {
      throw new Error(`Missing bio for ${rawName}`);
    }

    seeds.push({
      phone,
      ...meta,
      displayName: formatDisplayName(rawName, phone),
      bio,
      languages,
      experience:
        Number.isFinite(experience) && experience > 0 ? experience : 1,
    });
  }

  if (seeds.length !== 8) {
    throw new Error(`Expected 8 pandit rows in xlsx, found ${seeds.length}`);
  }

  return seeds;
}

export function panditStableId(phone: string): string | undefined {
  return PANDIT_STABLE_IDS[phone];
}

export function allStablePanditIds(): string[] {
  return Object.values(PANDIT_STABLE_IDS);
}

export function panditPortraitUrl(phone: string): string | null {
  const stableId = PANDIT_STABLE_IDS[phone];
  if (!stableId) return null;

  const cdnBaseUrl = process.env.MEDIA_CDN_URL?.replace(/\/$/, '');
  if (cdnBaseUrl) {
    return panditAvatarCdnUrl(cdnBaseUrl, stableId, 1);
  }

  const meta = PANDIT_META_BY_PHONE[phone];
  if (!meta) return null;

  const filePath = join(
    process.cwd(),
    'uploads',
    'avatars',
    'seed',
    `${meta.imageSlug}.png`,
  );
  if (!existsSync(filePath)) {
    return null;
  }
  return `${PANDIT_IMAGE_BASE_URL}/${meta.imageSlug}.png`;
}

/** Copy committed AI portrait assets into the served uploads directory. */
export function ensurePanditPortraitAssets(backendRoot: string): void {
  const sourceDir = join(backendRoot, 'data', 'pandit-portraits');
  const targetDir = join(backendRoot, 'uploads', 'avatars', 'seed');
  mkdirSync(targetDir, { recursive: true });

  for (const phone of Object.keys(PANDIT_META_BY_PHONE)) {
    const meta = PANDIT_META_BY_PHONE[phone]!;
    const source = join(sourceDir, `${meta.imageSlug}.png`);
    const target = join(targetDir, `${meta.imageSlug}.png`);
    if (existsSync(source)) {
      copyFileSync(source, target);
    }
  }
}

export function allRealPanditPhones(): string[] {
  return Object.keys(PANDIT_META_BY_PHONE);
}
