import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';

const meta = {
  title: 'Search/SearchBar',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function SearchBarPlayground() {
  const { t } = useTranslation('storybook');
  const [query, setQuery] = useState('');
  const [distanceKm, setDistanceKm] = useState(25);

  return (
    <SearchBar
      query={query}
      onQueryChange={setQuery}
      onSubmit={fn()}
      areaName={t('searchBar.area')}
      distanceKm={distanceKm}
      onDistanceChange={setDistanceKm}
      onChangeLocation={fn()}
    />
  );
}

export const Interactive: Story = {
  render: () => <SearchBarPlayground />,
};
