#!/usr/bin/env node
/**
 * Shift all default Supabase local host ports by (apiPort - 54321), matching CLI layout:
 * shadow 54320, api 54321, db 54322, studio 54323, inbucket 54324, analytics 54327,
 * pooler 54329 (if [db.pooler] present), edge inspector 8083.
 *
 * Usage: node scripts/patch-supabase-ports.mjs <config.toml> <apiPort>
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , configPath, apiPortArg] = process.argv;

if (!configPath || !apiPortArg) {
  console.error('Usage: node scripts/patch-supabase-ports.mjs <config.toml> <apiPort>');
  process.exit(1);
}

const apiPort = parseInt(apiPortArg, 10);
if (!Number.isInteger(apiPort) || apiPort < 1024 || apiPort > 65535) {
  console.error('patch-supabase-ports: invalid apiPort');
  process.exit(1);
}

const delta = apiPort - 54321;
const SHADOW = 54320 + delta;
const DB = 54322 + delta;
const STUDIO = 54323 + delta;
const INBUCKET = 54324 + delta;
const ANALYTICS = 54327 + delta;
const POOLER = 54329 + delta;
const INSPECTOR = 8083 + delta;

const text = readFileSync(configPath, 'utf8');
const lines = text.split('\n');

/** @type {Set<string>} */
const seen = new Set();

let section = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const header = line.match(/^\[([^\]]+)\]\s*$/);
  if (header) {
    section = header[1];
    seen.add(section);
    continue;
  }

  if (section === 'api' && /^port = \d+\s*$/.test(line)) {
    lines[i] = `port = ${apiPort}`;
  } else if (section === 'db') {
    if (/^port = \d+\s*$/.test(line)) {
      lines[i] = `port = ${DB}`;
    } else if (/^shadow_port = \d+\s*$/.test(line)) {
      lines[i] = `shadow_port = ${SHADOW}`;
    }
  } else if (section === 'db.pooler' && /^port = \d+\s*$/.test(line)) {
    lines[i] = `port = ${POOLER}`;
  } else if (section === 'studio' && /^port = \d+\s*$/.test(line)) {
    lines[i] = `port = ${STUDIO}`;
  } else if (section === 'inbucket' && /^port = \d+\s*$/.test(line)) {
    lines[i] = `port = ${INBUCKET}`;
  } else if (section === 'analytics' && /^port = \d+\s*$/.test(line)) {
    lines[i] = `port = ${ANALYTICS}`;
  } else if (section === 'edge_runtime' && /^inspector_port = \d+\s*$/.test(line)) {
    lines[i] = `inspector_port = ${INSPECTOR}`;
  }
}

const extra = [];
if (!seen.has('inbucket')) {
  extra.push('', '[inbucket]', 'enabled = true', `port = ${INBUCKET}`, '');
}
if (!seen.has('analytics')) {
  extra.push('[analytics]', 'enabled = true', `port = ${ANALYTICS}`, '');
}
if (!seen.has('edge_runtime')) {
  extra.push(
    '[edge_runtime]',
    'enabled = true',
    'policy = "per_worker"',
    `inspector_port = ${INSPECTOR}`,
    '',
  );
}

const out = lines.join('\n') + extra.join('\n');
writeFileSync(configPath, out, 'utf8');
