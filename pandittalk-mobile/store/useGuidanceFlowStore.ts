import { create } from 'zustand';

import type { BookingAreaKey, BookingDepthKey, BookingFormatKey } from '@/lib/bookingPricing';
import type { ExpertEntity } from '@/lib/expertsApi';

export type GuidanceStepIndex = 1 | 2 | 3 | 4 | 5;

type GuidanceFlowState = {
  step: GuidanceStepIndex;
  area: BookingAreaKey | null;
  notes: string;
  depth: BookingDepthKey | null;
  format: BookingFormatKey | null;
  expert: ExpertEntity | null;
  setStep: (step: GuidanceStepIndex) => void;
  setArea: (area: BookingAreaKey | null) => void;
  setNotes: (notes: string) => void;
  setDepth: (depth: BookingDepthKey | null) => void;
  setFormat: (format: BookingFormatKey | null) => void;
  setExpert: (expert: ExpertEntity | null) => void;
  resetFlow: () => void;
};

const initialState = {
  step: 1 as GuidanceStepIndex,
  area: null as BookingAreaKey | null,
  notes: '',
  depth: null as BookingDepthKey | null,
  format: null as BookingFormatKey | null,
  expert: null as ExpertEntity | null,
};

export const useGuidanceFlowStore = create<GuidanceFlowState>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setArea: (area) => set({ area }),
  setNotes: (notes) => set({ notes }),
  setDepth: (depth) => set({ depth }),
  setFormat: (format) => set({ format }),
  setExpert: (expert) => set({ expert }),
  resetFlow: () => set(initialState),
}));
