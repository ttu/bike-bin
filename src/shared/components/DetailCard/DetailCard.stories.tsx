import type { Meta, StoryObj } from '@storybook/react-native';
import { useTranslation } from 'react-i18next';
import { DetailCard } from './DetailCard';

const meta = {
  title: 'Shared/DetailCard',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function SampleDetail() {
  const { t } = useTranslation('storybook');
  return (
    <DetailCard icon="information" label={t('sample.detailTitle')} value={t('sample.detailBody')} />
  );
}

export const Default: Story = {
  render: () => <SampleDetail />,
};
