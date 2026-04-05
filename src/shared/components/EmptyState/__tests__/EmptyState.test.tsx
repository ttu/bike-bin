import React from 'react';
import { screen, fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  const defaultProps = {
    icon: 'bike',
    title: 'No items found',
    description: 'Add your first item to get started.',
  };

  it('renders the title', () => {
    renderWithProviders(<EmptyState {...defaultProps} />);
    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('renders the description', () => {
    renderWithProviders(<EmptyState {...defaultProps} />);
    expect(screen.getByText('Add your first item to get started.')).toBeTruthy();
  });

  it('does not render CTA button when ctaLabel is not provided', () => {
    renderWithProviders(<EmptyState {...defaultProps} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('does not render CTA button when onCtaPress is not provided', () => {
    renderWithProviders(<EmptyState {...defaultProps} ctaLabel="Add item" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders CTA button when ctaLabel and onCtaPress are provided', () => {
    const onCtaPress = jest.fn();
    renderWithProviders(
      <EmptyState {...defaultProps} ctaLabel="Add item" onCtaPress={onCtaPress} />,
    );
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
  });

  it('calls onCtaPress when CTA button is pressed', () => {
    const onCtaPress = jest.fn();
    renderWithProviders(
      <EmptyState {...defaultProps} ctaLabel="Add item" onCtaPress={onCtaPress} />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onCtaPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onCtaPress when ctaDisabled is true', () => {
    const onCtaPress = jest.fn();
    renderWithProviders(
      <EmptyState {...defaultProps} ctaLabel="Add item" onCtaPress={onCtaPress} ctaDisabled />,
    );
    fireEvent.press(screen.getByRole('button', { name: 'Add item' }));
    expect(onCtaPress).not.toHaveBeenCalled();
  });
});
