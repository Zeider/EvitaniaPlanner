/**
 * TreeNode — a single talent-tree node rendered as a clickable box.
 *
 * Visual states:
 *  1. maxed   — green solid border (points >= maxPoints)
 *  2. partial — amber solid border (0 < points < maxPoints)
 *  3. available — blue dashed border (points === 0, prereqs met)
 *  4. locked  — faded, low opacity (points === 0, prereqs NOT met)
 *  5. classUnlock — special gradient, larger (id starts with "class_")
 *  6. recommended — purple glow (best power-per-point among available nodes)
 */

export function TreeNode({ node, points, state, isRecommended, isSelected, onClick, onRightClick }) {
  const stateClass = `tree-node--${state}`;
  const selectedClass = isSelected ? 'tree-node--selected' : '';
  const recommendedClass = isRecommended ? 'tree-node--recommended' : '';

  return (
    <div
      class={`tree-node ${stateClass} ${selectedClass} ${recommendedClass}`}
      onClick={onClick}
      onContextMenu={(e) => { e.preventDefault(); onRightClick?.(); }}
      title={`${node.name} (${points}/${node.maxPoints})`}
    >
      <div class="tree-node__name">{node.name}</div>
      <div class="tree-node__stat">{formatBonusShort(node)}</div>
      <div class="tree-node__points">{points}/{node.maxPoints}</div>
    </div>
  );
}

function formatBonusShort(node) {
  if (!node.stat) return '?';

  const statNames = {
    atk: 'ATK', hp: 'HP', def: 'DEF', critChance: 'CritCh', critDamage: 'CritDMG',
    atkSpeed: 'ATKSPD', moveSpeed: 'MvSpd', magicFind: 'MF', mana: 'Mana', manaRegen: 'ManaRg',
    str: 'STR', dex: 'DEX', int: 'INT', con: 'CON', men: 'MEN', bonusXp: 'BonusXP',
    accuracy: 'Acc', miningPower: 'MinPwr', wcPower: 'WCPwr',
    miningPowerPercent: 'MinPwr%', wcPowerPercent: 'WCPwr%',
    miningProficiency: 'MinProf', wcProficiency: 'WCProf',
    miningMultiloot: 'MinML', wcMultiloot: 'WCML',
    miningCritChance: 'MinCrit', wcCritChance: 'WCCrit',
    miningCritDamage: 'MinCrDmg', wcCritDamage: 'WCCrDmg',
    miningSpeed: 'MinSpd', wcSpeed: 'WCSpd',
    miningXp: 'MinXP', wcXp: 'WCXP',
    miningDamagePerLevel: 'MinDmg/Lv', wcDamagePerLevel: 'WCDmg/Lv',
  };

  // Skill nodes don't have numeric stat bonuses
  if (node.isSkill) return 'Skill';

  const name = statNames[node.stat] || node.stat;
  const val = node.perPoint >= 1 ? `+${node.perPoint}` : `+${node.perPoint}`;
  return `${name} ${val}`;
}
