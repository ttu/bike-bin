import { type PropsWithChildren, useMemo, useCallback } from 'react';
import {
  Pressable,
  Animated,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  readonly style?: StyleProp<ViewStyle>;
  readonly scaleValue?: number;
}

export function AnimatedPressable({
  children,
  style,
  scaleValue = 0.98,
  onPressIn,
  onPressOut,
  ...rest
}: PropsWithChildren<AnimatedPressableProps>) {
  const scale = useMemo(() => new Animated.Value(1), []);

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      Animated.timing(scale, {
        toValue: scaleValue,
        duration: 150,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scale, scaleValue, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    <AnimatedPressableBase
      {...rest}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ transform: [{ scale }] }, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
