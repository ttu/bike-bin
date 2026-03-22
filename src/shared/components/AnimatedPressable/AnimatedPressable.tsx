import { type PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
}

export function AnimatedPressable({
  children,
  style,
  scaleValue = 0.98,
  onPressIn,
  onPressOut,
  ...rest
}: PropsWithChildren<AnimatedPressableProps>) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      {...rest}
      onPressIn={(e) => {
        // eslint-disable-next-line react-hooks/immutability -- reanimated shared value assignment is expected
        scale.value = withTiming(scaleValue, {
          duration: 150,
          easing: Easing.out(Easing.ease),
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        // eslint-disable-next-line react-hooks/immutability -- reanimated shared value assignment is expected
        scale.value = withTiming(1, {
          duration: 200,
          easing: Easing.in(Easing.ease),
        });
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
