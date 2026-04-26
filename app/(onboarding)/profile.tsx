import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ProgressDots } from '@/features/onboarding/components/ProgressDots';
import { useAuth } from '@/features/auth';
import { useUpdateProfile } from '@/features/profile';
import type { UserId } from '@/shared/types';

export default function ProfileSetupScreen() {
  const theme = useTheme();
  const { t } = useTranslation('onboarding');
  const { user } = useAuth();
  const updateProfile = useUpdateProfile(user?.id ? (user.id as UserId) : undefined);

  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '');

  const handleContinue = () => {
    const trimmed = displayName.trim();
    if (user?.id && trimmed.length > 0) {
      updateProfile.mutate({ displayName: trimmed });
    }
    router.push('/(onboarding)/location');
  };

  const handleSkip = () => {
    router.push('/(onboarding)/location');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ProgressDots total={2} current={1} />
      <Text variant="headlineMedium" style={styles.title}>
        {t('profile.title')}
      </Text>

      <View style={[styles.photoPlaceholder, { borderColor: theme.colors.outline }]}>
        <MaterialCommunityIcons
          name="camera-plus"
          size={40}
          color={theme.colors.onSurfaceVariant}
        />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('profile.photoLabel')}
        </Text>
      </View>

      <TextInput
        label={t('profile.displayNameLabel')}
        placeholder={t('profile.displayNamePlaceholder')}
        value={displayName}
        onChangeText={setDisplayName}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.buttonRow}>
        <Button mode="text" onPress={handleSkip}>
          {t('profile.skip')}
        </Button>
        <Button mode="contained" onPress={handleContinue}>
          {t('profile.continue')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
