import { create } from 'zustand';

type LayoutState = {
  isTimelineFloating: boolean;
  timelinePos: { x: number; y: number };
  setTimelineFloating: (v: boolean) => void;
  setTimelinePos: (p: { x: number; y: number }) => void;
  resetTimelinePos: () => void;
};

const STORAGE_KEY = 'lemma.layout';

const defaultPos = { x: 40, y: 80 };

export const useLayoutStore = create<LayoutState>((set, get) => {
  const persist = () => {
    try {
      const s = { isTimelineFloating: get().isTimelineFloating, timelinePos: get().timelinePos };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      // ignore
    }
  };

  return {
    // Keep defaults consistent between server and client render to avoid hydration mismatches.
    isTimelineFloating: false,
    timelinePos: defaultPos,
    setTimelineFloating: (v: boolean) => {
      set({ isTimelineFloating: v });
      persist();
    },
    setTimelinePos: (p) => {
      set({ timelinePos: p });
      persist();
    },
    resetTimelinePos: () => {
      set({ timelinePos: defaultPos });
      persist();
    },
  };
});

// Client-only hydration helper: read persisted layout and update the store after mount.
export function hydrateLayoutFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      useLayoutStore.setState({
        isTimelineFloating: !!parsed.isTimelineFloating,
        timelinePos: parsed.timelinePos || defaultPos,
      });
    }
  } catch (e) {
    // ignore parse/storage errors
  }
}
