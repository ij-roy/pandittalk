import { envFlag, readFeatureFlags } from './feature-flags';

describe('feature flags', () => {
  it('defaults payments on and digital tools off', () => {
    expect(readFeatureFlags({})).toEqual({
      payments: true,
      digitalTools: false,
    });
  });

  it('treats off words as false', () => {
    expect(envFlag('false', true)).toBe(false);
    expect(envFlag('off', true)).toBe(false);
    expect(envFlag('0', true)).toBe(false);
  });

  it('treats on words as true', () => {
    expect(envFlag('true', false)).toBe(true);
    expect(envFlag('on', false)).toBe(true);
  });

  it('ignores unknown values', () => {
    expect(envFlag('maybe', true)).toBe(true);
    expect(envFlag('maybe', false)).toBe(false);
  });
});
