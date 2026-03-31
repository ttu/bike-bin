import { View } from 'react-native';
import { Text, Chip, HelperText, useTheme } from 'react-native-paper';
import type { AppTheme } from '@/shared/theme';
import { Visibility } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/features/groups';
import type { GroupWithRole } from '@/features/groups';
import type { ItemFormState } from '../types';
import { styles } from '../styles';

interface VisibilitySectionProps {
  visibility: ItemFormState['visibility'];
  setVisibility: ItemFormState['setVisibility'];
  groupIds: ItemFormState['groupIds'];
  toggleGroupId: ItemFormState['toggleGroupId'];
  errors: ItemFormState['errors'];
}

export function VisibilitySection({
  visibility,
  setVisibility,
  groupIds,
  toggleGroupId,
  errors,
}: VisibilitySectionProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('inventory');
  const { data: userGroups } = useGroups();

  return (
    <>
      <Text variant="labelLarge" style={[styles.label, styles.sectionLabel]}>
        {t('form.visibilityLabel')}
      </Text>
      <View style={styles.chipRow}>
        <Chip
          selected={visibility === Visibility.Private}
          onPress={() => setVisibility(Visibility.Private)}
          showSelectedCheck={false}
          textStyle={
            visibility === Visibility.Private ? { color: theme.colors.onPrimary } : undefined
          }
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.Private
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
          ]}
        >
          {t('form.visibilityPrivate')}
        </Chip>
        <Chip
          selected={visibility === Visibility.All}
          onPress={() => setVisibility(Visibility.All)}
          showSelectedCheck={false}
          textStyle={visibility === Visibility.All ? { color: theme.colors.onPrimary } : undefined}
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.All
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
          ]}
        >
          {t('form.visibilityAll')}
        </Chip>
        <Chip
          selected={visibility === Visibility.Groups}
          onPress={() => setVisibility(Visibility.Groups)}
          showSelectedCheck={false}
          textStyle={
            visibility === Visibility.Groups ? { color: theme.colors.onPrimary } : undefined
          }
          style={[
            styles.chip,
            {
              backgroundColor:
                visibility === Visibility.Groups
                  ? theme.colors.primary
                  : theme.colors.secondaryContainer,
            },
          ]}
        >
          {t('form.visibilityGroups')}
        </Chip>
      </View>

      {visibility === Visibility.Groups && (
        <View style={styles.groupSelection}>
          {userGroups && userGroups.length > 0 ? (
            <View style={styles.chipRow}>
              {userGroups.map((group: GroupWithRole) => (
                <Chip
                  key={group.id}
                  selected={groupIds.includes(group.id)}
                  onPress={() => toggleGroupId(group.id)}
                  showSelectedCheck={false}
                  textStyle={
                    groupIds.includes(group.id) ? { color: theme.colors.onPrimary } : undefined
                  }
                  style={[
                    styles.chip,
                    {
                      backgroundColor: groupIds.includes(group.id)
                        ? theme.colors.primary
                        : theme.colors.secondaryContainer,
                    },
                  ]}
                >
                  {group.name}
                </Chip>
              ))}
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
