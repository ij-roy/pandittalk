import * as common from './index';

type ResolveServicePort = (
  runtimePort: string | number | undefined,
  servicePort: string | number | undefined,
  fallbackPort: number,
) => number;

const resolveServicePort = (
  common as typeof common & {
    resolveServicePort: ResolveServicePort;
  }
).resolveServicePort;

describe('resolveServicePort', () => {
  it('prefers Render PORT over the service-specific port', () => {
    expect(resolveServicePort('10000', '3001', 3001)).toBe(10000);
  });

  it('falls back to the service-specific port when PORT is unavailable', () => {
    expect(resolveServicePort(undefined, '3001', 3001)).toBe(3001);
  });

  it('falls back to the local default when neither port is configured', () => {
    expect(resolveServicePort(undefined, undefined, 3001)).toBe(3001);
  });
});
