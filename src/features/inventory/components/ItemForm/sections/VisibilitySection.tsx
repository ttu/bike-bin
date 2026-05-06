import { View } from 'react-native';
import { Text, Chip, HelperText, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { Visibility } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { useGroups, type GroupWithRole } from '@/features/groups';
import type { ItemFormState } from '../types';
import { styles } from '../styles';

interface VisibilitySectionProps {
  readonly state: ItemFormState;
}

const VISIBILITY_OPTIONS: ReadonlyArray<{ value: Visibility; labelKey: string }> = [
  { value: Visibility.Private, labelKey: 'form.visibilityPrivate' },
  { value: Visibility.All, labelKey: 'form.visibilityAll' },
  { value: Visibility.Groups, labelKey: 'form.visibilityGroups' },
];

export function VisibilitySection({ state }: VisibilitySectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { data: userGroups } = useGroups();
  const { visibility, setVisibility, groupIds, toggleGroupId, errors } = state;

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.visibilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        {VISIBILITY_OPTIONS.map(({ value, labelKey }) => {
          const selected = visibility === value;
          return (
            <Chip
              key={value}
              selected={selected}
              onPress={() => setVisibility(value)}
              showSelectedCheck={false}
              textStyle={selected ? { color: theme.colors.onPrimary } : undefined}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.colors.primary
                    : theme.colors.secondaryContainer,
                },
              ]}
            >
              {t(labelKey)}
            </Chip>
          );
        })}
      </View>

      {visibility === Visibility.Groups && (
        <View style={styles.groupSelection}>
          {userGroups && userGroups.length > 0 ? (
            <View style={styles.chipRow}>
              {userGroups.map((group: GroupWithRole) => {
                const selected = groupIds.includes(group.id);
                return (
                  <Chip
                    key={group.id}
                    selected={selected}
                    onPress={() => toggleGroupId(group.id)}
                    showSelectedCheck={false}
                    textStyle={selected ? { color: theme.colors.onPrimary } : undefined}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? theme.colors.primary
                          : theme.colors.secondaryContainer,
                      },
                    ]}
                  >
                    {group.name}
                  </Chip>
                );
              })}
            </View>
          ) : (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('form.noGroups')}
            </Text>
          )}
          {errors.groupIds && (
            <HelperText type="error" visible>
              {errors.groupIds}
            </HelperText>
          )}
        </View>
      )}
    </>
  );
}
