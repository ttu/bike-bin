import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function ConfirmCancelStory() {
  const { t } = useTranslation('storybook');
  return (
    <ConfirmDialog
      visible
      title={t('confirm.title')}
      message={t('confirm.message')}
      confirmLabel={t('confirm.confirm')}
      variant="confirm-cancel"
      onDismiss={fn()}
      onConfirm={fn()}
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
  render: () => <ConfirmCancelStory />,
};

function AcknowledgeStory() {
  const { t } = useTranslation('common');
  return (
    <ConfirmDialog
      visible
      title={t('alerts.noticeTitle')}
      message={t('errors.generic')}
      confirmLabel={t('actions.ok')}
      variant="acknowledge"
      onDismiss={fn()}
      onConfirm={fn()}
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
  render: () => <AcknowledgeStory />,
};
