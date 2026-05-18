# Personal ACTk save import — design

## Problem

Game v0.311.0 wraps `data.sav` in an ACTk envelope: AES-128 PBKDF2 with password = `SystemInfo.deviceUniqueIdentifier + "dhnt_evit_2024_xK9pQ3vL"`, where the device ID is `sha1_lc(BaseBoard SN + BIOS SN + CPU UniqueId + Disk SN + OS SN)` via WMI. Browsers can't compute that ID — no Win32 access — so `src/state/save-decoder.js#loadSaveFile()` (which only handles the pre-0.311 hex-XOR format) now silently fails against the user's own live save. The public GitHub Pages build must not contain the user's device ID; the Node CLI side already has working decryption via `scripts/actk-codec.mjs`.

## Goal

Restore personal ability to import the current-game-version save into the browser tool with one extra CLI step. The public artifact stays device-ID-free.

## Non-goals

- Other users' ACTk saves. They aren't supported and the tool tells them what to do instead.
- In-browser AES/PBKDF2. Explicitly rejected for cost vs. friction.
- Browser-side encryption / round-trip back to ACTk. Save-stuffing stays in `scripts/save-edit.mjs` where it already works.
- Any change to the legacy hex-XOR path. It keeps working unchanged for pre-0.311 saves and the captured `Player Saves/` fixtures.

## Approach

A new `scripts/save-export.mjs` CLI decrypts ACTk → plain JSON on disk. The browser's `loadSaveFile()` gains a tiny format sniff at the top so it accepts plain JSON in addition to the existing hex format, and fails closed with a helpful pointer when handed a raw ACTk blob.

## Architecture

```
Game writes              CLI (Node)                       Browser (Vite bundle)
─────────────            ─────────────────────             ──────────────────────────
data.sav.dat   ───────►  npm run save:export    ───────►  Drop file in Import button
(ACTk-encrypted)         (uses actk-codec.mjs)   data.sav.json    │
                                                                  ▼
                                                       loadSaveFile() format sniff
                                                       ├─ '{' → JSON.parse
                                                       ├─ hex → decodeSaveHex (legacy)
                                                       └─ 'ACTk' → friendly error
```

Crypto stays in Node. The browser bundle gets ~15 LoC of format detection.

## Components

### `scripts/save-export.mjs` (new)

Thin CLI on top of the existing codec. Reuses the format-detection and default-path logic that `scripts/save-edit.mjs` already proved out (`save-edit.mjs:42-57`).

- **Defaults:** input `data.sav.dat` if present, else `data.sav`, same fallback chain as `save-edit.mjs`. Output: `<input-basename>.json` next to the input (e.g. `data.sav.dat` → `data.sav.json`).
- **Flags:**
  - `--save <path>` — override input path. Lets you decrypt files in `Player Saves/` too, for symmetry with `save-edit.mjs`.
  - `--out <path>` — override output path. Takes precedence over the default `<input-basename>.json`.
  - `--stdout` — write JSON to stdout instead of a file (for piping). Mutually exclusive with `--out` — passing both is an arg-parse error.
- **Auto-detect input:**
  - ACTk → `decryptActk(buf)` from `actk-codec.mjs`, writes `result.json` to disk
  - Legacy hex → `decodeSaveHex(text)` from `src/state/save-decoder.js`, writes the decoded string
- **No re-encryption.** This script is read-only by design; `save-edit.mjs` remains the round-trip tool.
- **Exit codes:** 0 success, 1 file not found, 2 unknown format, 3 decrypt failure (wrong device).

### `src/state/save-decoder.js` — `loadSaveFile()` (modified)

Current implementation (`save-decoder.js:1108-1113`) unconditionally hex-decodes. Replace with a sniff that reads bytes first (binary-safe) and only decodes as text when it's safe to:

```
1. Read file as ArrayBuffer → Uint8Array.
2. If first 4 bytes are "ACTk" (0x41 0x43 0x54 0x6B):
   → throw SaveFormatError with actionable message (see below).
3. Otherwise UTF-8-decode the bytes; trim leading whitespace; peek first non-WS char.
   - '{'                              → JSON.parse(text)  (new plain-JSON path)
   - matches HEX_PAIR (existing regex
     in save-decoder.js)              → decodeSaveHex(text)  (existing legacy path)
   - else                             → throw SaveFormatError "Unrecognized save format"
4. Pass parsed JSON to extractProfiles() as today.
```

