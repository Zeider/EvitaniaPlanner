import { activeProfile, activeProfileKey } from '../state/store.js';

function shortGuid(guid) {
  return guid ? guid.slice(0, 8) : '';
}

// Resource buckets, ordered top-to-bottom. The classifier walks predicates
// in declaration order and assigns the first match — so put more specific
// patterns above broader ones (e.g. event items above ore/bar materials).
const RESOURCE_CATEGORIES = [
  { id: 'cards', label: 'Cards', match: (n) => n.endsWith(' card') || n === 'card part' || n === 'tree toy' },
  { id: 'fragments', label: 'Rune Fragments', match: (n, raw) => /^[A-Z]{2,4}$/.test(raw) },
  { id: 'hourglass', label: 'Time Items', match: (n) => n.includes('hourglass') },
  { id: 'brews', label: 'Brews & Potions', match: (n) => n.includes('brew') || n.includes('potion') || n.includes('soda') || n.includes('reset') || n.includes('scroll of') },
  { id: 'boss', label: 'Boss Drops & Keys', match: (n) => n.endsWith(' soul') || n.endsWith(' horn') || n.endsWith(' eye') || n.endsWith(' key') || /'s (key|flower|feather|liquid|petal|powder)/.test(n) || n.includes('bitusk') || n === 'jötunn eye' || n === "maevath's horn" || n.endsWith(' soul') || n.endsWith(' bitusk') },
  { id: 'pets', label: 'Pet Items', match: (n) => n.endsWith(' pet') || n.includes('pet snack') || n.includes('pet storage') || n.endsWith(' unlock') },
  { id: 'event', label: 'Event Items', match: (n) => /(christmas|halloween|easter|valentine|summer|anniversary|thanksgiving|jolly|spooky|romantic|firework|1k installs|fez fez)/.test(n) },
  { id: 'stones', label: 'Stones', match: (n) => n.includes('stone') || n === 'failsafe' },
  { id: 'materials', label: 'Raw Materials', match: (n) => n.endsWith(' ore') || n.endsWith(' bar') || n.endsWith(' log') || ['mithril', 'cryolite', 'goak', 'thread', 'thorium', 'sunstone', 'stone'].includes(n) },
  { id: 'reagents', label: 'Essences & Reagents', match: (n) => n.endsWith(' essence') || n.endsWith(' feather') || n.endsWith(' liquid') || n.endsWith(' petal') || n.endsWith(' powder') || n.includes('crystal') || n.endsWith(' shards') },
  { id: 'currency', label: 'Currencies & Tokens', match: (n) => /(coin|snowflake|aether|rename feather|town teleport)/.test(n) },
  { id: 'unlocks', label: 'Storage Unlocks', match: (n) => n === 'stash space' || n === 'inventory space' || n.includes('storage') },
  { id: 'other', label: 'Other', match: () => true },
];

function categorizeResource(item) {
  const raw = item.name || '';
  const n = raw.toLowerCase();
  for (const cat of RESOURCE_CATEGORIES) {
    if (cat.match(n, raw)) return cat.id;
  }
  return 'other';
}

function StashSection({ title, items, columns }) {
  if (items.length === 0) {
    return (
      <section class="storage__section">
        <h2 class="storage__section-title">{title}</h2>
        <p class="storage__empty">No {title.toLowerCase()} in storage.</p>
      </section>
    );
  }
  return (
    <section class="storage__section">
      <h2 class="storage__section-title">{title} ({items.length})</h2>
      <table class="storage__table">
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.guid + ':' + (item.enhancementLevel || 0)}>
              {columns.map((c) => <td key={c.key}>{c.render(item)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function Storage() {
  const profile = activeProfile.value;

  if (!activeProfileKey.value) {
    return (
      <div class="storage">
        <p class="storage__empty">Import a save file or create a profile to view your storage.</p>
      </div>
    );
  }

  const stash = profile.stash || { items: [], slotsOpened: 0, totalSlots: 0 };
  const gear = stash.items.filter((i) => i.isGear);
  const resources = stash.items.filter((i) => !i.isGear);

  gear.sort((a, b) => (b.enhancementLevel - a.enhancementLevel) || (a.name || '').localeCompare(b.name || ''));
  resources.sort((a, b) => b.amount - a.amount);

  // Bucket resources by category; preserve amount-descending order within each.
  const byCategory = new Map();
  for (const item of resources) {
    const cat = categorizeResource(item);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(item);
  }

  const resourceColumns = [
    { key: 'name', label: 'Name', render: (i) => i.name || <code>{shortGuid(i.guid)}…</code> },
    { key: 'amount', label: 'Amount', render: (i) => i.amount.toLocaleString() },
  ];

  return (
    <div class="storage">
      <section class="storage__summary">
        <div>
          <strong>{stash.items.length}</strong> items across <strong>{stash.slotsOpened}</strong> opened slots
          {stash.totalSlots > stash.slotsOpened && <> (of <strong>{stash.totalSlots}</strong> total)</>}
        </div>
      </section>

      <StashSection
        title="Gear"
        items={gear}
        columns={[
          { key: 'name', label: 'Name', render: (i) => i.name || <code>{shortGuid(i.guid)}…</code> },
          { key: 'enh', label: 'Enhance', render: (i) => `+${i.enhancementLevel}` },
          { key: 'dur', label: 'Durability', render: (i) => i.durability },
        ]}
      />

      {RESOURCE_CATEGORIES.map((cat) => {
        const items = byCategory.get(cat.id);
        if (!items || items.length === 0) return null;
        return (
          <StashSection
            key={cat.id}
            title={cat.label}
            items={items}
            columns={resourceColumns}
          />
        );
      })}
    </div>
  );
}
