# Evitania Online — Update 0.311.0 (game-side patch notes + planner impact)

Posted to community by dev with redeem code `L1NCUE8C`.
This file is the **game-side** patch notes (verbatim) plus a planner-side
impact assessment. Distinct from `patch-notes-*.md` files which track
EvitaniaCalc/Planner changes.

---

## Verbatim patch notes

### New
- New Steel tier: full armor set with set bonuses, weapons, and tools (old Steel weapons renamed to Iron)
- Second ring slot; equipment slots are now decoupled from item type
- Live character preview in the cosmetics tab
- Tin and Goak cards
- Meena skin and pet added to permanent skins
- Card drop table is now scrollable and sorted by chance
- Engineer category headers show item icon, name, and live stockpile
- Engineer slots show net production rate per item and highlight deficits
- Cross-shortcuts between Craft and Smeltery, and between Enhance and Repair
- Quantity slider in the gem-shop grocery info panel

### Balance
- Lightning Strike damage increased from 30% to 60%
- Act 2 bonfire sacrifices replaced with boss body parts
- Animal bones added to the Act 1 vendor

### Improvements
- Bonfire Ash Gain now shows rate per hour instead of probability
- Stronger anti-cheat protections and local save encryption

### Bug Fixes
- Fixed Engineer sprite flicker
- Fixed legacy saves failing to load when they contained removed types or enhancements
- Fixed multiple cases where cloud data could overwrite the local save
- New-device cloud-wipe flow tightened and a blocked-save UI added
- Engineer's Double Crit talent worked for offline gains calculations even when not learned

### Known bugs
Equipping two of the same ring can cause the effects to cancel out each other when changing zones or unequipping.
**Temp fix: Don't wear two of the same ring.**

---

## Planner-side impact

### CRITICAL — workflow risk

**Local save encryption + stronger anti-cheat.** `scripts/save-edit.mjs` currently
relies on the format being plain XOR-0xFF over UTF-8 JSON. If 0.311.0 wraps that
in a new envelope (AES, key-derived-from-machine-id, signed manifest, etc.),
the tool dies until we reverse the new format.

Confirmed pre-update: today's gems → 100k and ring inserts (Ashen, Steam at
stash[103]/[104]) both wrote successfully under the old format. Status of those
edits after the 0.311.0 client loads them is **unknown** — possibilities:
1. Client treats existing files as legacy, re-encrypts on next save-out. Edits persist.
2. Client validates a missing signature/hash and refuses to load. Edits lost.
3. Server-side anti-cheat flags the unusual delta (3.5k → 100k gems in one tick).
   The "total" field was deliberately left at 41,600 to keep the lifetime-earned
   counter natural, which should help — but no guarantee.

**Action:** investigate after game patch lands. Don't run more save-edits
until format is re-mapped.

### HIGH — schema break

**Second ring slot + slot-type decoupling.** Hero `equipment.Ring` (singular)
will change. Consumers in EvitaniaCalc:
- `src/state/save-decoder.js` — gear-slot iteration, hero-stat aggregation
- `src/state/stat-engine.js` — equipment-driven stat math
- `src/state/upgrade-enumerator.js` — slot-by-slot upgrade enumeration
- Any UI that lists slots (Heroes tab, gear comparison)

If slots are "decoupled from item type," this might mean: a generic slot array
where each slot has a `type` field and any compatible item can go in any compatible
slot — closer to Diablo's flexible-slot model. Need to inspect a 0.311.0 save
to know the new shape.

**Action:** add fixture from a 0.311.0 save before touching the code. Right
now we'd be guessing the schema.

### MEDIUM — new content to map

- **Steel tier (full set)** — gear.json needs new entries: Steel Helmet,
  Chest, Legs, Boots + set-bonus definition + matching weapons/tools.
  "Old Steel weapons renamed to Iron" means existing Steel-weapon GUIDs
  now resolve to Iron names → check `save-decoder.js` GEAR_GUID_MAP for
  any "Steel <weapon>" entries that need their display names updated.