Reading as `ArrayBuffer` before any text decode matters: ACTk files are high-entropy binary and `file.text()` would mojibake them, breaking the sniff. Pseudo:

```js
const buf = new Uint8Array(await file.arrayBuffer());
if (buf[0] === 0x41 && buf[1] === 0x43 && buf[2] === 0x54 && buf[3] === 0x6B) {
  throw new SaveFormatError(
    'ACTk-encrypted save (.dat). Decrypt locally first:\n' +
    '  npm run save:export\n' +
    'Then drop the resulting data.sav.json into the importer.'
  );
}
const text = new TextDecoder('utf-8').decode(buf);
// continue with text-based branches
```

A new `SaveFormatError` class (small `extends Error`) lets the UI surface this message verbatim instead of a generic stack trace.

### File-picker `accept` attribute (modified)

Wherever the import button's `<input type="file">` lives, extend the `accept` list to include `.json`. (Identify in implementation — likely a component under `src/components/` or `src/tabs/`.)

### `package.json` (modified)

Add `"save:export": "node scripts/save-export.mjs"` next to the existing dev/build/test scripts.

### `README.md` (modified)

Add one paragraph under "How to Use" pointing current-game-version players at:

> If your save lives at `…data.sav.dat` (game v0.311.0+), it's encrypted to your device. The browser tool can't decrypt it. Run `npm run save:export` once locally to produce a `data.sav.json`, then import that.

## Data flow

1. User runs `npm run save:export`. Node reads `data.sav.dat`, decrypts via `actk-codec.mjs` using locally-computed device ID, writes `data.sav.json`.
2. User clicks **Import Save** in the browser, selects `data.sav.json`.
3. `loadSaveFile()` sniffs `{` → `JSON.parse(text)` → `extractProfiles(saveData)`.
4. Profiles render exactly as they would for a legacy save.

Nothing about the device ID, AES, or ACTk crosses into the browser at any point. The plain JSON is data, not a key.

## Error handling

| Input | Behavior |
|---|---|
| Plain JSON, valid | Parses, profiles load |
| Plain JSON, malformed | Existing `JSON.parse` error surfaces via UI (no change) |
| Legacy hex | Existing `decodeSaveHex` path, no change |
| ACTk binary (`.dat`) | `SaveFormatError` with the `npm run save:export` pointer |
| Empty / garbage | `SaveFormatError` "Unrecognized save format" |
| CLI run with no save present | Exit 1, prints both default paths it tried |
| CLI run, ACTk decrypt fails (e.g. file copied from another device) | Exit 3, prints "Decrypt failed — was this save written by this machine?" |

## Testing

- **Unit (`src/state/save-decoder.test.js`):** add cases for the four branches — plain JSON, legacy hex, ACTk binary (synthesize 4-byte magic prefix), unrecognized garbage. Assert correct profiles or correct error class+message.
- **Round-trip:** add a `scripts/` smoke test that runs `save-export.mjs` against `data.sav.dat`, then re-parses the emitted JSON and confirms hero count matches `actk-test.mjs`'s baseline.
- **No E2E change required.** The Playwright import flow already exercises `loadSaveFile`; once unit tests cover the new branches, it transparently works for JSON files too. Optional: extend one existing Playwright test to drop a `.json` fixture alongside the `.sav` fixture.
- **Manual verification (you):** export your live `data.sav.dat`, drop the resulting JSON, confirm character dropdown and hunter upgrades render.

## What this does NOT change

- `src/state/save-decoder.js#decodeSaveHex` — untouched
- `src/state/save-decoder.js#extractProfiles` — untouched
- `scripts/actk-codec.mjs` — untouched
- `scripts/save-edit.mjs` — untouched (still the round-trip tool)
- Public GitHub Pages bundle size — gains ~15 LoC of format detection, no new dependencies
- Anyone else's experience — they continue to drop their (legacy) `.sav` and it works as before

## Open decisions captured

- Output file name: `<input-basename>.json` next to the input. (e.g. `data.sav.dat` → `data.sav.json`, `Player Saves/Tiago-data.sav` → `Player Saves/Tiago-data.json`.) Predictable, no flag needed for the happy path.
- `--save` flag included for parity with `save-edit.mjs` — lets you decrypt fixtures and other-player saves through the same CLI.
- No clipboard / file-watcher mode. YAGNI given the chosen friction tolerance.
