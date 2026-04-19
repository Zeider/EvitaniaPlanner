import { signal } from '@preact/signals';
import { useState, useRef, useEffect, useCallback, useMemo } from 'preact/hooks';
import { activeProfile, saveProfile, activeProfileKey } from '../state/store.js';
import { computeStats, computeEffectiveDPS } from '../state/stat-engine.js';
import { TreeNode } from '../components/TreeNode.jsx';
import talentsData from '../data/talents.json';
import professionsData from '../data/professions.json';
import enemies from '../data/enemies.json';

/* ── Constants ───────────────────────────────────── */

const TREE_TABS = [
  { id: 'novice', label: 'Novice', type: 'combat' },
  { id: 'warrior', label: 'Warrior', type: 'combat' },
  { id: 'rogue', label: 'Rogue', type: 'combat' },
  { id: 'mage', label: 'Mage', type: 'combat' },
  { id: 'mining', label: 'Mining', type: 'profession' },
  { id: 'woodcutting', label: 'Woodcutting', type: 'profession' },
];

const BUILD_MODES = ['custom', 'levelling', 'farming'];

const CLASS_TO_TREE = { warrior: 'warrior', rogue: 'rogue', mage: 'mage' };

/* ── Levelling mode priority (stat name -> priority, lower = first) */
const LEVELLING_PRIORITY = { bonusXp: 0, atk: 1, atkSpeed: 2, moveSpeed: 3 };

/* ── Farming mode priority */
const FARMING_PRIORITY = { magicFind: 0, goldMulti: 1, mobSpawnReduction: 2, atk: 3, critDamage: 4, critDmg: 4 };

/* ── Profession farming priority (stat substring matching) */
const PROFESSION_FARMING_PRIORITY = ['Multiloot', 'Power', 'Speed', 'Crit'];

/* ── Helpers ──────────────────────────────────────── */

function getAllTrees() {
  return { ...talentsData, ...professionsData };
}

function getTreeData(treeId) {
  const all = getAllTrees();
  return all[treeId] || null;
}

/** Group nodes by row (used as horizontal tiers/columns in the UI). */
function groupByRow(nodes) {
  const groups = {};
  for (const node of nodes) {
    const row = node.row ?? 0;
    if (!groups[row]) groups[row] = [];
    groups[row].push(node);
  }
  // Sort columns within each row by col
  for (const row of Object.values(groups)) {
    row.sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
  }
  return groups;
}

/** Check whether prerequisite nodes are met.
 *  If tree has explicit connections, a node's prereqs are all nodes that connect TO it.
 *  Otherwise falls back to "all nodes in previous row must be maxed." */
function arePrereqsMet(node, allocation, tree) {
  // Row 0 / first nodes are always available
  if ((node.row ?? 0) === 0) return true;

  if (tree.connections && tree.connections.length > 0) {
    // Find all parent nodes (connections where this node is the target)
    const parents = tree.connections
      .filter(([, toId]) => toId === node.id)
      .map(([fromId]) => tree.nodes.find(n => n.id === fromId))
      .filter(Boolean);
    // If no parents listed, it's reachable (leaf with no explicit prereq)
    if (parents.length === 0) return true;
    // At least one parent must be maxed
    return parents.some(p => (allocation[p.id] || 0) >= p.maxPoints);
  }

  // Fallback: all nodes in previous row must be maxed
  const prevRow = (node.row ?? 0) - 1;
  const prevNodes = tree.nodes.filter(n => (n.row ?? 0) === prevRow);
  if (prevNodes.length === 0) return true;
  return prevNodes.every(n => (allocation[n.id] || 0) >= n.maxPoints);
}

/** Determine the visual state of a node. */
function getNodeState(node, points, allocation, tree) {
  if (node.id.startsWith('class_')) return 'classUnlock';
  if (points >= node.maxPoints) return 'maxed';
  if (points > 0) return 'partial';
  if (arePrereqsMet(node, allocation, tree)) return 'available';
  return 'locked';
}

/** Count total allocated points across a set of nodes. */
function countUsedPoints(allocation, nodes) {
  let total = 0;
  for (const node of nodes) {
    total += allocation[node.id] || 0;
  }
  return total;
}

