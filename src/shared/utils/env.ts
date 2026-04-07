export type AppEnv = 'development' | 'test' | 'preview' | 'staging' | 'production';

export const APP_ENV: AppEnv = (process.env.EXPO_PUBLIC_ENV as AppEnv) || 'development';

export const isProduction = APP_ENV === 'production';
