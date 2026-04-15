import { activeProfile } from '../state/store.js';

const GEAR_SLOTS = ['Helmet', 'Chest', 'Gloves', 'Boots', 'Belt', 'Amulet', 'Ring', 'Weapon1', 'Axe', 'Pickaxe'];

export function GearStrip({ onSlotClick }) {
  const gear = activeProfile.value.gear || {};

  return (
    <div class="gear-strip">
      <div class="gear-strip__label">Equipped Gear</div>
      <div class="gear-strip__slots">
        {GEAR_SLOTS.map((slot) => {
          const item = gear[slot];
          const equipped = !!item;
          return (
            <div
              key={slot}
              class={`gear-slot ${equipped ? 'gear-slot--equipped' : 'gear-slot--empty'}`}
              onClick={() => onSlotClick && onSlotClick(slot)}
              title={slot}
            >
              <span class="gear-slot__name">{equipped ? item.name || slot : slot}</span>
              {equipped && item.enhancement > 0 && (
                <span class="gear-slot__badge">+{item.enhancement}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
