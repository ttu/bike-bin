import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { RemoveFromInventoryDialog } from './RemoveFromInventoryDialog';

const meta = {
  title: 'Inventory/RemoveFromInventoryDialog',
  component: RemoveFromInventoryDialog,
} satisfies Meta<typeof RemoveFromInventoryDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ArchiveAndDelete: Story = {
  args: {
    visible: true,
    onDismiss: fn(),
    onArchive: fn(),
    onDelete: fn(),
  },
};

export const DeleteOnly: Story = {
  args: {
    visible: true,
    onDismiss: fn(),
    onArchive: undefined,
    onDelete: fn(),
  },
};
