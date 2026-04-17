import type { Meta, StoryObj } from '@storybook/react-native';
import { CenteredLoadingIndicator } from './CenteredLoadingIndicator';

const meta = {
  title: 'Shared/CenteredLoadingIndicator',
  component: CenteredLoadingIndicator,
} satisfies Meta<typeof CenteredLoadingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
