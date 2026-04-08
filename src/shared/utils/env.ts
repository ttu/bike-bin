export type AppEnv = 'development' | 'test' | 'preview' | 'staging' | 'production';

export const APP_ENV: AppEnv = (process.env.EXPO_PUBLIC_ENV as AppEnv) || 'development';

export const isProduction = APP_ENV === 'production';

/** Seeded test-user password buttons on the login screen (local, CI, PR preview, staging). Disabled in production only. */
export const isPasswordDemoLoginEnabled =
  APP_ENV === 'development' || APP_ENV === 'test' || APP_ENV === 'preview' || APP_ENV === 'staging';
