import { useState, useEffect, useRef } from 'preact/hooks';
import { activeTab } from '../state/store.js';

// Top-level nav: standalone tabs and grouped dropdowns. Groups exist when the
// tab count exceeds horizontal space; the alternative was a sidebar or "More ▾"
// catch-all, both of which lose the discoverability of seeing every category
// upfront.
const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  {
    group: 'Character',
    items: [
      { id: 'gear', label: 'Gear Planner' },
      { id: 'skills', label: 'Skill Trees' },
      { id: 'cards', label: 'Cards' },
      { id: 'runes', label: 'Rune Planner' },
      { id: 'engineer', label: 'Engineer' },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { id: 'storage', label: 'Storage' },
      { id: 'crafting', label: 'Crafting' },
    ],
  },
  {
    group: 'Planning',
    items: [
      { id: 'advisor', label: 'Upgrade Advisor' },
      { id: 'progression', label: 'Progression' },
      { id: 'alt-advisor', label: 'Alt Advisor' },
    ],
  },
  { id: 'dps', label: 'DPS Sim' },
];

export function TabNav() {
  const [openGroup, setOpenGroup] = useState(null);
  // Anchor coords for the open dropdown. We render with position:fixed so the
  // popover escapes .tab-nav's overflow:auto clipping (which would otherwise
  // hide the menu on narrow screens where horizontal scroll is enabled).
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
  const navRef = useRef(null);

  // Close the open dropdown when the user clicks anywhere outside the nav.
  useEffect(() => {
    if (!openGroup) return;
    const onDocClick = (e) => {
      if (!navRef.current?.contains(e.target)) setOpenGroup(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openGroup]);

  // Close on Escape too — common dropdown affordance, matches user expectation.
  useEffect(() => {
    if (!openGroup) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpenGroup(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openGroup]);

  const toggleGroup = (groupName, ev) => {
    if (openGroup === groupName) {
      setOpenGroup(null);
      return;
    }
    const rect = ev.currentTarget.getBoundingClientRect();
    setMenuPos({ left: rect.left, top: rect.bottom });
    setOpenGroup(groupName);
  };

  const selectTab = (id) => {
    activeTab.value = id;
    setOpenGroup(null);
  };

  return (
    <nav class="tab-nav" ref={navRef}>
      {NAV.map((entry) => {
        if (entry.group) {
          const groupActive = entry.items.some((i) => i.id === activeTab.value);
          const isOpen = openGroup === entry.group;
          return (
            <div class="tab-group" key={entry.group}>
              <button
                class={`tab-btn tab-btn--group ${groupActive ? 'active' : ''} ${isOpen ? 'tab-btn--open' : ''}`}
                onClick={(e) => toggleGroup(entry.group, e)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
              >
                {entry.group}<span class="tab-btn__chevron">▾</span>
              </button>
              {isOpen && (
                <div
                  class="tab-group__menu"
                  role="menu"
                  style={{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }}
                >
                  {entry.items.map((item) => (
                    <button
                      key={item.id}
                      role="menuitem"
                      class={`tab-group__item ${activeTab.value === item.id ? 'active' : ''}`}
                      onClick={() => selectTab(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <button
            key={entry.id}
            class={`tab-btn ${activeTab.value === entry.id ? 'active' : ''}`}
            onClick={() => selectTab(entry.id)}
          >
            {entry.label}
          </button>
        );
      })}
    </nav>
  );
}
