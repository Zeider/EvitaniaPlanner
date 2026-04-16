const TYPE_COLORS = {
  hunter: { bg: 'rgba(200,100,255,0.15)', color: '#c8f' },
  gear: { bg: 'rgba(100,100,255,0.15)', color: '#aaf' },
  talent: { bg: 'rgba(100,200,100,0.15)', color: '#8f8' },
  ash: { bg: 'rgba(255,150,50,0.15)', color: '#fa8' },
  sacrifice: { bg: 'rgba(255,100,100,0.15)', color: '#f88' },
};

function formatNumber(n) {
  if (n === Infinity) return '\u221e';
  if (n === -Infinity) return '-\u221e';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  if (Math.abs(n) >= 10) return n.toFixed(1);
  if (Math.abs(n) >= 1) return n.toFixed(2);
  if (n === 0) return '0';
  if (Math.abs(n) >= 0.01) return n.toFixed(3);
  return n.toExponential(1);
}

function formatCost(materialCost) {
  if (!materialCost || Object.keys(materialCost).length === 0) return 'Free';
  return Object.entries(materialCost)
    .map(([mat, qty]) => `${qty} ${mat}`)
    .join(', ');
}

function formatFarmTime(hours) {
  if (hours <= 0) return 'Free';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  return `${hours.toFixed(1)}h`;
}

export function UpgradeRow({ rank, upgrade }) {
  const typeStyle = TYPE_COLORS[upgrade.type] || { bg: 'rgba(128,128,128,0.15)', color: '#aaa' };

  return (
    <tr class="upgrade-row">
      <td class="upgrade-row__rank">{rank}</td>
      <td class="upgrade-row__name">{upgrade.name}</td>
      <td>
        <span
          class="upgrade-row__badge"
          style={{ background: typeStyle.bg, color: typeStyle.color }}
        >
          {upgrade.type}
        </span>
      </td>
      <td class="upgrade-row__num">{formatNumber(upgrade.powerDelta)}</td>
      <td class="upgrade-row__cost">{formatCost(upgrade.materialCost)}</td>
      <td class="upgrade-row__num">{formatFarmTime(upgrade.farmTimeHours)}</td>
      <td class="upgrade-row__num upgrade-row__score">
        {formatNumber(upgrade.score)}
      </td>
    </tr>
  );
}
