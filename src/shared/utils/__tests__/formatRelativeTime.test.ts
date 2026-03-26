import { formatRelativeTime, formatMessageTime } from '../formatRelativeTime';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-21T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "just now" for times within the last minute', () => {
    expect(formatRelativeTime('2026-03-21T11:59:30Z')).toBe('just now');
  });

  it('returns compact "now" when compact=true', () => {
    expect(formatRelativeTime('2026-03-21T11:59:30Z', true)).toBe('now');
  });

  it('returns minutes for recent times', () => {
    expect(formatRelativeTime('2026-03-21T11:55:00Z')).toBe('5m ago');
  });

  it('returns compact minutes', () => {
    expect(formatRelativeTime('2026-03-21T11:55:00Z', true)).toBe('5m');
  });

  it('returns hours for same-day times', () => {
    expect(formatRelativeTime('2026-03-21T09:00:00Z')).toBe('3h ago');
  });

  it('returns "yesterday" for one day ago', () => {
    expect(formatRelativeTime('2026-03-20T12:00:00Z')).toBe('yesterday');
  });

  it('returns days for recent past', () => {
    expect(formatRelativeTime('2026-03-19T12:00:00Z')).toBe('2d ago');
  });

  it('returns formatted date for old timestamps', () => {
    const result = formatRelativeTime('2025-01-01T00:00:00Z');
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
