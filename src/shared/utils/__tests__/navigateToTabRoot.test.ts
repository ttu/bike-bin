import { navigateToTabRoot } from '../navigateToTabRoot';

describe('navigateToTabRoot', () => {
  it('navigates to the tab stack root index screen', () => {
    const navigate = jest.fn();
    const navigation = { navigate };

    navigateToTabRoot(navigation, 'search');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('search', {
      screen: 'index',
      params: {},
    });
  });
});
