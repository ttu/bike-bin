import { useMemo, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Portal, Modal, Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import { signInAsReviewer, type ReviewerSignInError } from '../../utils/signInAsReviewer';

interface ReviewerSignInSheetProps {
  readonly visible: boolean;
  readonly onDismiss: () => void;
}

export function ReviewerSignInSheet({ visible, onDismiss }: ReviewerSignInSheetProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('reviewerSignin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ReviewerSignInError | undefined>(undefined);

  const themed = useMemo(
    () => ({
      sheet: {
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
      },
      grabHandle: { backgroundColor: theme.colors.outlineVariant },
      eyebrow: { color: theme.colors.primary },
      title: { color: theme.colors.onSurface },
      subtitle: { color: theme.colors.onSurfaceVariant },
      footer: { color: theme.colors.onSurfaceVariant },
      error: { color: theme.colors.error },
    }),
    [theme],
  );

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(undefined);
    setSubmitting(false);
  };

  const handleDismiss = () => {
    reset();
    onDismiss();
  };

  const handleSubmit = async () => {
    if (!email || !password || submitting) {
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const result = await signInAsReviewer(email.trim(), password);
    if (result.ok) {
      reset();
      onDismiss();
      router.replace('/(tabs)/inventory');
      return;
    }
    setError(result.error);
    setSubmitting(false);
  };

  const submitDisabled = submitting || !email || !password;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
        style={styles.modal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={[styles.sheet, themed.sheet]}>
            <View style={[styles.grabHandle, themed.grabHandle]} />
            <Text variant="labelMedium" style={[styles.eyebrow, themed.eyebrow]}>
              {t('sheet.eyebrow').toUpperCase()}
            </Text>
            <Text variant="headlineMedium" style={[styles.title, themed.title]}>
              {t('sheet.title')}
            </Text>
            <Text variant="bodyMedium" style={[styles.subtitle, themed.subtitle]}>
              {t('sheet.subtitle')}
            </Text>

            <TextInput
              mode="outlined"
              label={t('sheet.emailLabel')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              disabled={submitting}
              style={styles.input}
              accessibilityLabel={t('sheet.emailLabel')}
            />
            <TextInput
              mode="outlined"
              label={t('sheet.passwordLabel')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              disabled={submitting}
              style={styles.input}
              accessibilityLabel={t('sheet.passwordLabel')}
            />

            {error && (
              <Text variant="bodySmall" style={[styles.error, themed.error]}>
                {t(`errors.${error}`)}
              </Text>
            )}

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleDismiss}
                disabled={submitting}
                style={styles.actionButton}
              >
                {t('sheet.cancel')}
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitDisabled}
                style={styles.actionButton}
              >
                {t('sheet.submit')}
              </Button>
            </View>

            <Text variant="bodySmall" style={[styles.footer, themed.footer]}>
              {t('sheet.footer')}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
  },
  modalContainer: {
    margin: 0,
  },
  kav: {
    width: '100%',
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  grabHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  eyebrow: {
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  title: {
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.md,
  },
  input: {
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.base,
  },
  actionButton: {
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
