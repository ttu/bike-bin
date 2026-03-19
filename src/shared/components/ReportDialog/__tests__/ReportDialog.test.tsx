import { fireEvent } from '@testing-library/react-native';
import { ReportDialog } from '../ReportDialog';
import { renderWithProviders } from '@/test/utils';

describe('ReportDialog', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    onSubmit: jest.fn(),
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    expect(getByText('Report')).toBeTruthy();
    expect(getByText('Reason for reporting')).toBeTruthy();
  });

  it('renders all report reason options', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    expect(getByText('Inappropriate content')).toBeTruthy();
    expect(getByText('Spam')).toBeTruthy();
    expect(getByText('Stolen goods')).toBeTruthy();
    expect(getByText('Misleading condition')).toBeTruthy();
    expect(getByText('Harassment')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('renders submit and cancel buttons', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    expect(getByText('Submit Report')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('shows validation error when submitting without a reason', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    fireEvent.press(getByText('Submit Report'));
    expect(getByText('Please select a reason')).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits with selected reason and no details', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    fireEvent.press(getByText('Spam'));
    fireEvent.press(getByText('Submit Report'));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith('spam', undefined);
  });

  it('submits with selected reason and details text', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <ReportDialog {...defaultProps} />,
    );
    fireEvent.press(getByText('Stolen goods'));
    fireEvent.changeText(
      getByPlaceholderText('Provide any additional context...'),
      'This item was reported stolen on a local forum',
    );
    fireEvent.press(getByText('Submit Report'));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      'stolenGoods',
      'This item was reported stolen on a local forum',
    );
  });

  it('clears validation error when a reason is selected', () => {
    const { getByText, queryByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    fireEvent.press(getByText('Submit Report'));
    expect(getByText('Please select a reason')).toBeTruthy();
    fireEvent.press(getByText('Harassment'));
    expect(queryByText('Please select a reason')).toBeNull();
  });

  it('calls onDismiss when cancel is pressed', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} />);
    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    const { getByText } = renderWithProviders(<ReportDialog {...defaultProps} loading={true} />);
    expect(getByText('Submitting...')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = renderWithProviders(<ReportDialog {...defaultProps} visible={false} />);
    expect(queryByText('Report')).toBeNull();
  });
});