/** Count max possible points for a tree. */
function countMaxPoints(tree) {
  if (tree.maxPoints) return tree.maxPoints;
  let total = 0;
  for (const node of tree.nodes) {
    total += node.maxPoints;
  }
  return total;
}

/** Compute stat totals from current allocation in a single tree. */
function computeTreeStats(tree, allocation) {
  const stats = {};
  for (const node of tree.nodes) {
    const pts = allocation[node.id] || 0;
    if (pts <= 0 || node.isSkill) continue;
    const stat = node.stat;
    stats[stat] = (stats[stat] || 0) + node.perPoint * pts;
  }
  return stats;
}

/** Find first enemy for DPS calculations. */
function getDefaultEnemy() {
  for (const act of Object.values(enemies)) {
    if (act.zones && act.zones.length > 0) return act.zones[0];
  }
  return { hp: 100, atk: 10, evasion: 0 };
}

/** Build a profile variant with a modified talent allocation for DPS comparison. */
function profileWithTalents(profile, allocation, isProfession) {
  if (isProfession) {
    return { ...profile, professionSkills: { ...profile.professionSkills, ...allocation } };
  }
  return { ...profile, talents: { ...profile.talents, ...allocation } };
}

/** Stat display names for the sidebar. */
const STAT_DISPLAY = {
  atk: 'ATK', hp: 'HP', def: 'DEF', critChance: 'Crit Chance', critDamage: 'Crit DMG',
  atkSpeed: 'ATK Speed', moveSpeed: 'Move Speed', magicFind: 'Magic Find',
  mana: 'Mana', manaRegen: 'Mana Regen', str: 'STR', dex: 'DEX', int: 'INT',
  con: 'CON', men: 'MEN', bonusXp: 'Bonus XP', accuracy: 'Accuracy',
  miningPower: 'Mining Pwr', wcPower: 'WC Pwr',
  miningPowerPercent: 'Mining Pwr%', wcPowerPercent: 'WC Pwr%',
  miningProficiency: 'Mining Prof', wcProficiency: 'WC Prof',
  miningMultiloot: 'Mining ML', wcMultiloot: 'WC ML',
  miningCritChance: 'Mining Crit', wcCritChance: 'WC Crit',
  miningCritDamage: 'Mining CrDmg', wcCritDamage: 'WC CrDmg',
  miningSpeed: 'Mining Speed', wcSpeed: 'WC Speed',
  miningXp: 'Mining XP', wcXp: 'WC XP',
  miningDamagePerLevel: 'Mining Dmg/Lv', wcDamagePerLevel: 'WC Dmg/Lv',
};

/** Auto-allocate for levelling mode. */
function autoAllocateLevelling(tree, maxPts) {
  const alloc = {};
  let remaining = maxPts;
  // Sort nodes by priority then by row
  const sorted = [...tree.nodes].filter(n => !n.isSkill).sort((a, b) => {
    const pa = LEVELLING_PRIORITY[a.stat] ?? 99;
    const pb = LEVELLING_PRIORITY[b.stat] ?? 99;
    if (pa !== pb) return pa - pb;
    return (a.row ?? 0) - (b.row ?? 0);
  });
  // Greedy fill
  for (const node of sorted) {
    if (remaining <= 0) break;
    const pts = Math.min(node.maxPoints, remaining);
    alloc[node.id] = pts;
    remaining -= pts;
  }
  return alloc;
}

/** Auto-allocate for farming mode. */
function autoAllocateFarming(tree, maxPts, isProfession) {
  const alloc = {};
  let remaining = maxPts;

  let sorted;
  if (isProfession) {
    sorted = [...tree.nodes].filter(n => !n.isSkill).sort((a, b) => {
      const pa = getProfessionFarmingPriority(a.stat);
      const pb = getProfessionFarmingPriority(b.stat);
      if (pa !== pb) return pa - pb;
      return (a.row ?? 0) - (b.row ?? 0);
    });
  } else {
    sorted = [...tree.nodes].filter(n => !n.isSkill).sort((a, b) => {
      const pa = FARMING_PRIORITY[a.stat] ?? 99;
      const pb = FARMING_PRIORITY[b.stat] ?? 99;
      if (pa !== pb) return pa - pb;
      return (a.row ?? 0) - (b.row ?? 0);
    });
  }

  for (const node of sorted) {
    if (remaining <= 0) break;
    const pts = Math.min(node.maxPoints, remaining);
    alloc[node.id] = pts;
    remaining -= pts;
  }
  return alloc;
}

