import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { TransactionType } from '@/shared/types';
import { RatingPrompt } from './RatingPrompt';

const meta = {
  title: 'Ratings/RatingPrompt',
  component: RatingPrompt,
} satisfies Meta<typeof RatingPrompt>;

export default meta;

type Story = StoryObj<typeof meta>;

function RatingPromptDefaultStory(args: ComponentProps<typeof RatingPrompt>) {
  const { t } = useTranslation('storybook');
  return (
    <RatingPrompt
      {...args}
      itemName={
        args.itemName && args.itemName.length > 0 ? args.itemName : t('fixtures.ratingItemName')
      }
      userName={
        args.userName && args.userName.length > 0 ? args.userName : t('fixtures.ratingUserName')
      }
    />
  );
}

export const Default: Story = {
  args: {
    visible: true,
    onDismiss: fn(),
    onSubmit: fn(),
    isSubmitting: false,
    itemName: '',
    userName: '',
    transactionType: TransactionType.Borrow,
  },
  render: (args) => <RatingPromptDefaultStory {...args} />,
};
