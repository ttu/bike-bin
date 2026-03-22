#!/usr/bin/env node
/**
 * Generate seed images for all demo items using OpenAI DALL-E 3.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... node scripts/generate-seed-images.mjs
 *   OPENAI_API_KEY=sk-... node scripts/generate-seed-images.mjs --force  # regenerate existing
 *
 * Images are saved to supabase/seed-images/{item-id}.png
 * Only missing images are generated (safe to re-run).
 */

import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'supabase', 'seed-images');
const FORCE = process.argv.includes('--force');
const BIKES_ONLY = process.argv.includes('--bikes-only');
const ITEMS_ONLY = process.argv.includes('--items-only');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ITEMS = [
  // Test User (MTB rider)
  { id: 'd0000001-0001-4000-8000-000000000001', name: 'Fox 36 Float Fork', brand: 'Fox', model: '36 Float Performance', category: 'component', description: '160mm travel, 29er boost mountain bike suspension fork' },
  { id: 'd0000001-0002-4000-8000-000000000001', name: 'Maxxis Minion DHF/DHR Combo', brand: 'Maxxis', model: 'Minion DHF/DHR II 29x2.5', category: 'component', description: 'Mountain bike tire set, knobby tread, EXO+ casing' },
  { id: 'd0000001-0003-4000-8000-000000000001', name: 'Park Tool Chain Checker', brand: 'Park Tool', model: 'CC-3.2', category: 'tool', description: 'Chain wear indicator tool for bike maintenance' },
  { id: 'd0000001-0004-4000-8000-000000000001', name: 'Topeak Alien II Multi-tool', brand: 'Topeak', model: 'Alien II', category: 'tool', description: '26-function bicycle multi-tool for trailside repairs' },
  { id: 'd0000001-0005-4000-8000-000000000001', name: 'Troy Lee Designs A3 Helmet', brand: 'Troy Lee', model: 'A3 MIPS', category: 'accessory', description: 'Mountain bike trail helmet with MIPS protection' },
  { id: 'd0000001-0006-4000-8000-000000000001', name: 'Park Tool PCS-10.3 Stand', brand: 'Park Tool', model: 'PCS-10.3', category: 'tool', description: 'Portable folding bicycle repair stand' },
  { id: 'd0000001-0007-4000-8000-000000000001', name: 'RaceFace Turbine R Cranks', brand: 'RaceFace', model: 'Turbine R 175mm', category: 'component', description: 'Alloy mountain bike crankset with 30T direct mount ring' },
  { id: 'd0000001-0008-4000-8000-000000000001', name: 'Muc-Off Chain Lube', brand: 'Muc-Off', model: 'Wet Lube 120ml', category: 'consumable', description: 'Bicycle chain wet lubricant in a small bottle' },

  // Marcus (road cyclist)
  { id: 'd0000001-0001-4000-8000-000000000002', name: 'Shimano 105 Cassette', brand: 'Shimano', model: '105 CS-R7000', category: 'component', description: '11-speed road bike cassette, 11-28T silver' },
  { id: 'd0000001-0002-4000-8000-000000000002', name: 'Continental GP5000 Tires', brand: 'Continental', model: 'Grand Prix 5000', category: 'component', description: 'Set of two 700x25mm road bike clincher tires' },
  { id: 'd0000001-0003-4000-8000-000000000002', name: 'Lezyne Micro Floor Drive', brand: 'Lezyne', model: 'Micro Floor Drive HVG', category: 'accessory', description: 'Compact bicycle floor pump with pressure gauge' },
  { id: 'd0000001-0004-4000-8000-000000000002', name: 'Fizik Antares R5 Saddle', brand: 'Fizik', model: 'Antares R5', category: 'component', description: 'Road bike saddle, 143mm width, black' },
  { id: 'd0000001-0005-4000-8000-000000000002', name: 'Shimano SPD-SL Cleats', brand: 'Shimano', model: 'SM-SH11', category: 'accessory', description: 'Yellow road bike pedal cleats in packaging, 6-degree float' },
  { id: 'd0000001-0006-4000-8000-000000000002', name: 'Zipp Service Course Handlebar', brand: 'Zipp', model: 'Service Course SL-70', category: 'component', description: '42cm compact drop handlebar, alloy, 31.8mm clamp' },

  // Sarah (commuter)
  { id: 'd0000001-0001-4000-8000-000000000003', name: 'Brompton Front Carrier Block', brand: 'Brompton', model: 'Front Carrier Block', category: 'accessory', description: 'Brompton folding bike front carrier block mounting adapter' },
  { id: 'd0000001-0002-4000-8000-000000000003', name: 'Kryptonite Evolution Mini-7', brand: 'Kryptonite', model: 'Evolution Mini-7', category: 'accessory', description: 'Compact U-lock with flex cable for bicycle security' },
  { id: 'd0000001-0003-4000-8000-000000000003', name: 'Busch+Mueller IQ-X Light', brand: 'Busch+Mueller', model: 'IQ-X', category: 'accessory', description: '100 lux dynamo front bicycle light with shaped beam' },
  { id: 'd0000001-0004-4000-8000-000000000003', name: 'SKS Bluemels Fenders', brand: 'SKS', model: 'Bluemels 45mm', category: 'component', description: 'Full-length clip-on bicycle fenders/mudguards, 45mm wide' },
  { id: 'd0000001-0005-4000-8000-000000000003', name: 'Schwalbe Marathon Plus Tire', brand: 'Schwalbe', model: 'Marathon Plus 700x28', category: 'component', description: 'Puncture-resistant commuter/touring bicycle tire' },

  // Jonas (touring cyclist)
  { id: 'd0000001-0001-4000-8000-000000000004', name: 'Tubus Logo Rear Rack', brand: 'Tubus', model: 'Logo Classic', category: 'component', description: 'Stainless steel rear bicycle touring rack' },
  { id: 'd0000001-0002-4000-8000-000000000004', name: 'Ortlieb Back-Roller Classic', brand: 'Ortlieb', model: 'Back-Roller Classic', category: 'accessory', description: 'Pair of waterproof bicycle panniers, 40L total, yellow/black' },
  { id: 'd0000001-0003-4000-8000-000000000004', name: 'Wahoo ELEMNT Bolt V2', brand: 'Wahoo', model: 'ELEMNT Bolt V2', category: 'accessory', description: 'GPS bicycle computer with color screen, aerodynamic mount' },
  { id: 'd0000001-0004-4000-8000-000000000004', name: 'Brooks B17 Saddle', brand: 'Brooks', model: 'B17 Standard', category: 'component', description: 'Classic brown leather bicycle touring saddle' },
  { id: 'd0000001-0005-4000-8000-000000000004', name: 'Topeak Joe Blow Sport III', brand: 'Topeak', model: 'Joe Blow Sport III', category: 'tool', description: 'Full-size floor bicycle pump with pressure gauge' },

  // Lisa (gravel racer)
  { id: 'd0000001-0001-4000-8000-000000000005', name: 'Shimano GRX RD-RX812', brand: 'Shimano', model: 'GRX RX812', category: 'component', description: 'Gravel bike rear derailleur, 1x11 clutch type, black' },
  { id: 'd0000001-0002-4000-8000-000000000005', name: 'Vittoria Terreno Dry Tires', brand: 'Vittoria', model: 'Terreno Dry 700x38', category: 'component', description: 'Fast-rolling gravel bike tires with small knobs' },
  { id: 'd0000001-0003-4000-8000-000000000005', name: 'Silca T-Ratchet Torque Kit', brand: 'Silca', model: 'T-Ratchet', category: 'tool', description: 'Compact bicycle torque wrench with titanium bits in a case' },
  { id: 'd0000001-0004-4000-8000-000000000005', name: 'Shimano Ultegra RD-R8000', brand: 'Shimano', model: 'Ultegra R8000 SS', category: 'component', description: 'Road bike short cage rear derailleur, silver/black' },

  // Kai (MTB enduro)
  { id: 'd0000001-0001-4000-8000-000000000006', name: 'Fox DHX2 Rear Shock', brand: 'Fox', model: 'DHX2 Factory', category: 'component', description: '230x65mm coil rear shock for mountain bike, gold/black' },
  { id: 'd0000001-0002-4000-8000-000000000006', name: 'Crankbrothers Stamp 7 Pedals', brand: 'Crankbrothers', model: 'Stamp 7 Large', category: 'component', description: 'Large flat platform mountain bike pedals, thin profile' },
  { id: 'd0000001-0003-4000-8000-000000000006', name: 'Leatt DBX 4.0 Knee Pads', brand: 'Leatt', model: 'DBX 4.0', category: 'accessory', description: 'Slim mountain bike knee pads with impact foam, black' },
  { id: 'd0000001-0004-4000-8000-000000000006', name: 'Maxxis Assegai Tire', brand: 'Maxxis', model: 'Assegai 29x2.5 WT', category: 'component', description: 'Aggressive knobby mountain bike tire for wet conditions' },
  { id: 'd0000001-0005-4000-8000-000000000006', name: "Stan's NoTubes Sealant", brand: "Stan's", model: 'NoTubes 32oz', category: 'consumable', description: 'Tubeless tire sealant bottle for bicycle tires' },

  // Nina (MTB trail/XC)
  { id: 'd0000001-0001-4000-8000-000000000007', name: 'RockShox SID Ultimate Fork', brand: 'RockShox', model: 'SID Ultimate 120mm', category: 'component', description: '29er 120mm travel XC mountain bike suspension fork, black/gold' },
  { id: 'd0000001-0002-4000-8000-000000000007', name: 'SRAM Eagle XX1 Cassette', brand: 'SRAM', model: 'XX1 Eagle 10-52T', category: 'component', description: '12-speed XD mountain bike cassette, copper/black' },
  { id: 'd0000001-0003-4000-8000-000000000007', name: 'Wolf Tooth Pompon', brand: 'Wolf Tooth', model: 'Pack Pliers Master Link', category: 'tool', description: 'Compact master link pliers for bicycle chain, red handles' },
  { id: 'd0000001-0004-4000-8000-000000000007', name: 'OneUp Components Dropper Post', brand: 'OneUp', model: 'Dropper Post V2 180mm', category: 'component', description: 'Internal routing dropper seatpost for mountain bike, 180mm travel, black' },
];

