import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

/** Fixed install locations, so the binary cannot be shadowed via a writable PATH entry. */
const FFMPEG_CANDIDATES = [
  '/opt/homebrew/bin/ffmpeg',
  '/usr/local/bin/ffmpeg',
  '/usr/bin/ffmpeg',
] as const;

function resolveFfmpegExecutable(): string | undefined {
  return FFMPEG_CANDIDATES.find((candidate) => existsSync(candidate));
}

/**
 * Converts a WebM produced by Playwright to GIF using ffmpeg.
 * @returns true if conversion succeeded, false if ffmpeg is missing or failed
 */
export function webmToGif(webmPath: string, gifPath: string): boolean {
  const ffmpeg = resolveFfmpegExecutable();
  if (ffmpeg === undefined) return false;

  try {
    execFileSync(
      ffmpeg,
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
