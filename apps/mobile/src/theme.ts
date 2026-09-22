/** Shared semantic colors. Keep screen and component colors in this file. */
export type AppColors = {
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentForeground: string;
  secondary: string;
  secondaryForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  focus: string;
  error: string;
  errorBackground: string;
};

// White is specified in the reference; taupe and yellow are sampled from its swatches.
export const palette = {
  white: '#FFFFFF',
  taupe: '#B2A094',
  yellow: '#F1CD49',
  black: '#000000',
} as const;

export const themes = {
  default: {
    background: palette.white,
    surface: palette.white,
    ink: palette.black,
    muted: '#51473F',
    accent: palette.yellow,
    accentForeground: palette.black,
    secondary: palette.taupe,
    secondaryForeground: palette.black,
    border: palette.black,
    primary: palette.black,
    primaryForeground: palette.white,
    focus: '#FFF8DE',
    error: '#B42318',
    errorBackground: '#FCEBEA',
  },
  // Preserve the original account palette as a second, optional theme.
  classic: {
    background: '#FFFFFF',
    surface: '#FFFDFD',
    ink: '#090909',
    muted: '#62626B',
    accent: '#F5D657',
    accentForeground: '#090909',
    secondary: '#F2F2F7',
    secondaryForeground: '#090909',
    border: '#454545',
    primary: '#000000',
    primaryForeground: '#FFFFFF',
    focus: '#FFFBED',
    error: '#B42318',
    errorBackground: '#FCEBEA',
  },
} satisfies Record<string, AppColors>;

export type ThemeName = keyof typeof themes;
// Use one default app-wide for now. Change this to 'classic' to preview the other palette.
export const activeTheme: ThemeName = 'default';
export const colors: AppColors = themes[activeTheme];
