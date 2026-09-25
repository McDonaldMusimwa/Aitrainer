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
  // Neutral grayscale palette, chosen after a design review for a more professional, serious feel.
  mono: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    ink: '#212529',
    muted: '#6C757D',
    accent: '#343A40',
    accentForeground: '#FFFFFF',
    secondary: '#E9ECEF',
    secondaryForeground: '#212529',
    border: '#DEE2E6',
    primary: '#212529',
    primaryForeground: '#FFFFFF',
    focus: '#E9ECEF',
    error: '#B42318',
    errorBackground: '#FCEBEA',
  },
  // Warm ivory & antique gold, chosen from the design review's palette exploration.
  keeper: {
    background: '#F7F4EC',
    surface: '#FFFFFF',
    ink: '#1C1712',
    muted: '#6B6152',
    accent: '#B8892E',
    accentForeground: '#FFFFFF',
    secondary: '#F1ECDF',
    secondaryForeground: '#1C1712',
    border: '#E3DBC7',
    primary: '#B8892E',
    primaryForeground: '#FFFFFF',
    focus: '#FBF3DC',
    error: '#A63F2C',
    errorBackground: '#FBEAE6',
  },
} satisfies Record<string, AppColors>;

export type ThemeName = keyof typeof themes;
// Use one default app-wide for now. Change this to 'classic', 'default', or 'mono' to preview the other palettes.
export const activeTheme: ThemeName = 'keeper';
export const colors: AppColors = themes[activeTheme];
