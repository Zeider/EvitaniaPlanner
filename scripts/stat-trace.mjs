import fs from 'fs';

const classData = JSON.parse(fs.readFileSync('src/data/classes.json', 'utf8'));
const hunterData = JSON.parse(fs.readFileSync('src/data/hunter-upgrades.json', 'utf8'));
const talentsData = JSON.parse(fs.readFileSync('src/data/talents.json', 'utf8'));
const gearData = JSON.parse(fs.readFileSync('src/data/gear.json', 'utf8'));
const sacrificesData = JSON.parse(fs.readFileSync('src/data/sacrifices.json', 'utf8'));
const ashData = JSON.parse(fs.readFileSync('src/data/ash-upgrades.json', 'utf8'));
const cardsData = JSON.parse(fs.readFileSync('src/data/cards.json', 'utf8'));

const hex = fs.readFileSync('C:/Users/Jeremy/AppData/LocalLow/Fireblast Studios/Evitania Online - Idle RPG/data.sav', 'utf8').trim();
const bytes = new Uint8Array(hex.length / 2);
for (let i = 0; i < hex.length; i += 2) bytes[i/2] = parseInt(hex.substring(i, i+2), 16) ^ 0xff;
const save = JSON.parse(new TextDecoder().decode(bytes));

const hero = save.Heroes.Heroes[0];
const progEnh = save.ProgressProfile.Enhancements;
const heroEnh = hero.Enhancements;
const cards = save.Currency.cards;

const rogue = classData.rogue.stats;
let atk = rogue.atk || 0;
let atkPercent = rogue.atkPercent || 0;
let dex = rogue.dex || 0;
let defPercent = 0;
let critChance = rogue.critChance || 0;
let critDmg = rogue.critDamage || 0;
let def = rogue.def || 0;
let hp = rogue.hp || 0;

console.log('=== Layer 1: Base ===');
console.log(`atk=${atk} atkPct=${atkPercent} dex=${dex} critCh=${critChance} critDmg=${critDmg} def=${def} hp=${hp}`);

// === Layer 2 ===
const hunterMultipliers = [];
for (const h of hunterData) {
  const rank = progEnh[h.id] || 0;
  if (rank <= 0) continue;
  if (h.isMultiplier) {
    hunterMultipliers.push({ stat: h.stat, perRank: h.perRank, rank });
    continue;
  }
  const val = h.perRank * rank;
  if (h.stat === 'atk') atk += val;
  else if (h.stat === 'atkPercent') atkPercent += val;
  else if (h.stat === 'atkSpeed') {} // not tracking here
  else if (h.stat === 'dex') dex += val;
  else if (h.stat === 'critChance') critChance += val;
  else if (h.stat === 'critDmg' || h.stat === 'critDamage') critDmg += val;
  else if (h.stat === 'def') def += val;
  else if (h.stat === 'defPercent') defPercent += val;
  else if (h.stat === 'hp') hp += val;
}
console.log(`\n=== After Hunter (flat) ===`);
console.log(`atk=${atk.toFixed(1)} atkPct=${atkPercent.toFixed(1)} dex=${dex.toFixed(1)}`);

// Talents
for (const tree of Object.values(talentsData)) {
  if (!tree.nodes) continue;
  for (const node of tree.nodes) {
    const pts = heroEnh[node.id] || 0;
    if (pts <= 0 || node.isSkill) continue;
    const val = node.perPoint * pts;
    if (node.stat === 'atk') atk += val;
    else if (node.stat === 'dex') dex += val;
    else if (node.stat === 'critChance') critChance += val;
    else if (node.stat === 'critDamage') critDmg += val;
    else if (node.stat === 'def') def += val;
    else if (node.stat === 'hp') hp += val;
  }
}
console.log(`\n=== After Talents ===`);
console.log(`atk=${atk.toFixed(1)} dex=${dex.toFixed(1)}`);

