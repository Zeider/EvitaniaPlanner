# Personal ACTk Save Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let me personally import the current-game-version (0.311.0+, ACTk-encrypted) `data.sav.dat` into the browser tool with one extra CLI step, without leaking my device ID into the public bundle.

**Architecture:** A new `scripts/save-export.mjs` CLI decrypts ACTk → plain JSON on disk using the existing Node-side `actk-codec.mjs`. The browser's `loadSaveFile()` gains a binary-safe format sniff (ArrayBuffer → check `ACTk` magic → fall back to text → branch on `{` vs hex) so it accepts plain JSON alongside the existing legacy-hex path and fails closed on raw ACTk with a clear pointer to the CLI.

**Tech Stack:** Preact + Vite browser app; Node ≥ 18 for CLI scripts; Vitest (jsdom env) for unit tests; existing `scripts/actk-codec.mjs` for AES/PBKDF2/xxHash.

**Spec:** `docs/superpowers/specs/2026-05-18-personal-actk-save-import-design.md`

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `src/state/save-decoder.js` | Modify | Export new `SaveFormatError` class; rewrite `loadSaveFile()` to sniff format via ArrayBuffer |
| `src/state/save-decoder.test.js` | Modify | Update one existing test to use real `Blob`; add 4 new branch tests |
| `src/components/TopBar.jsx` | Modify (line 20) | Broaden file-picker `accept` to `.sav,.json` |
| `scripts/save-export.mjs` | Create | Thin CLI: reads `data.sav.dat`/`data.sav`/`--save <path>`, decrypts, writes JSON |
| `package.json` | Modify | Add `"save:export"` npm script |
| `README.md` | Modify | Add a paragraph in "How to Use" for 0.311.0+ saves |

---

### Task 1: Add format sniff to `loadSaveFile` (TDD)

**Files:**
- Modify: `src/state/save-decoder.js:1108-1113` (`loadSaveFile`)
- Modify: `src/state/save-decoder.test.js:438-452` (existing `loadSaveFile` test block + new cases)

The current `loadSaveFile` unconditionally calls `decodeSaveHex` on `await file.text()`. We need it to read bytes first (binary-safe for ACTk), then branch on the content. We'll write all the new tests first, then make one implementation change that satisfies them all.

- [ ] **Step 1: Update existing happy-path test to use real `Blob`**

The existing test (`save-decoder.test.js:438-452`) mocks `File` as `{ text: async () => hex }`. After this task, `loadSaveFile` will call `file.arrayBuffer()` first, so the mock has to provide that too. The simplest fix is to use a real `Blob` (jsdom supports `Blob.prototype.arrayBuffer` and `.text`).

In `src/state/save-decoder.test.js`, replace lines 438–452 with:

```javascript
describe('loadSaveFile', () => {
  it('reads a legacy hex File object and returns profiles', async () => {
    const saveJson = JSON.stringify(MOCK_SAVE);
    const hex = encodeSaveHex(saveJson);
    const file = new Blob([hex], { type: 'text/plain' });

    const profiles = await loadSaveFile(file);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].name).toBe('Zeider');
    expect(profiles[0].class).toBe('rogue');
    expect(profiles[1].name).toBe('Thalin');
  });
});
```

- [ ] **Step 2: Run the test to verify it still passes against the current (text-based) implementation**

Run: `npx vitest run src/state/save-decoder.test.js -t loadSaveFile`
Expected: PASS — the current implementation calls `file.text()` which `Blob` supports natively, so swapping the mock for a real `Blob` shouldn't change behavior yet.

- [ ] **Step 3: Add failing tests for the four new branches**

Append inside the same `describe('loadSaveFile', ...)` block, before its closing `});`:

