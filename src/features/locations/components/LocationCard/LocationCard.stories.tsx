import type { Meta, StoryObj } from '@storybook/react-native';
import type { ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { createMockLocation } from '@/test/factories';
import { LocationCard } from './LocationCard';

const meta = {
  title: 'Locations/LocationCard',
  component: LocationCard,
} satisfies Meta<typeof LocationCard>;

export default meta;

type Story = StoryObj<typeof meta>;

function LocationCardDefaultStory(args: ComponentProps<typeof LocationCard>) {
  const { t } = useTranslation('storybook');
  return (
    <LocationCard
      {...args}
      location={createMockLocation({
        label: t('locationCard.homeLabel'),
        areaName: t('locationCard.berlinArea'),
        isPrimary: true,
      })}
    />
  );
}

export const Default: Story = {
  args: {
    location: createMockLocation({
      label: 'placeholder',
      areaName: 'placeholder',
      isPrimary: true,
    }),
    onPress: fn(),
    onDelete: fn(),
  },
  render: (args) => <LocationCardDefaultStory {...args} />,
};

function LocationCardSecondaryStory(args: ComponentProps<typeof LocationCard>) {
  const { t } = useTranslation('storybook');
  return (
    <LocationCard
      {...args}
      location={createMockLocation({
        label: t('locationCard.workshopLabel'),
        isPrimary: false,
      })}
    />
  );
}

export const Secondary: Story = {
  args: {
    location: createMockLocation({ label: 'placeholder', isPrimary: false }),
    onPress: fn(),
    onDelete: fn(),
  },
  render: (args) => <LocationCardSecondaryStory {...args} />,
};
