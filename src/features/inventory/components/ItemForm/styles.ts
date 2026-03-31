import { StyleSheet } from 'react-native';
import { spacing, borderRadius } from '@/shared/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  label: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: borderRadius.full,
  },
  subcategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  subcategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionValue: {
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conditionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  groupSelection: {
    marginTop: spacing.sm,
  },
  optionalToggle: {
    marginTop: spacing.lg,
  },
  optionalSection: {
    marginTop: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
  autocompleteWrapper: {
    zIndex: 10,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: borderRadius.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  usageInput: {
    flex: 1,
  },
  tagChip: {
    borderRadius: borderRadius.full,
    height: 36,
  },
});
