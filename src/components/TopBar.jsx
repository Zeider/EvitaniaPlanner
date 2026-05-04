import { profiles, activeProfileKey, activeProfile, setActiveProfile, theme, setTheme, lightMode, setLightMode, activeTab } from '../state/store.js';
import { loadSaveFile } from '../state/save-decoder.js';
import { importProfiles } from '../state/store.js';
import { version } from '../../package.json';

export function TopBar() {
  const profile = activeProfile.value;
  const allProfiles = profiles.value;
  const profileKeys = Object.keys(allProfiles);

  const SAVE_PATH = '%AppData%\\..\\LocalLow\\Fireblast Studios\\Evitania Online - Idle RPG';

  function handleCopyPath() {
    navigator.clipboard.writeText(SAVE_PATH).then(() => alert('Save file path copied! Paste it into the file picker address bar.'));
  }

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

  // Open GitHub's "new issue" page with a prefilled template carrying enough
  // context to triage without a back-and-forth (planner version, browser, the
  // tab the user was on, whether they had a profile loaded). We deliberately
  // don't include any save-file contents — that would leak character state
  // into a public issue tracker without the user's explicit consent.
  function handleReportIssue() {
    const tab = activeTab.value || '(unknown)';
    const profileLoaded = activeProfileKey.value ? `yes — class ${activeProfile.value?.class || '?'}, level ${activeProfile.value?.level ?? '?'}` : 'no';
    const ua = navigator.userAgent;
    const title = `[v${version}] `;
    const body = [
      `**Planner version:** v${version}`,
      `**Active tab:** \`${tab}\``,
      `**Profile loaded:** ${profileLoaded}`,
      `**Browser:** ${ua}`,
      '',
      '## What were you doing?',
      '<!-- e.g. "Picking Infinite I Set in the Progression tab" -->',
      '',
      '## What happened?',
      '<!-- What you saw — paste a screenshot if useful -->',
      '',
      '## What did you expect?',
      '<!-- What should have happened instead -->',
    ].join('\n');
    const url = `https://github.com/Zeider/EvitaniaPlanner/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <header class="top-bar">
      <div class="top-bar-left">
        <h1 class="top-bar-title">EvitaniaPlanner</h1>
        <span class="top-bar-version">v{version}</span>
      </div>
      <div class="top-bar-right">
        <button class="btn btn-sm btn-import" onClick={handleImport}>Import Save</button>
        <button class="btn btn-sm btn-path" onClick={handleCopyPath} title={SAVE_PATH}>Copy Path</button>
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
        <button
          class={`btn btn-sm btn-release-notes ${activeTab.value === 'release-notes' ? 'active' : ''}`}
          onClick={() => { activeTab.value = 'release-notes'; }}
          title="Release Notes"
        >
          Release Notes
        </button>
        <button class="btn btn-sm btn-report" onClick={handleReportIssue} title="Open GitHub issue with prefilled diagnostic context">
          Report Issue
        </button>
        <button class="btn btn-sm btn-theme" onClick={handleThemeToggle}>
          {lightMode.value ? '🌙' : '☀️'}
        </button>
        <a
          href="https://ko-fi.com/zeider"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-sm btn-support"
        >
          Support
        </a>
      </div>
    </header>
  );
}
