import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';

interface ProgressDotsProps {
  readonly total: number;
  readonly current: number;
}

export function ProgressDots({ total, current }: ProgressDotsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityLabel={`Step ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i + 1 === current ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
