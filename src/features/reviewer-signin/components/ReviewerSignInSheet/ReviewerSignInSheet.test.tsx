import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/utils';
import { ReviewerSignInSheet } from './ReviewerSignInSheet';
import { signInAsReviewer } from '../../utils/signInAsReviewer';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock('../../utils/signInAsReviewer', () => ({
  signInAsReviewer: jest.fn(),
}));

const signIn = signInAsReviewer as jest.Mock;

describe('ReviewerSignInSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form when visible', () => {
    const { getByText } = renderWithProviders(
      <ReviewerSignInSheet visible onDismiss={jest.fn()} />,
    );
    expect(getByText('Reviewer sign-in')).toBeTruthy();
    expect(getByText('Credentials provided in App Store Connect review notes.')).toBeTruthy();
  });

  it('cancel triggers onDismiss', () => {
    const onDismiss = jest.fn();
    const { getByText } = renderWithProviders(
      <ReviewerSignInSheet visible onDismiss={onDismiss} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('signs in successfully, dismisses, and navigates', async () => {
    signIn.mockResolvedValue({ ok: true });
    const onDismiss = jest.fn();
    const { getByLabelText, getByText } = renderWithProviders(
      <ReviewerSignInSheet visible onDismiss={onDismiss} />,
    );
    fireEvent.changeText(getByLabelText('Email'), 'appreview@bikebin.app');
    fireEvent.changeText(getByLabelText('Password'), 'secret');
    await act(async () => {
      fireEvent.press(getByText('Sign in'));
    });
    await waitFor(() => expect(signIn).toHaveBeenCalledWith('appreview@bikebin.app', 'secret'));
    expect(onDismiss).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/inventory');
  });

  it('shows inline error and keeps sheet open on invalid credentials', async () => {
    signIn.mockResolvedValue({ ok: false, error: 'invalidCredentials' });
    const onDismiss = jest.fn();
    const { getByLabelText, getByText, findByText } = renderWithProviders(
      <ReviewerSignInSheet visible onDismiss={onDismiss} />,
    );
    fireEvent.changeText(getByLabelText('Email'), 'a@b.test');
    fireEvent.changeText(getByLabelText('Password'), 'wrong');
    await act(async () => {
      fireEvent.press(getByText('Sign in'));
    });
    expect(await findByText(/Sign-in failed/i)).toBeTruthy();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does not submit when fields are empty', () => {
    const { getByText } = renderWithProviders(
      <ReviewerSignInSheet visible onDismiss={jest.fn()} />,
    );
    fireEvent.press(getByText('Sign in'));
    expect(signIn).not.toHaveBeenCalled();
  });
});
