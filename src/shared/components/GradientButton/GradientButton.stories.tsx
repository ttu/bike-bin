import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { GradientButton } from './GradientButton';

const meta = {
  title: 'Shared/GradientButton',
} satisfies Meta;

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
  render: () => <LoadingState />,
};
