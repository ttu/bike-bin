/**
 * Used by `playwright.remote-*.config.ts` for CI runs against deployed Expo web.
 */
export function requireRemotePlaywrightBaseUrl(): string {
  const raw = process.env.PLAYWRIGHT_BASE_URL?.trim();
  if (raw === undefined || raw === '') {
    throw new Error(
      'PLAYWRIGHT_BASE_URL is required for remote E2E (HTTPS URL of the deployed Expo web app).',
    );
  }
  return raw;
}
