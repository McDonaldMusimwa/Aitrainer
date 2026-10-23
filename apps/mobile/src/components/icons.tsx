import type { ReactElement } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Line icons drawn on a 24×24 grid; decorative, so they are hidden from screen readers. */
export type IconName =
  | 'flame' | 'dumbbell' | 'barsUp' | 'pulse' | 'calendar' | 'kettlebell' | 'shield' | 'leaf'
  | 'building' | 'home' | 'person' | 'bolt' | 'sprout' | 'grain' | 'camera' | 'skip';

const PATHS: Record<IconName, ReactElement> = {
  flame: <Path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />,
  dumbbell: <Path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />,
  barsUp: <Path d="M4 19h16M7 19v-6M12 19V9M17 19V5" />,
  pulse: <Path d="M3 12h4l2-5 4 10 2-5h6" />,
  calendar: <><Rect x={3.5} y={5} width={17} height={15} rx={2.5} /><Path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  kettlebell: <><Path d="M9 7a3 3 0 0 1 6 0" /><Path d="M6.5 10h11l1.5 9.5H5z" /></>,
  shield: <><Path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><Path d="M12 9v6M9 12h6" /></>,
  leaf: <><Path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" /><Path d="M5 19l7-7" /></>,
  building: <><Rect x={4} y={4} width={16} height={16} rx={2} /><Path d="M8 8h2M14 8h2M8 12h2M14 12h2M10 20v-4h4v4" /></>,
  home: <Path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />,
  person: <><Circle cx={12} cy={5} r={2} /><Path d="M6 10l6-1 6 1M12 9v6l-3 5M12 15l3 5" /></>,
  bolt: <Path d="M13 3L5 13h6l-1 8 8-10h-6z" />,
  sprout: <Path d="M12 20v-8M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-7 7-7 0 4-3 7-7 7z" />,
  grain: <><Path d="M12 21V8M12 8c-2-1-2-4 0-5 2 1 2 4 0 5zM12 13c-3 0-4-2-4-4 2 0 4 1 4 4zM12 13c3 0 4-2 4-4-2 0-4 1-4 4z" /><Path d="M4 4l16 16" /></>,
  camera: <><Path d="M4 8h3l2-3h6l2 3h3v11H4z" /><Circle cx={12} cy={13} r={3.5} /></>,
  skip: <Path d="M5 6l7 6-7 6M13 6l7 6-7 6" />,
};

export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  // The hiding props live on a View: passed to Svg they reach the DOM as unknown attributes on web.
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  </View>;
}
