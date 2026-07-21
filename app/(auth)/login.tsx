import { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { LoginMasthead, LoginActionPanel, useAuth } from '@/features/auth';
import { useDemoMode } from '@/features/demo';
import { ReviewerSignInSheet, useReviewerLongPress } from '@/features/reviewer-signin';
import { spacing, type AppTheme } from '@/shared/theme';

const MAX_CONTENT_WIDTH = 480;

export default function LoginScreen() {
  const theme = useTheme<AppTheme>();
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const [reviewerSheetVisible, setReviewerSheetVisible] = useState(false);
  const reviewerLongPress = useReviewerLongPress(() => setReviewerSheetVisible(true));

  const handleBrowseWithout = () => {
    router.replace('/(tabs)/inventory');
  };

  const handleTryDemo = () => {
    enterDemoMode();
    router.replace('/(tabs)/inventory');
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <LoginMasthead
            onLogoLongPress={reviewerLongPress.onLongPress}
            logoLongPressDelay={reviewerLongPress.delayLongPress}
          />
          <LoginActionPanel
            onSignInWithApple={signInWithApple}
            onSignInWithGoogle={signInWithGoogle}
            onBrowseWithout={handleBrowseWithout}
            onTryDemo={handleTryDemo}
          />
        </View>
      </ScrollView>
      <ReviewerSignInSheet
        visible={reviewerSheetVisible}
        onDismiss={() => setReviewerSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
});
