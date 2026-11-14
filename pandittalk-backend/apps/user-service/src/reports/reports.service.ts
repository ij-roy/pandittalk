import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CompatibilityDto } from '../tools/dto/compatibility.dto';
import { KundliDto } from '../tools/dto/kundli.dto';
import {
  UNLOCK_TOOL_TYPES,
  type UnlockToolType,
} from '../tools/dto/unlock-tool.dto';
import type {
  CompatibilityDetailedResponse,
  CompatibilityResponse,
  HoroscopeResponse,
  KundliDetailedResponse,
  KundliPlanet,
  KundliResponse,
  MonthlyHoroscopeResponse,
  PalmReadingResponse,
  TarotResponse,
} from '../tools/tools.service';

const TOOL_UNLOCK_COSTS: Record<UnlockToolType, number> = {
  monthly_horoscope: 101,
  detailed_kundli: 251,
  detailed_compatibility: 201,
};

export const SAVED_REPORT_TYPES = [
  ...UNLOCK_TOOL_TYPES,
  'free_kundli',
  'free_compatibility',
  'daily_horoscope',
  'tarot',
  'palm_reading',
] as const;

export type SavedReportType = (typeof SAVED_REPORT_TYPES)[number];

export type SavedReportSummary = {
  id: string;
  type: SavedReportType;
  title: string;
  inputSummary: string;
  coinsSpent: number;
  createdAt: string;
};

export type SavedReportDetail = SavedReportSummary & {
  payload: unknown;
};