```javascript
  it('reads a plain-JSON File object and returns profiles', async () => {
    const saveJson = JSON.stringify(MOCK_SAVE);
    const file = new Blob([saveJson], { type: 'application/json' });

    const profiles = await loadSaveFile(file);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].name).toBe('Zeider');
  });

  it('throws SaveFormatError with a CLI pointer when given an ACTk-encrypted file', async () => {
    // Synthetic ACTk file: magic bytes "ACTk" followed by random binary garbage.
    // We don't need a valid AES payload — the sniff fires on the magic alone.
    const actk = new Uint8Array(64);
    actk[0] = 0x41; // 'A'
    actk[1] = 0x43; // 'C'
    actk[2] = 0x54; // 'T'
    actk[3] = 0x6b; // 'k'
    for (let i = 4; i < actk.length; i++) actk[i] = i & 0xff;
    const file = new Blob([actk], { type: 'application/octet-stream' });

    await expect(loadSaveFile(file)).rejects.toMatchObject({
      name: 'SaveFormatError',
      message: expect.stringContaining('npm run save:export'),
    });
  });

  it('throws SaveFormatError on unrecognized content (not JSON, not hex, not ACTk)', async () => {
    const file = new Blob(['this is not a save file'], { type: 'text/plain' });

    await expect(loadSaveFile(file)).rejects.toMatchObject({
      name: 'SaveFormatError',
      message: expect.stringMatching(/[Uu]nrecognized save format/),
    });
  });

  it('tolerates leading whitespace before a plain-JSON payload', async () => {
    const saveJson = '   \n\t' + JSON.stringify(MOCK_SAVE);
    const file = new Blob([saveJson], { type: 'application/json' });

    const profiles = await loadSaveFile(file);
    expect(profiles).toHaveLength(2);
  });
```

- [ ] **Step 4: Run the new tests to verify they fail**

Run: `npx vitest run src/state/save-decoder.test.js -t loadSaveFile`
Expected: FAIL on the four new cases — the current implementation either calls `JSON.parse` on hex (throws `Unexpected token`) or returns wrong profiles, and there's no `SaveFormatError` class yet. The first (legacy) case continues to PASS.

- [ ] **Step 5: Add `SaveFormatError` class + import to `save-decoder.js`**

In `src/state/save-decoder.js`, immediately above the existing `decodeSaveHex` export (around line 770), add:

```javascript
/**
 * Thrown by loadSaveFile when the input bytes don't match any supported save
 * format. The .message is intended to be surfaced to the user verbatim.
 */
export class SaveFormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SaveFormatError';
  }
}
```

- [ ] **Step 6: Rewrite `loadSaveFile` with format sniff**

Replace the existing implementation at `src/state/save-decoder.js:1108-1113`:

```javascript
/**
 * Load a save File/Blob and return extracted profiles.
 *
 * Accepts three formats:
 *   - Plain JSON (preferred for 0.311.0+ saves; produced by `npm run save:export`)
 *   - Legacy hex-XOR `data.sav` (pre-0.311.0 game versions)
 *   - ACTk-encrypted `data.sav.dat` (0.311.0+) — rejected with a CLI pointer
 *
 * @param {Blob} file - A File or Blob representing the save
 * @returns {Promise<Array<object>>} Extracted character profiles
 */
export async function loadSaveFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());

  // ACTk magic: bytes 0x41 0x43 0x54 0x6B at offset 0
  if (
    buf.length >= 4 &&
    buf[0] === 0x41 &&
    buf[1] === 0x43 &&
    buf[2] === 0x54 &&
    buf[3] === 0x6b
  ) {
    throw new SaveFormatError(
      'ACTk-encrypted save (.dat). Decrypt locally first:\n' +
        '  npm run save:export\n' +
        'Then drop the resulting data.sav.json into the importer.'
    );
  }

  const text = new TextDecoder('utf-8').decode(buf);
  const trimmed = text.replace(/^\s+/, '');
  const first = trimmed.charAt(0);

  let saveData;
  if (first === '{') {
    saveData = JSON.parse(trimmed);
  } else if (HEX_PAIR.test(trimmed) && trimmed.length % 2 === 0 && trimmed.length > 0) {
    saveData = JSON.parse(decodeSaveHex(trimmed));
  } else {
    throw new SaveFormatError('Unrecognized save format');
  }

  return extractProfiles(saveData);
}
```

Note: `HEX_PAIR` is already defined at `save-decoder.js:329` as `/^[0-9A-Fa-f]*$/` and is already used by `decodeSaveHex` at line 780, so it's in scope.

- [ ] **Step 7: Run all save-decoder tests to confirm green**

