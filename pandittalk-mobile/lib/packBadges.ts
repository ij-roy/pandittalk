export type PackBadgeInput = {
  id: string;
  coins: number;
  bonusCoins: number;
  priceInr: number;
  isPopular: boolean;
};

export type PackBadge = {
  popular: boolean;
  savePercent: number | null;
};

function totalCoins(pack: PackBadgeInput): number {
  return pack.coins + Math.max(0, pack.bonusCoins);
}

function coinsPerRupee(pack: PackBadgeInput): number {
  if (pack.priceInr <= 0) return 0;
  return totalCoins(pack) / pack.priceInr;
}

export function packBadges(packs: PackBadgeInput[]): Record<string, PackBadge> {
  const priced = packs.filter((pack) => coinsPerRupee(pack) > 0);
  const baseline = priced.reduce<PackBadgeInput | null>((worst, pack) => {
    if (!worst || coinsPerRupee(pack) < coinsPerRupee(worst)) return pack;
    return worst;
  }, null);

  const flagged = packs.filter((pack) => pack.isPopular);
  let popularId: string | null = null;
  if (flagged.length > 0) {
    popularId = [...flagged].sort((a, b) => totalCoins(b) - totalCoins(a))[0]?.id ?? null;
  } else if (packs.length >= 3) {
    const sorted = [...packs].sort((a, b) => totalCoins(a) - totalCoins(b));
    popularId = sorted[Math.floor(sorted.length / 2)]?.id ?? null;
  }

  const badges: Record<string, PackBadge> = {};
  for (const pack of packs) {
    let savePercent: number | null = null;
    if (baseline && pack.id !== baseline.id) {
      const baseRate = coinsPerRupee(baseline);
      const rate = coinsPerRupee(pack);
      if (baseRate > 0 && rate > baseRate) {
        const percent = Math.round(((rate - baseRate) / baseRate) * 100);
        if (percent >= 1) savePercent = percent;
      }
    }
    badges[pack.id] = { popular: pack.id === popularId, savePercent };
  }
  return badges;
}