// Gear
const GEAR_MAP = {
  '25f97961-90f6-4f18-9f7b-76e20c54e845': 'Iron Helmet',
  '19d55c7a-3354-4c01-9f7d-8b8a9620066f': 'Iron Chestplate',
  '99528be3-8b4f-4067-88d8-662d72b3d578': 'Iron Gloves',
  'c6d360e1-1c30-454c-bb63-935e67761d8b': 'Iron Boots',
  '36737f24-0684-4744-a032-6feb29cd39dd': 'Steam Belt',
  '4d02a095-fe8b-4a12-a7c3-6d1ef2ab5107': 'Boss Amulet',
  'b62ce843-0d7f-4a03-8680-62545e79a873': 'Nordic Amulet',
  '2c1d48e6-875a-4530-8080-f017bac70e99': 'Mammoth Ring',
  'a30e858e-5429-4c2a-9175-8a6cfd0f5c7a': 'Steel Bow',
  'a2e7e691-4c65-49b5-a7f6-2f512a059b56': 'Iron Pickaxe',
  '8500b653-61a3-42b3-9a60-af782562e9e6': 'Thorium Pickaxe',
  '95fbcc3e-b5f2-48cd-adc7-42a187ae4179': 'Iron Axe',
};
function findItem(name) {
  for (const cat of Object.values(gearData)) {
    for (const sub of Object.values(cat)) {
      if (!Array.isArray(sub)) continue;
      for (const item of sub) { if (item.name === name) return item; }
    }
  }
  return null;
}
for (const [slot, eq] of Object.entries(hero.equipment)) {
  if (!eq?.itemGuid) continue;
  const name = GEAR_MAP[eq.itemGuid];
  if (!name) continue;
  const item = findItem(name);
  if (!item) continue;
  const enhLevel = eq.EnhancementLevel || 0;
  if (item.slot === 'weapon' && item.atk) {
    const enhAtk = Math.round(item.atk * (1 + enhLevel * 0.275) * 10) / 10;
    atk += enhAtk;
    console.log(`  ${name} +${enhLevel} weapon ATK: ${enhAtk}`);
  }
  if (item.def && item.slot !== 'weapon') {
    def += Math.round(item.def * (1 + enhLevel * 0.05) * 10) / 10;
  }
  if (item.stats) {
    for (const [k, v] of Object.entries(item.stats)) {
      if (k === 'atk') { atk += v; console.log(`  ${name} bonus ATK: ${v}`); }
      if (k === 'dex') dex += v;
      if (k === 'critChance') critChance += v;
      if (k === 'critDamage') critDmg += v;
      if (k === 'physDef') def += v;
      if (k === 'hp') hp += v;
    }
  }
}
console.log(`\n=== After Gear ===`);
console.log(`atk=${atk.toFixed(1)} dex=${dex.toFixed(1)} def=${def.toFixed(1)} hp=${hp.toFixed(1)}`);

// PRE runes (3 equipped)
atk += 3 * 30;
console.log(`PRE runes: +90 ATK → atk=${atk.toFixed(1)}`);

// Ash
for (const a of ashData) {
  const rank = progEnh[a.id] || 0;
  if (rank <= 0) continue;
  if (a.perRank.stat === 'atkPercent') atkPercent += a.perRank.value * rank;
  if (a.perRank.stat === 'critDamage') critDmg += a.perRank.value * rank;
  if (a.perRank.stat === 'physDef') def += a.perRank.value * rank;
}

// Flat sacrifices
for (const sac of sacrificesData) {
  const rank = progEnh[sac.id] || 0;
  if (rank <= 0 || sac.isMultiplier) continue;
  if (sac.stat === 'atk') atk += sac.perRank * rank;
  if (sac.stat === 'hp') hp += sac.perRank * rank;
  if (sac.stat === 'def') def += sac.perRank * rank;
}

