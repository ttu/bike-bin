import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { GradientButton } from './GradientButton';

const meta = {
  title: 'Shared/GradientButton',
  component: GradientButton,
} satisfies Meta<typeof GradientButton>;

export default meta;

type Story = StoryObj<typeof meta>;

type GradientButtonProps = ComponentProps<typeof GradientButton>;

function SaveLabel(args: Partial<GradientButtonProps>) {
  const { t } = useTranslation('common');
  return (
    <GradientButton
      {...args}
      onPress={args.onPress ?? fn()}
      accessibilityLabel={args.accessibilityLabel ?? t('actions.save')}
    >
      {args.children ?? t('actions.save')}
    </GradientButton>
  );
}

export const Primary: Story = {
  args: {
    children: undefined,
    onPress: fn(),
  },
  render: (args) => <SaveLabel {...args} />,
};

function LoadingState(args: Partial<GradientButtonProps>) {
  const { t } = useTranslation('common');
  return (
    <GradientButton
      {...args}
      loading={args.loading ?? true}
      accessibilityLabel={args.accessibilityLabel ?? t('actions.save')}
    >
      {args.children ?? t('actions.save')}
    </GradientButton>
  );
}

export const Loading: Story = {
  args: {
    children: undefined,
    loading: true,
  },
  render: (args) => <LoadingState {...args} />,
};
