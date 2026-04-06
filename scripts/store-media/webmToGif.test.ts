import { execFileSync } from 'node:child_process';

import { webmToGif } from './webmToGif';

jest.mock('node:child_process', () => ({
  execFileSync: jest.fn(),
}));

const execMock = execFileSync as jest.MockedFunction<typeof execFileSync>;

describe('webmToGif', () => {
  beforeEach(() => {
    execMock.mockReset();
  });

  it('returns true when ffmpeg succeeds', () => {
    execMock.mockImplementation(() => '');
    expect(webmToGif('a.webm', 'b.gif')).toBe(true);
    expect(execMock).toHaveBeenCalledWith(
      'ffmpeg',
      expect.arrayContaining(['-y', '-i', 'a.webm', 'b.gif']),
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('returns false when ffmpeg throws', () => {
    execMock.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(webmToGif('a.webm', 'b.gif')).toBe(false);
  });
});
