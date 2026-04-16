import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { TransactionType } from '@/shared/types';
import { RatingPrompt } from './RatingPrompt';

const meta = {
  title: 'Ratings/RatingPrompt',
  component: RatingPrompt,
} satisfies Meta<typeof RatingPrompt>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    onDismiss: fn(),
    onSubmit: fn(),
    isSubmitting: false,
    itemName: 'Tubeless sealant',
    userName: 'Jamie',
    transactionType: TransactionType.Borrow,
  },
};
