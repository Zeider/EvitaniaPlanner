#!/usr/bin/env node
/**
 * Decrypt an Evitania save file to plain JSON on disk.
 *
 * Defaults to the live AppData save: prefers data.sav.dat (0.311.0+ ACTk),
 * falls back to data.sav (legacy hex-XOR). Output is written next to the
 * input as <input-basename>.json unless --out or --stdout is given.
 *
 * Usage:
 *   node scripts/save-export.mjs
 *   node scripts/save-export.mjs --save "Player Saves/Tiago-data.sav"
 *   node scripts/save-export.mjs --out /tmp/save.json
 *   node scripts/save-export.mjs --stdout > save.json
 *
 * Exit codes:
 *   0 success
 *   1 file not found
 *   2 unknown format
 *   3 decrypt failure (e.g. ACTk written by a different machine)
 *   4 bad arguments
 */
import fs from 'node:fs';
import path from 'node:path';
import { decryptActk } from './actk-codec.mjs';
import { decodeSaveHex } from '../src/state/save-decoder.js';

const DEFAULT_NEW = 'C:/Users/Jeremy/AppData/LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav.dat';
const DEFAULT_LEGACY = 'C:/Users/Jeremy/AppData/LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav';

function parseArgs(argv) {
  const out = { save: null, out: null, stdout: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--save') out.save = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else if (a === '--stdout') out.stdout = true;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scripts/save-export.mjs [--save <path>] [--out <path>] [--stdout]');
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(4);
    }
  }
  if (out.out && out.stdout) {
    console.error('--out and --stdout are mutually exclusive');
    process.exit(4);
  }
  return out;
}

function resolveInput(explicit) {
  if (explicit) {
    if (!fs.existsSync(explicit)) {
      console.error(`File not found: ${explicit}`);
      process.exit(1);
    }
    return explicit;
  }
  if (fs.existsSync(DEFAULT_NEW)) return DEFAULT_NEW;
  if (fs.existsSync(DEFAULT_LEGACY)) return DEFAULT_LEGACY;
  console.error('No save file found. Tried:');
  console.error(`  ${DEFAULT_NEW}`);
  console.error(`  ${DEFAULT_LEGACY}`);
  console.error('Pass --save <path> to override.');
  process.exit(1);
}

// Same heuristic as scripts/save-edit.mjs:52-57: ACTk files are binary,
// legacy hex files are ASCII hex chars (plus CR/LF).
function detectFormat(buf) {
  const head = buf.slice(0, 64);
  const allHex = head.every(
    (b) =>
      (b >= 0x30 && b <= 0x39) ||
      (b >= 0x41 && b <= 0x46) ||
      (b >= 0x61 && b <= 0x66) ||
      b === 0x0a ||
      b === 0x0d
  );
  return allHex ? 'legacy-hex' : 'actk-v1';
}

function deriveOutputPath(inputPath) {
  // data.sav.dat → data.sav.json ; data.sav → data.json ;
  // Player Saves/Tiago-data.sav → Player Saves/Tiago-data.json
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath);
  // Strip the final extension and replace with .json
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return path.join(dir, `${stem}.json`);
}

const args = parseArgs(process.argv.slice(2));
const inputPath = resolveInput(args.save);
const buf = fs.readFileSync(inputPath);
const format = detectFormat(buf);

let jsonText;
if (format === 'actk-v1') {
  try {
    const { json } = decryptActk(buf);
    jsonText = json.toString('utf8');
  } catch (e) {
    console.error(`Decrypt failed: ${e.message}`);
    console.error('Was this save written by this machine?');
    process.exit(3);
  }
} else if (format === 'legacy-hex') {
  try {
    jsonText = decodeSaveHex(buf.toString('utf8').trim());
  } catch (e) {
    console.error(`Hex decode failed: ${e.message}`);
    process.exit(2);
  }
} else {
  console.error(`Unknown format: ${format}`);
  process.exit(2);
}

// Sanity check: must be parseable JSON
try {
  JSON.parse(jsonText);
} catch (e) {
  console.error(`Decoded payload is not valid JSON: ${e.message}`);
  process.exit(2);
}

if (args.stdout) {
  process.stdout.write(jsonText);
} else {
  const outPath = args.out ?? deriveOutputPath(inputPath);
  fs.writeFileSync(outPath, jsonText);
  console.error(`Wrote ${jsonText.length} bytes to ${outPath}`);
}
