import { activeProfile } from '../state/store.js';

const GEAR_SLOTS = [
  { id: 'helmet', label: 'Helmet' },
  { id: 'chest', label: 'Chest' },
  { id: 'gloves', label: 'Gloves' },
  { id: 'boots', label: 'Boots' },
  { id: 'belt', label: 'Belt' },
  { id: 'amulet', label: 'Amulet' },
  { id: 'ring', label: 'Ring' },
  { id: 'weapon', label: 'Weapon' },
  { id: 'axe', label: 'Axe' },
  { id: 'pickaxe', label: 'Pickaxe' },
];

export function GearStrip({ onSlotClick }) {
  const gear = activeProfile.value.gear || {};

  return (
    <div class="gear-strip">
      <div class="gear-strip__label">Equipped Gear</div>
      <div class="gear-strip__slots">
        {GEAR_SLOTS.map((slot) => {
          const item = gear[slot.id];
          const equipped = !!(item && item.name);
          return (
            <div
              key={slot.id}
              class={`gear-slot ${equipped ? 'gear-slot--equipped' : 'gear-slot--empty'}`}
              onClick={() => onSlotClick && onSlotClick(slot.id)}
              title={slot.label}
            >
              <span class="gear-slot__name">{equipped ? item.name : slot.label}</span>
              {equipped && item.enhancementLevel > 0 && (
                <span class="gear-slot__badge">+{item.enhancementLevel}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
