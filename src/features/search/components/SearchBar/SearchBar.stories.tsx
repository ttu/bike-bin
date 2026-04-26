import type { Meta, StoryObj } from '@storybook/react-native';
import { useState, type ComponentProps } from 'react';
import { fn } from 'storybook/test';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';

const meta = {
  title: 'Search/SearchBar',
  component: SearchBar,
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

const searchBarOnSubmit = fn();
const searchBarOnChangeLocation = fn();

function SearchBarPlayground(args: ComponentProps<typeof SearchBar>) {
  const { t } = useTranslation('storybook');
  const [query, setQuery] = useState(args.query ?? '');
  const [distanceKm, setDistanceKm] = useState(args.distanceKm ?? 25);

  return (
    <SearchBar
      query={query}
      onQueryChange={(text) => {
        setQuery(text);
        args.onQueryChange?.(text);
      }}
      onSubmit={args.onSubmit ?? searchBarOnSubmit}
      areaName={args.areaName && args.areaName.length > 0 ? args.areaName : t('searchBar.area')}
      distanceKm={distanceKm}
      onDistanceChange={(km) => {
        setDistanceKm(km);
        args.onDistanceChange?.(km);
      }}
      onChangeLocation={args.onChangeLocation ?? searchBarOnChangeLocation}
    />
  );
}

export const Interactive: Story = {
  args: {
    query: '',
    onQueryChange: fn(),
    onSubmit: fn(),
    areaName: '',
    distanceKm: 25,
    onDistanceChange: fn(),
    onChangeLocation: fn(),
  },
  render: (args) => <SearchBarPlayground {...args} />,
};
