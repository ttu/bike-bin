import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Appbar, Text, Button, Chip, useTheme } from 'react-native-paper';
import { ConfirmDialog } from '@/shared/components';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';
import { useSnackbarAlerts } from '@/shared/components/SnackbarAlerts';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import type { Href } from 'expo-router';
import { tabScopedBack } from '@/shared/utils/tabScopedBack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { spacing, iconSize, borderRadius } from '@/shared/theme';
import type { AppTheme } from '@/shared/theme';
import { useAuth } from '@/features/auth';
import {
  useGroup,
  useGroupMembers,
  useUpdateGroup,
  useDeleteGroup,
  useLeaveGroup,
  usePromoteMember,
  useRemoveMember,
  canDeleteGroup,
  canPromoteMember,
  canRemoveMember,
  canLeaveGroup,
  GroupEditForm,
} from '@/features/groups';
import { GroupInventoryTab } from '@/features/groups/components/GroupInventoryTab';
import type { GroupMemberWithProfile } from '@/features/groups';
import type { GroupId, UserId } from '@/shared/types';
import { GroupRole } from '@/shared/types';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = id as GroupId;
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation('groups');
  const { t: tCommon } = useTranslation('common');
  const { showSnackbarAlert } = useSnackbarAlerts();
  const { user } = useAuth();

  const userId = (user?.id ?? '') as UserId;
  const [isEditing, setIsEditing] = useState(false);

  const { data: group } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);

  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();
  const promoteMember = usePromoteMember();
  const removeMember = useRemoveMember();

  const { openConfirm, closeConfirm, confirmDialogProps } = useConfirmDialog();

  const currentMember = useMemo(
    () => (members ?? []).find((m) => m.userId === userId),
    [members, userId],
  );

  const isAdmin = currentMember?.role === GroupRole.Admin;

  const handleEditSubmit = useCallback(
    async (data: { name: string; description: string | undefined; isPublic: boolean }) => {
      try {
        await updateGroup.mutateAsync({
          id: groupId,
          name: data.name,
          description: data.description,
          isPublic: data.isPublic,
        });
        setIsEditing(false);
      } catch {
        showSnackbarAlert({
          message: t('errors.updateFailed'),
          variant: 'error',
          duration: 'long',
        });
      }
    },
    [groupId, updateGroup, showSnackbarAlert, t],
  );

  const handleDeleteGroup = useCallback(() => {
    openConfirm({
      title: t('detail.deleteGroup'),
      message: t('detail.deleteConfirm'),
      cancelLabel: tCommon('actions.cancel'),
      confirmLabel: tCommon('actions.delete'),
      destructive: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteGroup.mutateAsync(groupId);
          tabScopedBack('/(tabs)/groups' as Href);
        } catch {
          showSnackbarAlert({
            message: t('errors.deleteFailed'),
            variant: 'error',
            duration: 'long',
          });
        }
      },
    });
  }, [groupId, deleteGroup, showSnackbarAlert, t, tCommon, openConfirm, closeConfirm]);

  const handleLeaveGroup = useCallback(() => {
    if (!currentMember || !members) return;

    if (!canLeaveGroup(currentMember, members)) {
      showSnackbarAlert({
        message: t('detail.lastAdminWarning'),
        variant: 'error',
        duration: 'long',
      });
      return;
    }

    openConfirm({
      title: t('detail.leaveGroup'),
      message: t('detail.leaveConfirm'),
      cancelLabel: tCommon('actions.cancel'),
      confirmLabel: t('detail.leaveGroup'),
      destructive: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await leaveGroup.mutateAsync(groupId);
          tabScopedBack('/(tabs)/groups' as Href);
        } catch {
          showSnackbarAlert({
            message: t('errors.leaveFailed'),
            variant: 'error',
            duration: 'long',
          });
        }
      },
    });
  }, [
    groupId,
    currentMember,
    members,
    leaveGroup,
    showSnackbarAlert,
    t,
    tCommon,
    openConfirm,
    closeConfirm,
  ]);

  const handlePromoteMember = useCallback(
    (member: GroupMemberWithProfile) => {
      const displayName = member.profile.displayName ?? t('detail.unknownMember');
      openConfirm({
        title: t('detail.promote'),
        message: t('detail.promoteConfirm', { name: displayName }),
        cancelLabel: tCommon('actions.cancel'),
        confirmLabel: t('detail.promote'),
        onConfirm: async () => {
          closeConfirm();
          try {
            await promoteMember.mutateAsync({
              groupId,
              userId: member.userId,
            });
          } catch {
            showSnackbarAlert({
              message: t('errors.promoteFailed'),
              variant: 'error',
              duration: 'long',
            });
          }
        },
      });
    },
    [groupId, promoteMember, showSnackbarAlert, t, tCommon, openConfirm, closeConfirm],
  );

  const handleRemoveMember = useCallback(
    (member: GroupMemberWithProfile) => {
      const displayName = member.profile.displayName ?? t('detail.unknownMember');
      openConfirm({
        title: t('detail.remove'),
        message: t('detail.removeConfirm', { name: displayName }),
        cancelLabel: tCommon('actions.cancel'),
        confirmLabel: t('detail.remove'),
        destructive: true,
        onConfirm: async () => {
          closeConfirm();
          try {
            await removeMember.mutateAsync({
              groupId,
              userId: member.userId,
            });
          } catch {
            showSnackbarAlert({
              message: t('errors.removeFailed'),
              variant: 'error',
              duration: 'long',
            });
          }
        },
      });
    },
    [groupId, removeMember, showSnackbarAlert, t, tCommon, openConfirm, closeConfirm],
  );

  if (!group) {
    return null;
  }

  if (isEditing) {
    return (
      <GroupEditForm
        initialName={group.name}
        initialDescription={group.description ?? ''}
        initialIsPublic={group.isPublic}
        onCancel={() => setIsEditing(false)}
        onSubmit={handleEditSubmit}
        isSubmitting={updateGroup.isPending}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header dark={theme.dark} style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => tabScopedBack('/(tabs)/groups' as Href)} />
        <Appbar.Content title={group.name} />
        {isAdmin && <Appbar.Action icon="pencil" onPress={() => setIsEditing(true)} />}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.detailContent}>
        {/* Group info */}
        <View style={styles.groupInfo}>
          <View style={styles.groupMeta}>
            <Chip
              compact
              textStyle={styles.chipText}
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: borderRadius.full,
              }}
            >
              {group.isPublic ? t('detail.publicBadge') : t('detail.privateBadge')}
            </Chip>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('detail.memberCount', { count: (members ?? []).length })}
            </Text>
          </View>
          {group.description && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {group.description}
            </Text>
          )}
        </View>

        {/* Members */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          {t('detail.members')}
        </Text>

        {(members ?? []).map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            currentMember={currentMember}
            allMembers={members ?? []}
            onPromote={handlePromoteMember}
            onRemove={handleRemoveMember}
          />
        ))}

        {/* Inventory */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          {t('inventory.sectionTitle')}
        </Text>
        <View style={styles.inventoryTab}>
          <GroupInventoryTab groupId={groupId} />
        </View>

        {/* Actions */}
        {currentMember && (
          <View style={styles.actions}>
            {canLeaveGroup(currentMember, members ?? []) && (
              <Button
                mode="outlined"
                onPress={handleLeaveGroup}
                textColor={theme.colors.error}
                style={styles.actionButton}
              >
                {t('detail.leaveGroup')}
              </Button>
            )}

            {canDeleteGroup(currentMember) && (
              <Button
                mode="outlined"
                onPress={handleDeleteGroup}
                textColor={theme.colors.error}
                style={styles.actionButton}
              >
                {t('detail.deleteGroup')}
              </Button>
            )}
          </View>
        )}
      </ScrollView>
      <ConfirmDialog {...confirmDialogProps} />
    </View>
  );
}

