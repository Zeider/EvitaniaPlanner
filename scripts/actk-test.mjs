/**
 * Smoke-test the ACTk codec against the live save.
 * Verifies: decrypt → re-encrypt → re-decrypt → byte-identical plaintext.
 */
import fs from 'node:fs';
import { decryptActk, encryptActk, computeDeviceUniqueIdentifier } from './actk-codec.mjs';

const SAVE = 'C:/Users/Jeremy/AppData/LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav.dat';

const id = computeDeviceUniqueIdentifier();
console.log(`Computed deviceUniqueIdentifier: ${id}`);

const fileBytes = fs.readFileSync(SAVE);
console.log(`File: ${fileBytes.length} bytes`);

const { json, deviceIdHash, mode, headerVersion } = decryptActk(fileBytes);
console.log(`ACTk header: version=${headerVersion}, mode=${mode}, deviceIdHash=${deviceIdHash.toString('hex')}`);
console.log(`JSON: ${json.length} bytes`);
console.log(`First 120 chars: ${json.slice(0, 120).toString('utf8')}`);

// Sanity: parse JSON
const data = JSON.parse(json.toString('utf8'));
const gems = data.Currency?.Currencies?.find(c => c.name === 4);
console.log(`Gems: current=${gems?.current}, total=${gems?.total}`);
console.log(`Hero[0] equipment.Ring.itemGuid: ${data.Heroes?.Heroes?.[0]?.equipment?.Ring?.itemGuid}`);
console.log(`Hero[0] equipment.Ring2?.itemGuid: ${data.Heroes?.Heroes?.[0]?.equipment?.Ring2?.itemGuid ?? '(none)'}`);

// Round-trip
const reEncrypted = encryptActk(json, deviceIdHash);
console.log(`\nRe-encrypted: ${reEncrypted.length} bytes (vs original ${fileBytes.length})`);
const { json: json2, deviceIdHash: dh2, mode: m2 } = decryptActk(reEncrypted);
const match = json.equals(json2) && deviceIdHash.equals(dh2) && mode === m2;
console.log(`Round-trip JSON match: ${match}`);
if (!match) {
  console.error('  json bytes differ');
  process.exit(1);
}
console.log('\n✓ Codec verified end-to-end');
