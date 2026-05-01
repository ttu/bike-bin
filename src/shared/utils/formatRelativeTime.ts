type Translator = (key: string, options?: Record<string, unknown>) => string;

/** Format an ISO date string as a relative time string (e.g. "5m ago" or compact "5m"). */
export function formatRelativeTime(isoString: string, t: Translator, compact = false): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const suffix = compact ? 'Compact' : '';

  if (diffMinutes < 1) return t(`common:timeAgo.justNow${suffix}`);
  if (diffHours < 1) return t(`common:timeAgo.minutesAgo${suffix}`, { count: diffMinutes });
  if (diffDays < 1) return t(`common:timeAgo.hoursAgo${suffix}`, { count: diffHours });
  if (diffDays === 1) return t('common:timeAgo.yesterday');
  if (diffDays < 7) return t(`common:timeAgo.daysAgo${suffix}`, { count: diffDays });

  return new Date(isoString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/** Format an ISO date string as a time (e.g. "14:30"). */
export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
