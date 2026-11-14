import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import OpenAI from 'openai';
import {
  assertDigitalToolPurchaseAllowed,
  type ClientPlatform,
} from '../common/client-platform';
import { readFeatureFlags } from '../config/feature-flags';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { CompatibilityDto } from './dto/compatibility.dto';
import { HoroscopeDto } from './dto/horoscope.dto';
import { KundliDto } from './dto/kundli.dto';
import { MonthlyHoroscopeDto } from './dto/monthly-horoscope.dto';
import { PalmReadingDto } from './dto/palm-reading.dto';
import { DetailedKundliCancelledError, KUNDLI_CANCELLED_MESSAGE } from './kundli-cancel';
import {
  UNLOCK_TOOL_TYPES,
  type MonthlyHoroscopeReportPayloadDto,
  type UnlockToolType,
} from './dto/unlock-tool.dto';
import {
  MAJOR_ARCANA,
  resolveCoordinatesFromPlace,
} from './tools.constants';

const TOOL_UNLOCK_COSTS: Record<UnlockToolType, number> = {
  monthly_horoscope: 101,
  detailed_kundli: 251,
  detailed_compatibility: 201,
};

const PROKERALA_BASE_URL = 'https://api.prokerala.com';
const IST_OFFSET = '+05:30';

export interface KundliPlanet {
  name: string;
  sign: string;
  house: number;
  degree: number | string;
}

export interface KundliResponse {
  chart: unknown;
  planets: KundliPlanet[];
  firstName: string;
  lastName: string;
}

export interface KundliDosha {
  name: string;
  present: boolean;
  severity: string;
  description: string;
}

export interface KundliCurrentDasha {
  mahadasha: string;
  antardasha: string;
  endsOn: string;
  meaning: string;
}

export interface KundliLuckyElements {
  number: number;
  color: string;
  day: string;
  gemstone: string;
  deity: string;
}

export interface KundliRemedy {
  title: string;
  description: string;
}

export interface KundliDetailedResponse extends KundliResponse {
  detailed: true;
  lifeNarrative: string;
  doshas: KundliDosha[];
  currentDasha: KundliCurrentDasha;
  luckyElements: KundliLuckyElements;
  remedies: KundliRemedy[];
  newBalance: number;
}

export interface KundliGptDetailedResult {
  lifeNarrative: string;
  doshas: KundliDosha[];
  currentDasha: KundliCurrentDasha;
  luckyElements: KundliLuckyElements;
  remedies: KundliRemedy[];
}

export interface HoroscopeResponse {
  sign: string;
  type: string;
  prediction: unknown;
  todayInsight: string;
  luckyColor: string;
  luckyTime: string;
  luckyNumber: number;
  /** Guidance-only — never present lucky fields as guaranteed forecasts. */
  disclaimer: string;
}

export interface CompatibilityResponse {
  matching: unknown;
  score: number;
  emotionalCompatibility: string;
  communication: string;
  longTermHarmony: string;
}

export interface CompatibilityRemedy {
  title: string;
  description: string;
}

export interface CompatibilityDoshaItem {
  name: string;
  present: boolean;
  severity: string;
  description: string;
}

export interface CompatibilityGptDetailedResult {
  score: number;
  emotionalCompatibility: string;
  communication: string;
  longTermHarmony: string;
  gunaMilan: string;
  doshaCompatibility: CompatibilityDoshaItem[];
  strengths: string;
  challenges: string;
  remedies: CompatibilityRemedy[];
  marriageOutlook: string;
  coupleNarrative: string;
}

export interface CompatibilityDetailedResponse extends CompatibilityResponse {
  detailed: true;
  gunaMilan: string;
  doshaCompatibility: CompatibilityDoshaItem[];
  strengths: string;
  challenges: string;
  remedies: CompatibilityRemedy[];
  marriageOutlook: string;
  coupleNarrative: string;
  newBalance: number;
}

export interface TarotResponse {
  cardName: string;
  cardMeaning: string;
  yourInsight: string;
}

export interface PalmLineReading {
  title: string;
  description: string;
}

export interface PalmReadingResponse {
  lifeLine: PalmLineReading;
  heartLine: PalmLineReading;
  headLine: PalmLineReading;
  overview: string;
}

export interface MonthlyHoroscopeResponse {
  monthlyOverview: string;
  career: string;
  relationships: string;
  health: string;
  keyOpportunities: string;
}

