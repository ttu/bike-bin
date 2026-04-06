import { execFileSync } from 'node:child_process';

/**
 * Converts a WebM produced by Playwright to GIF using ffmpeg (must be on PATH).
 * @returns true if conversion succeeded
 */
export function webmToGif(webmPath: string, gifPath: string): boolean {
  try {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-i',
        webmPath,
        '-vf',
        'fps=12,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse',
        gifPath,
      ],
      { stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}
