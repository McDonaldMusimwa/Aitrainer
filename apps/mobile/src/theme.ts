import { createContext, useContext, useMemo } from 'react';

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
  // Primary is ink rather than gold: white on #B8892E is only ~3:1, below the 4.5:1 text minimum.
  // The gold accent is deepened to #8F6A1F for the same reason, as it also carries text.
  keeper: {
    background: '#F7F4EC',
    surface: '#FFFFFF',
    ink: '#1C1712',
    muted: '#6B6152',
    accent: '#8F6A1F',
    accentForeground: '#FFFFFF',
    secondary: '#F1ECDF',
    secondaryForeground: '#1C1712',
    border: '#E3DBC7',
    primary: '#1C1712',
    primaryForeground: '#FFFFFF',
    focus: '#FBF3DC',
    error: '#A63F2C',
    errorBackground: '#FBEAE6',
  },
  // Dark counterpart to keeper, matching the photo-backed auth screens: near-black ground,
  // warm off-white ink and a white primary button.
  night: {
    background: '#121110',
    surface: '#1D1B18',
    ink: '#F5F2EA',
    muted: '#A69D8E',
    accent: '#D1A24A',
    accentForeground: '#1C1712',
    secondary: '#2A2622',
    secondaryForeground: '#F5F2EA',
    border: '#34302A',
    primary: '#FFFFFF',
    primaryForeground: '#1C1712',
    focus: '#2A2622',
    error: '#FF8A75',
    errorBackground: '#3A1F1A',
  },
} satisfies Record<string, AppColors>;

export type ThemeName = keyof typeof themes;
// The palettes used for light and dark mode. Change lightTheme to 'classic', 'default', or 'mono' to preview the others.
export const lightTheme: ThemeName = 'keeper';
export const darkTheme: ThemeName = 'night';

export type ColorScheme = 'light' | 'dark';
/** What the person picked in Profile › Appearance; 'system' follows the phone's setting. */
export type ThemePreference = 'system' | ColorScheme;

export type ThemeValue = {
  colors: AppColors;
  scheme: ColorScheme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeValue>({
  colors: themes[lightTheme], scheme: 'light', preference: 'system', setPreference: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/** Builds a component's StyleSheet from the active colors, rebuilding only when the theme changes. */
export function useStyles<T>(makeStyles: (colors: AppColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => makeStyles(colors), [makeStyles, colors]);
}

// Text and controls drawn over a darkened photo (the auth screens). These sit on the
// photo's gradient rather than on a palette surface, so they are the same for every theme.
export const onPhoto = {
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.8)',
  field: 'rgba(255,255,255,0.14)',
  fieldFocused: 'rgba(255,255,255,0.24)',
  border: 'rgba(255,255,255,0.4)',
  error: '#FFB4A6',
  buttonFill: '#FFFFFF',
  buttonText: '#1C1712',
  gradient: ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.78)', 'rgba(0,0,0,0.94)'] as const,
  gradientStops: [0, 0.28, 0.62, 1] as const,
  // Even darkening for content that starts near the top (e.g. a form), where the bottom-weighted
  // gradient would leave white text over the photo's bright wall.
  fullGradient: ['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.72)', 'rgba(0,0,0,0.92)'] as const,
  fullGradientStops: [0, 0.45, 1] as const,
  track: 'rgba(255,255,255,0.28)',
  accent: '#E2B85C',
};