function getProfessionFarmingPriority(stat) {
  const s = stat.toLowerCase();
  for (let i = 0; i < PROFESSION_FARMING_PRIORITY.length; i++) {
    if (s.includes(PROFESSION_FARMING_PRIORITY[i].toLowerCase())) return i;
  }
  return 99;
}

/** Find the recommended next node: highest power-per-point among available nodes. */
function findRecommendedNode(tree, allocation, profile, isProfession) {
  const enemy = getDefaultEnemy();
  const baseStats = computeStats(profileWithTalents(profile, allocation, isProfession));
  const baseDPS = computeEffectiveDPS(baseStats, enemy);

  let bestNode = null;
  let bestGain = 0;

  for (const node of tree.nodes) {
    const pts = allocation[node.id] || 0;
    if (pts >= node.maxPoints) continue;
    if (node.isSkill) continue;
    const state = getNodeState(node, pts, allocation, tree);
    if (state === 'locked') continue;

    // Compute DPS with +1 point
    const testAlloc = { ...allocation, [node.id]: pts + 1 };
    const testStats = computeStats(profileWithTalents(profile, testAlloc, isProfession));
    const testDPS = computeEffectiveDPS(testStats, enemy);
    const gain = testDPS - baseDPS;

    if (gain > bestGain) {
      bestGain = gain;
      bestNode = node;
    }
  }
  return bestNode?.id || null;
}

/** Format a number compactly. */
function fmt(n) {
  if (n == null || isNaN(n)) return '0';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(1);
}

/* ── SVG Connection Lines ────────────────────────── */

const NODE_W = 100;
const NODE_H = 64;
const COL_GAP = 32;
const ROW_GAP = 12;

function computeNodePosition(node, maxCols) {
  const tierX = (node.row ?? 0) * (NODE_W + COL_GAP);
  const tierY = (node.col ?? 0) * (NODE_H + ROW_GAP);
  return { x: tierX, y: tierY };
}

