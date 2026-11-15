import { Prisma, PrismaClient, type ArticleCategory } from '@prisma/client';
import OpenAI from 'openai';
import {
  AVAILABILITY_WINDOW_END,
  AVAILABILITY_WINDOW_START,
  DAYS_OF_WEEK,
  DEMO_ONLINE_PHONES,
  EXTRA_PANDIT_SEEDS,
  ensurePanditPortraitAssets,
  loadPanditSeedsFromXlsx,
  panditPortraitUrl,
  panditStableId,
  SEED_REVIEWER_PHONE,
  type PanditSeedRow,
} from './pandit-seed';

const prisma = new PrismaClient();

const COIN_PACKAGE_SEEDS = [
  {
    label: 'Mini',
    coins: 100,
    priceInr: 99,
    bonusCoins: 0,
    isPopular: false,
    sortOrder: 1,
  },
  {
    label: 'Starter',
    coins: 200,
    priceInr: 199,
    bonusCoins: 0,
    isPopular: false,
    sortOrder: 2,
  },
  {
    label: 'Essential',
    coins: 260,
    priceInr: 249,
    bonusCoins: 10,
    isPopular: false,
    sortOrder: 3,
  },
  {
    label: 'Plus',
    coins: 320,
    priceInr: 299,
    bonusCoins: 20,
    isPopular: false,
    sortOrder: 4,
  },
  {
    label: 'Standard',
    coins: 380,
    priceInr: 349,
    bonusCoins: 30,
    isPopular: false,
    sortOrder: 5,
  },
  {
    label: 'Basic',
    coins: 500,
    priceInr: 449,
    bonusCoins: 50,
    isPopular: false,
    sortOrder: 6,
  },
  {
    label: 'Comfort',
    coins: 620,
    priceInr: 549,
    bonusCoins: 70,
    isPopular: false,
    sortOrder: 7,
  },
  {
    label: 'Advantage',
    coins: 720,
    priceInr: 649,
    bonusCoins: 80,
    isPopular: false,
    sortOrder: 8,
  },
  {
    label: 'Select',
    coins: 820,
    priceInr: 749,
    bonusCoins: 100,
    isPopular: false,
    sortOrder: 9,
  },
  {
    label: 'Popular',
    coins: 1000,
    priceInr: 849,
    bonusCoins: 150,
    isPopular: true,
    sortOrder: 10,
  },
  {
    label: 'Value',
    coins: 2000,
    priceInr: 1599,
    bonusCoins: 400,
    isPopular: false,
    sortOrder: 11,
  },
  {
    label: 'Premium',
    coins: 5000,
    priceInr: 3799,
    bonusCoins: 1000,
    isPopular: false,
    sortOrder: 12,
  },
  {
    label: 'Elite',
    coins: 7500,
    priceInr: 5499,
    bonusCoins: 1500,
    isPopular: false,
    sortOrder: 13,
  },
  {
    label: 'Ultimate',
    coins: 10000,
    priceInr: 6999,
    bonusCoins: 2000,
    isPopular: false,
    sortOrder: 14,
  },
  {
    label: 'Platinum',
    coins: 15000,
    priceInr: 9999,
    bonusCoins: 3500,
    isPopular: false,
    sortOrder: 15,
  },
  {
    label: 'Imperial',
    coins: 20000,
    priceInr: 12499,
    bonusCoins: 5000,
    isPopular: false,
    sortOrder: 16,
  },
] as const;

const ARTICLE_CATEGORY_PLAN: { category: ArticleCategory; count: number }[] = [
  { category: 'astrology', count: 5 },
  { category: 'spirituality', count: 5 },
  { category: 'vastu', count: 5 },
  { category: 'numerology', count: 5 },
  { category: 'tarot', count: 5 },
  { category: 'palmistry', count: 5 },
  { category: 'relationships', count: 5 },
  { category: 'career', count: 5 },
];

const COVER_IMAGES: Record<ArticleCategory, string> = {
  astrology:
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=400&fit=crop',
  spirituality:
    'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop',
  vastu:
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=800&h=400&fit=crop',
  numerology:
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=400&fit=crop',
  tarot:
    'https://images.unsplash.com/photo-1509245853830-fb36a1f1f1c1?w=800&h=400&fit=crop',
  palmistry:
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&h=400&fit=crop',
  relationships:
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&h=400&fit=crop',
  career:
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
};

/** Public journal byline — never invent credentials or named experts. */
const EDITORIAL_AUTHOR = 'PanditTalk Editorial';

function assignAuthor(_globalIndex: number): string {
  return EDITORIAL_AUTHOR;
}

function publishedAtForIndex(articleIndex: number, now: number): Date {
  const daysAgo = Math.floor((articleIndex + 1) * (180 / 40));
  return new Date(now - daysAgo * 24 * 60 * 60 * 1000);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function estimateReadTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 200));
}

type GeneratedArticle = {
  title: string;
  excerpt: string;
  content: string;
};

