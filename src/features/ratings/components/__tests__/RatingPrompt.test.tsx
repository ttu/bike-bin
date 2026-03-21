import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { TransactionType } from '@/shared/types';
import { RatingPrompt } from '../RatingPrompt/RatingPrompt';

describe('RatingPrompt', () => {
  const onDismiss = jest.fn();
  const onSubmit = jest.fn();
  const defaultProps = {
    visible: true,
    onDismiss,
    onSubmit,
    isSubmitting: false,
    itemName: 'Shimano 105 Cassette',
    userName: 'Alice',
    transactionType: TransactionType.Borrow,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the prompt title and context', () => {
    const { getByText } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    expect(getByText('How was your experience?')).toBeTruthy();
    expect(getByText('borrow of Shimano 105 Cassette with Alice')).toBeTruthy();
  });

  it('renders 5 star buttons', () => {
    const { getByTestId } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    for (let i = 1; i <= 5; i++) {
      expect(getByTestId(`star-${i}`)).toBeTruthy();
    }
  });

  it('shows the 14-day window note', () => {
    const { getByText } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    expect(getByText('You have 14 days to leave or edit a rating')).toBeTruthy();
  });

  it('renders skip and submit buttons', () => {
    const { getByText } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    expect(getByText('Skip')).toBeTruthy();
    expect(getByText('Submit Rating')).toBeTruthy();
  });

  it('calls onDismiss when skip is pressed', () => {
    const { getByText } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    fireEvent.press(getByText('Skip'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not call onSubmit when no star is selected', () => {
    const { getByText } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    fireEvent.press(getByText('Submit Rating'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with score when a star is selected and submit is pressed', async () => {
    const { getByText, getByTestId } = renderWithProviders(<RatingPrompt {...defaultProps} />);

    // Select 4 stars
    fireEvent.press(getByTestId('star-4'));

    // Shows score label
    await waitFor(() => {
      expect(getByText('Good')).toBeTruthy();
    });

    fireEvent.press(getByText('Submit Rating'));

    expect(onSubmit).toHaveBeenCalledWith(4, undefined);
  });

  it('calls onSubmit with score and comment text', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = renderWithProviders(
      <RatingPrompt {...defaultProps} />,
    );

    // Select 5 stars
    fireEvent.press(getByTestId('star-5'));

    // Type a comment
    fireEvent.changeText(getByPlaceholderText('Share your experience...'), 'Great transaction!');

    fireEvent.press(getByText('Submit Rating'));

    expect(onSubmit).toHaveBeenCalledWith(5, 'Great transaction!');
  });

  it('disables submit button while submitting', () => {
    const { getByTestId } = renderWithProviders(<RatingPrompt {...defaultProps} isSubmitting />);

    const submitButton = getByTestId('submit-button');
    // The button should be disabled (GradientButton shows spinner when loading)
    fireEvent.press(submitButton);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not render when not visible', () => {
    const { queryByText } = renderWithProviders(<RatingPrompt {...defaultProps} visible={false} />);

    expect(queryByText('How was your experience?')).toBeNull();
  });
});
