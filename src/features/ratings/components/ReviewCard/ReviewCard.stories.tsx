import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { TransactionType } from '@/shared/types';
import { ReviewCard } from './ReviewCard';

const meta = {
  title: 'Ratings/ReviewCard',
  component: ReviewCard,
} satisfies Meta<typeof ReviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

function BorrowTransactionStory(args: ComponentProps<typeof ReviewCard>) {
  const { t } = useTranslation('storybook');
  const reviewerName =
    args.reviewerName !== undefined && args.reviewerName.length > 0
      ? args.reviewerName
      : t('fixtures.reviewerName');
  const text =
    args.text !== undefined && args.text.length > 0 ? args.text : t('fixtures.reviewBody');
  return <ReviewCard {...args} reviewerName={reviewerName} text={text} />;
}

export const BorrowTransaction: Story = {
  args: {
    reviewerName: '',
    score: 5,
    text: '',
    transactionType: TransactionType.Borrow,
    createdAt: '2026-02-01T12:00:00Z',
  },
  render: (args) => <BorrowTransactionStory {...args} />,
};

export const DeletedReviewer: Story = {
  args: {
    reviewerName: undefined,
    isDeletedReviewer: true,
    score: 4,
    text: undefined,
    transactionType: TransactionType.Sell,
    createdAt: '2026-01-20T09:00:00Z',
  },
};
