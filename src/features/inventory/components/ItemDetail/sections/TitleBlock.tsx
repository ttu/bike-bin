import { View } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { ItemStatus, type Item } from '@/shared/types';
import { type AppTheme } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/utils/colorWithAlpha';
import { MIDDLE_DOT, styles, type Themed, type TFn } from '../shared';

export function TitleBlock({
  item,
  theme,
  themed,
  statusColor,
  categoryLabel,
  subcategoryLabel,
  metaParts,
  t,
}: {
  readonly item: Item;
  readonly theme: AppTheme;
  readonly themed: Themed;
  readonly statusColor: string;
  readonly categoryLabel: string;
  readonly subcategoryLabel: string | undefined;
  readonly metaParts: string[];
  readonly t: TFn;
}) {
  return (
    <View style={[styles.section, styles.sectionFirst, themed.sectionBorder]}>
      <View style={styles.chipRow}>
        {item.status !== ItemStatus.Stored && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: colorWithAlpha(statusColor, 0.12) }]}
          >
            <Text variant="labelSmall" style={{ color: statusColor }}>
              {t(`status.${item.status}`)}
            </Text>
          </Chip>
        )}
        <Chip
          compact
          style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
        >
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subcategoryLabel ?? categoryLabel}
          </Text>
        </Chip>
        {item.quantity > 1 && (
          <Chip
            compact
            style={[styles.titleChip, { backgroundColor: theme.customColors.surfaceContainerHigh }]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {`×${item.quantity}`}
            </Text>
          </Chip>
        )}
      </View>
      <Text
        variant="displayLarge"
        style={[styles.title, themed.onBackground]}
        accessibilityRole="header"
      >
        {item.name}
      </Text>
      {metaParts.length > 0 && (
        <Text variant="bodyMedium" style={[styles.metaRow, themed.onSurfaceVariant]}>
          {metaParts.join(MIDDLE_DOT)}
        </Text>
      )}
      {item.tags.length > 0 && (
        <View style={[styles.chipRow, styles.tagRow]}>
          {item.tags.map((tag) => (
            <Chip
              key={tag}
              compact
              style={[styles.titleChip, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {tag}
              </Text>
            </Chip>
          ))}
        </View>
      )}
    </View>
  );
}