Run: `npx vitest run src/state/save-decoder.test.js`
Expected: PASS for all five `loadSaveFile` tests plus the existing `decodeSaveHex`, `extractProfiles`, `extractStash`, `extractEngineer` test blocks. No regressions.

- [ ] **Step 8: Run the full unit test suite as a regression guard**

Run: `npm test`
Expected: All tests pass. (If any unrelated test fails, stop and investigate — it isn't expected.)

- [ ] **Step 9: Commit**

```bash
git add src/state/save-decoder.js src/state/save-decoder.test.js
git commit -m "feat: accept plain JSON and reject ACTk in loadSaveFile

Add SaveFormatError + format-sniff to support importing decrypted
0.311.0 saves. Raw ACTk .dat files now fail with a pointer to
'npm run save:export' instead of a confusing hex-decode error."
```

---

### Task 2: Broaden file-picker `accept` to include `.json`

**Files:**
- Modify: `src/components/TopBar.jsx:20`

- [ ] **Step 1: Update `accept` attribute**

In `src/components/TopBar.jsx`, change line 20 from:

```javascript
    input.accept = '.sav';
```

to:

```javascript
    input.accept = '.sav,.sav.dat,.json';
```

`.sav.dat` is included so the OS dialog still shows the file you'd want to (and now can) reject with a friendly error — not so it works, but so the user can pick it and see the helpful "run npm run save:export" message rather than wondering why it doesn't appear.

- [ ] **Step 2: Smoke-check in dev**

Run: `npm run dev`
Open the browser to the dev URL, click **Import Save**. Confirm the OS file picker shows `.sav`, `.sav.dat`, and `.json` files. Cancel.

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.jsx
git commit -m "feat: accept .json and .sav.dat in the import file picker"
```

---

### Task 3: Create `scripts/save-export.mjs`

**Files:**
- Create: `scripts/save-export.mjs`

This is a thin Node CLI on top of `actk-codec.mjs` + `decodeSaveHex`. The logic mirrors `scripts/save-edit.mjs:42-57` (default-path resolution + format detection) but without the edit/encode path.

- [ ] **Step 1: Create the script**

Write `scripts/save-export.mjs` with this content:

```javascript
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
```

(Status messages go to stderr so `--stdout` mode produces clean JSON when piped.)

- [ ] **Step 2: Smoke-test against live ACTk save**

Run: `node scripts/save-export.mjs`
Expected: prints `Wrote NNNNN bytes to C:/.../data.sav.json` to stderr. A `data.sav.json` file appears next to the live save. Exit code 0.

- [ ] **Step 3: Verify the output is valid JSON with expected structure**

Run (PowerShell):
```powershell
$json = Get-Content "C:\Users\Jeremy\AppData\LocalLow\Fireblast Studios\Evitania Online - Idle RPG\data.sav.json" -Raw | ConvertFrom-Json
$json.Heroes.Heroes.Count
```
Expected: prints the number of heroes (≥ 1). No JSON parse error.

- [ ] **Step 4: Smoke-test against a legacy hex save from `Player Saves/`**

Run: `node scripts/save-export.mjs --save "Player Saves/Tiago-data.sav"`
Expected: writes `Player Saves/Tiago-data.json`. Exit code 0.

- [ ] **Step 5: Smoke-test `--stdout` mode**

Run (PowerShell): `node scripts/save-export.mjs --stdout | Out-Null`
Expected: exit code 0, no errors. Status line still appears on stderr.

- [ ] **Step 6: Smoke-test error path (bad input path)**

Run: `node scripts/save-export.mjs --save does-not-exist.sav`
Expected: stderr `File not found: does-not-exist.sav`. Exit code 1.

- [ ] **Step 7: Commit**

```bash
git add scripts/save-export.mjs
git commit -m "feat: add save-export CLI for decrypting ACTk saves to JSON

Reuses actk-codec for ACTk-v1 and decodeSaveHex for legacy saves.
Defaults to the live AppData save; accepts --save/--out/--stdout."
```

---

### Task 4: Wire `npm run save:export`

**Files:**
- Modify: `package.json:9-16`

- [ ] **Step 1: Add the script entry**

In `package.json`, change the `"scripts"` block from:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "npx playwright test",
    "test:all": "vitest run && npx playwright test"
  },
```

to:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:e2e": "npx playwright test",
    "test:all": "vitest run && npx playwright test",
    "save:export": "node scripts/save-export.mjs"
  },
