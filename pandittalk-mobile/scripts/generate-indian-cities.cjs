const { City, State } = require(require.resolve('country-state-city', {
  paths: [require('path').join(__dirname, '../../backend')],
}));
const fs = require('fs');
const path = require('path');

const states = State.getStatesOfCountry('IN');
const stateMap = Object.fromEntries(states.map((s) => [s.isoCode, s.name]));

const cities = City.getCitiesOfCountry('IN')
  .map((c) => ({
    name: c.name,
    state: stateMap[c.stateCode] || c.stateCode,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
  }))
  .filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude))
  .sort((a, b) => a.name.localeCompare(b.name));

const mobileOut = `export type IndianCity = {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
};

export const INDIAN_CITIES: IndianCity[] = ${JSON.stringify(cities, null, 2)} as const;

export function formatCityCoordinates(city: IndianCity): string {
  return \`\${city.latitude},\${city.longitude}\`;
}

export function findIndianCity(name: string): IndianCity | undefined {
  const lower = name.trim().toLowerCase();
  return INDIAN_CITIES.find((c) => c.name.toLowerCase() === lower);
}
`;

const coordEntries = {};
for (const c of cities) {
  coordEntries[c.name.toLowerCase()] = `${c.latitude},${c.longitude}`;
}

const backendOut = `/** Auto-generated — run apps/mobile/scripts/generate-indian-cities.cjs to refresh. */
export const INDIAN_CITY_COORDINATES: Record<string, string> = ${JSON.stringify(coordEntries, null, 2)};

export function lookupCityCoordinates(placeName: string): string | undefined {
  const lower = placeName.trim().toLowerCase();
  if (INDIAN_CITY_COORDINATES[lower]) return INDIAN_CITY_COORDINATES[lower];
  for (const [key, coords] of Object.entries(INDIAN_CITY_COORDINATES)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  return undefined;
}
`;

const root = path.join(__dirname, '..');
fs.writeFileSync(path.join(root, 'constants', 'indianCities.ts'), mobileOut);
fs.writeFileSync(
  path.join(root, '..', 'backend', 'apps', 'user-service', 'src', 'tools', 'indian-city-coordinates.ts'),
  backendOut,
);
console.log(`Wrote ${cities.length} cities.`);