function ConnectionLines({ tree, allocation }) {
  if (!tree || !tree.nodes || tree.nodes.length === 0) return null;

  const maxRow = Math.max(...tree.nodes.map(n => n.row ?? 0));
  const maxCol = Math.max(...tree.nodes.map(n => n.col ?? 0));

  const svgW = (maxRow + 1) * (NODE_W + COL_GAP);
  const svgH = (maxCol + 1) * (NODE_H + ROW_GAP);

  const lines = [];

  // Build node lookup by ID for connection rendering
  const nodeById = {};
  for (const node of tree.nodes) {
    nodeById[node.id] = node;
  }

  // Use explicit connections from data if available, otherwise fall back to row-based
  const connectionPairs = [];
  if (tree.connections && tree.connections.length > 0) {
    for (const [fromId, toId] of tree.connections) {
      if (nodeById[fromId] && nodeById[toId]) {
        connectionPairs.push([nodeById[fromId], nodeById[toId]]);
      }
    }
  } else {
    // Fallback: connect each node to all nodes in previous row
    const byRow = {};
    for (const node of tree.nodes) {
      const r = node.row ?? 0;
      if (!byRow[r]) byRow[r] = [];
      byRow[r].push(node);
    }
    for (const node of tree.nodes) {
      const row = node.row ?? 0;
      if (row === 0) continue;
      const prevNodes = byRow[row - 1] || [];
      for (const prevNode of prevNodes) {
        connectionPairs.push([prevNode, node]);
      }
    }
  }

  const INTRA_BRACKET_OFFSET = 10;

  for (const [fromNode, toNode] of connectionPairs) {
    const prevPos = computeNodePosition(fromNode);
    const pos = computeNodePosition(toNode);

    const sameTier = (fromNode.row ?? 0) === (toNode.row ?? 0);

    const prevAllocated = (allocation[fromNode.id] || 0) > 0;
    const nodeAllocated = (allocation[toNode.id] || 0) > 0;
    const bothAllocated = prevAllocated && nodeAllocated;
    const eitherAllocated = prevAllocated || nodeAllocated;

    const stroke = bothAllocated ? '#8f8' : eitherAllocated ? '#8af' : '#667';
    const strokeWidth = bothAllocated ? 3 : 2;
    const dash = bothAllocated ? 'none' : eitherAllocated ? '6 3' : '4 4';
    const opacity = bothAllocated ? 0.9 : eitherAllocated ? 0.6 : 0.4;
    const key = `${fromNode.id}-${toNode.id}`;

    if (sameTier) {
      // Intra-tier: draw as a bracket "]" on the right side of the column so it's visible
      const rightEdge = prevPos.x + NODE_W;
      const bracketX = rightEdge + INTRA_BRACKET_OFFSET;
      const yA = prevPos.y + NODE_H / 2;
      const yB = pos.y + NODE_H / 2;
      const points = `${rightEdge},${yA} ${bracketX},${yA} ${bracketX},${yB} ${rightEdge},${yB}`;

      if (bothAllocated) {
        lines.push(
          <polyline
            key={`glow-${key}`}
            points={points}
            fill="none"
            stroke="#8f8"
            stroke-width={6}
            opacity={0.15}
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        );
      }
      lines.push(
        <polyline
          key={key}
          points={points}
          fill="none"
          stroke={stroke}
          stroke-width={strokeWidth}
          stroke-dasharray={dash}
          opacity={opacity}
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      );
    } else {
      const x1 = prevPos.x + NODE_W;
      const y1 = prevPos.y + NODE_H / 2;
      const x2 = pos.x;
      const y2 = pos.y + NODE_H / 2;

      if (bothAllocated) {
        lines.push(
          <line
            key={`glow-${key}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#8f8"
            stroke-width={6}
            opacity={0.15}
            stroke-linecap="round"
          />
        );
      }
      lines.push(
        <line
          key={key}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke}
          stroke-width={strokeWidth}
          stroke-dasharray={dash}
          opacity={opacity}
          stroke-linecap="round"
        />
      );
    }
  }

  return (
    <svg class="tree-svg-overlay" width={svgW} height={svgH} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
      {lines}
    </svg>
  );
}

/* ── Main Component ──────────────────────────────── */

export function SkillTrees() {
  const profile = activeProfile.value;
  const isProfessionTree = (id) => id === 'mining' || id === 'woodcutting';

  // Auto-select class tree based on profile
  const defaultTree = CLASS_TO_TREE[profile.class] || 'novice';
  const [activeTree, setActiveTree] = useState(defaultTree);
  const [buildMode, setBuildMode] = useState('custom');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Local allocation state, initialized from profile
  const [allocation, setAllocation] = useState(() => {
    const combined = { ...profile.talents, ...profile.professionSkills };
    return combined;
  });

  // Persist allocation changes back to the profile
  useEffect(() => {
    if (buildMode !== 'custom') return;
    const talents = {};
    const professionSkills = {};
    for (const [key, val] of Object.entries(allocation)) {
      if (key.startsWith('profession_')) {
        professionSkills[key] = val;
      } else {
        talents[key] = val;
      }
    }
    const currentProfile = activeProfile.value;
    const talentsChanged = JSON.stringify(talents) !== JSON.stringify(currentProfile.talents);
    const profsChanged = JSON.stringify(professionSkills) !== JSON.stringify(currentProfile.professionSkills);
    if (talentsChanged || profsChanged) {
      saveProfile(activeProfileKey.value, { ...currentProfile, talents, professionSkills });
    }
  }, [allocation, buildMode]);

  const tree = getTreeData(activeTree);
  if (!tree || !tree.nodes) {
    return <div class="skill-trees"><p>No tree data for "{activeTree}".</p></div>;
  }

  const isProfession = isProfessionTree(activeTree);

  // Recompute allocation when build mode changes
  const switchBuildMode = useCallback((mode) => {
    setBuildMode(mode);
    if (mode === 'custom') {
      // Reload from profile
      setAllocation({ ...profile.talents, ...profile.professionSkills });
    } else if (mode === 'levelling') {
      const maxPts = countMaxPoints(tree);
      setAllocation(prev => {
        const base = { ...prev };
        // Clear current tree allocations
        for (const node of tree.nodes) delete base[node.id];
        return { ...base, ...autoAllocateLevelling(tree, maxPts) };
      });
    } else if (mode === 'farming') {
      const maxPts = countMaxPoints(tree);
      setAllocation(prev => {
        const base = { ...prev };
        for (const node of tree.nodes) delete base[node.id];
        return { ...base, ...autoAllocateFarming(tree, maxPts, isProfession) };
      });
    }
  }, [tree, profile, isProfession]);

  // Switch tree
  const switchTree = useCallback((treeId) => {
    setActiveTree(treeId);
    setSelectedNodeId(null);
    // Re-apply build mode for new tree
    if (buildMode !== 'custom') {
      const newTree = getTreeData(treeId);
      if (newTree) {
        const maxPts = countMaxPoints(newTree);
        const isProf = isProfessionTree(treeId);
        setAllocation(prev => {
          const base = { ...prev };
          for (const node of newTree.nodes) delete base[node.id];
          if (buildMode === 'levelling') {
            return { ...base, ...autoAllocateLevelling(newTree, maxPts) };
          } else {
            return { ...base, ...autoAllocateFarming(newTree, maxPts, isProf) };
          }
        });
      }
    }
  }, [buildMode]);

  // Allocate a point
  const allocatePoint = useCallback((node) => {
    if (buildMode !== 'custom') return;
    const pts = allocation[node.id] || 0;
    if (pts >= node.maxPoints) return;
    const state = getNodeState(node, pts, allocation, tree);
    if (state === 'locked') return;
    setAllocation(prev => ({ ...prev, [node.id]: (prev[node.id] || 0) + 1 }));
  }, [allocation, tree, buildMode]);

  // Deallocate a point
  const deallocatePoint = useCallback((node) => {
    if (buildMode !== 'custom') return;
    const pts = allocation[node.id] || 0;
    if (pts <= 0) return;
    setAllocation(prev => ({ ...prev, [node.id]: (prev[node.id] || 0) - 1 }));
  }, [allocation, buildMode]);

  // Compute sidebar data
  const treeStats = computeTreeStats(tree, allocation);
  const usedPoints = countUsedPoints(allocation, tree.nodes);
  const maxPoints = countMaxPoints(tree);
  const freePoints = maxPoints - usedPoints;

  // Recommended node
  const recommendedNodeId = findRecommendedNode(tree, allocation, profile, isProfession);

  // DPS impact for selected node
  const selectedNode = selectedNodeId ? tree.nodes.find(n => n.id === selectedNodeId) : null;
  let dpsImpact = null;
  if (selectedNode) {
    const enemy = getDefaultEnemy();
    const currentStats = computeStats(profileWithTalents(profile, allocation, isProfession));
    const currentDPS = computeEffectiveDPS(currentStats, enemy);

    const pts = allocation[selectedNode.id] || 0;
    if (pts < selectedNode.maxPoints) {
      const testAlloc = { ...allocation, [selectedNode.id]: pts + 1 };
      const testStats = computeStats(profileWithTalents(profile, testAlloc, isProfession));
      const testDPS = computeEffectiveDPS(testStats, enemy);
      dpsImpact = {
        currentDPS,
        newDPS: testDPS,
        diff: testDPS - currentDPS,
      };
    }
  }

  // Group nodes by row for horizontal layout
  const rowGroups = groupByRow(tree.nodes);
  const sortedRows = Object.keys(rowGroups).map(Number).sort((a, b) => a - b);

  return (
    <div class="skill-trees">
      {/* ── Left Sidebar ── */}
      <aside class="skill-trees__left">
        <div class="skill-trees__tree-tabs">
          <div class="tree-tabs__section-label">Combat</div>
          {TREE_TABS.filter(t => t.type === 'combat').map(t => (
            <button
              key={t.id}
              class={`tree-tab-btn ${activeTree === t.id ? 'tree-tab-btn--active' : ''}`}
              onClick={() => switchTree(t.id)}
            >
              {t.label}
            </button>
          ))}
          <div class="tree-tabs__divider" />
          <div class="tree-tabs__section-label">Professions</div>
          {TREE_TABS.filter(t => t.type === 'profession').map(t => (
            <button
              key={t.id}
              class={`tree-tab-btn ${activeTree === t.id ? 'tree-tab-btn--active' : ''}`}
              onClick={() => switchTree(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div class="skill-trees__build-modes">
          <div class="tree-tabs__section-label">Build Mode</div>
          {BUILD_MODES.map(m => (
            <button
              key={m}
              class={`build-mode-btn ${buildMode === m ? 'build-mode-btn--active' : ''}`}
              onClick={() => switchBuildMode(m)}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <div class="skill-trees__points">
          <div class="points-counter">
            <span class="points-counter__label">Used:</span>
            <span class="points-counter__value">{usedPoints} / {maxPoints}</span>
          </div>
          <div class="points-counter">
            <span class="points-counter__label">Free:</span>
            <span class="points-counter__value points-counter__value--free">{freePoints}</span>
          </div>
        </div>
      </aside>

      {/* ── Center Panel ── */}
      <section class="skill-trees__center">
        <div class="tree-graph" style={{ position: 'relative' }}>
          <ConnectionLines tree={tree} allocation={allocation} />
          <div class="tree-tiers">
            {sortedRows.map(row => (
              <div key={row} class="tree-tier">
                <div class="tree-tier__label">Tier {row + 1}</div>
                <div class="tree-tier__nodes">
                  {rowGroups[row].map(node => {
                    const pts = allocation[node.id] || 0;
                    const state = getNodeState(node, pts, allocation, tree);
                    return (
                      <TreeNode
                        key={node.id}
                        node={node}
                        points={pts}
                        state={state}
                        isRecommended={node.id === recommendedNodeId}
                        isSelected={node.id === selectedNodeId}
                        onClick={() => {
                          setSelectedNodeId(node.id);
                          allocatePoint(node);
                        }}
                        onRightClick={() => {
                          deallocatePoint(node);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Right Sidebar ── */}
      <aside class="skill-trees__right">
        {selectedNode ? (
          <div class="node-detail">
            <h3 class="node-detail__name">{selectedNode.name}</h3>
            <p class="node-detail__desc">
              {selectedNode.isSkill ? 'Skill unlock' : `${STAT_DISPLAY[selectedNode.stat] || selectedNode.stat}: +${selectedNode.perPoint} per point`}
            </p>
            <div class="node-detail__progress">
              <div class="progress-bar">
                <div
                  class="progress-bar__fill"
                  style={{ width: `${((allocation[selectedNode.id] || 0) / selectedNode.maxPoints) * 100}%` }}
                />
              </div>
              <span class="node-detail__pts">{allocation[selectedNode.id] || 0} / {selectedNode.maxPoints}</span>
            </div>

            {buildMode === 'custom' && (
              <div class="node-detail__actions">
                <button
                  class="node-action-btn node-action-btn--add"
                  onClick={() => allocatePoint(selectedNode)}
                  disabled={(allocation[selectedNode.id] || 0) >= selectedNode.maxPoints || freePoints <= 0}
                >
                  + Add
                </button>
                <button
                  class="node-action-btn node-action-btn--remove"
                  onClick={() => deallocatePoint(selectedNode)}
                  disabled={(allocation[selectedNode.id] || 0) <= 0}
                >
                  - Remove
                </button>
              </div>
            )}

            {dpsImpact && (
              <div class="node-detail__impact">
                <div class="impact-label">DPS Impact (next point)</div>
                <div class="impact-row">
                  <span>Current eDPS</span>
                  <span>{fmt(dpsImpact.currentDPS)}</span>
                </div>
                <div class="impact-row">
                  <span>New eDPS</span>
                  <span>{fmt(dpsImpact.newDPS)}</span>
                </div>
                <div class="impact-row impact-row--diff">
                  <span>Change</span>
                  <span class={dpsImpact.diff >= 0 ? 'impact-positive' : 'impact-negative'}>
                    {dpsImpact.diff >= 0 ? '+' : ''}{fmt(dpsImpact.diff)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div class="node-detail node-detail--empty">
            <p>Select a node to see details</p>
          </div>
        )}

        <div class="tree-stats">
          <h4 class="tree-stats__title">From This Tree</h4>
          {Object.keys(treeStats).length === 0 ? (
            <p class="tree-stats__empty">No points allocated</p>
          ) : (
            Object.entries(treeStats).map(([stat, value]) => (
              <div key={stat} class="tree-stats__row">
                <span class="tree-stats__label">{STAT_DISPLAY[stat] || stat}</span>
                <span class="tree-stats__value">+{value % 1 === 0 ? value : value.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
