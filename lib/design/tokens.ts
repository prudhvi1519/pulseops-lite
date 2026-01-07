/**
 * Design tokens for the application.
 * These mirror the CSS variables defined in globals.css and can be used
 * for programmatic access or type-safe styling.
 */

export const spacing = {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
    '2xl': 'var(--spacing-2xl)',
} as const;

export const radius = {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
} as const;

export const colors = {
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    borderSubtle: 'var(--color-border-subtle)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textMuted: 'var(--color-text-muted)',
    success: 'var(--color-success)',
    successBg: 'var(--color-success-bg)',
    warning: 'var(--color-warning)',
    warningBg: 'var(--color-warning-bg)',
    error: 'var(--color-error)',
    errorBg: 'var(--color-error-bg)',
    info: 'var(--color-info)',
    infoBg: 'var(--color-info-bg)',
} as const;

export const typography = {
    fontSans: 'var(--font-sans)',
    fontMono: 'var(--font-mono)',
    textXs: 'var(--text-xs)',
    textSm: 'var(--text-sm)',
    textBase: 'var(--text-base)',
    textLg: 'var(--text-lg)',
    textXl: 'var(--text-xl)',
    text2xl: 'var(--text-2xl)',
    text3xl: 'var(--text-3xl)',
} as const;

export const shadows = {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
} as const;