export interface UnlockToolResponse {
  success: true;
  newBalance: number;
  toolType: UnlockToolType;
}

export interface UnlockedToolsResponse {
  unlockedTools: UnlockToolType[];
}

interface ProkeralaTokenResponse {
  access_token: string;
  expires_in: number;
}

@Injectable()
export class ToolsService {
  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  async getKundli(
    dto: KundliDto,
    userId?: string,
    platform: ClientPlatform = 'unknown',
    isClientGone?: () => boolean,
  ): Promise<KundliResponse | KundliDetailedResponse> {
    if (!dto.detailed) {
      const basic = await this.getBasicKundli(dto);
      if (userId) {
        await this.reportsService.saveFreeKundliReport(userId, dto, basic);
      }
      return basic;
    }
    assertDigitalToolPurchaseAllowed(platform);
    if (!userId) {
      throw new UnauthorizedException();
    }
    const detailed = await this.getDetailedKundli(dto);
    if (isClientGone?.()) {
      throw new BadRequestException(KUNDLI_CANCELLED_MESSAGE);
    }
    const cost = TOOL_UNLOCK_COSTS.detailed_kundli;
    const newBalance = await this.debitDetailedKundli(userId);
    try {
      await this.reportsService.saveDetailedKundliReport(userId, dto, detailed);
      if (isClientGone?.()) {
        throw new DetailedKundliCancelledError();
      }
      return { ...detailed, newBalance };
    } catch (error) {
      await this.refundToolCharge(userId, cost, 'Detailed Kundli Report');
      if (error instanceof DetailedKundliCancelledError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private async debitDetailedKundli(userId: string): Promise<number> {
    const cost = TOOL_UNLOCK_COSTS.detailed_kundli;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (Number(user.walletBalance) < cost) {
      throw new BadRequestException('insufficient_balance');
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: cost } },
        select: { walletBalance: true },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type: 'booking_debit',
          coinsAmount: cost,
          // Coin debits are not INR — leave amountInr null so wallet history stays honest.
          amountInr: null,
          status: TransactionStatus.SUCCESS,
          description: 'Detailed Kundli Report',
        },
      }),
    ]);

    return Math.floor(Number(updatedUser.walletBalance));
  }

  private async refundToolCharge(
    userId: string,
    cost: number,
    description: string,
  ): Promise<number> {
    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { increment: cost } },
        select: { walletBalance: true },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type: 'refund',
          coinsAmount: cost,
          amountInr: null,
          status: TransactionStatus.SUCCESS,
          description: `Refund: ${description}`,
        },
      }),
    ]);

    return Math.floor(Number(updatedUser.walletBalance));
  }

  private async debitDetailedCompatibility(userId: string): Promise<number> {
    const cost = TOOL_UNLOCK_COSTS.detailed_compatibility;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (Number(user.walletBalance) < cost) {
      throw new BadRequestException('insufficient_balance');
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: cost } },
        select: { walletBalance: true },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type: 'booking_debit',
          coinsAmount: cost,
          amountInr: null,
          status: TransactionStatus.SUCCESS,
          description: 'Detailed Compatibility Report',
        },
      }),
    ]);

    return Math.floor(Number(updatedUser.walletBalance));
  }

  private async getBasicKundli(dto: KundliDto): Promise<KundliResponse> {
    const coordinates = this.resolveCoordinates(dto.placeOfBirth, dto.coordinates);
    const datetime = this.buildDatetime(dto.dob, dto.timeOfBirth);
    const params = {
      ayanamsa: '1',
      coordinates,
      datetime,
    };

    const [chart, planetData] = await Promise.all([
      this.prokeralaGet('/v2/astrology/kundli', params),
      this.prokeralaGet('/v2/astrology/planet-position', params),
    ]);

    return {
      chart,
      planets: this.mapPlanetPositions(planetData),
      firstName: dto.firstName,
      lastName: dto.lastName ?? '',
    };
  }

  private async getDetailedKundli(
    dto: KundliDto,
  ): Promise<Omit<KundliDetailedResponse, 'newBalance'>> {
    const coordinates = this.resolveCoordinates(dto.placeOfBirth, dto.coordinates);
    const datetime = this.buildDatetime(dto.dob, dto.timeOfBirth);
    const params = {
      ayanamsa: '1',
      coordinates,
      datetime,
    };

    const [chart, planetData, mangalDosha, kaalSarpDosha, dashaData] =
      await Promise.all([
        this.prokeralaGet('/v2/astrology/kundli', params),
        this.prokeralaGet('/v2/astrology/planet-position', params),
        this.prokeralaGetOptional('/v2/astrology/mangal-dosha', params),
        this.prokeralaGetOptional('/v2/astrology/kaal-sarp-dosha', params),
        this.prokeralaGetOptional('/v2/astrology/dasha-periods', params),
      ]);

    const planets = this.mapPlanetPositions(planetData);
    const doshaResults = { mangalDosha, kaalSarpDosha };
    const currentDashaRaw = this.extractCurrentDasha(dashaData);

    const gptResult = await this.callGptJson<KundliGptDetailedResult>(
      `You are an expert Vedic astrologer. Based on this birth chart data, provide a detailed life reading. Birth chart: ${JSON.stringify({ chart, planets })}.
Doshas: ${JSON.stringify(doshaResults)}. Current Dasha: ${JSON.stringify(currentDashaRaw)}.

Return ONLY this exact JSON, no markdown:
{
  "lifeNarrative": "3-4 paragraph cohesive life reading combining Lagna, Sun, Moon placements — written directly to the person, not clinical",
  "doshas": [
    { "name": "string", "present": true, "severity": "string", "description": "string" }
  ],
  "currentDasha": {
    "mahadasha": "string",
    "antardasha": "string",
    "endsOn": "string",
    "meaning": "2-3 sentence explanation of what this period means"
  },
  "luckyElements": {
    "number": 0,
    "color": "string",
    "day": "string",
    "gemstone": "string",
    "deity": "string"
  },
  "remedies": [
    { "title": "string", "description": "string" }
  ]
}`,
    );

    return {
      chart,
      planets,
      firstName: dto.firstName,
      lastName: dto.lastName ?? '',
      detailed: true,
      ...gptResult,
    };
  }

  async getHoroscope(
    dto: HoroscopeDto,
    userId?: string,
  ): Promise<HoroscopeResponse> {
    const datetime =
      dto.type === 'monthly'
        ? this.startOfMonthIstDatetime()
        : this.nowIstDatetime();

    const prediction =
      dto.type === 'daily'
        ? await this.prokeralaGet('/v2/horoscope/daily', {
            sign: dto.sign,
            datetime,
          })
        : await this.prokeralaGet('/v2/horoscope/daily/advanced', {
            sign: dto.sign,
            datetime,
            type: 'general',
          });

    const gptResult = await this.callGptJson<{
      todayInsight: string;
      luckyColor: string;
      luckyTime: string;
      luckyNumber: number;
    }>(
      `You are a warm, insightful Vedic astrologer writing for a mobile app audience in India.
Based on the following ${dto.type} horoscope prediction data for ${dto.sign}, generate a personalized ${dto.type === 'monthly' ? 'monthly' : 'daily'} reading.

Prediction data:
${JSON.stringify(prediction)}

Return JSON with exactly these fields:
- todayInsight: 2-3 paragraph narrative insight (use \\n\\n between paragraphs)
- luckyColor: a single color name
- luckyTime: a time range string e.g. "10:00 AM - 12:00 PM"
- luckyNumber: a single integer between 1 and 99`,
    );

    const report: HoroscopeResponse = {
      sign: dto.sign,
      type: dto.type,
      prediction,
      ...gptResult,
      disclaimer:
        'Lucky color, time and number are generative suggestions for reflection — not predictions or guarantees.',
    };
    if (userId) {
      await this.reportsService.saveDailyHoroscopeReport(userId, report);
    }
    return report;
  }

  async getCompatibility(
    dto: CompatibilityDto,
    userId?: string,
    platform: ClientPlatform = 'unknown',
  ): Promise<CompatibilityResponse | CompatibilityDetailedResponse> {
    if (!dto.detailed) {
      const basic = await this.getBasicCompatibility(dto);
      if (userId) {
        await this.reportsService.saveFreeCompatibilityReport(userId, dto, basic);
      }
      return basic;
    }
    assertDigitalToolPurchaseAllowed(platform);
    if (!userId) {
      throw new UnauthorizedException();
    }
    const cost = TOOL_UNLOCK_COSTS.detailed_compatibility;
    const newBalance = await this.debitDetailedCompatibility(userId);
    try {
      const detailed = await this.getDetailedCompatibility(dto);
      await this.reportsService.saveDetailedCompatibilityReport(
        userId,
        dto,
        detailed,
      );
      return { ...detailed, newBalance };
    } catch (error) {
      await this.refundToolCharge(
        userId,
        cost,
        'Detailed Compatibility Report',
      );
      throw error;
    }
  }

  private async getBasicCompatibility(
    dto: CompatibilityDto,
  ): Promise<CompatibilityResponse> {
    const matching = await this.fetchKundliMatching(dto);

    const gptResult = await this.callGptJson<{
      score: number;
      emotionalCompatibility: string;
      communication: string;
      longTermHarmony: string;
    }>(
      `You are a compassionate Vedic astrologer specializing in relationship compatibility.
Based on the following kundli matching data, provide a compatibility reading for ${dto.person1.name} (person1/girl) and ${dto.person2.name} (person2/boy).

Matching data:
${JSON.stringify(matching)}

Return JSON with exactly these fields:
- score: integer 0-100 representing overall compatibility
- emotionalCompatibility: 1-2 paragraph text about emotional connection
- communication: 1-2 paragraph text about communication dynamics
- longTermHarmony: 1-2 paragraph text about long-term relationship potential`,
    );

    return {
      matching,
      ...gptResult,
    };
  }

  private async fetchKundliMatching(dto: CompatibilityDto): Promise<unknown> {
    const girlCoordinates = this.resolveCoordinates(
      dto.person1.placeOfBirth,
      dto.person1.coordinates,
    );
    const boyCoordinates = this.resolveCoordinates(
      dto.person2.placeOfBirth,
      dto.person2.coordinates,
    );
    const girlDob = this.buildDatetime(
      dto.person1.dob,
      dto.person1.timeOfBirth,
    );
    const boyDob = this.buildDatetime(dto.person2.dob, dto.person2.timeOfBirth);

    return this.prokeralaGet('/v2/astrology/kundli-matching', {
      ayanamsa: '1',
      girl_coordinates: girlCoordinates,
      boy_coordinates: boyCoordinates,
      girl_dob: girlDob,
      boy_dob: boyDob,
    });
  }

  private async getDetailedCompatibility(
    dto: CompatibilityDto,
  ): Promise<Omit<CompatibilityDetailedResponse, 'newBalance'>> {
    const matching = await this.fetchKundliMatching(dto);

    const gptResult = await this.callGptJson<CompatibilityGptDetailedResult>(
      `You are an expert Vedic astrologer specializing in marriage and relationship compatibility.
Based on the following kundli matching data, provide a comprehensive detailed compatibility report for ${dto.person1.name} (person1/girl) and ${dto.person2.name} (person2/boy).

Matching data:
${JSON.stringify(matching)}

Return ONLY this exact JSON, no markdown:
{
  "score": 0,
  "emotionalCompatibility": "1-2 paragraphs about emotional connection",
  "communication": "1-2 paragraphs about communication dynamics",
  "longTermHarmony": "1-2 paragraphs about long-term relationship potential",
  "gunaMilan": "2-3 paragraphs explaining Ashtakoot / guna points breakdown from the matching data",
  "doshaCompatibility": [
    { "name": "string", "present": true, "severity": "string", "description": "string" }
  ],
  "strengths": "2-3 paragraphs on relationship strengths",
  "challenges": "2-3 paragraphs on growth areas and friction points",
  "remedies": [
    { "title": "string", "description": "string" }
  ],
  "marriageOutlook": "2-3 paragraphs on marriage timing and long-term outlook",
  "coupleNarrative": "3-4 paragraph cohesive reading written directly to the couple"
}`,
    );

    return {
      matching,
      score: gptResult.score,
      emotionalCompatibility: gptResult.emotionalCompatibility,
      communication: gptResult.communication,
      longTermHarmony: gptResult.longTermHarmony,
      detailed: true,
      gunaMilan: gptResult.gunaMilan,
      doshaCompatibility: gptResult.doshaCompatibility ?? [],
      strengths: gptResult.strengths,
      challenges: gptResult.challenges,
      remedies: gptResult.remedies ?? [],
      marriageOutlook: gptResult.marriageOutlook,
      coupleNarrative: gptResult.coupleNarrative,
    };
  }

  async getTarot(userId?: string): Promise<TarotResponse> {
    const cardIndex = Math.floor(Math.random() * MAJOR_ARCANA.length);
    const drawnCard = MAJOR_ARCANA[cardIndex];

    const report = await this.callGptJson<TarotResponse>(
      `You are a tarot reader. The card drawn is: ${drawnCard}.
Return a JSON object:
{
  cardName: string,
  cardMeaning: '2-3 sentence general meaning',
  yourInsight: '3-4 sentence personalized insight and guidance'
}
Return only valid JSON, no markdown.`,
    );
    if (userId) {
      await this.reportsService.saveTarotReport(userId, report);
    }
    return report;
  }

  async getPalmReading(
    dto: PalmReadingDto,
    userId?: string,
  ): Promise<PalmReadingResponse> {
    const apiKey = this.getOpenAiKey();
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are an expert Vedic palmist. Analyze both palms provided.
Return a JSON object with this exact structure:
{
  lifeLine: { title: 'Life Line', description: '2-3 sentence analysis' },
  heartLine: { title: 'Heart Line', description: '2-3 sentence analysis' },
  headLine: { title: 'Head Line', description: '2-3 sentence analysis' },
  overview: '1-2 sentence overall palm summary'
}
Return only valid JSON, no markdown.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${dto.leftPalmImage}`,
                },
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${dto.rightPalmImage}`,
                },
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(content) as Record<string, unknown>;
      const report = {
        lifeLine: this.normalizePalmLine(parsed.lifeLine, 'Life Line'),
        heartLine: this.normalizePalmLine(parsed.heartLine, 'Heart Line'),
        headLine: this.normalizePalmLine(parsed.headLine, 'Head Line'),
        overview:
          typeof parsed.overview === 'string' ? parsed.overview : '',
      };
      if (userId) {
        await this.reportsService.savePalmReadingReport(userId, report);
      }
      return report;
    } catch (error) {
      console.error('Palm reading OpenAI error:', error?.response?.data || error?.message || error);
      throw new InternalServerErrorException('Failed to analyze palm images');
    }
  }

  private normalizePalmLine(
    value: unknown,
    fallbackTitle: string,
  ): PalmLineReading {
    if (typeof value === 'string') {
      return { title: fallbackTitle, description: value };
    }
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      return {
        title:
          typeof obj.title === 'string' ? obj.title : fallbackTitle,
        description:
          typeof obj.description === 'string' ? obj.description : '',
      };
    }
    return { title: fallbackTitle, description: '' };
  }

  async getMonthlyHoroscope(
    dto: MonthlyHoroscopeDto,
  ): Promise<MonthlyHoroscopeResponse> {
    return this.callGptJson<MonthlyHoroscopeResponse>(
      `You are a Vedic astrologer. Generate a monthly horoscope for ${dto.sign}.
Return a JSON object:
{
  monthlyOverview: '2-3 paragraph overview',
  career: '2-3 paragraph career outlook',
  relationships: '2-3 paragraph relationship outlook',
  health: '2-3 paragraph health outlook',
  keyOpportunities: '2-3 paragraph key opportunities'
}
Return only valid JSON, no markdown.`,
    );
  }

  async unlockTool(
    userId: string,
    toolType: UnlockToolType,
    reportPayload?: MonthlyHoroscopeReportPayloadDto,
    platform: ClientPlatform = 'unknown',
  ): Promise<UnlockToolResponse> {
    assertDigitalToolPurchaseAllowed(platform);
    // FEATURE_DIGITAL_TOOLS=true reopens unlocks. Default stays off.
    if (!readFeatureFlags().digitalTools) {
      throw new ServiceUnavailableException(
        'Paid report unlock is temporarily unavailable. You will not be charged. Try again when unlock reopens in the app.',
      );
    }

    if (toolType === 'detailed_kundli') {
      throw new BadRequestException(
        'Detailed Kundli is charged per report. Generate from the app to purchase.',
      );
    }

    if (toolType === 'detailed_compatibility') {
      throw new BadRequestException(
        'Detailed Compatibility is charged per report. Generate from the app to purchase.',
      );
    }

    // Never debit monthly unlock without a payload we can persist as a report.
    if (toolType === 'monthly_horoscope') {
      const sign = reportPayload?.sign?.trim();
      if (!reportPayload || !sign) {
        throw new BadRequestException(
          'Monthly horoscope unlock requires a complete report payload before any charge.',
        );
      }
    }

    const cost = TOOL_UNLOCK_COSTS[toolType];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (Number(user.walletBalance) < cost) {
      throw new BadRequestException('insufficient_balance');
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: cost } },
        select: { walletBalance: true },
      }),
      this.prisma.transaction.create({
        data: {
          userId,
          type: 'booking_debit',
          coinsAmount: cost,
          amountInr: null,
          status: TransactionStatus.SUCCESS,
          description: `Unlocked ${toolType}`,
        },
      }),
    ]);

    if (toolType === 'monthly_horoscope' && reportPayload) {
      try {
        await this.reportsService.saveMonthlyHoroscopeReport(
          userId,
          reportPayload.sign?.trim() || '',
          reportPayload,
        );
      } catch (error) {
        await this.refundToolCharge(
          userId,
          cost,
          'Month Report Unlock',
        );
        throw error;
      }
    }

    return {
      success: true,
      newBalance: Math.floor(Number(updatedUser.walletBalance)),
      toolType,
    };
  }

  async isToolUnlocked(
    userId: string,
    toolType: UnlockToolType,
  ): Promise<boolean> {
    const unlockedSet = await this.getUnlockedToolSet(userId);
    return unlockedSet.has(toolType);
  }

  async getUnlockedTools(userId: string): Promise<UnlockedToolsResponse> {
    const unlockedSet = await this.getUnlockedToolSet(userId);
    return { unlockedTools: [...unlockedSet] };
  }

  private async getUnlockedToolSet(
    userId: string,
  ): Promise<Set<UnlockToolType>> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'booking_debit',
        status: TransactionStatus.SUCCESS,
        description: { startsWith: 'Unlocked ' },
      },
      select: { description: true },
    });

    const unlockedSet = new Set<UnlockToolType>();
    for (const tx of transactions) {
      if (!tx.description) continue;
      const toolType = tx.description.slice('Unlocked '.length);
      if ((UNLOCK_TOOL_TYPES as readonly string[]).includes(toolType)) {
        unlockedSet.add(toolType as UnlockToolType);
      }
    }

    return unlockedSet;
  }

  private resolveCoordinates(placeOfBirth: string, coordinatesOverride?: string): string {
    const override = coordinatesOverride?.trim();
    if (override && /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(override)) {
      return override.replace(/\s+/g, '');
    }
    const coordinates = resolveCoordinatesFromPlace(placeOfBirth);
    if (!coordinates) {
      throw new BadRequestException(
        `Unknown place of birth: ${placeOfBirth}. Please select a city from the list.`,
      );
    }
    return coordinates;
  }

  private mapPlanetPositions(data: unknown): KundliPlanet[] {
    if (!data || typeof data !== 'object') {
      return [];
    }

    const record = data as Record<string, unknown>;
    const rawList =
      record.planet_position ??
      record.planetPosition ??
      (Array.isArray(data) ? data : null);

    if (!Array.isArray(rawList)) {
      return [];
    }

    return rawList
      .map((item): KundliPlanet | null => {
        if (!item || typeof item !== 'object') return null;
        const planet = item as Record<string, unknown>;
        const name = typeof planet.name === 'string' ? planet.name : null;
        if (!name) return null;

        const rasi = planet.rasi as Record<string, unknown> | undefined;
        const sign =
          typeof rasi?.name === 'string'
            ? rasi.name
            : typeof planet.sign === 'string'
              ? planet.sign
              : '—';

        const houseRaw = planet.position ?? planet.house;
        const house =
          typeof houseRaw === 'number'
            ? houseRaw
            : typeof houseRaw === 'string'
              ? Number.parseInt(houseRaw, 10) || 0
              : 0;

        const degreeRaw = planet.degree;
        let degree: number | string = '—';
        if (typeof degreeRaw === 'number') {
          degree = Math.round(degreeRaw * 100) / 100;
        } else if (typeof degreeRaw === 'string' && degreeRaw.trim()) {
          degree = degreeRaw;
        }

        return { name, sign, house, degree };
      })
      .filter((planet): planet is KundliPlanet => planet !== null);
  }

  private buildDatetime(dob: string, timeOfBirth: string): string {
    const datePart = dob.includes('T') ? dob.split('T')[0] : dob;
    const timeParts = timeOfBirth.split(':');
    const hours = timeParts[0]?.padStart(2, '0') ?? '00';
    const minutes = timeParts[1]?.padStart(2, '0') ?? '00';
    const seconds = timeParts[2]?.padStart(2, '0') ?? '00';
    return `${datePart}T${hours}:${minutes}:${seconds}${IST_OFFSET}`;
  }

  private nowIstDatetime(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(
      now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000,
    );
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}T${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}${IST_OFFSET}`;
  }

  private startOfMonthIstDatetime(): string {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(
      now.getTime() + istOffset + now.getTimezoneOffset() * 60 * 1000,
    );
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-01T00:00:00${IST_OFFSET}`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    const clientId = this.configService.get<string>('PROKERALA_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'PROKERALA_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Prokerala API is not configured',
      );
    }

    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });

      const response = await fetch(`${PROKERALA_BASE_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token request failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as ProkeralaTokenResponse;
      this.cachedToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      return this.cachedToken;
    } catch (error) {
      console.error('[Prokerala] token fetch failed:', error);
      throw new InternalServerErrorException(
        'Failed to authenticate with Prokerala API',
      );
    }
  }

  private extractCurrentDasha(dashaData: unknown): Record<string, string> {
    if (!dashaData || typeof dashaData !== 'object') {
      return {};
    }

    const record = dashaData as Record<string, unknown>;
    const periods = record.dasha_periods ?? record.dashaPeriods;
    if (!Array.isArray(periods)) {
      return {};
    }

    const now = Date.now();
    for (const maha of periods) {
      if (!maha || typeof maha !== 'object') continue;
      const mahaRecord = maha as Record<string, unknown>;
      const mahaStart = Date.parse(String(mahaRecord.start ?? ''));
      const mahaEnd = Date.parse(String(mahaRecord.end ?? ''));
      if (Number.isNaN(mahaStart) || Number.isNaN(mahaEnd)) continue;
      if (now < mahaStart || now >= mahaEnd) continue;

      const mahadasha =
        typeof mahaRecord.name === 'string' ? mahaRecord.name : '';
      const antardashas = mahaRecord.antardasha;
      if (!Array.isArray(antardashas)) {
        return {
          mahadasha,
          antardasha: '',
          mahadashaEndsOn: String(mahaRecord.end ?? ''),
          antardashaEndsOn: '',
        };
      }

      for (const antar of antardashas) {
        if (!antar || typeof antar !== 'object') continue;
        const antarRecord = antar as Record<string, unknown>;
        const antarStart = Date.parse(String(antarRecord.start ?? ''));
        const antarEnd = Date.parse(String(antarRecord.end ?? ''));
        if (Number.isNaN(antarStart) || Number.isNaN(antarEnd)) continue;
        if (now < antarStart || now >= antarEnd) continue;

        return {
          mahadasha,
          antardasha:
            typeof antarRecord.name === 'string' ? antarRecord.name : '',
          mahadashaEndsOn: String(mahaRecord.end ?? ''),
          antardashaEndsOn: String(antarRecord.end ?? ''),
        };
      }

      return {
        mahadasha,
        antardasha: '',
        mahadashaEndsOn: String(mahaRecord.end ?? ''),
        antardashaEndsOn: '',
      };
    }

    return {};
  }

  private async prokeralaGetOptional(
    path: string,
    params: Record<string, string>,
  ): Promise<unknown> {
    try {
      return await this.prokeralaGet(path, params);
    } catch (error) {
      console.error(`[Prokerala] ${path} failed:`, error);
      return {};
    }
  }

  private async prokeralaGet(
    path: string,
    params: Record<string, string>,
  ): Promise<unknown> {
    const token = await this.getAccessToken();
    const url = new URL(`${PROKERALA_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      const json = (await response.json()) as { data?: unknown };
      return json.data ?? json;
    } catch (error) {
      console.error(`[Prokerala] ${path} failed:`, error);
      const detail =
        error instanceof Error
          ? error.message
          : 'Failed to fetch data from Prokerala API';
      throw new InternalServerErrorException(detail);
    }
  }

  private getOpenAiKey(): string {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('OpenAI API is not configured');
    }
    return apiKey;
  }

  private async callGptJson<T>(prompt: string): Promise<T> {
    const apiKey = this.getOpenAiKey();
    const openai = new OpenAI({ apiKey });

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      return JSON.parse(content) as T;
    } catch (error) {
      console.error('[OpenAI] completion failed:', error);
      throw new InternalServerErrorException('Failed to generate reading');
    }
  }
}
