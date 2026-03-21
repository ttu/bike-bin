import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Modal, Portal, Text, useTheme } from 'react-native-paper';
import { GradientButton } from '@/shared/components/GradientButton';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';

interface AuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGate({ children, fallback }: AuthGateProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback ?? null}</>;
}

export function useAuthGate() {
  const { isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation('auth');
  const theme = useTheme();

  const requireAuth = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setShowModal(true);
    }
  };

  const modal = (
    <Portal>
      <Modal
        visible={showModal}
        onDismiss={() => setShowModal(false)}
        contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
      >
        <MaterialCommunityIcons name="lock-outline" size={48} color={theme.colors.primary} />
        <Text variant="titleLarge" style={styles.modalTitle}>
          {t('gate.title', 'Sign in to continue')}
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('gate.description', 'You need to sign in to use this feature.')}
        </Text>
        <GradientButton
          onPress={() => {
            setShowModal(false);
            router.push('/(auth)/login');
          }}
          style={styles.modalButton}
        >
          {t('gate.signIn', 'Sign in')}
        </GradientButton>
        <Button mode="text" onPress={() => setShowModal(false)}>
          {t('gate.cancel', 'Cancel')}
        </Button>
      </Modal>
    </Portal>
  );

  return { requireAuth, AuthModal: modal };
}

const styles = StyleSheet.create({
  modalContent: {
    margin: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    marginBottom: 8,
    minWidth: 200,
  },
});
