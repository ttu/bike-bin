import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

function WithCallToActionStory(args: ComponentProps<typeof EmptyState>) {
  const { t } = useTranslation('storybook');
  return (
    <EmptyState
      icon={args.icon ?? 'bike'}
      title={args.title && args.title.length > 0 ? args.title : t('emptyState.title')}
      description={
        args.description && args.description.length > 0
          ? args.description
          : t('emptyState.description')
      }
      ctaLabel={args.ctaLabel && args.ctaLabel.length > 0 ? args.ctaLabel : t('emptyState.cta')}
      onCtaPress={args.onCtaPress ?? fn()}
    />
  );
}

export const WithCallToAction: Story = {
  args: {
    icon: 'bike',
    title: '',
    description: '',
    ctaLabel: '',
    onCtaPress: fn(),
  },
  render: (args) => <WithCallToActionStory {...args} />,
};

function TextOnlyStory(args: ComponentProps<typeof EmptyState>) {
  const { t } = useTranslation('storybook');
  return (
    <EmptyState
      icon={args.icon ?? 'package-variant'}
      title={args.title && args.title.length > 0 ? args.title : t('emptyState.title')}
      description={
        args.description && args.description.length > 0
          ? args.description
          : t('emptyState.description')
      }
    />
  );
}

export const TextOnly: Story = {
  args: {
    icon: 'package-variant',
    title: '',
    description: '',
  },
  render: (args) => <TextOnlyStory {...args} />,
};
