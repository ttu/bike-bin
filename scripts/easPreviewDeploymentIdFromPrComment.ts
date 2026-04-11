/**
 * Extract EAS Hosting deployment id from the bot PR comment left by deploy-web-preview.
 * Supports explicit marker (preferred) and fallback parsing of the preview URL hostname.
 */
export function easPreviewDeploymentIdFromPrComment(body: string): string | undefined {
  const trimmed = body.trim();
  if (!trimmed) {
    return undefined;
  }

  const tagged = /<!--\s*bike-bin-eas-deployment-id:([a-zA-Z0-9_-]+)\s*-->/.exec(trimmed);
  if (tagged?.[1]) {
    return tagged[1];
  }

  const urlLine = /\*\*URL:\*\*\s*(https:\/\/[^\s*]+)/.exec(trimmed);
  const url = urlLine?.[1];
  if (!url) {
    return undefined;
  }

  /** Preview URLs: https://{sub}--{deploymentId}.expo.app/ */
  const fromHost = /--([0-9a-z_-]+)\.expo\.app/i.exec(url);
  return fromHost?.[1];
}
