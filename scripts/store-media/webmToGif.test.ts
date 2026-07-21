import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

import { webmToGif } from './webmToGif';

jest.mock('node:child_process', () => ({
  execFileSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

const execMock = execFileSync as jest.MockedFunction<typeof execFileSync>;
const existsMock = existsSync as jest.MockedFunction<typeof existsSync>;

/** First absolute candidate probed by the ffmpeg resolver. */
const HOMEBREW_FFMPEG = '/opt/homebrew/bin/ffmpeg';

describe('webmToGif', () => {
  beforeEach(() => {
    execMock.mockReset();
    existsMock.mockReset();
    existsMock.mockImplementation((p) => p === HOMEBREW_FFMPEG);
  });

  it('returns true when ffmpeg succeeds', () => {
    execMock.mockImplementation(() => '');
    expect(webmToGif('a.webm', 'b.gif')).toBe(true);
    expect(execMock).toHaveBeenCalledWith(
      HOMEBREW_FFMPEG,
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

  it('returns false without invoking ffmpeg when it is not installed', () => {
    existsMock.mockReturnValue(false);
    expect(webmToGif('a.webm', 'b.gif')).toBe(false);
    expect(execMock).not.toHaveBeenCalled();
  });
});
