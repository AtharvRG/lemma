import { startTimelineInterval, stopTimelineInterval } from '../timelineInterval';

jest.useFakeTimers();

describe('timelineInterval helper', () => {
  let calls = 0;
  const handler = () => calls++;

  beforeEach(() => {
    calls = 0;
    jest.clearAllTimers();
  });

  test('starts and stops interval at given speed', () => {
    const id = startTimelineInterval(handler, 1);
    jest.advanceTimersByTime(500);
    expect(calls).toBeGreaterThan(0);
    stopTimelineInterval(id as number);
    const prev = calls;
    jest.advanceTimersByTime(500);
    expect(calls).toBe(prev);
  });

  test('higher speed results in more ticks in the same time', () => {
    const id1 = startTimelineInterval(handler, 1);
    jest.advanceTimersByTime(600);
    const callsAt1 = calls;
    stopTimelineInterval(id1 as number);

    calls = 0;
    const id2 = startTimelineInterval(handler, 4);
    jest.advanceTimersByTime(600);
    const callsAt4 = calls;
    stopTimelineInterval(id2 as number);

    expect(callsAt4).toBeGreaterThanOrEqual(callsAt1);
  });
});