// Cards (flat)
const allCards = [];
const addCards = (c, th) => { for (const card of c) allCards.push({...card, thresholds: th}); };
addCards(cardsData.act1Cards || [], cardsData.tierThresholds.act1);
addCards(cardsData.act2Cards || [], cardsData.tierThresholds.act2);
addCards(cardsData.act3Cards || [], cardsData.tierThresholds.act3);
const cardMultipliers = [];
for (const card of allCards) {
  const count = cards[card.enemy] || 0;
  if (count <= 0) continue;
  let tier = -1;
  for (let i = 0; i < card.thresholds.length; i++) {
    if (count >= card.thresholds[i]) tier = i;
  }
  if (tier < 0) continue;
  const value = card.tierValues[tier];
  if (value == null) continue;
  if (card.isMultiplier) {
    cardMultipliers.push({ stat: card.stat, value, name: card.enemy });
  } else {
    if (card.stat === 'atk') atk += value;
    if (card.stat === 'critChance') critChance += value;
    if (card.stat === 'critDamage') critDmg += value;
    if (card.stat === 'hp') hp += value;
    if (card.stat === 'def' || card.stat === 'physDef') def += value;
  }
}
console.log(`\n=== Pre-multiplier totals ===`);
console.log(`atk=${atk.toFixed(1)} atkPct=${atkPercent.toFixed(1)} dex=${dex.toFixed(1)} defPct=${defPercent.toFixed(1)}`);
console.log(`critCh=${critChance.toFixed(1)} critDmg=${critDmg.toFixed(1)} def=${def.toFixed(1)} hp=${hp.toFixed(1)}`);

// === Layer 3: Multipliers ===
const dexScale = dex * 0.10 * atk;
atk += dexScale;
console.log(`\nDex scaling: ${dex} × 0.10 × ${(atk - dexScale).toFixed(1)} = +${dexScale.toFixed(1)} → atk=${atk.toFixed(1)}`);

for (const hm of hunterMultipliers) {
  const mult = Math.pow(1 + hm.perRank, hm.rank);
  if (hm.stat === 'atk') {
    const before = atk;
    atk *= mult;
    console.log(`Hunter mult: x${mult.toFixed(4)} → atk ${before.toFixed(1)} → ${atk.toFixed(1)}`);
  }
}

for (const sac of sacrificesData) {
  const rank = progEnh[sac.id] || 0;
  if (rank <= 0 || !sac.isMultiplier) continue;
  const mult = 1 + sac.perRank * rank;
  if (sac.stat === 'atk') {
    const before = atk;
    atk *= mult;
    console.log(`Sacrifice ${sac.name} x${mult.toFixed(2)} → atk ${before.toFixed(1)} → ${atk.toFixed(1)}`);
  }
}

for (const cm of cardMultipliers) {
  if (cm.stat === 'atk') {
    const before = atk;
    atk *= cm.value;
    console.log(`Card ${cm.name} ATK x${cm.value} → atk ${before.toFixed(1)} → ${atk.toFixed(1)}`);
  }
}

// Bonfire buffs (heat ~1450)
// TODO: would add atkPercent here if we knew the heat

// ATK% final
const totalAtk = atk * (1 + atkPercent / 100);
console.log(`\nATK% = ${atkPercent.toFixed(1)}% → ${atk.toFixed(1)} × ${(1 + atkPercent/100).toFixed(3)} = ${totalAtk.toFixed(2)}`);

// DEF% final
const totalDef = def * (1 + defPercent / 100);

console.log(`\n========== COMPARISON ==========`);
console.log(`           OURS         GAME         GAP`);
console.log(`ATK:       ${totalAtk.toFixed(0).padStart(8)}     ${54069}     ${(54069 - totalAtk).toFixed(0)} (${((54069 - totalAtk)/54069*100).toFixed(1)}%)`);
console.log(`CritCh:    ${critChance.toFixed(1).padStart(8)}     ${38.2}`);
console.log(`CritDmg:   ${critDmg.toFixed(1).padStart(8)}     ${290}`);
console.log(`DEF:       ${totalDef.toFixed(1).padStart(8)}     ${442.67}`);
console.log(`HP:        ${hp.toFixed(0).padStart(8)}     ${3478}`);
