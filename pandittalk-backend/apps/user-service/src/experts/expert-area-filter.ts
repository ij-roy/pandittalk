import type { Prisma } from '@prisma/client';
import type { BookingAreaId, ExpertAreaId } from './dto/list-experts-query.dto';
import {
  BOOKING_AREA_IDS,
  EXPERT_AREA_IDS,
} from './dto/list-experts-query.dto';

/** Expert-tab filter buckets → guidance booking area keys stored on Pandit. */
const EXPERT_AREA_TO_GUIDANCE: Record<ExpertAreaId, BookingAreaId[]> = {
  career_business: ['career', 'business'],
  love_relationships: ['love'],
  marriage_family: ['family', 'marriage'],
  finance_wealth: ['finance'],
  health_wellbeing: ['health'],
  spiritual_protection: ['spiritual_protection'],
};

const BOOKING_AREA_ID_SET = new Set<string>(BOOKING_AREA_IDS);
const EXPERT_AREA_ID_SET = new Set<string>(EXPERT_AREA_IDS);

/** Resolve ?area= query param to guidance area keys for DB filtering. */
export function resolveGuidanceAreasForFilter(
  area: string,
): BookingAreaId[] | null {
  const normalized = area.trim().toLowerCase();
  if (!normalized) return null;
  if (BOOKING_AREA_ID_SET.has(normalized)) {
    return [normalized as BookingAreaId];
  }
  if (EXPERT_AREA_ID_SET.has(normalized)) {
    return EXPERT_AREA_TO_GUIDANCE[normalized as ExpertAreaId];
  }
  return null;
}

/** Prisma where clause — empty areas yields no matches (no fallback to all). */
export function buildAreaWhere(
  guidanceAreas: BookingAreaId[],
): Prisma.PanditWhereInput {
  if (guidanceAreas.length === 0) {
    return { id: { in: [] } };
  }
  if (guidanceAreas.length === 1) {
    return { guidanceAreas: { has: guidanceAreas[0] } };
  }
  return { guidanceAreas: { hasSome: guidanceAreas } };
}
