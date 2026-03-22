#!/usr/bin/env node
/**
 * Upload seed images to local Supabase storage and create item_photos rows.
 *
 * Prerequisites:
 *   - Local Supabase must be running (npm run db:start)
 *   - Images must exist in supabase/seed-images/ (run generate-seed-images.mjs first)
 *   - Database must be seeded (npm run db:reset)
 *
 * Usage:
 *   node scripts/seed-images.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars,
 * or defaults to local Supabase (http://127.0.0.1:54321 + default service key).
 */

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'supabase', 'seed-images');
const BUCKET = 'item-photos';

// Bike ID -> owner ID mapping (from seed.sql)
const BIKE_OWNERS = {
  'c0000001-0001-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'c0000001-0002-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'c0000001-0001-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'c0000001-0002-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'c0000001-0001-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'c0000001-0001-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'c0000001-0001-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'c0000001-0002-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'c0000001-0001-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'c0000001-0002-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'c0000001-0001-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
  'c0000001-0002-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
};

// Item ID -> owner ID mapping (from seed.sql)
const ITEM_OWNERS = {
  'd0000001-0001-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0002-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0003-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0004-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0005-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0006-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0007-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0008-4000-8000-000000000001': 'a1b2c3d4-0001-4000-8000-000000000001',
  'd0000001-0001-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0002-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0003-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0004-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0005-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0006-4000-8000-000000000002': 'a1b2c3d4-0002-4000-8000-000000000002',
  'd0000001-0001-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'd0000001-0002-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'd0000001-0003-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'd0000001-0004-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'd0000001-0005-4000-8000-000000000003': 'a1b2c3d4-0003-4000-8000-000000000003',
  'd0000001-0001-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'd0000001-0002-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'd0000001-0003-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'd0000001-0004-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'd0000001-0005-4000-8000-000000000004': 'a1b2c3d4-0004-4000-8000-000000000004',
  'd0000001-0001-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'd0000001-0002-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'd0000001-0003-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'd0000001-0004-4000-8000-000000000005': 'a1b2c3d4-0005-4000-8000-000000000005',
  'd0000001-0001-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'd0000001-0002-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'd0000001-0003-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'd0000001-0004-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'd0000001-0005-4000-8000-000000000006': 'a1b2c3d4-0006-4000-8000-000000000006',
  'd0000001-0001-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
  'd0000001-0002-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
  'd0000001-0003-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
  'd0000001-0004-4000-8000-000000000007': 'a1b2c3d4-0007-4000-8000-000000000007',
};

function getSupabaseCredentials() {
  const envUrl = process.env.SUPABASE_URL;
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (envUrl && envKey) {
    return { apiUrl: envUrl, serviceKey: envKey };
  }

  try {
    const output = execFileSync('supabase', ['status'], { encoding: 'utf-8' });
    const apiUrl = output.match(/Project URL\s*│\s*(http\S+)/)?.[1];
    const serviceKey = output.match(/Secret\s*│\s*(\S+)/)?.[1];
    if (!apiUrl || !serviceKey) throw new Error('Could not parse supabase status');
    return { apiUrl, serviceKey };
  } catch {
    console.error('Error: Could not get Supabase credentials. Is Supabase running? (npm run db:start)');
    process.exit(1);
  }
}

async function ensureBucket(supabase) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log(`Created storage bucket: ${BUCKET}`);
  } else {
    console.log(`Storage bucket exists: ${BUCKET}`);
  }
}

async function main() {
  const { apiUrl, serviceKey } = getSupabaseCredentials();
  const supabase = createClient(apiUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureBucket(supabase);

  // Clear existing seed photos (items)
  const { data: existingItemPhotos } = await supabase.from('item_photos').select('id, storage_path');
  if (existingItemPhotos?.length) {
    const paths = existingItemPhotos.map((p) => p.storage_path);
    await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from('item_photos').delete().in('id', existingItemPhotos.map((p) => p.id));
    console.log(`Cleared ${existingItemPhotos.length} existing item_photos rows`);
  }

  // Clear existing seed photos (bikes)
  const { data: existingBikePhotos } = await supabase.from('bike_photos').select('id, storage_path');
  if (existingBikePhotos?.length) {
    const paths = existingBikePhotos.map((p) => p.storage_path);
    await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from('bike_photos').delete().in('id', existingBikePhotos.map((p) => p.id));
    console.log(`Cleared ${existingBikePhotos.length} existing bike_photos rows`);
  }

  // Get available images
  const imageFiles = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${imageFiles.length} images to upload\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of imageFiles) {
    const id = file.replace(/\.(png|jpg)$/, '');
    const ext = path.extname(file);
    const contentType = ext === '.jpg' ? 'image/jpeg' : 'image/png';
    const fileBuffer = fs.readFileSync(path.join(IMAGES_DIR, file));

    // Determine if this is an item or bike image
    const itemOwnerId = ITEM_OWNERS[id];
    const bikeOwnerId = BIKE_OWNERS[id];

    if (itemOwnerId) {
      const storagePath = `items/${itemOwnerId}/${id}/seed-photo${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

      if (uploadError) {
        console.log(`  FAILED upload ${file}: ${uploadError.message}`);
        failed++;
        continue;
      }

      const { error: dbError } = await supabase.from('item_photos').insert({
        item_id: id,
        storage_path: storagePath,
        sort_order: 1,
      });

      if (dbError) {
        console.log(`  FAILED db insert ${file}: ${dbError.message}`);
        failed++;
        continue;
      }

      console.log(`  OK item ${id}`);
      uploaded++;
    } else if (bikeOwnerId) {
      const storagePath = `bikes/${bikeOwnerId}/${id}/seed-photo${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

      if (uploadError) {
        console.log(`  FAILED upload ${file}: ${uploadError.message}`);
        failed++;
        continue;
      }

      const { error: dbError } = await supabase.from('bike_photos').insert({
        bike_id: id,
        storage_path: storagePath,
        sort_order: 1,
      });

      if (dbError) {
        console.log(`  FAILED db insert ${file}: ${dbError.message}`);
        failed++;
        continue;
      }

      console.log(`  OK bike ${id}`);
      uploaded++;
    } else {
      console.log(`  SKIP ${file} (no matching item or bike in seed data)`);
    }
  }

  console.log(`\nDone! Uploaded: ${uploaded}, Failed: ${failed}`);
}

main();