- **Tin + Goak cards** — cards.json gains two entries. Card-bonus math
  unchanged, just new data.
- **Meena skin/pet** — cosmetic, no math impact, but pet skin GUID map
  (38 entries from v3.2.17) needs Meena added.

### LOW — neutral / good for us

- "Card drop table sorted by chance" — UI-only.
- Engineer UI improvements — UI-only on game side; doesn't change the data
  the planner reads.
- Lightning Strike 30 → 60% — talent.json balance update if the planner
  models this talent's damage contribution; otherwise neutral.

### Side note — known bug

The 2-rings-cancel-on-zone-change bug means a player can't safely run two
copies of the SAME ring (e.g., two Ashen Rings). Different rings are fine.
Worth surfacing in the planner's upgrade-advisor if it ever recommends
"equip two of X" as a build (currently it doesn't, but flag it as a guard).

---

## Action checklist (when ready to act)

- [x] Patch game to 0.311.0 — `data.sav` → `data.sav.dat` (raw binary instead of hex-text)
- [x] Snapshot save before+after patch; diff the formats — Confirmed AES-encrypted (entropy 7.997, per-write random IV: `.dat` ≠ `.dat.bak` at 99.6% of bytes despite same length)
- [x] Identify encryption framework — **CodeStage Anti-Cheat Toolkit (ACTk)**, class `CodeStage.AntiCheat.Storage.ObscuredFile` with AES-128 (key length 16). File header: `"ACTk\0<mode>"` XOR-obscured.
- [x] Reverse-engineer password construction — **`UTF8(SystemInfo.deviceUniqueIdentifier) + b"dhnt_evit_2024_xK9pQ3vL"`** assembled by `DataFileHandlerService.BuildPasswordBytes()`. The 23-byte constant suffix is split across three deliberately-misnamed obfuscator classes (`Audio.AudioMixerProfile.Resolve()` → `"dhnt_evi"`, `Player.Combat.CombatTuningTable.Resolve()` → `"t_2024_x"`, `Pathfinder.NavMeshOffsets.Resolve()` → `"K9pQ3vL"`), each XOR-decoding a metadata-blob constant with a class-specific mask.
- [x] **Finalize decoder (DONE 2026-05-14)** — Node implementation at `scripts/actk-codec.mjs`, wired into `save-edit.mjs` with auto-detection between legacy hex and ACTk-v1 formats. Verified end-to-end on the live save:
  - Reads gems correctly (`current: 100090` — pre-patch edit of 100k + 90 from gameplay survived 0.311.0 migration)
  - Ashen Ring lands on `Heroes[0].equipment.Ring`, Steam Ring on `Heroes[0].equipment.Ring2` (confirming the new schema is `Ring`+`Ring2`, not a flexible array)
  - Round-trip decrypt → encrypt → decrypt → byte-identical plaintext
  - File-level xxHash32 recomputed and re-stored correctly so the game's tamper check passes
  - The Unity 6 Windows `deviceUniqueIdentifier` formula resolved empirically: `sha1_lc(BB_SN + BIOS_SN + CPU_UID + Disk_SN + OS_SN)` with empty fields preserved (on this machine: `Default string` + `Default string` + `` + `` + OS-product-key SHA1s to `93ff3c14...`). Unity 6 omits Disk.SerialNumber on multi-disk systems where the boot drive can't be uniquely picked.
- [ ] Add a 0.311.0 fixture to `tests/fixtures/` (decrypted JSON snapshot)
- [x] **Equipment-slot consumers updated for Ring2** — `save-decoder.js` SLOT_MAP gains `Ring2: 'ring2'`, `store.js` SLOT_MIGRATE matches, `GearStrip.jsx`/`GearPlanner.jsx` add `ring2` to display rows, `GearPlanner` shares ring items into both ring buckets, `upgrade-enumerator.js` iterates both slots for empty-suggestions + guards against recommending two-of-same-ring (the 0.311.0 known bug). Stat engine doesn't need changes (already iterates all `Object.values(profile.gear)`). Equipment shape confirmed: `Ring` + `Ring2` separate keys, not flexible array.
- [x] **Steel tier added to gear.json with REAL stats** (from user's in-game screenshots 2026-05-14): Helmet/Chestplate/Gloves/Boots (def 43, str/dex/int/con 25, xpMulti 10, set bonus marker), Longsword (atk 79, str 40, atkSpeed 20, critDamage 35, xpMulti 10), Bow (atk 86, dex 30, atkSpeed 30, critDamage 35, xpMulti 10), Staff (atk 97, int 28, men 42, critDamage 35, xpMulti 10), Axe (con 1, wcXp 15, wcPower 76), Pickaxe (atk 1, miningXp 15, miningPower 70). Chestplate also gets hp 320, Boots get moveSpeed 10. Set bonus calculation NOT YET WIRED — `setBonus: "Steel"` field added for future implementation. Recipes preserved from screenshots (Steel Bar amounts varying by piece, plus Dragon Horn/Norse Essence for weapons, Death's Flower/Furry Fur for armor, The Crab's Pickaxe/Crystallized Yellow Substance for tools — these recipes need adding to the crafting tree separately).
- [x] **GEAR_GUID_MAP renames applied** — old Steel weapon GUIDs flipped to Iron names. Old `bd3cfbe4...` Steel Longsword → Iron Longsword. Old `a30e858e...` Steel Bow → Iron Bow. Old `fe3f786f...` Steel Staff → Iron Staff. Old `1a5ec422...` Steel Sword → Iron Sword. New Steel-tier GUIDs added: Steel Helmet/Chestplate/Gloves/Boots + new Steel Longsword/Bow/Staff/Axe/Pickaxe. Test fixtures in 4 files updated to match new names.
- [x] GUID map updated for Tin + Goak cards (resolve in Storage/Inventory). Tin Card: `bb6c4591-abb8-41a3-87ab-0d9d1439941d`. Goak Card: `01a18d23-4f27-4e23-9f99-6de74e723eb4`.
- [ ] **cards.json entries for Tin/Goak need in-game observation** — drop zone, stat type, tier values, drop rate. Resource cards in cards.json drive both UI display and stat math; adding placeholders would produce wrong calculations. Better to leave them off the Cards tab until real values land than to fake it. Both names already resolve via CARD_GUID_MAP so they appear correctly in Storage/Inventory.
- [ ] Add Meena pet skin GUID
- [x] Lightning Strike 30→60% damage — **not applicable**, talent only stored as `isSkill: true` flag with no damage value; planner doesn't simulate skill damage.
- [ ] Redeem code `L1NCUE8C` in-game before it expires

## Known limitations (deferred)

**Browser save-import doesn't handle ACTk-encrypted `.dat` files.** The Node CLI (`scripts/save-edit.mjs`) auto-detects format and decrypts via `actk-codec.mjs`, but the in-browser `decodeSaveHex` import flow (the `Import Save` button in the web app) only understands the legacy XOR-FF hex format. Importing `data.sav.dat` shows: `"Failed to decode save file: Invalid hex string: odd number of characters"`.

Root cause: `actk-codec.mjs` shells out to PowerShell + WMI to compute `SystemInfo.deviceUniqueIdentifier`, which doesn't work in a browser. Web Crypto API can handle PBKDF2-SHA1 + AES-128-CBC natively, but the device ID would need to come from somewhere else (user paste, pre-decrypt step, etc.).

**Workaround for now:** use the CLI for save-driven editing (`node scripts/save-edit.mjs --get/--set`). The web app remains useful for everything that doesn't require importing a 0.311.0 save (manual stat entry, gear planning from scratch, talent trees, etc.).

**Future fix options when prioritized:**
- Add a "Device ID" text input to the Import dialog. Ship a tiny CLI helper that prints the ID; user pastes once, stored in localStorage. ~1 hour of work.
- Accept pre-decrypted JSON uploads alongside `.dat`. Two-step UX but simpler code.

## Stale Playwright tests (pre-existing, not caused by 0.311.0)

4 of 23 Playwright E2E tests fail because they were written in May 2025 against the flat tab layout, but v3.2.12 restructured nav into 4 dropdown groups (`Character ▾`, `Inventory ▾`, `Planning ▾`) and moved `Release Notes` into the top bar. Test selectors like `.tab-btn:has-text("Upgrade Advisor")` no longer match anything. These need updating to navigate via dropdowns, but the underlying functionality works correctly — verified visually via Playwright MCP that Ring 2 displays in the equipped-gear strip and all dropdowns expand properly.

Failing tests:
- `app.spec.js:24` — `all tabs render without errors` (iterates flat tab list)
- `app.spec.js:172` — `upgrade advisor does not suggest talents when fully allocated`
- `app.spec.js:195` — `dps simulator renders stats after import` (DPS Sim is now `DPS Sim`, not `DPS Simulator`)
- `app.spec.js:265` — `release notes tab shows version history` (Release Notes moved to top bar)

Unit tests (Vitest) all pass: 123/123.

## Investigation artifacts (for the next session)

- **New `data.sav.dat` location**: `C:\Users\Jeremy\AppData\LocalLow\Fireblast Studios\Evitania Online - Idle RPG\data.sav.dat` (64,516 bytes)
- **Post-patch Cpp2IL output (use this, not the 5/5 pre-patch one)**:
  - `dummydll` mode (signatures/fields): `C:\Users\Jeremy\Tools\Cpp2IL\output_0311\`
  - `dll_il_recovery` mode: `C:\Users\Jeremy\Tools\Cpp2IL\output_0311_il\`
  - `diffable-cs` (pseudo-C# skeletons): `C:\Users\Jeremy\Tools\Cpp2IL\output_0311_cs\`
  - `isil` (instruction-level IR — most useful): `C:\Users\Jeremy\Tools\Cpp2IL\output_0311_isil\`
- **Key files in the ISIL dump**:
  - `IsilDump/Assembly-CSharp/DataFileHandlerService.txt` (line 1626: `BuildPasswordBytes`)
  - `IsilDump/Assembly-CSharp/Utils/BuildContext.txt` (the orchestrator)
  - `IsilDump/Assembly-CSharp/Audio/AudioMixerProfile.txt` (XOR 0xA3, 8 bytes, RVA 0x184A42498 — but actual bytes live at metadata file offset 0x984608)
  - `IsilDump/Assembly-CSharp/Player/Combat/CombatTuningTable.txt` (XOR 0x57, base64 `"IwhlZ2VjCC8="`)
  - `IsilDump/Assembly-CSharp/Pathfinder/NavMeshOffsets.txt` (XOR 0xF1, Int16[4] at RVA 0x184A420C8 — actual bytes at metadata file offset 0x976b88)
  - `IsilDump/ACTk.Runtime/CodeStage/AntiCheat/Storage/ObscuredFileCrypto.txt` (lines 366+ = `EncryptInternal`, lines 472+ = `DecryptInternal`) — both call helper at `0x180AE0A30` / `0x180AE0620` which is the actual AES/format implementation
- **First 6 bytes of the live `.dat` file XOR-decode to "ACTk\0\x01"** (the ACTk header magic with `ObscurationMode.Encrypted=1`) — file bytes `46 2E A6 53 CF 70`, XOR key bytes `07 6D F2 38 CF 71`. The XOR key is what ACTk's internal helper generates from somewhere (probably constant or seeded from a fixed value to make the file look uniformly random).
- **Confirmed: 0.311.0 ships a `TryLoadLegacy` path in `DataFileHandlerService`** — old XOR-0xFF saves get migrated on first load. The pre-patch gem-edit (3,500 → 100,000) and ring inserts (Ashen + Steam at `stash[103]/[104]`) should ride through the migration. Server-side anti-cheat on the gem delta is a separate risk this investigation doesn't address.
