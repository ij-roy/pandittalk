export type GuidanceStep = 1 | 2 | 3 | 4 | 5;

export const SEE_EXPERTS_LABEL = 'See experts';
export const SESSION_LENGTH_FIRST_LABEL = 'Choose session length first';
export const CHOOSE_SESSION_LENGTH_LABEL = 'Choose session length';

/** Home already picked the topic, so the next screen is the expert list. */
export function guidanceStepAfterArea(): GuidanceStep {
  return 4;
}

export function nextGuidanceStep(
  step: GuidanceStep,
  choices: { depth: boolean; format: boolean; expert: boolean },
): GuidanceStep {
  if (step === 4 && (!choices.depth || !choices.format)) return 2;
  if (step === 3 && choices.expert) return 5;
  if (step >= 5) return 5;
  return (step + 1) as GuidanceStep;
}

export function previousGuidanceStep(
  step: GuidanceStep,
  choices: { depth: boolean; format: boolean; expert: boolean },
): GuidanceStep | null {
  if (step <= 1) return null;
  if (step === 4 && !choices.depth && !choices.format) return 1;
  if (step === 2 && choices.expert && !choices.format) return 4;
  return (step - 1) as GuidanceStep;
}
