import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(25, { duration: 300 }),
      4,
      true
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotation.value, [0, 25], [0, 25], Extrapolate.CLAMP)}deg`,
        },
      ],
    };
  });

  return (
    <Animated.Text
      style={[
        {
          fontSize: 28,
          lineHeight: 32,
          marginTop: -6,
        },
        animatedStyle,
      ]}>
      👋
    </Animated.Text>
  );
}
