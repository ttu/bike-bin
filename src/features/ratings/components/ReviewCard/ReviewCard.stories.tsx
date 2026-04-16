import type { Meta, StoryObj } from '@storybook/react-native';
import { TransactionType } from '@/shared/types';
import { ReviewCard } from './ReviewCard';

const meta = {
  title: 'Ratings/ReviewCard',
  component: ReviewCard,
} satisfies Meta<typeof ReviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BorrowTransaction: Story = {
  args: {
    reviewerName: 'Alex',
    score: 5,
    text: 'Smooth borrow, item matched the listing.',
    transactionType: TransactionType.Borrow,
    createdAt: '2026-02-01T12:00:00Z',
  },
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
