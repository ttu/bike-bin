import type { Meta, StoryObj } from '@storybook/react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaxWidthContainer } from './MaxWidthContainer';

const meta = {
  title: 'Shared/MaxWidthContainer',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function MaxWidthHint() {
  const { t } = useTranslation('storybook');
  return (
    <MaxWidthContainer>
      <Text variant="bodyLarge">{t('sample.maxWidthHint')}</Text>
    </MaxWidthContainer>
  );
}

export const WithContent: Story = {
  render: () => <MaxWidthHint />,
};