async function generateArticlesForCategory(
  openai: OpenAI,
  category: ArticleCategory,
  count: number,
): Promise<GeneratedArticle[]> {
  const prompt = `Generate exactly ${count} unique, realistic articles for an Indian astrology/spiritual wellness app.
Category: ${category}

Return JSON: { "articles": [ { "title": string, "excerpt": string (max 150 chars), "content": string (400-600 words of markdown with headings and paragraphs) } ] }

Write in accessible English for Indian readers. Topics should feel authentic for ${category}. Use markdown formatting in content.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error(`Empty OpenAI response for category ${category}`);
  }

  const parsed = JSON.parse(raw) as { articles: GeneratedArticle[] };
  if (!Array.isArray(parsed.articles) || parsed.articles.length === 0) {
    throw new Error(`Invalid OpenAI article payload for category ${category}`);
  }

  return parsed.articles.slice(0, count);
}

const FALLBACK_ARTICLES: GeneratedArticle[] = [
  // astrology (5)
  {
    title: 'Understanding Your Birth Chart',
    excerpt:
      'A practical introduction to reading your kundli and what each house represents.',
    content:
      '## Your birth chart\n\nYour birth chart, or kundli, is a snapshot of the sky at the moment you were born.\n\n### The twelve houses\n\nEach house governs a life area — career, relationships, health, and more.\n\n### Getting started\n\nBegin with your ascendant (lagna) and moon sign for a grounded first reading.\n\n### Planetary periods\n\nDasha systems reveal when certain themes become active in your life.\n\n### Daily practice\n\nKeep a simple journal noting transits and how you feel — patterns emerge over time.',
  },
  {
    title: 'Mercury Retrograde: What It Really Means',
    excerpt:
      'Separate myth from meaning when Mercury appears to move backward in the sky.',
    content:
      '## Mercury retrograde\n\nMercury retrograde is a familiar phrase, but it is often misunderstood.\n\n### Communication and travel\n\nThis period invites review rather than panic — revisit plans, double-check messages, and slow down decisions.\n\n### A mindful approach\n\nUse retrograde cycles for reflection and finishing unfinished work.\n\n### In relationships\n\nMisunderstandings are more common — speak clearly and listen twice.\n\n### Remedies\n\nChanting the Budh mantra on Wednesdays can support mental clarity during this phase.',
  },
  {
    title: 'Moon Signs and Daily Rhythms',
    excerpt:
      'How your moon sign shapes emotions and the best times for rest or action.',
    content:
      '## Moon signs\n\nWhile your sun sign describes identity, your moon sign reflects emotional needs.\n\n### Lunar rhythms\n\nTracking the moon helps you align rest, creativity, and social energy.\n\n### Simple practice\n\nNote how you feel on full moon and new moon days for two months.\n\n### Moon in each sign\n\nAries moon seeks action; Cancer moon needs nurturing space.\n\n### Tithi awareness\n\nIndian panchang tithis add another layer of auspicious timing to daily life.',
  },
  {
    title: 'Saturn Return: A Turning Point in Life',
    excerpt:
      'What happens when Saturn returns to its natal position around age 29.',
    content:
      '## Saturn return\n\nRoughly every 29 years, Saturn completes a full orbit and returns to where it was at your birth.\n\n### Themes of maturity\n\nCareer direction, responsibility, and long-term commitments come into focus.\n\n### First return\n\nMany people change jobs, cities, or relationship status during this period.\n\n### Working with Saturn\n\nDiscipline, patience, and honest self-assessment bring lasting rewards.\n\n### Remedies\n\nServing elders and lighting a sesame oil lamp on Saturdays are traditional supports.',
  },
  {
    title: 'Rahu and Ketu: The Lunar Nodes Explained',
    excerpt:
      'How the shadow planets influence ambition, obsession, and spiritual release.',
    content:
      "## Rahu and Ketu\n\nThese mathematical points where the moon's path crosses the ecliptic carry deep karmic meaning.\n\n### Rahu's hunger\n\nRahu amplifies desire and worldly ambition in the house it occupies.\n\n### Ketu's detachment\n\nKetu points toward past-life mastery and areas where you seek liberation.\n\n### Eclipses\n\nSolar and lunar eclipses near your nodal axis often trigger major life shifts.\n\n### Balance\n\nIntegrating Rahu's drive with Ketu's wisdom is a lifelong spiritual task.",
  },
  // spirituality (5)
  {
    title: 'Morning Mantras for Calm Focus',
    excerpt: 'Short daily practices to centre the mind before a busy day.',
    content:
      '## Morning mantras\n\nA few minutes of mantra or breath work can steady the nervous system.\n\n### Choosing a mantra\n\nPick a phrase that feels natural — Om, So Hum, or a personal affirmation.\n\n### Building consistency\n\nFive minutes daily beats an hour once a week.\n\n### Gayatri mantra\n\nThe Gayatri is widely chanted at dawn for clarity and divine illumination.\n\n### Breath pairing\n\nInhale on the first syllable, exhale on the last — let rhythm carry you.',
  },
  {
    title: 'Gratitude as Spiritual Practice',
    excerpt: 'Why gratitude journaling supports clarity and emotional balance.',
    content:
      '## Gratitude practice\n\nGratitude shifts attention from lack to presence.\n\n### How to begin\n\nWrite three specific things each evening.\n\n### Over time\n\nYou may notice calmer reactions and clearer priorities.\n\n### Sankalpa\n\nPair gratitude with a gentle intention for the day ahead.\n\n### Community\n\nSharing thanks with family at meals strengthens bonds and awareness.',
  },
  {
    title: 'Meditation for Beginners',
    excerpt:
      'Start sitting quietly without pressure — posture, breath, and patience.',
    content:
      '## Meditation basics\n\nMeditation is not about stopping thoughts but observing them.\n\n### Posture\n\nSit comfortably with a straight spine.\n\n### Breath\n\nReturn gently to the breath whenever the mind wanders.\n\n### Duration\n\nStart with five minutes and increase gradually.\n\n### Common obstacles\n\nRestlessness and sleepiness are normal — meet them with kindness, not judgment.',
  },
  {
    title: 'The Power of Daily Puja at Home',
    excerpt:
      'Simple home altar practices that bring sacred rhythm to ordinary days.',
    content:
      '## Home puja\n\nA small altar with a lamp, flowers, and incense anchors the day in devotion.\n\n### Setting up\n\nChoose a clean northeast corner if possible.\n\n### Daily offering\n\nLight a diya morning and evening — consistency matters more than complexity.\n\n### Family involvement\n\nChildren who witness daily puja often carry calm habits into adulthood.\n\n### Festivals\n\nYour home altar becomes the heart of seasonal celebrations throughout the year.',
  },
  {
    title: 'Finding Your Ishta Devata',
    excerpt:
      'How to discover and connect with your chosen deity for personal worship.',
    content:
      "## Ishta Devata\n\nYour chosen deity reflects the divine quality you most need to cultivate.\n\n### Signs in the chart\n\nThe Atmakaraka planet and twelfth house often hint at your spiritual path.\n\n### Personal connection\n\nNotice which deity's stories and images move you deeply.\n\n### Daily sadhana\n\nA simple name repetition builds a living relationship over months and years.\n\n### Guru guidance\n\nAn experienced teacher can confirm your ishta through chart analysis.",
  },
  // vastu (5)
  {
    title: 'Vastu Tips for a Peaceful Home',
    excerpt:
      'Simple layout ideas to improve flow and calm in your living space.',
    content:
      '## Vastu at home\n\nVastu considers direction, light, and clutter.\n\n### Entrance\n\nKeep the main door welcoming and well lit.\n\n### Bedroom\n\nPlace the bed so you face east or south when sleeping if possible.\n\n### Kitchen\n\nSoutheast is traditionally ideal for the cooking area.\n\n### Clutter\n\nClear stagnant corners regularly — energy flows where space is open.',
  },
  {
    title: 'Office Desk Direction and Focus',
    excerpt:
      'Where you sit while working can support concentration and steady growth.',
    content:
      '## Workspace vastu\n\nFace north or east while working when you can.\n\n### Clutter\n\nClear papers and cables regularly.\n\n### Plants\n\nA small green plant can soften harsh corners.\n\n### North zone\n\nThe north governs career and opportunities — keep it clean and open.\n\n### Mirrors\n\nAvoid mirrors directly facing the desk; they scatter focus.',
  },
  {
    title: 'Vastu for the Master Bedroom',
    excerpt:
      'Direction, colour, and placement tips for restful sleep and harmony.',
    content:
      '## Bedroom vastu\n\nThe southwest is considered the most stable direction for the master bedroom.\n\n### Bed placement\n\nHead toward south or east; avoid sleeping with feet pointing toward the door.\n\n### Colours\n\nSoft earth tones and pastels promote rest.\n\n### Electronics\n\nMinimise screens near the bed for better sleep quality.\n\n### Pairs\n\nKeep matching nightstands to symbolise balance in partnership.',
  },
  {
    title: 'Correcting Vastu Without Renovation',
    excerpt: 'Practical remedies when moving walls or rooms is not an option.',
    content:
      '## Vastu remedies\n\nNot every imbalance requires structural change.\n\n### Mirrors and crystals\n\nStrategic placement can redirect or balance energy flow.\n\n### Salt bowls\n\nA bowl of sea salt in problematic corners absorbs stagnant energy — replace weekly.\n\n### Yantras\n\nVastu purusha yantras placed in the northeast support overall harmony.\n\n### Plants\n\nMoney plant in the north and tulsi in the east are widely used supports.',
  },
  {
    title: "Vastu for Children's Study Room",
    excerpt:
      'Help young students focus with direction, light, and colour choices.',
    content:
      '## Study room vastu\n\nEast or northeast facing desks support learning and memory.\n\n### Lighting\n\nNatural light from the left side reduces eye strain.\n\n### Bookshelves\n\nPlace books in the northeast or east wall for intellectual growth.\n\n### Avoid\n\nBeds in the study room blur rest and work — keep zones separate.\n\n### Motivation\n\nA small Saraswati image or symbol honours the goddess of knowledge.',
  },
  // numerology (5)
  {
    title: 'Life Path Numbers Explained',
    excerpt: 'Calculate your core number and what it suggests about strengths.',
    content:
      '## Numerology basics\n\nLife path numbers come from your full date of birth.\n\n### Calculation\n\nReduce day, month, and year digits to a single digit or master number.\n\n### Interpretation\n\nEach number highlights natural talents and growth edges.\n\n### Master numbers\n\n11, 22, and 33 carry intensified potential and responsibility.\n\n### Practical use\n\nUse your life path as a reflection tool, not a rigid prediction.',
  },
  {
    title: 'Name Numerology and Intent',
    excerpt:
      'How the letters in your name add up and what practitioners look for.',
    content:
      '## Name numbers\n\nNames carry vibrational patterns in numerology.\n\n### Expression number\n\nDerived from all letters in your full name.\n\n### Use wisely\n\nTreat numbers as reflection tools, not rigid fate.\n\n### Name changes\n\nSome consult numerologists before naming a business or child.\n\n### Compatibility\n\nCompare life path and expression numbers for relationship insight.',
  },
  {
    title: 'Personal Year Cycles in Numerology',
    excerpt: 'Understand the nine-year rhythm and what each year invites.',
    content:
      '## Personal year\n\nAdd your birth day and month to the current calendar year, then reduce.\n\n### Year 1\n\nNew beginnings — plant seeds for the nine-year cycle ahead.\n\n### Year 5\n\nChange and freedom — expect travel, moves, or career shifts.\n\n### Year 9\n\nCompletion — release what no longer serves before the next cycle.\n\n### Planning\n\nAlign major decisions with your personal year theme for smoother outcomes.',
  },
  {
    title: 'Destiny Number vs Life Path',
    excerpt:
      'Two core numbers and how they complement each other in your chart.',
    content:
      '## Two core numbers\n\nLife path comes from birth date; destiny from your full birth name.\n\n### Life path\n\nReveals the road you walk — lessons, opportunities, and natural direction.\n\n### Destiny\n\nShows what you are meant to express and achieve in this lifetime.\n\n### Tension\n\nWhen they differ, inner work bridges who you are and who you become.\n\n### Integration\n\nMeditation on both numbers clarifies purpose over time.',
  },
  {
    title: 'Lucky Numbers for Business Success',
    excerpt: 'How entrepreneurs use numerology for naming and launch dates.',
    content:
      '## Business numerology\n\nCompany names and launch dates carry vibrational weight.\n\n### Name total\n\nReduce the business name to a single digit — 1 and 8 often suit enterprise.\n\n### Launch muhurat\n\nCombine numerology with panchang for an auspicious opening day.\n\n### Phone numbers\n\nSome owners prefer totals that align with their personal year.\n\n### Balance\n\nNumerology supports intuition — it does not replace market research.',
  },
  // tarot (5)
  {
    title: 'Tarot for Beginners: The Major Arcana',
    excerpt:
      'An introduction to the 22 archetypal cards and their life themes.',
    content:
      "## Major Arcana\n\nThese 22 cards represent major life lessons and turning points.\n\n### The Fool's journey\n\nThe sequence from Fool to World maps a path of growth and integration.\n\n### Reading upright\n\nEach card carries a core meaning that shifts with context and position.\n\n### Daily draw\n\nPull one card each morning for a theme to contemplate.\n\n### Respect the deck\n\nKeep cards wrapped in cloth and handle them with intention.",
  },
  {
    title: 'Three-Card Spreads for Daily Guidance',
    excerpt: 'Simple past-present-future layouts you can do in five minutes.',
    content:
      '## Three-card spread\n\nLay three cards left to right: past, present, future.\n\n### Shuffling\n\nFocus on your question while mixing the deck.\n\n### Interpretation\n\nLook for patterns — many cups suggest emotional themes.\n\n### Journaling\n\nWrite your reading and revisit it after a week.\n\n### Reversals\n\nSome readers use reversed cards; others read all upright — choose one approach.',
  },
  {
    title: 'The Suit of Cups and Emotional Life',
    excerpt:
      'How water-suit cards reflect love, intuition, and inner feelings.',
    content:
      '## Suit of Cups\n\nCups govern emotions, relationships, and creative flow.\n\n### Key cards\n\nThe Two of Cups speaks to partnership; the Ten to family fulfilment.\n\n### Blocked energy\n\nMany reversed cups may signal emotional withdrawal or unprocessed grief.\n\n### Meditation\n\nGaze at a cup card and notice what feelings arise.\n\n### Pair with astrology\n\nWater sign transits often activate cup themes in readings.',
  },
  {
    title: 'Cleansing and Charging Your Tarot Deck',
    excerpt:
      'Rituals to clear old energy and prepare cards for accurate readings.',
    content:
      '## Deck care\n\nTarot absorbs the energy of readers and querents over time.\n\n### Moonlight\n\nPlace the deck under full moon light overnight to cleanse.\n\n### Crystals\n\nRest clear quartz or amethyst on top of the deck between sessions.\n\n### Knock three times\n\nA simple knock on the deck surface resets energy before a reading.\n\n### Storage\n\nKeep the deck in a dedicated bag away from unrelated clutter.',
  },
  {
    title: 'Ethics of Reading Tarot for Others',
    excerpt:
      'Boundaries, consent, and responsibility when reading for friends or clients.',
    content:
      '## Tarot ethics\n\nReading for others is a privilege that requires care.\n\n### Consent\n\nNever read about someone who has not agreed to the session.\n\n### Empowerment\n\nFrame messages as possibilities, not fixed fate.\n\n### Sensitive topics\n\nAvoid medical or legal pronouncements — refer to qualified professionals.\n\n### Self-care\n\nGround yourself after heavy readings; your energy matters too.',
  },
  // palmistry (5)
  {
    title: 'Reading the Life Line',
    excerpt:
      'What palmists look for in vitality, major changes, and life direction.',
    content:
      '## Life line\n\nContrary to myth, the life line does not predict length of life.\n\n### Vitality\n\nA deep, clear line suggests robust energy and resilience.\n\n### Breaks\n\nBreaks may indicate major life transitions rather than danger.\n\n### Branches\n\nUpward branches suggest ambition; downward branches may show periods of retreat.\n\n### Both hands\n\nCompare dominant and non-dominant hands for inherited vs developed traits.',
  },
  {
    title: 'The Heart Line and Relationships',
    excerpt:
      'Emotional expression, attachment style, and partnership patterns in the palm.',
    content:
      '## Heart line\n\nThis upper horizontal line reveals how you love and connect.\n\n### Starting point\n\nLines beginning under the index finger suggest high ideals in love.\n\n### Curves\n\nA deep curve toward the fingers indicates warmth and expressiveness.\n\n### Breaks\n\nSmall breaks can mark emotional turning points or heartbreak.\n\n### Timing\n\nPalmists estimate event timing by measuring along the life line.',
  },
  {
    title: 'Mount of Jupiter and Leadership',
    excerpt:
      'What a prominent Jupiter mount suggests about ambition and authority.',
    content:
      '## Mount of Jupiter\n\nLocated at the base of the index finger, this mount governs leadership.\n\n### Well-developed\n\nSuggests confidence, ambition, and desire for recognition.\n\n### Flat mount\n\nMay indicate humility or less interest in public authority.\n\n### Cross marks\n\nA cross on Jupiter can suggest strong spiritual protection.\n\n### Balance\n\nOverdeveloped Jupiter without Saturn discipline can lead to arrogance.',
  },
  {
    title: 'Fate Line: Career and Destiny',
    excerpt: 'Tracing the vertical line that many associate with career path.',
    content:
      '## Fate line\n\nNot everyone has a clear fate line — its absence is not negative.\n\n### Starting low\n\nA line beginning near the wrist suggests self-made success.\n\n### Breaks\n\nCareer changes often correspond to breaks or shifts in the fate line.\n\n### Multiple lines\n\nParallel lines can indicate diverse income sources or interests.\n\n### Evolution\n\nLines change over years — revisit palm readings periodically.',
  },
  {
    title: 'Palmistry Basics: Which Hand to Read',
    excerpt: 'Active vs passive hand and what each reveals about your path.',
    content:
      '## Which hand\n\nTradition reads the non-dominant hand as inherited potential.\n\n### Active hand\n\nThe dominant hand shows choices and developed character.\n\n### Comparing both\n\nDifferences between hands reveal growth and conscious change.\n\n### Texture\n\nSoft palms suggest sensitivity; firm palms indicate practicality.\n\n### Finger length\n\nLong fingers show detail orientation; short fingers favour quick action.',
  },
  // relationships (5)
  {
    title: 'Healthy Communication in Relationships',
    excerpt:
      'Astrological timing and honest dialogue for stronger partnerships.',
    content:
      '## Relationship clarity\n\nVenus and moon transits often highlight relationship themes.\n\n### Listening first\n\nPause before reacting during heated moments.\n\n### Shared rituals\n\nA weekly check-in builds trust.\n\n### Mercury periods\n\nUse Mercury transits for important conversations and agreements.\n\n### Boundaries\n\nClear boundaries protect intimacy rather than weaken it.',
  },
  {
    title: 'When to Seek Guidance Together',
    excerpt:
      'Signs that a couples session with an expert may help you move forward.',
    content:
      '## Couples guidance\n\nRepeated misunderstandings or major life transitions are common reasons to consult together.\n\n### Preparation\n\nAgree on one topic beforehand.\n\n### After the session\n\nWrite down two practical steps you both accept.\n\n### Kundli matching\n\nTraditional Guna Milan offers one lens — not the only factor in compatibility.\n\n### Timing\n\nConsult during Venus-friendly periods for receptive dialogue.',
  },
  {
    title: 'Venus Transits and Love Life',
    excerpt:
      'How Venus moving through signs affects romance and social harmony.',
    content:
      '## Venus transits\n\nVenus changes signs roughly every four weeks, colouring social and romantic energy.\n\n### Venus in fire signs\n\nPassion and bold gestures flourish.\n\n### Venus retrograde\n\nRevisit old connections; avoid impulsive commitment decisions.\n\n### Seventh house\n\nTransits through your seventh house activate partnership themes.\n\n### Remedies\n\nFridays dedicated to Lakshmi puja support Venusian harmony.',
  },
  {
    title: 'Understanding Guna Milan in Matchmaking',
    excerpt:
      'The 36-point system and what each guna reveals about compatibility.',
    content:
      '## Guna Milan\n\nTraditional kundli matching scores up to 36 points across eight categories.\n\n### Minimum score\n\nMany families seek 18 or above, but context matters.\n\n### Nadi dosha\n\nOne of the most discussed factors — remedies exist when other scores are strong.\n\n### Beyond numbers\n\nEmotional maturity and shared values matter as much as points.\n\n### Consultation\n\nAn experienced astrologer interprets doshas within the full chart picture.',
  },
  {
    title: 'Navigating Long-Distance Relationships',
    excerpt:
      'Astrological support for couples separated by geography or schedules.',
    content:
      '## Long-distance love\n\nDistance tests communication and trust — astrology can offer timing support.\n\n### Moon connection\n\nStrong moon compatibility helps emotional attunement across distance.\n\n### Visit timing\n\nPlan reunions during favourable Venus or Jupiter transits.\n\n### Daily rituals\n\nShared prayer or mantra at the same time bridges physical separation.\n\n### Patience\n\nSaturn periods demand patience — use them to build lasting foundations.',
  },
  // career (5)
  {
    title: 'Choosing a Career Aligned with Your Chart',
    excerpt:
      'How the tenth house and dasha periods guide professional direction.',
    content:
      "## Career astrology\n\nThe tenth house, its lord, and current dasha reveal professional themes.\n\n### Strong Mercury\n\nFavours communication, trade, and analytical roles.\n\n### Strong Mars\n\nSuits engineering, sports, surgery, and leadership in competitive fields.\n\n### Dasha timing\n\nMajor career shifts often coincide with dasha or antardasha changes.\n\n### Remedies\n\nWorship of the tenth lord's deity on its weekday supports steady progress.",
  },
  {
    title: 'Best Muhurat for Starting a New Job',
    excerpt:
      'Panchang factors to consider before signing an offer or joining day.',
    content:
      '## Job muhurat\n\nAn auspicious start sets intention for growth and stability.\n\n### Weekday\n\nChoose a day ruled by a benefic planet strong in your chart.\n\n### Tithi\n\nDwitiya, Tritiya, Panchami, and Dashami are generally favourable.\n\n### Avoid\n\nRahu kaal and eclipse periods for important beginnings.\n\n### First day ritual\n\nOffer gratitude at your workspace before starting tasks.',
  },
  {
    title: 'Saturn and Professional Discipline',
    excerpt:
      'Why Saturn periods demand patience and how they reward steady effort.',
    content:
      '## Saturn at work\n\nSaturn governs structure, responsibility, and long-term achievement.\n\n### Sade Sati\n\nThis seven-and-a-half year phase tests career foundations.\n\n### Productive response\n\nAccept extra responsibility, improve skills, and avoid shortcuts.\n\n### Saturday remedies\n\nFeed crows, donate black sesame, or serve workers on Saturdays.\n\n### Rewards\n\nSaturn eventually crowns persistent, ethical effort with lasting success.',
  },
  {
    title: 'Mercury for Entrepreneurs and Freelancers',
    excerpt:
      "Leverage Mercury's gifts for communication, negotiation, and trade.",
    content:
      '## Mercury in business\n\nMercury rules commerce, writing, and quick adaptation.\n\n### Strong placement\n\nSupports startups, consulting, and digital ventures.\n\n### Retrograde caution\n\nLaunch products and sign contracts outside retrograde when possible.\n\n### Budh mantra\n\nRegular chanting supports clarity in negotiations.\n\n### Networking\n\nMercury favours diverse connections — attend events and follow up promptly.',
  },
  {
    title: 'Sun Placement and Public Recognition',
    excerpt:
      'How a strong Sun in the chart supports authority and visibility at work.',
    content:
      "## Sun and career\n\nThe Sun represents authority, government, and public reputation.\n\n### Tenth house Sun\n\nOften indicates leadership roles and recognition in one's field.\n\n### Weak Sun\n\nMay benefit from Surya namaskar and ruby consultation with a gemologist.\n\n### Father's influence\n\nSun also reflects relationship with father and paternal figures at work.\n\n### Sunday practice\n\nOffer water to the rising sun for confidence and clarity in professional life.",
  },
];

async function seedFallbackArticles(): Promise<void> {
  const now = Date.now();
  let articleIndex = 0;

  for (const plan of ARTICLE_CATEGORY_PLAN) {
    for (let i = 0; i < plan.count; i++) {
      const article = FALLBACK_ARTICLES[articleIndex];
      if (!article) {
        break;
      }

      const slugBase = slugify(article.title);
      const slug = `${slugBase}-fallback-${articleIndex + 1}`;
      const publishedAt = publishedAtForIndex(articleIndex, now);

      await prisma.article.create({
        data: {
          title: article.title,
          slug,
          category: plan.category,
          author: assignAuthor(articleIndex),
          coverImageUrl: COVER_IMAGES[plan.category],
          excerpt: article.excerpt.slice(0, 150),
          content: article.content,
          readTimeMinutes: estimateReadTimeMinutes(article.content),
          publishedAt,
          status: 'published',
        },
      });

      console.log(`  Seeded fallback article: ${article.title}`);
      articleIndex += 1;
    }
  }

  console.log(`\nDone: ${articleIndex} fallback articles seeded.`);
}

async function seedArticles(): Promise<void> {
  await prisma.article.deleteMany();
  console.log('Cleared existing articles for re-seed.');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(
      'OPENAI_API_KEY is not set. Seeding static fallback articles...',
    );
    await seedFallbackArticles();
    return;
  }

  const openai = new OpenAI({ apiKey });
  const now = Date.now();
  let articleIndex = 0;

  for (const plan of ARTICLE_CATEGORY_PLAN) {
    console.log(
      `Generating ${plan.count} article(s) for category: ${plan.category}...`,
    );
    const generated = await generateArticlesForCategory(
      openai,
      plan.category,
      plan.count,
    );

    for (const article of generated) {
      const slugBase = slugify(article.title);
      const slug = `${slugBase}-${articleIndex + 1}`;
      const publishedAt = publishedAtForIndex(articleIndex, now);
      const excerpt = article.excerpt.slice(0, 150);

      await prisma.article.create({
        data: {
          title: article.title,
          slug,
          category: plan.category,
          author: assignAuthor(articleIndex),
          coverImageUrl: COVER_IMAGES[plan.category],
          excerpt,
          content: article.content,
          readTimeMinutes: estimateReadTimeMinutes(article.content),
          publishedAt,
          status: 'published',
        },
      });

      console.log(`  Seeded article: ${article.title}`);
      articleIndex += 1;
    }
  }

  console.log(`\nDone: ${articleIndex} articles seeded.`);
}

async function seedCoinPackages(): Promise<void> {
  const seedLabels = COIN_PACKAGE_SEEDS.map((pkg) => pkg.label);

  for (const pkg of COIN_PACKAGE_SEEDS) {
    const data = {
      label: pkg.label,
      coins: pkg.coins,
      priceInr: new Prisma.Decimal(pkg.priceInr),
      bonusCoins: pkg.bonusCoins,
      isPopular: pkg.isPopular,
      sortOrder: pkg.sortOrder,
      isActive: true,
    };
    const existing = await prisma.coinPackage.findFirst({
      where: { label: pkg.label },
    });
    if (existing) {
      await prisma.coinPackage.update({
        where: { id: existing.id },
        data,
      });
      console.log(`Updated coin package: ${pkg.label}`);
    } else {
      await prisma.coinPackage.create({ data });
      console.log(`Seeded coin package: ${pkg.label}`);
    }
  }

  const deactivated = await prisma.coinPackage.updateMany({
    where: { label: { notIn: [...seedLabels] } },
    data: { isActive: false },
  });
  if (deactivated.count > 0) {
    console.log(`Deactivated ${deactivated.count} orphaned coin package(s).`);
  }

  console.log(`\nDone: ${COIN_PACKAGE_SEEDS.length} coin packages.`);
}

async function upsertPanditAvailability(panditId: string): Promise<void> {
  // Seed inactive windows only — active all-day hours inflate available_slots_today.
  // Pandits (or ops) must turn windows on after verifying real hours.
  for (const dayOfWeek of DAYS_OF_WEEK) {
    const existing = await prisma.panditAvailability.findFirst({
      where: { panditId, dayOfWeek },
    });
    const row = {
      windowStart: AVAILABILITY_WINDOW_START,
      windowEnd: AVAILABILITY_WINDOW_END,
      isActive: false,
    };
    if (existing) {
      await prisma.panditAvailability.update({
        where: { id: existing.id },
        data: row,
      });
    } else {
      await prisma.panditAvailability.create({
        data: { panditId, dayOfWeek, ...row },
      });
    }
  }
}

// Do not seed fake completed bookings / glowing reviews into the DB.
// Public APIs filter seed reviewers, but placeholder social proof is a trust hazard.
async function seedPlaceholderReviews(
  _panditId: string,
  _reviewerUserId: string,
  _seed: PanditSeedRow,
): Promise<void> {
  return;
}

async function upsertRealPandit(
  seed: PanditSeedRow,
  reviewerUserId: string,
  options: { skipReviews?: boolean } = {},
): Promise<void> {
  if (DEMO_ONLINE_PHONES.length > 0 && process.env.NODE_ENV !== 'development') {
    throw new Error(
      'DEMO_ONLINE_PHONES must stay empty outside development — refuse force-online seed.',
    );
  }
  const isOnline = DEMO_ONLINE_PHONES.includes(seed.phone);
  const stableId = panditStableId(seed.phone);
  if (!stableId) {
    throw new Error(`No stable pandit ID for phone ${seed.phone}`);
  }
  const imageUrl = panditPortraitUrl(seed.phone);

  const user = await prisma.user.upsert({
    where: { phoneNumber: seed.phone },
    create: { phoneNumber: seed.phone, walletBalance: 0, role: 'PANDIT' },
    update: { role: 'PANDIT' },
  });

  const panditFields = {
    name: seed.displayName,
    headline: seed.headline,
    bio: seed.bio,
    specialty: seed.specialty,
    languages: seed.languages,
    experience: seed.experience,
    pricePerSession: new Prisma.Decimal(seed.pricePerSession),
    rating: new Prisma.Decimal(0),
    totalReviews: 0,
    imageUrl,
    isVerified: false,
    isPremium: seed.isPremium,
    isOnline,
    presenceSeenAt: isOnline ? new Date() : null,
    category: seed.category,
    guidanceAreas: [...seed.guidanceAreas],
  };

  const pandit = await prisma.pandit.upsert({
    where: { id: stableId },
    create: {
      id: stableId,
      ...panditFields,
      user: { connect: { id: user.id } },
    },
    update: {
      ...panditFields,
      user: { connect: { id: user.id } },
    },
  });

  await upsertPanditAvailability(pandit.id);
  if (!options.skipReviews) {
    await seedPlaceholderReviews(pandit.id, reviewerUserId, seed);
  }

  console.log(
    `Seeded ${seed.displayName} [${seed.guidanceAreas.join(', ')}] (${isOnline ? 'online' : 'offline'}) — phone: ${seed.phone.replace('+91', '')}`,
  );
}

async function seedPandits(): Promise<void> {
  const backendRoot = process.cwd();
  ensurePanditPortraitAssets(backendRoot);
  const panditSeeds = loadPanditSeedsFromXlsx(backendRoot);

  // First name stays null so public review APIs never show an internal seed label.
  const reviewer = await prisma.user.upsert({
    where: { phoneNumber: SEED_REVIEWER_PHONE },
    create: {
      phoneNumber: SEED_REVIEWER_PHONE,
      firstName: null,
      walletBalance: 0,
    },
    update: { firstName: null },
  });

  for (const seed of panditSeeds) {
    await upsertRealPandit(seed, reviewer.id);
  }

  for (const seed of EXTRA_PANDIT_SEEDS) {
    await upsertRealPandit(seed, reviewer.id, { skipReviews: true });
  }

  const totalPandits = panditSeeds.length + EXTRA_PANDIT_SEEDS.length;
  console.log(
    `\nDone: ${totalPandits} pandits, ${totalPandits * DAYS_OF_WEEK.length} availability rows.`,
  );
  console.log(
    '\nPandit dashboard phones (use real SMS OTP unless TEST_OTP allowlist is set):',
    [...panditSeeds, ...EXTRA_PANDIT_SEEDS]
      .map((p) => `  ${p.phone.replace('+91', '')} → ${p.displayName}`)
      .join('\n'),
  );
}

async function seedLocalAdmin(): Promise<void> {
  if (process.env.NODE_ENV !== 'development') return;

  await prisma.user.upsert({
    where: { phoneNumber: '+919999999996' },
    create: {
      phoneNumber: '+919999999996',
      firstName: 'Local',
      lastName: 'Admin',
      name: 'Local Demo Admin',
      walletBalance: 0,
      profileCompleted: true,
      isActive: true,
      role: 'ADMIN',
    },
    update: {
      firstName: 'Local',
      lastName: 'Admin',
      name: 'Local Demo Admin',
      profileCompleted: true,
      isActive: true,
      role: 'ADMIN',
    },
  });
}

async function main(): Promise<void> {
  await seedCoinPackages();

  if (process.argv.includes('--coins-only')) {
    return;
  }

  if (process.argv.includes('--pandits-only')) {
    await seedPandits();
    return;
  }

  await seedPandits();
  await seedLocalAdmin();

  await seedArticles();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
