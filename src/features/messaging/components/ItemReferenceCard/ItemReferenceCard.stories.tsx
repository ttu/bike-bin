import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { AvailabilityType } from '@/shared/types';
import { createMockConversationListItem } from '@/test/factories';
import { ItemReferenceCard } from './ItemReferenceCard';

const meta = {
  title: 'Messaging/ItemReferenceCard',
  component: ItemReferenceCard,
} satisfies Meta<typeof ItemReferenceCard>;

export default meta;

type Story = StoryObj<typeof meta>;

const conversation = createMockConversationListItem({
  itemName: 'Shimano XT derailleur',
  itemAvailabilityTypes: [AvailabilityType.Borrowable],
});

export const Default: Story = {
  args: {
    conversation,
    isOwnItem: false,
    onViewItem: fn(),
  },
};

export const OwnItem: Story = {
  args: {
    conversation,
    isOwnItem: true,
    onViewItem: fn(),
  },
};
