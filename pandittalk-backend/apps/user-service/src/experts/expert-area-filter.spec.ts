import {
  buildAreaWhere,
  resolveGuidanceAreasForFilter,
} from './expert-area-filter';

describe('expert topic filters', () => {
  it('maps supported grouped topics to persisted guidance areas', () => {
    expect(resolveGuidanceAreasForFilter('career_business')).toEqual(['career', 'business']);
    expect(resolveGuidanceAreasForFilter('love_relationships')).toEqual(['love']);
    expect(resolveGuidanceAreasForFilter('finance_wealth')).toEqual(['finance']);
    expect(resolveGuidanceAreasForFilter('marriage_family')).toEqual(['family', 'marriage']);
    expect(resolveGuidanceAreasForFilter('health_wellbeing')).toEqual(['health']);
    expect(resolveGuidanceAreasForFilter('spiritual_protection')).toEqual(['spiritual_protection']);
  });

  it('does not resolve removed legal or life-path topics', () => {
    expect(resolveGuidanceAreasForFilter('legal_advice')).toBeNull();
    expect(resolveGuidanceAreasForFilter('life_path')).toBeNull();
  });

  it('builds an exact persisted-area filter for spiritual protection', () => {
    expect(buildAreaWhere(['spiritual_protection'])).toEqual({
      guidanceAreas: { has: 'spiritual_protection' },
    });
  });
});
