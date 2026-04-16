import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { GradientButton } from './GradientButton';

const meta = {
  title: 'Shared/GradientButton',
  component: GradientButton,
} satisfies Meta<typeof GradientButton>;

export default meta;

type Story = StoryObj<typeof meta>;

function SaveLabel() {
  const { t } = useTranslation('common');
  return (
    <GradientButton onPress={fn()} accessibilityLabel={t('actions.save')}>
      {t('actions.save')}
    </GradientButton>
  );
}

export const Primary: Story = {
  args: {
    children: ' ',
    onPress: fn(),
  },
  render: () => <SaveLabel />,
};

function LoadingState() {
  const { t } = useTranslation('common');
  return (
    <GradientButton loading accessibilityLabel={t('actions.save')}>
      {t('actions.save')}
    </GradientButton>
  );
}

export const Loading: Story = {
  args: {
    children: ' ',
    loading: true,
  },
  render: () => <LoadingState />,
};
