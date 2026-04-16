import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Shared/EmptyState',
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

function EmptyStateWithCopy() {
  const { t } = useTranslation('storybook');
  return (
    <EmptyState
      icon="bike"
      title={t('emptyState.title')}
      description={t('emptyState.description')}
      ctaLabel={t('emptyState.cta')}
      onCtaPress={fn()}
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
  render: () => <EmptyStateWithCopy />,
};

function EmptyStateNoCta() {
  const { t } = useTranslation('storybook');
  return (
    <EmptyState
      icon="package-variant"
      title={t('emptyState.title')}
      description={t('emptyState.description')}
    />
  );
}

export const TextOnly: Story = {
  args: {
    icon: 'package-variant',
    title: '',
    description: '',
  },
  render: () => <EmptyStateNoCta />,
};
