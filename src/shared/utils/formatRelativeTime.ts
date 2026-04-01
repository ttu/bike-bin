type Translator = (key: string, options?: Record<string, unknown>) => string;

/**
 * Format an ISO date string as a relative time string.
 *
 * When a `t` function is provided, returns i18n keys (timeAgo.justNow, etc.).
 * Otherwise returns English strings in compact ("5m") or long ("5m ago") form.
 */
export function formatRelativeTime(isoString: string, compact?: boolean): string;
export function formatRelativeTime(isoString: string, t: Translator): string;
export function formatRelativeTime(isoString: string, compactOrT?: boolean | Translator): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (typeof compactOrT === 'function') {
    const t = compactOrT;
    if (diffMinutes < 1) return t('timeAgo.justNow');
    if (diffHours < 1) return t('timeAgo.minutesAgo', { count: diffMinutes });
    if (diffDays < 1) return t('timeAgo.hoursAgo', { count: diffHours });
    return t('timeAgo.daysAgo', { count: diffDays });
  }

  const compact = compactOrT ?? false;
  const suffix = compact ? '' : ' ago';

  if (diffMinutes < 1) return compact ? 'now' : 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m${suffix}`;
  if (diffHours < 24) return `${diffHours}h${suffix}`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d${suffix}`;

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
