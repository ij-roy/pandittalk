const HIGHLIGHTS = ['ascendant', 'lagna', 'sun', 'moon'];

export type KundliSharePlanet = {
  name: string;
  sign: string;
  house: number;
};

export function kundliShareMessage(input: {
  firstName: string;
  lastName: string;
  planets: KundliSharePlanet[];
}): string {
  const name = [input.firstName, input.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  const lines = input.planets
    .filter((planet) => planet.name.trim() && planet.sign.trim() && Number.isFinite(planet.house))
    .sort((a, b) => highlightRank(a.name) - highlightRank(b.name))
    .slice(0, 10)
    .map((planet) => `${planet.name.trim()} · ${planet.sign.trim()} · House ${planet.house}`);
  const header = name ? [name, 'Free Kundli', ''] : ['Free Kundli', ''];
  return [...header, ...lines, '', 'PanditTalk'].join('\n');
}

function highlightRank(name: string): number {
  const index = HIGHLIGHTS.indexOf(name.trim().toLowerCase());
  return index === -1 ? HIGHLIGHTS.length : index;
}