// Bikes from seed.sql — full bicycles belonging to each demo user
const BIKES = [
  // Test User (MTB rider)
  { id: 'c0000001-0001-4000-8000-000000000001', name: 'Santa Cruz Hightower', brand: 'Santa Cruz', model: 'Hightower C S', type: 'mtb', year: 2024, description: 'Full-suspension 29er trail mountain bike, matte olive green frame, Fox suspension, SRAM drivetrain' },
  { id: 'c0000001-0002-4000-8000-000000000001', name: 'Commencal Meta HT AM', brand: 'Commencal', model: 'Meta HT AM', type: 'mtb', year: 2021, description: 'Hardtail mountain bike, aggressive geometry, orange/black frame, 27.5 wheels' },

  // Marcus (road cyclist)
  { id: 'c0000001-0001-4000-8000-000000000002', name: 'Canyon Endurace CF 7', brand: 'Canyon', model: 'Endurace CF 7', type: 'road', year: 2023, description: 'Carbon endurance road bike, dark blue frame, Shimano 105 groupset, disc brakes' },
  { id: 'c0000001-0002-4000-8000-000000000002', name: 'Specialized Tarmac SL7', brand: 'Specialized', model: 'Tarmac SL7', type: 'road', year: 2022, description: 'Aero carbon road bike, gloss white/red frame, Shimano Ultegra groupset, deep-section wheels' },

  // Sarah (commuter)
  { id: 'c0000001-0001-4000-8000-000000000003', name: 'Brompton C Line', brand: 'Brompton', model: 'C Line Explore', type: 'city', year: 2023, description: 'Folding city bike, classic racing green frame, 6-speed, front carrier block, dynamo lights' },

  // Jonas (touring cyclist)
  { id: 'c0000001-0001-4000-8000-000000000004', name: 'Surly Long Haul Trucker', brand: 'Surly', model: 'Long Haul Trucker', type: 'touring', year: 2020, description: 'Steel touring bicycle, blue frame, drop bars, rear rack with panniers, fenders, bar-end shifters' },

  // Lisa (gravel racer)
  { id: 'c0000001-0001-4000-8000-000000000005', name: 'Canyon Grail CF SL', brand: 'Canyon', model: 'Grail CF SL 8', type: 'gravel', year: 2024, description: 'Carbon gravel bike with distinctive double-decker handlebar, grey/orange frame, Shimano GRX groupset, wide knobby tires' },
  { id: 'c0000001-0002-4000-8000-000000000005', name: 'Ridley Kanzo Fast', brand: 'Ridley', model: 'Kanzo Fast', type: 'gravel', year: 2022, description: 'Aero gravel race bike, dark grey frame, integrated cockpit, Shimano GRX Di2' },

  // Kai (MTB enduro)
  { id: 'c0000001-0001-4000-8000-000000000006', name: 'YT Capra MX', brand: 'YT', model: 'Capra MX Core 3', type: 'mtb', year: 2024, description: 'Full-suspension enduro mountain bike, mixed wheel sizes 29/27.5, raw alloy frame, coil rear shock, aggressive build' },
  { id: 'c0000001-0002-4000-8000-000000000006', name: 'Canyon Spectral 125', brand: 'Canyon', model: 'Spectral 125 CF 7', type: 'mtb', year: 2023, description: 'Short-travel full-suspension trail mountain bike, carbon frame, teal/black, 29er, playful geometry' },

  // Nina (MTB trail/XC)
  { id: 'c0000001-0001-4000-8000-000000000007', name: 'Specialized Epic EVO', brand: 'Specialized', model: 'Epic EVO Expert', type: 'mtb', year: 2024, description: 'Cross-country full-suspension mountain bike, lightweight carbon frame, red/black, RockShox SID fork, SRAM XX1 Eagle' },
  { id: 'c0000001-0002-4000-8000-000000000007', name: 'Trek Fuel EX 8', brand: 'Trek', model: 'Fuel EX 8 Gen 6', type: 'mtb', year: 2023, description: 'Trail full-suspension mountain bike, matte black frame, 140mm travel, Shimano XT, 29er wheels' },
];

