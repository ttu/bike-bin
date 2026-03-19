import { useState } from 'react';
import { ScrollView, StyleSheet, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Appbar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { spacing, borderRadius } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import { useSubmitSupport } from '@/features/profile/hooks/useSubmitSupport';
import type { UserId } from '@/shared/types';

export default function SupportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { user } = useAuth();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [subjectError, setSubjectError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  const submitSupport = useSubmitSupport();

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const deviceInfo = `${Platform.OS} ${Platform.Version}`;

  const handleSubmit = () => {
    const hasSubject = subject.trim().length > 0;
    const hasMessage = message.trim().length > 0;

    setSubjectError(!hasSubject);
    setMessageError(!hasMessage);

    if (!hasSubject || !hasMessage) return;

    submitSupport.mutate(
      {
        userId: user ? (user.id as string as UserId) : undefined,
        email: !user && email.trim() ? email.trim() : undefined,
        subject: subject.trim(),
        body: message.trim(),
        appVersion,
        deviceInfo,
      },
      {
        onSuccess: () => {
          Alert.alert(t('support.successTitle'), t('support.successMessage'), [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: () => {
          Alert.alert(t('support.errorTitle'), t('support.errorMessage'));
        },
      },
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('support.title')} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Email field for unauthenticated users */}
        {!user && (
          <TextInput
            label={t('support.email')}
            placeholder={t('support.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        )}

        {/* Subject */}
        <TextInput
          label={t('support.subject')}
          placeholder={t('support.subjectPlaceholder')}
          value={subject}
          onChangeText={(text) => {
            setSubject(text);
            if (subjectError) setSubjectError(false);
          }}
          mode="outlined"
          error={subjectError}
          style={styles.input}
        />
        {subjectError && (
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            {t('support.validationSubject')}
          </Text>
        )}

        {/* Message */}
        <TextInput
          label={t('support.message')}
          placeholder={t('support.messagePlaceholder')}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (messageError) setMessageError(false);
          }}
          mode="outlined"
          multiline
          numberOfLines={6}
          error={messageError}
          style={[styles.input, styles.messageInput]}
        />
        {messageError && (
          <Text variant="bodySmall" style={{ color: theme.colors.error }}>
            {t('support.validationMessage')}
          </Text>
        )}

        {/* Context note */}
        {user && (
          <Text
            variant="bodySmall"
            style={[styles.contextNote, { color: theme.colors.onSurfaceVariant }]}
          >
            {t('support.contextNote')}
          </Text>
        )}

        {/* Submit */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitSupport.isPending}
          disabled={submitSupport.isPending}
          style={styles.submitButton}
        >
          {submitSupport.isPending ? t('support.sending') : t('support.send')}
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
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
  },
  messageInput: {
    minHeight: 120,
  },
  contextNote: {
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
});