export type SaveReportInput = {
  userId: string;
  type: SavedReportType;
  title: string;
  inputSummary: string;
  payload: Prisma.InputJsonValue;
  coinsSpent: number;
};

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllForUser(userId: string): Promise<SavedReportSummary[]> {
    const reports = await this.prisma.savedReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        inputSummary: true,
        coinsSpent: true,
        createdAt: true,
      },
    });

    return reports.map((report) => this.toSummary(report));
  }

  async findOneForUser(
    userId: string,
    reportId: string,
  ): Promise<SavedReportDetail> {
    const report = await this.prisma.savedReport.findFirst({
      where: { id: reportId, userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return {
      ...this.toSummary(report),
      payload: report.payload,
    };
  }

  async saveReportBestEffort(input: SaveReportInput): Promise<void> {
    try {
      await this.prisma.savedReport.create({ data: input });
    } catch (error) {
      this.logger.error('SavedReport insert failed', error);
    }
  }

  async saveDetailedKundliReport(
    userId: string,
    dto: KundliDto,
    detailed: Omit<KundliDetailedResponse, 'newBalance'>,
  ): Promise<void> {
    const ascendantSign = findAscendantSign(detailed.planets);
    const title = ascendantSign
      ? `Detailed Kundli — ${ascendantSign}`
      : 'Detailed Kundli';
    const inputSummary = `${dto.firstName} ${dto.lastName} · ${dto.placeOfBirth}`;

    await this.saveReportBestEffort({
      userId,
      type: 'detailed_kundli',
      title,
      inputSummary,
      payload: detailed as unknown as Prisma.InputJsonValue,
      coinsSpent: TOOL_UNLOCK_COSTS.detailed_kundli,
    });
  }

  async saveDetailedCompatibilityReport(
    userId: string,
    dto: CompatibilityDto,
    detailed: Omit<CompatibilityDetailedResponse, 'newBalance'>,
  ): Promise<void> {
    const title = 'Detailed Compatibility';
    const inputSummary = `${dto.person1.name} & ${dto.person2.name}`;
    const payload = {
      ...detailed,
      person1Name: dto.person1.name,
      person2Name: dto.person2.name,
    };

    await this.saveReportBestEffort({
      userId,
      type: 'detailed_compatibility',
      title,
      inputSummary,
      payload: payload as unknown as Prisma.InputJsonValue,
      coinsSpent: TOOL_UNLOCK_COSTS.detailed_compatibility,
    });
  }

  async saveMonthlyHoroscopeReport(
    userId: string,
    sign: string,
    report: MonthlyHoroscopeResponse,
  ): Promise<void> {
    const signLabel = formatSignLabel(sign);
    const payload = { ...report, sign };

    await this.saveReportBestEffort({
      userId,
      type: 'monthly_horoscope',
      title: `Month Report — ${signLabel}`,
      inputSummary: signLabel,
      payload: payload as unknown as Prisma.InputJsonValue,
      coinsSpent: TOOL_UNLOCK_COSTS.monthly_horoscope,
    });
  }

  async saveFreeKundliReport(
    userId: string,
    dto: KundliDto,
    basic: KundliResponse,
  ): Promise<void> {
    const ascendantSign = findAscendantSign(basic.planets);
    await this.saveReportBestEffort({
      userId,
      type: 'free_kundli',
      title: ascendantSign ? `Kundli — ${ascendantSign}` : 'Kundli',
      inputSummary: `${dto.firstName} ${dto.lastName} · ${dto.placeOfBirth}`,
      payload: basic as unknown as Prisma.InputJsonValue,
      coinsSpent: 0,
    });
  }

  async saveFreeCompatibilityReport(
    userId: string,
    dto: CompatibilityDto,
    basic: CompatibilityResponse,
  ): Promise<void> {
    await this.saveReportBestEffort({
      userId,
      type: 'free_compatibility',
      title: 'Compatibility',
      inputSummary: `${dto.person1.name} & ${dto.person2.name}`,
      payload: {
        ...basic,
        person1Name: dto.person1.name,
        person2Name: dto.person2.name,
      } as unknown as Prisma.InputJsonValue,
      coinsSpent: 0,
    });
  }

  async saveDailyHoroscopeReport(
    userId: string,
    report: HoroscopeResponse,
  ): Promise<void> {
    const signLabel = formatSignLabel(report.sign);
    await this.saveReportBestEffort({
      userId,
      type: 'daily_horoscope',
      title: `Daily Horoscope — ${signLabel}`,
      inputSummary: signLabel,
      payload: report as unknown as Prisma.InputJsonValue,
      coinsSpent: 0,
    });
  }

  async saveTarotReport(userId: string, report: TarotResponse): Promise<void> {
    const card = report.cardName.trim() || 'Tarot';
    await this.saveReportBestEffort({
      userId,
      type: 'tarot',
      title: `Tarot — ${card}`,
      inputSummary: card,
      payload: report as unknown as Prisma.InputJsonValue,
      coinsSpent: 0,
    });
  }

  async savePalmReadingReport(
    userId: string,
    report: PalmReadingResponse,
  ): Promise<void> {
    await this.saveReportBestEffort({
      userId,
      type: 'palm_reading',
      title: 'Palm reading',
      inputSummary: report.overview.trim() || 'Palm reading',
      payload: report as unknown as Prisma.InputJsonValue,
      coinsSpent: 0,
    });
  }

  private toSummary(report: {
    id: string;
    type: string;
    title: string;
    inputSummary: string;
    coinsSpent: number;
    createdAt: Date;
  }): SavedReportSummary {
    return {
      id: report.id,
      type: assertSavedReportType(report.type),
      title: report.title,
      inputSummary: report.inputSummary,
      coinsSpent: report.coinsSpent,
      createdAt: report.createdAt.toISOString(),
    };
  }
}

function assertSavedReportType(value: string): SavedReportType {
  if ((SAVED_REPORT_TYPES as readonly string[]).includes(value)) {
    return value as SavedReportType;
  }
  return 'detailed_kundli';
}

function findAscendantSign(planets: KundliPlanet[]): string | null {
  const ascendant = planets.find(
    (planet) => planet.name.trim().toLowerCase() === 'ascendant',
  );
  return ascendant?.sign?.trim() || null;
}

function formatSignLabel(sign: string): string {
  const trimmed = sign.trim();
  if (!trimmed) return 'Unknown';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