// Casual settings that look like real user listing photos
const ITEM_SETTINGS = [
  'on a wooden workbench in a garage',
  'on a concrete garage floor',
  'lying on a towel in a workshop',
  'on a wooden table next to other bike parts',
  'on a shelf in a home workshop',
  'on a cardboard box in a garage',
  'on a wooden floor at home',
  'on a bike repair mat',
  'resting against a wall in a shed',
  'on a kitchen counter',
];

const BIKE_SETTINGS = [
  'leaning against a garage wall',
  'on a bike stand in a home workshop',
  'parked on a patio with a fence behind',
  'on a gravel path outside a shed',
  'in a hallway leaning on a wall',
  'on a driveway with the kickstand down',
  'leaning against a wooden fence outdoors',
  'standing in a bike room next to other bikes',
  'on grass in a backyard',
  'in a parking garage under fluorescent lights',
];

function buildItemPrompt(item, index) {
  const setting = ITEM_SETTINGS[index % ITEM_SETTINGS.length];
  return `Photo of a used ${item.brand} ${item.model} (${item.name}), ${setting}. ${item.description}. The item shows normal signs of use — minor scuffs and wear marks — but is in decent condition. Natural indoor lighting, casual angle, slightly imperfect framing as if someone quickly took a photo to list the item online. Realistic photograph, not a studio product shot. No text, no watermarks, no phones or cameras visible.`;
}

