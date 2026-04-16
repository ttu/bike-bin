import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { ReportDialog } from './ReportDialog';

const meta = {
  title: 'Shared/ReportDialog',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ReportDialog visible onDismiss={fn()} onSubmit={fn()} />,
};
