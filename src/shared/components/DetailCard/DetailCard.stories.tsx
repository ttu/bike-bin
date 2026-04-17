import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { DetailCard } from './DetailCard';

const meta = {
  title: 'Shared/DetailCard',
  component: DetailCard,
} satisfies Meta<typeof DetailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

function DefaultStory(args: ComponentProps<typeof DetailCard>) {
  const { t } = useTranslation('storybook');
  return (
    <DetailCard
      icon={args.icon ?? 'information'}
      label={args.label && args.label.length > 0 ? args.label : t('sample.detailTitle')}
      value={args.value && args.value.length > 0 ? args.value : t('sample.detailBody')}
    />
  );
}

export const Default: Story = {
  args: {
    icon: 'information',
    label: '',
    value: '',
  },
  render: (args) => <DefaultStory {...args} />,
};