function buildBikePrompt(bike, index) {
  const setting = BIKE_SETTINGS[index % BIKE_SETTINGS.length];
  return `Photo of a used ${bike.year} ${bike.brand} ${bike.model} bicycle, ${setting}. ${bike.description}. The bike shows normal signs of use — minor cable rub marks, light scratches on the frame — but is in good rideable condition. Natural lighting, casual angle, full bike visible from the drive side, slightly imperfect framing as if someone quickly took a photo to list the bike online. Realistic photograph, not a studio product shot. No text, no watermarks, no people visible.`;
}

async function generateImage(entry, promptFn, index) {
  const outPath = path.join(OUT_DIR, `${entry.id}.jpg`);

  if (!FORCE && fs.existsSync(outPath)) {
    console.log(`  SKIP ${entry.name} (already exists)`);
    return;
  }

  console.log(`  GENERATING ${entry.name}...`);
  const prompt = promptFn(entry, index);

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json',
  });

  const imageData = response.data[0].b64_json;
  const pngBuffer = Buffer.from(imageData, 'base64');
  const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 85 }).toBuffer();
  fs.writeFileSync(outPath, jpgBuffer);
  console.log(`  SAVED ${entry.name}`);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const items = ITEMS_ONLY ? ITEMS : BIKES_ONLY ? [] : ITEMS;
  const bikes = BIKES_ONLY ? BIKES : ITEMS_ONLY ? [] : BIKES;
  const total = items.length + bikes.length;
  console.log(`Generating images for ${items.length} items + ${bikes.length} bikes (${total} total)...\n`);

  if (items.length) {
    console.log('── Items ──');
    for (let i = 0; i < items.length; i++) {
      try {
        await generateImage(items[i], buildItemPrompt, i);
      } catch (err) {
        console.error(`  FAILED ${items[i].name}: ${err.message}`);
      }
    }
  }

  if (bikes.length) {
    console.log('\n── Bikes ──');
    for (let i = 0; i < bikes.length; i++) {
      try {
        await generateImage(bikes[i], buildBikePrompt, i);
      } catch (err) {
        console.error(`  FAILED ${bikes[i].name}: ${err.message}`);
      }
    }
  }

  const count = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png')).length;
  console.log(`\nDone! ${count} images in supabase/seed-images/`);
}

main();