// ─── Member row ───────────────────────────────────────────────────

function MemberRow({
  member,
  currentMember,
  allMembers,
  onPromote,
  onRemove,
}: {
  member: GroupMemberWithProfile;
  currentMember: GroupMemberWithProfile | undefined;
  allMembers: GroupMemberWithProfile[];
  onPromote: (member: GroupMemberWithProfile) => void;
  onRemove: (member: GroupMemberWithProfile) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('groups');

  const showPromote = currentMember && canPromoteMember(currentMember, member);
  const showRemove = currentMember && canRemoveMember(currentMember, member, allMembers);

  return (
    <View style={styles.memberRow}>
      <MaterialCommunityIcons
        name="account-circle"
        size={36}
        color={theme.colors.onSurfaceVariant}
      />
      <View style={styles.memberInfo}>
        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
          {member.profile.displayName ?? t('detail.unknownMember')}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {member.role === GroupRole.Admin ? t('detail.admin') : t('detail.member')}
        </Text>
      </View>
      {showPromote && (
        <Pressable onPress={() => onPromote(member)} accessibilityRole="button">
          <MaterialCommunityIcons
            name="arrow-up-bold"
            size={iconSize.sm}
            color={theme.colors.primary}
          />
        </Pressable>
      )}
      {showRemove && (
        <Pressable onPress={() => onRemove(member)} accessibilityRole="button">
          <MaterialCommunityIcons
            name="account-remove"
            size={iconSize.sm}
            color={theme.colors.error}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  groupInfo: {
    gap: spacing.sm,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chipText: {
    fontSize: 11,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  actions: {
    gap: spacing.sm,
  },
  inventoryTab: {
    minHeight: 200,
  },
  actionButton: {
    borderColor: 'transparent',
  },
});
