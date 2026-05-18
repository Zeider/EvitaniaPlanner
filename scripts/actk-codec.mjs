/**
 * ACTk V1 ObscuredFile codec for Evitania Online ≥ 0.311.0 saves.
 *
 * Reverse-engineered from CodeStage Anti-Cheat Toolkit (Unity Asset Store)
 * via Cpp2IL ISIL inspection of Evitania's `ACTk.Runtime.dll` and
 * `Assembly-CSharp.dll`. Algorithm details documented in
 * `game-0.311.0-impact.md`.
 *
 * File layout:
 *   [4 bytes]  xxHash32(plaintext, seed=0x6031D5ED) XOR 0x7E7EB288, LE
 *   [16 bytes] AES IV (also used as PBKDF2 salt)
 *   [N bytes]  AES-128-CBC ciphertext, PKCS7-padded
 *
 * Plaintext layout:
 *   "ACTk"             4 bytes — ObscuredFile magic
 *   0x00               1 byte  — header version
 *   0x01               1 byte  — ObscurationMode.Encrypted
 *   <DeviceIdHash:u32> 4 bytes — opaque device-lock check (preserved on round-trip)
 *   <JSON bytes>       rest    — the actual save JSON
 *
 * Password = utf8(SystemInfo.deviceUniqueIdentifier) + "dhnt_evit_2024_xK9pQ3vL"
 *   where deviceUniqueIdentifier on Windows =
 *     sha1_lc(Win32_BaseBoard.SerialNumber + Win32_BIOS.SerialNumber +
 *             Win32_Processor.UniqueId + Win32_DiskDrive.SerialNumber +
 *             Win32_OperatingSystem.SerialNumber)
 *   with empty fields preserved (no separator).
 *
 * Key = PBKDF2-HMAC-SHA1(password, IV, iters=10, dkLen=16)
 */
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const SUFFIX = Buffer.from('dhnt_evit_2024_xK9pQ3vL', 'utf8');
const ACTK_MAGIC = Buffer.from([0x41, 0x43, 0x54, 0x6b, 0x00, 0x01]); // "ACTk\0\x01"
const XXHASH_SEED = 0x6031d5ed;
const HASH_XOR_MASK = 0x7e7eb288;

