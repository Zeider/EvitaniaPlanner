import { activeProfile, activeProfileKey } from '../state/store.js';

function shortGuid(guid) {
  return guid ? guid.slice(0, 8) : '';
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

  // Sort gear by enhancement descending, then name. Resources by amount descending.
  gear.sort((a, b) => (b.enhancementLevel - a.enhancementLevel) || (a.name || '').localeCompare(b.name || ''));
  resources.sort((a, b) => b.amount - a.amount);

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

      <StashSection
        title="Resources"
        items={resources}
        columns={[
          { key: 'name', label: 'Name', render: (i) => i.name || <code>{shortGuid(i.guid)}…</code> },
          { key: 'amount', label: 'Amount', render: (i) => i.amount.toLocaleString() },
        ]}
      />
    </div>
  );
}
