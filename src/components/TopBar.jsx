import { profiles, activeProfileKey, activeProfile, setActiveProfile, theme, setTheme, lightMode, setLightMode } from '../state/store.js';
import { loadSaveFile } from '../state/save-decoder.js';
import { importProfiles } from '../state/store.js';

export function TopBar() {
  const profile = activeProfile.value;
  const allProfiles = profiles.value;
  const profileKeys = Object.keys(allProfiles);

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.sav';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const extracted = await loadSaveFile(file);
        importProfiles(extracted);
      } catch (err) {
        alert('Failed to decode save file: ' + err.message);
      }
    };
    input.click();
  }

  function handleShare() {
    const data = JSON.stringify(activeProfile.value);
    const encoded = btoa(unescape(encodeURIComponent(data)));
    const url = `${location.origin}${location.pathname}#b=${encoded}`;
    navigator.clipboard.writeText(url).then(() => alert('Build link copied!'));
  }

  function handleThemeToggle() {
    setLightMode(!lightMode.value);
  }

  return (
    <header class="top-bar">
      <div class="top-bar-left">
        <h1 class="top-bar-title">EvitaniaCalc</h1>
        <span class="top-bar-version">v2.0.0</span>
      </div>
      <div class="top-bar-right">
        <button class="btn btn-sm btn-import" onClick={handleImport}>Import Save</button>
        {profileKeys.length > 0 && (
          <select
            class="profile-select"
            value={activeProfileKey.value}
            onChange={(e) => setActiveProfile(e.target.value)}
          >
            {profileKeys.map((key) => {
              const p = allProfiles[key];
              return (
                <option key={key} value={key}>
                  {p.name} ({p.class} {p.level})
                </option>
              );
            })}
          </select>
        )}
        <button class="btn btn-sm btn-share" onClick={handleShare}>Share</button>
        <button class="btn btn-sm btn-theme" onClick={handleThemeToggle}>
          {lightMode.value ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