```

- [ ] **Step 2: Verify it runs through npm**

Run: `npm run save:export`
Expected: same behavior as Task 3 Step 2 — exports the live save and writes JSON next to it.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add npm run save:export"
```

---

### Task 5: README — document the personal-import flow

**Files:**
- Modify: `README.md` (in the "How to Use" section, after the existing numbered steps)

- [ ] **Step 1: Add a paragraph**

In `README.md`, between the existing line 41 (`Everything runs locally in your browser...`) and the `## Support` heading, insert:

```markdown
### Game v0.311.0+ saves (encrypted)

Starting in Evitania **0.311.0**, the game writes `data.sav.dat` — an
AES-encrypted file locked to your machine's hardware ID. The browser tool
can't decrypt it (browsers have no access to Windows WMI). If your save is
`data.sav.dat`, decrypt it once locally:

```bash
npm run save:export
```

That writes a plain `data.sav.json` next to your save. Drop **that** file
into the **Import Save** picker. Re-run whenever you want fresh data.

Pre-0.311.0 saves (`data.sav`, hex-encoded) keep working without any extra step.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add v0.311.0+ save export instructions"
```

---

### Task 6: End-to-end manual verification

No code changes. This is the proof the whole thing works for the user it was built for.

- [ ] **Step 1: Export the live save**

Run: `npm run save:export`
Expected: `data.sav.json` written next to `data.sav.dat`.

- [ ] **Step 2: Build and serve the planner locally**

Run: `npm run dev`
Open the dev URL in the browser.

- [ ] **Step 3: Import the exported JSON**

Click **Import Save** → select the `data.sav.json` from Step 1.
Expected: profile dropdown populates with your characters, talent/hunter/gear panels render.

- [ ] **Step 4: Confirm the ACTk error path works**

Click **Import Save** again → select the raw `data.sav.dat`.
Expected: alert dialog showing the "ACTk-encrypted save (.dat). Decrypt locally first: npm run save:export…" message.

- [ ] **Step 5: Confirm legacy saves still import**

Click **Import Save** → select one of `Player Saves/*.sav` (e.g. `Tiago-data.sav`).
Expected: profiles load normally.

No commit — verification only. If anything fails, stop and file a follow-up task.

---

## Self-Review (post-write)

**Spec coverage check:**
- Spec "Approach" — covered by Tasks 1 + 3.
- Spec "Components → `scripts/save-export.mjs`" — Task 3 implements all flags (`--save`, `--out`, `--stdout`), default-path chain, format auto-detect, exit-code map.
- Spec "Components → `loadSaveFile`" — Task 1 implements ArrayBuffer-first sniff, `ACTk` magic detection, `{` plain-JSON branch, `HEX_PAIR` legacy branch, `SaveFormatError`.
- Spec "Components → file-picker `accept`" — Task 2 (with the bonus `.sav.dat` so users can pick it and see the friendly error).
- Spec "Components → `package.json`" — Task 4.
- Spec "Components → `README.md`" — Task 5.
- Spec "Error handling" table — every row is covered by either a test (Task 1 Step 3) or a smoke test (Task 3 Steps 2/4/5/6) or a manual check (Task 6 Step 4).
- Spec "Testing" — unit tests in Task 1; CLI smoke tests in Task 3; end-to-end manual verification in Task 6. The optional Playwright fixture isn't included — it's a nice-to-have, not in the spec's MUST list.

**Placeholder scan:** No `TBD`, no `add appropriate error handling`, every code block contains real code, every command has expected output.

**Type/name consistency:** `SaveFormatError` class name matches across declaration (Task 1 Step 5), import in tests (Task 1 Step 3 uses `name: 'SaveFormatError'` via `toMatchObject`), and the throw sites. `loadSaveFile`, `decryptActk`, `decodeSaveHex`, `HEX_PAIR`, `extractProfiles` all match their existing definitions. `--save`/`--out`/`--stdout` flag names are consistent between script implementation, usage docstring, and smoke-test invocations.

No gaps. No fixes needed.
