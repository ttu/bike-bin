import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

type ConfirmDialogProps = ComponentProps<typeof ConfirmDialog>;

function ConfirmCancelStory(args: Partial<ConfirmDialogProps>) {
  const { t } = useTranslation('storybook');
  return (
    <ConfirmDialog
      visible={args.visible ?? true}
      title={args.title && args.title.length > 0 ? args.title : t('confirm.title')}
      message={args.message && args.message.length > 0 ? args.message : t('confirm.message')}
      confirmLabel={
        args.confirmLabel && args.confirmLabel.length > 0 ? args.confirmLabel : t('confirm.confirm')
      }
      variant={args.variant ?? 'confirm-cancel'}
      onDismiss={args.onDismiss ?? fn()}
      onConfirm={args.onConfirm ?? fn()}
    />
  );
}

export const ConfirmCancel: Story = {
  args: {
    visible: true,
    title: '',
    message: '',
    confirmLabel: '',
    variant: 'confirm-cancel',
    onDismiss: fn(),
    onConfirm: fn(),
  },
  render: (args) => <ConfirmCancelStory {...args} />,
};

function AcknowledgeStory(args: Partial<ConfirmDialogProps>) {
  const { t: tCommon } = useTranslation('common');
  return (
    <ConfirmDialog
      visible={args.visible ?? true}
      title={args.title && args.title.length > 0 ? args.title : tCommon('alerts.noticeTitle')}
      message={args.message && args.message.length > 0 ? args.message : tCommon('errors.generic')}
      confirmLabel={
        args.confirmLabel && args.confirmLabel.length > 0
          ? args.confirmLabel
          : tCommon('actions.ok')
      }
      variant={args.variant ?? 'acknowledge'}
      onDismiss={args.onDismiss ?? fn()}
      onConfirm={args.onConfirm ?? fn()}
    />
  );
}

export const Acknowledge: Story = {
  args: {
    visible: true,
    title: '',
    message: '',
    confirmLabel: '',
    variant: 'acknowledge',
    onDismiss: fn(),
    onConfirm: fn(),
  },
  render: (args) => <AcknowledgeStory {...args} />,
};
