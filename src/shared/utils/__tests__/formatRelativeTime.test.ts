import { formatRelativeTime, formatMessageTime } from '../formatRelativeTime';

const t = (key: string, options?: Record<string, unknown>): string => {
  const count = options?.count;
  return count === undefined ? key : `${key}:${String(count)}`;
};

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-21T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns justNow key for times within the last minute', () => {
    expect(formatRelativeTime('2026-03-21T11:59:30Z', t)).toBe('common:timeAgo.justNow');
  });

  it('returns compact justNow key when compact=true', () => {
    expect(formatRelativeTime('2026-03-21T11:59:30Z', t, true)).toBe(
      'common:timeAgo.justNowCompact',
    );
  });

  it('returns minutesAgo key for recent times', () => {
    expect(formatRelativeTime('2026-03-21T11:55:00Z', t)).toBe('common:timeAgo.minutesAgo:5');
  });

  it('returns compact minutesAgo key', () => {
    expect(formatRelativeTime('2026-03-21T11:55:00Z', t, true)).toBe(
      'common:timeAgo.minutesAgoCompact:5',
    );
  });

  it('returns hoursAgo key for same-day times', () => {
    expect(formatRelativeTime('2026-03-21T09:00:00Z', t)).toBe('common:timeAgo.hoursAgo:3');
  });

  it('returns yesterday key for one day ago', () => {
    expect(formatRelativeTime('2026-03-20T12:00:00Z', t)).toBe('common:timeAgo.yesterday');
  });

  it('returns daysAgo key for recent past', () => {
    expect(formatRelativeTime('2026-03-19T12:00:00Z', t)).toBe('common:timeAgo.daysAgo:2');
  });

  it('returns formatted date for old timestamps', () => {
    const result = formatRelativeTime('2025-01-01T00:00:00Z', t);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatMessageTime', () => {
  it('formats an ISO string as a time', () => {
    const result = formatMessageTime('2026-03-21T14:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
