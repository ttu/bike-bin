import { Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import type { AppTheme } from '@/shared/theme';

interface SocketBBMarkProps {
  /** Rendered width and height in px. Defaults to 56. */
  size?: number;
  /** Disc fill colour. Defaults to theme primary (teal). */
  background?: string;
  /** Socket cutout fill colour. Defaults to theme background (warm paper). */
  foreground?: string;
  /**
   * Optional accessibility label. When omitted the mark is decorative and
   * hidden from assistive tech — use this when the mark stands alone (e.g.
   * an avatar), and leave it off when it sits next to the visible wordmark.
   */
  accessibilityLabel?: string;
}

/**
 * Socket BB — a teal disc with a rounded-hex socket cut out and the BB
 * monogram stamped inside. Read as a flat-top hex socket seen end-on.
 * Primary brand mark used at favicon, avatar, and masthead scales.
 */
export function SocketBBMark({
  size = 56,
  background,
  foreground,
  accessibilityLabel,
}: SocketBBMarkProps) {
  const theme = useTheme<AppTheme>();
  const bg = background ?? theme.colors.primary;
  const fg = foreground ?? theme.colors.background;
  const a11yProps = accessibilityLabel
    ? Platform.OS === 'web'
      ? ({ role: 'img', 'aria-label': accessibilityLabel } as const)
      : ({
          accessible: true,
          accessibilityLabel,
          importantForAccessibility: 'no-hide-descendants' as const,
        } as const)
    : Platform.OS === 'web'
      ? ({ 'aria-hidden': true } as const)
      : ({
          accessible: false,
          accessibilityElementsHidden: true,
          importantForAccessibility: 'no' as const,
        } as const);
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" {...a11yProps}>
      <Circle cx={60} cy={60} r={56} fill={bg} />
      <Path
        d="M 93.00 54.80 Q 96.00 60.00 93.00 65.20 L 81.00 85.98 Q 78.00 91.18 72.00 91.18 L 48.00 91.18 Q 42.00 91.18 39.00 85.98 L 27.00 65.20 Q 24.00 60.00 27.00 54.80 L 39.00 34.02 Q 42.00 28.82 48.00 28.82 L 72.00 28.82 Q 78.00 28.82 81.00 34.02 Z"
        fill={fg}
      />
      <SvgText
        x={60}
        y={74}
        textAnchor="middle"
        fontFamily="BigShoulders-Black"
        fontWeight="900"
        fontSize={36}
        fill={bg}
      >
        BB
      </SvgText>
    </Svg>
  );
}
