/**
 * Collects non-empty validation messages from a field→message map in stable
 * insertion order (matches typical validation pass order).
 */
export function collectFormErrorMessages(errors: object): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of Object.values(errors)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/**
 * Builds snackbar body: a single message is shown alone; multiple messages use
 * an intro line and a bulleted list so issues stay visible above the tab bar.
 */
export function formatValidationFeedbackBody(intro: string, messages: string[]): string {
  const cleaned = messages.map((m) => m.trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) {
    return cleaned[0] ?? '';
  }
  return `${intro}\n\n${cleaned.map((m) => `• ${m}`).join('\n')}`;
}
