/**
 * Coerces `null` to `undefined`, leaving every other value untouched.
 *
 * Why: PostgREST returns `null` for missing optional columns, but the project
 * convention is `undefined` over `null` (see CLAUDE.md). Use at the row→domain
 * mapping boundary so the rest of the codebase never has to think about `null`.
 */
export function nullToUndef<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
