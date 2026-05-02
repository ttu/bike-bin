import { useMemo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, spacing, type AppTheme } from '@/shared/theme';
import {
  WIDE_DETAIL_PAGE_MAX_WIDTH,
  WIDE_DETAIL_SPLIT_MIN_COLUMN_WIDTH,
} from '@/shared/utils/wideDetailLayout';

export const MIDDLE_DOT = ' · ';

export type TFn = ReturnType<typeof useTranslation>['t'];

export function useThemedStyles(theme: AppTheme) {
  return useMemo(
    () =>
      StyleSheet.create({
        onBackground: { color: theme.colors.onBackground },
        onSurfaceVariant: { color: theme.colors.onSurfaceVariant },
        primary: { color: theme.colors.primary },
        avatarBg: { backgroundColor: theme.colors.surfaceVariant },
        sectionBorder: { borderBottomColor: theme.colors.outlineVariant },
        accentChipText: { color: theme.customColors.accent, fontWeight: '700' },
      }),
    [theme],
  );
}

export type Themed = ReturnType<typeof useThemedStyles>;

export function ActionSlot({
  isWide,
  fullWidth,
  children,
}: {
  readonly isWide: boolean;
  readonly fullWidth?: boolean;
  readonly children: ReactNode;
}) {
  if (!isWide) {
    return <>{children}</>;
  }
  return (
    <View style={[styles.actionGridCell, fullWidth && styles.actionGridCellFull]}>{children}</View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['2xl'],
  },
  wideScrollContent: {
    flexGrow: 1,
  },
  widePageInner: {
    width: '100%',
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitScrollContent: {
    paddingHorizontal: spacing.base,
  },
  wideSplitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    width: '100%',
    maxWidth: WIDE_DETAIL_PAGE_MAX_WIDTH,
    alignSelf: 'center',
  },
  wideSplitLeft: {
    flex: 1,
    minWidth: WIDE_DETAIL_SPLIT_MIN_COLUMN_WIDTH,
  },
  wideSplitRight: {
    flex: 1,
    minWidth: WIDE_DETAIL_SPLIT_MIN_COLUMN_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionFirst: {
    paddingTop: spacing.base,
  },
  actionSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.base,
  },
  actionSectionWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  actionGridCell: {
    width: '48%',
  },
  actionGridCellFull: {
    width: '100%',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleChip: {
    borderRadius: borderRadius.sm,
  },
  title: {
    fontFamily: 'BigShoulders-Black',
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    lineHeight: 64,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    marginTop: 0,
  },
  stampHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
  },
  ownerInfo: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  locationBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationText: {
    flex: 1,
  },
  listingChip: {
    borderRadius: borderRadius.sm,
  },
  actionButton: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonInGrid: {
    marginBottom: 0,
    width: '100%',
  },
});
