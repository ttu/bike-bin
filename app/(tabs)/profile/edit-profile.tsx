import { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Avatar, Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import { useTranslation } from 'react-i18next';
import { spacing, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useProfile, useUpdateProfile } from '@/features/profile';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import type { UserId } from '@/shared/types';

export default function EditProfileScreen() {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { user } = useAuth();
  const { showSnackbarAlert } = useSnackbarAlerts();
  const userId = (user?.id ?? '') as UserId;

  const { data: profile } = useProfile(userId || undefined);
  const updateProfile = useUpdateProfile(userId || undefined);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');

  const handleSave = () => {
    updateProfile.mutate(
      { displayName: displayName.trim() || undefined },
      {
        onSuccess: () => {
          showSnackbarAlert({
            message: t('editScreen.successMessage'),
            variant: 'success',
            action: {
              label: tCommon('actions.done'),
              onPress: () => tabScopedBack('/(tabs)/profile'),
            },
          });
        },
        onError: () => {
          showSnackbarAlert({
            message: t('editScreen.errorMessage'),
            variant: 'error',
            duration: 'long',
          });
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/profile')} />
        <Appbar.Content title={t('editScreen.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          {profile?.avatarUrl ? (
            <Avatar.Image size={96} source={{ uri: profile.avatarUrl }} />
          ) : (
            <Avatar.Icon
              size={96}
              icon="account"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
          )}
        </View>

        <View style={[styles.fieldContainer, { backgroundColor: theme.colors.surface }]}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('editScreen.displayName')}
          </Text>
          <TextInput
            mode="outlined"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder={t('editScreen.displayNamePlaceholder')}
            maxLength={50}
            autoFocus
          />
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={updateProfile.isPending}
          disabled={updateProfile.isPending}
          style={styles.saveButton}
        >
          {updateProfile.isPending ? t('editScreen.saving') : t('editScreen.save')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  fieldContainer: {
    padding: spacing.base,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.lg,
  },
});
