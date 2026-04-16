import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { ReportDialog } from './ReportDialog';

const meta = {
  title: 'Shared/ReportDialog',
  component: ReportDialog,
} satisfies Meta<typeof ReportDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    onDismiss: fn(),
    onSubmit: fn(),
  },
  render: () => <ReportDialog visible onDismiss={fn()} onSubmit={fn()} />,
};
