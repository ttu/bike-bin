import { easPreviewDeploymentIdFromPrComment } from './easPreviewDeploymentIdFromPrComment';

describe('easPreviewDeploymentIdFromPrComment', () => {
  it('reads id from bike-bin marker', () => {
    const body = `<!-- bike-bin-web-preview -->
<!-- bike-bin-eas-deployment-id:abc12XY -->
### Web preview
**URL:** https://bike-bin--ignored.expo.app/`;
    expect(easPreviewDeploymentIdFromPrComment(body)).toBe('abc12XY');
  });

  it('falls back to hostname between -- and .expo.app', () => {
    const body = `<!-- bike-bin-web-preview -->
### Web preview
**URL:** https://my-app--or1170q9ix.expo.app/`;
    expect(easPreviewDeploymentIdFromPrComment(body)).toBe('or1170q9ix');
  });

  it('returns undefined when no marker or parseable URL', () => {
    expect(easPreviewDeploymentIdFromPrComment('')).toBeUndefined();
    expect(easPreviewDeploymentIdFromPrComment('no structured comment')).toBeUndefined();
  });
});
