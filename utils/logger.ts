const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  info:  (...a: unknown[]) => { if (isDev) console.log('[ACTIO]',   ...a); },
  warn:  (...a: unknown[]) => { if (isDev) console.warn('[ACTIO]',  ...a); },
  error: (...a: unknown[]) => { if (isDev) console.error('[ACTIO]', ...a); },
};
