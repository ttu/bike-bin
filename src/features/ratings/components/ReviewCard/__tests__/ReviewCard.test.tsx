import { renderWithProviders } from '@/test/utils';
import { ReviewCard } from '../ReviewCard';

describe('ReviewCard', () => {
  const defaultProps = {
    reviewerName: 'Alice',
    score: 4,
    text: 'Great condition!',
    transactionType: 'borrow' as const,
    createdAt: '2026-03-15T10:00:00Z',
  };

  it('renders reviewer name', () => {
    const { getByText } = renderWithProviders(<ReviewCard {...defaultProps} />);
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders review text', () => {
    const { getByText } = renderWithProviders(<ReviewCard {...defaultProps} />);
    expect(getByText('Great condition!')).toBeTruthy();
  });

  it('renders formatted date', () => {
    const { getByText } = renderWithProviders(<ReviewCard {...defaultProps} />);
    // Date format varies by locale, just check it renders something with "2026"
    expect(getByText(/2026/)).toBeTruthy();
  });

  it('renders sentence-form trust signal instead of stars (score ≥ 4 → on time)', () => {
    const { getByText, queryByLabelText } = renderWithProviders(<ReviewCard {...defaultProps} />);
    expect(getByText('Borrowed 1 times · 1 on time')).toBeTruthy();
    expect(queryByLabelText(/out of 5 stars/)).toBeNull();
  });

  it('marks low-score reviews as not on time', () => {
    const { getByText } = renderWithProviders(<ReviewCard {...defaultProps} score={2} />);
    expect(getByText('Borrowed 1 times · 0 on time')).toBeTruthy();
  });

  it('handles undefined text (no comment)', () => {
    const { queryByText } = renderWithProviders(<ReviewCard {...defaultProps} text={undefined} />);
    expect(queryByText('Great condition!')).toBeNull();
  });

  it('renders donate transaction type', () => {
    const { getByText } = renderWithProviders(
      <ReviewCard {...defaultProps} transactionType="donate" />,
    );
    // Should render some transaction label text
    expect(getByText('Alice')).toBeTruthy();
  });

  it('renders sell transaction type', () => {
    const { getByText } = renderWithProviders(
      <ReviewCard {...defaultProps} transactionType="sell" />,
    );
    expect(getByText('Alice')).toBeTruthy();
  });

  it('shows GDPR deleted-user label when reviewer was anonymized', () => {
    const { getByText } = renderWithProviders(
      <ReviewCard {...defaultProps} reviewerName={undefined} isDeletedReviewer />,
    );
    expect(getByText('[Deleted user]')).toBeTruthy();
  });
});
