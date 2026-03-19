/**
 * Format an ISO date string as a compact relative time string.
 *
 * @param compact - If true, uses short form ("5m", "2h"). If false, uses long form ("5m ago", "2h ago").
 */
export function formatRelativeTime(isoString: string, compact = false): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

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
