import type { Meta, StoryObj } from '@storybook/react-native';
import { ProgressDots } from './ProgressDots';

const meta = {
  title: 'Onboarding/ProgressDots',
  component: ProgressDots,
} satisfies Meta<typeof ProgressDots>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StepTwoOfFour: Story = {
  args: {
    total: 4,
    current: 2,
  },
};

export const LastStep: Story = {
  args: {
    total: 3,
    current: 3,
  },
};