function wmi(query) {
  // execFileSync runs PowerShell directly without a shell — no injection.
  // `query` is hardcoded by callers below, never user-supplied.
  try {
    return execFileSync('powershell', ['-NoProfile', '-Command', query], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Compute Unity's SystemInfo.deviceUniqueIdentifier on Windows Standalone.
 * Verified against Evitania 0.311.0 + Unity 6 on a multi-disk system where
 * disks and CPU UniqueId returned empty strings.
 */
export function computeDeviceUniqueIdentifier() {
  const bb = wmi('(Get-CimInstance Win32_BaseBoard).SerialNumber');
  const bios = wmi('(Get-CimInstance Win32_BIOS).SerialNumber');
  const cpuUid = wmi('(Get-CimInstance Win32_Processor | Select-Object -First 1).UniqueId');
  // Unity 6 omits Disk.SerialNumber on multi-disk Windows boxes (verified
  // empirically on a 3-disk system). CPU UniqueId is also typically empty
  // because consumer Intel/AMD don't expose it.
  const diskSn = '';
  const osSn = wmi('(Get-CimInstance Win32_OperatingSystem).SerialNumber');
  const concat = bb + bios + cpuUid + diskSn + osSn;
  return crypto.createHash('sha1').update(concat, 'utf8').digest('hex');
}

/**
 * xxHash32 (Yann Collet). Single-pass; matches ACTk.Utils.xxHash byte-for-byte.
 */
function xxHash32(buf, seed = 0) {
  const PRIME1 = 0x9e3779b1 >>> 0;
  const PRIME2 = 0x85ebca77 >>> 0;
  const PRIME3 = 0xc2b2ae3d >>> 0;
  const PRIME4 = 0x27d4eb2f >>> 0;
  const PRIME5 = 0x165667b1 >>> 0;
  const mul32 = (a, b) => Math.imul(a | 0, b | 0) >>> 0;
  const rotl32 = (x, n) => (((x << n) | (x >>> (32 - n))) >>> 0);

  const len = buf.length;
  let i = 0;
  let h;
  if (len >= 16) {
    let v1 = (seed + PRIME1 + PRIME2) >>> 0;
    let v2 = (seed + PRIME2) >>> 0;
    let v3 = (seed + 0) >>> 0;
    let v4 = (seed - PRIME1) >>> 0;
    while (i + 16 <= len) {
      v1 = mul32(rotl32((v1 + mul32(buf.readUInt32LE(i), PRIME2)) >>> 0, 13), PRIME1);
      v2 = mul32(rotl32((v2 + mul32(buf.readUInt32LE(i + 4), PRIME2)) >>> 0, 13), PRIME1);
      v3 = mul32(rotl32((v3 + mul32(buf.readUInt32LE(i + 8), PRIME2)) >>> 0, 13), PRIME1);
      v4 = mul32(rotl32((v4 + mul32(buf.readUInt32LE(i + 12), PRIME2)) >>> 0, 13), PRIME1);
      i += 16;
    }
    h = (rotl32(v1, 1) + rotl32(v2, 7) + rotl32(v3, 12) + rotl32(v4, 18)) >>> 0;
  } else {
    h = (seed + PRIME5) >>> 0;
  }
  h = (h + len) >>> 0;
  while (i + 4 <= len) {
    h = (h + mul32(buf.readUInt32LE(i), PRIME3)) >>> 0;
    h = mul32(rotl32(h, 17), PRIME4);
    i += 4;
  }
  while (i < len) {
    h = (h + mul32(buf[i], PRIME5)) >>> 0;
    h = mul32(rotl32(h, 11), PRIME1);
    i += 1;
  }
  h = mul32(h ^ (h >>> 15), PRIME2);
  h = mul32(h ^ (h >>> 13), PRIME3);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function pbkdf2Sha1(password, salt, iters, dkLen) {
  return crypto.pbkdf2Sync(password, salt, iters, dkLen, 'sha1');
}

/**
 * Decrypt an ACTk V1 ObscuredFile.
 * @param {Buffer} fileBytes - the raw .dat file bytes
 * @param {string} [deviceId] - override; defaults to live WMI computation
 * @returns {{json: Buffer, deviceIdHash: Buffer, mode: number, headerVersion: number}}
 */
export function decryptActk(fileBytes, deviceId = null) {
  if (fileBytes.length < 4 + 16 + 16) {
    throw new Error(`File too small (${fileBytes.length} bytes)`);
  }
  const id = deviceId ?? computeDeviceUniqueIdentifier();
  const password = Buffer.concat([Buffer.from(id, 'utf8'), SUFFIX]);

  const storedHash = fileBytes.readUInt32LE(0);
  const iv = fileBytes.slice(4, 20);
  const ciphertext = fileBytes.slice(20);
  if (ciphertext.length % 16 !== 0) {
    throw new Error(`Ciphertext not a multiple of 16 (${ciphertext.length})`);
  }

  const key = pbkdf2Sha1(password, iv, 10, 16);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(true);
  let plaintext;
  try {
    plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (e) {
    throw new Error(`AES decrypt failed (likely wrong password/key): ${e.message}`);
  }

  if (!plaintext.slice(0, 4).equals(Buffer.from([0x41, 0x43, 0x54, 0x6b]))) {
    throw new Error(`Bad ACTk magic — got ${plaintext.slice(0, 4).toString('hex')}`);
  }
  const headerVersion = plaintext[4];
  const mode = plaintext[5];
  const deviceIdHash = plaintext.slice(6, 10);
  const json = plaintext.slice(10);

  const computed = xxHash32(plaintext, XXHASH_SEED);
  const expected = (storedHash ^ HASH_XOR_MASK) >>> 0;
  if (computed !== expected) {
    process.stderr.write(
      `warning: file hash mismatch (expected 0x${expected.toString(16)}, got 0x${computed.toString(16)})\n`,
    );
  }

  return { json, deviceIdHash, mode, headerVersion };
}

/**
 * Encrypt a JSON save back to ACTk V1 format.
 * @param {Buffer} jsonBytes - the new JSON save bytes
 * @param {Buffer} deviceIdHash - 4-byte device-lock hash (preserve from decrypt)
 * @param {string} [deviceId] - override; defaults to live WMI computation
 * @returns {Buffer}
 */
export function encryptActk(jsonBytes, deviceIdHash, deviceId = null) {
  if (deviceIdHash.length !== 4) {
    throw new Error(`deviceIdHash must be exactly 4 bytes (got ${deviceIdHash.length})`);
  }
  const id = deviceId ?? computeDeviceUniqueIdentifier();
  const password = Buffer.concat([Buffer.from(id, 'utf8'), SUFFIX]);

  const plaintext = Buffer.concat([ACTK_MAGIC, deviceIdHash, jsonBytes]);
  const iv = crypto.randomBytes(16);
  const key = pbkdf2Sha1(password, iv, 10, 16);

  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  cipher.setAutoPadding(true);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);

  const hash = xxHash32(plaintext, XXHASH_SEED);
  const stored = (hash ^ HASH_XOR_MASK) >>> 0;
  const hashBytes = Buffer.alloc(4);
  hashBytes.writeUInt32LE(stored, 0);

  return Buffer.concat([hashBytes, iv, ciphertext]);
}
