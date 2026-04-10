/**
 * CI helper: read pr-preview-comment.md and write has_deployment_id + deployment_id to GITHUB_OUTPUT.
 * Used by close-eas-web-preview workflow when a PR is closed.
 */
import { appendFileSync, readFileSync } from 'node:fs';

import { easPreviewDeploymentIdFromPrComment } from './easPreviewDeploymentIdFromPrComment';

const commentPath = process.argv[2] ?? 'pr-preview-comment.md';
const body = readFileSync(commentPath, 'utf8');
const deploymentId = easPreviewDeploymentIdFromPrComment(body);

const out = process.env.GITHUB_OUTPUT;
if (!out) {
  throw new Error('GITHUB_OUTPUT is not set');
}

appendFileSync(out, `has_deployment_id=${deploymentId ? 'true' : 'false'}\n`);
if (deploymentId) {
  appendFileSync(out, `deployment_id=${deploymentId}\n`);
}
