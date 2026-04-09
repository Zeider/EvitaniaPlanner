var _recalcTimer  = null;
var _invTimer     = null;
var _resultView   = 'combined';

// ── VIEW TOGGLE ───────────────────────────────────
function switchResultView(view) {
  _resultView = view;
  document.getElementById('resultCombined').style.display = view === 'combined' ? '' : 'none';
  document.getElementById('resultByItem').style.display   = view === 'byitem'   ? '' : 'none';
  document.getElementById('toggleCombined').classList.toggle('active', view === 'combined');
  document.getElementById('toggleByItem').classList.toggle('active',   view === 'byitem');
}

// ── LIVE RECALC ───────────────────────────────────
function liveRecalc() {
  clearTimeout(_recalcTimer);
  _recalcTimer = setTimeout(_doRender, 80);
}

function _doRender() {
  var card = document.getElementById('resultCard');
  if (!craftList.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  _renderCombined();
  _renderByItem();
  switchResultView(_resultView);
}

// ══════════════════════════════════════════════════
// COMBINED VIEW
// ══════════════════════════════════════════════════
function _renderCombined() {
  var raw     = rawCalc();
  var net     = netCalc();
  var rawBase = raw.base, rawInter = raw.inter;
  var netBase = net.base, netInter = net.inter;

  var allEntries = [];
  var k;
  for (k in rawBase)  allEntries.push({ name: k, raw: rawBase[k],  type: 'base'  });
  for (k in rawInter) allEntries.push({ name: k, raw: rawInter[k], type: 'inter' });
  allEntries.sort(function(a, b) { return b.raw - a.raw; });

  var total     = allEntries.length;
  var satisfied = 0;
  for (var i = 0; i < allEntries.length; i++) {
    var e      = allEntries[i];
    var netAcc = e.type === 'base' ? netBase : netInter;
    if ((netAcc[e.name] || 0) <= 0) satisfied++;
  }
  var hasAny = false;
  for (k in inventory) { if (inventory[k] > 0) { hasAny = true; break; } }

  var html =
    '<div class="summary-row">' +
      '<span class="summary-label">' + total + ' ingredient(s)</span>' +
      (satisfied > 0 ? '<span class="pill-green">✓ ' + satisfied + ' covered</span>' : '') +
      '<span class="pill-red">' + (total - satisfied) + ' still needed</span>' +
    '</div>' +
    '<table class="inventory-table"><thead><tr>' +
      '<th>Item</th>' +
      '<th style="text-align:right;">Required</th>' +
      '<th style="text-align:right;">You Have</th>' +
      '<th style="text-align:right;">Still Need</th>' +
    '</tr></thead><tbody>';

  for (var i = 0; i < allEntries.length; i++) {
    var e      = allEntries[i];
    var netAcc = e.type === 'base' ? netBase : netInter;
    var remain = Math.max(0, netAcc[e.name] || 0);
    var have   = inventory[e.name] || 0;
    var remCls = remain === 0 ? 'zero' : have > 0 ? 'partial' : 'full';
    var typeLbl = e.type === 'base'
      ? '<span class="inv-item-type base">base</span>'
      : '<span class="inv-item-type inter">craft</span>';
    var safe = e.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    html +=
      '<tr>' +
        '<td><span class="inv-item-name">' + e.name + '</span>' + typeLbl + '</td>' +
        '<td style="text-align:right;"><span class="inv-required">' + e.raw.toLocaleString() + '</span></td>' +
        '<td style="text-align:right;">' +
          '<input type="number" class="inv-input" min="0"' +
          ' value="' + (have || '') + '" placeholder="0"' +
          ' oninput="onInventoryInput(\'' + safe + '\', this)" />' +
        '</td>' +
        '<td style="text-align:right;">' +
          '<span class="inv-remaining ' + remCls + '"' +
          ' data-still-name="' + e.name + '"' +
          ' data-still-type="' + e.type + '">' +
          (remain === 0 ? '✓ Done' : remain.toLocaleString()) +
          '</span>' +
        '</td>' +
      '</tr>';
  }

  html += '</tbody></table>' +
    '<p class="recalc-note">💡 Inventory persists across sessions and recalculates the full crafting tree live.</p>';

  document.getElementById('resultCombined').innerHTML = html;
  document.getElementById('clearInvBtn').style.display = hasAny ? 'inline-flex' : 'none';
}

function _patchNetCells() {
  if (!craftList.length) return;
  var net     = netCalc();
  var netBase = net.base, netInter = net.inter;
  var k;

  var cells = document.querySelectorAll('[data-still-name]');
  for (var i = 0; i < cells.length; i++) {
    var cell   = cells[i];
    var name   = cell.getAttribute('data-still-name');
    var type   = cell.getAttribute('data-still-type');
    var netAcc = type === 'base' ? netBase : netInter;
    var remain = Math.max(0, netAcc[name] || 0);
    var have   = inventory[name] || 0;
    cell.className   = 'inv-remaining ' + (remain === 0 ? 'zero' : have > 0 ? 'partial' : 'full');
    cell.textContent = remain === 0 ? '✓ Done' : remain.toLocaleString();
  }

  var raw    = rawCalc();
  var allRaw = {}, allNet = {};
  for (k in raw.base)  allRaw[k] = raw.base[k];
  for (k in raw.inter) allRaw[k] = raw.inter[k];
  for (k in netBase)   allNet[k] = netBase[k];
  for (k in netInter)  allNet[k] = netInter[k];

  var total     = Object.keys(allRaw).length;
  var satisfied = 0;
  for (k in allRaw) { if ((allNet[k] || 0) <= 0) satisfied++; }

  var row = document.querySelector('.summary-row');
  if (row) {
    row.innerHTML =
      '<span class="summary-label">' + total + ' ingredient(s)</span>' +
      (satisfied > 0 ? '<span class="pill-green">✓ ' + satisfied + ' covered</span>' : '') +
      '<span class="pill-red">' + (total - satisfied) + ' still needed</span>';
  }

  var hasAny = false;
  for (k in inventory) { if (inventory[k] > 0) { hasAny = true; break; } }
  document.getElementById('clearInvBtn').style.display = hasAny ? 'inline-flex' : 'none';

  // Also refresh the by-item view since inventory changed
  _renderByItem();
}

// ══════════════════════════════════════════════════
// BY ITEM VIEW
// ══════════════════════════════════════════════════
function _renderByItem() {
  var container = document.getElementById('byItemContent'); // Target the new div for content
  if (!craftList.length) { container.innerHTML = ''; return; }

  // Preserve collapsed state across re-renders
  var collapsed = {};
  document.querySelectorAll('.by-item-block').forEach(function(block) {
    var key  = block.getAttribute('data-item-key');
    var body = block.querySelector('.by-item-body');
    if (key && body && body.classList.contains('collapsed')) collapsed[key] = true;
  });

  // Create individual craft items for display (always in list order now)
  var individualCrafts = [];
  craftList.forEach(function(c, idx) {
    for (var i = 0; i < c.qty; i++) {
      individualCrafts.push({
        item: c.item,
        originalIndex: idx, // To maintain original list order
        instanceIndex: i + 1 // For display like "Chestplate #1"
      });
    }
  });

  // Sort by original list order (which is the default behavior now)
  individualCrafts.sort(function(a, b) {
    return a.originalIndex - b.originalIndex;
  });

  // Create a mutable copy of inventory for sequential allocation
  var currentInventory = {};
  for (var k in inventory) currentInventory[k] = inventory[k];

  var html = '';
  individualCrafts.forEach(function(ic) {
    var key  = ic.item + '::' + ic.originalIndex + '::' + ic.instanceIndex; // Unique key for collapsed state
    var isCollapsed = collapsed[key] ? ' collapsed' : '';
    var colLabel    = collapsed[key] ? '▼ Expand'   : '▲ Collapse';

    // Snapshot inventory *before* this item consumes
    var invBeforeThisItem = {};
    for (var invKey in currentInventory) invBeforeThisItem[invKey] = currentInventory[invKey];

    // Calculate base totals for this individual item, consuming from currentInventory
    var baseRequiredForThisItem = {}; // Tracks total base materials needed for this item
    var interNeeded = {};
    _expandForItemWithAllocation(ic.item, 1, baseRequiredForThisItem, interNeeded, currentInventory, {}); // currentInventory is modified here

    // Snapshot inventory *after* this item consumes
    var invAfterThisItem = {};
    for (var invKey in currentInventory) invAfterThisItem[invKey] = currentInventory[invKey];

    // Calculate progress based on what was *actually consumed* by this item
    var totalRequiredBase = 0;
    var totalAllocatedBase = 0;
    for (var bn in baseRequiredForThisItem) {
      var required = baseRequiredForThisItem[bn];
      var availableBefore = invBeforeThisItem[bn] || 0;
      var availableAfter = invAfterThisItem[bn] || 0;
      var consumedByThisItem = availableBefore - availableAfter;

      totalRequiredBase += required;
      totalAllocatedBase += consumedByThisItem;
    }

    var pct      = totalRequiredBase > 0 ? Math.round((totalAllocatedBase / totalRequiredBase) * 100) : 100;
    var complete = pct >= 100;
    var fillCls  = complete ? ' complete' : '';
    var pctCls   = complete ? ' complete'  : '';

    var safeKey = key.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    html +=
      '<div class="by-item-block" data-item-key="' + safeKey + '">' +
        '<div class="by-item-header" onclick="toggleByItemBlock(this)">' +
          '<span class="by-item-name">' + ic.item + ' #' + ic.instanceIndex + '</span>' +
          '<div class="by-item-progress-wrap">' +
            '<div class="progress-bar-bg">' +
              '<div class="progress-bar-fill' + fillCls + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="progress-pct' + pctCls + '">' + (complete ? '✓ 100%' : pct + '%') + '</span>' +
          '</div>' +
          '<button class="by-item-collapse-btn">' + colLabel + '</button>' +
        '</div>' +
        '<div class="by-item-body' + isCollapsed + '">' +
          '<div class="tree-root">' +
            _renderTree(ic.item, 1, 0, {}, invBeforeThisItem, invAfterThisItem) + // Pass both inventories
          '</div>' +
        '</div>' +
      '</div>';
  });

  container.innerHTML = html;
}

function toggleByItemBlock(header) {
  var body = header.nextElementSibling;
  var btn  = header.querySelector('.by-item-collapse-btn');
  var col  = body.classList.toggle('collapsed');
  btn.textContent = col ? '▼ Expand' : '▲ Collapse';
}

// ── PER-ITEM EXPAND (for progress calculation - NO ALLOCATION) ────
// This version is used for the initial 'closest first' sorting,
// it calculates what *could* be covered without actually consuming inventory.
// This function is no longer strictly needed for sorting, but kept for potential future use
// or if itemBaseCalc is used elsewhere.
function _expandForItem(itemName, qty, baseAcc, interAcc, stack) {
  if (!stack) stack = {};
  var recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }
  var times = Math.ceil(qty / recipe.yields);
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + times * recipe.yields;
  }
  var ns = {}; for (var k in stack) ns[k] = true; ns[itemName] = true;
  for (var j = 0; j < recipe.ingredients.length; j++) {
    var ingr = recipe.ingredients[j];
    _expandForItem(ingr.name, ingr.qty * times, baseAcc, interAcc, ns);
  }
}

// ── PER-ITEM EXPAND (for progress calculation - WITH ALLOCATION) ────
// This version consumes from the provided mutable inventory.
function _expandForItemWithAllocation(itemName, qty, baseAcc, interAcc, mutableInv, stack) {
  if (!stack) stack = {};
  var recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    var have = mutableInv[itemName] || 0;
    var consume = Math.min(have, qty);
    mutableInv[itemName] = have - consume;
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty; // baseAcc tracks *total required* for this item
    return;
  }
  var times = Math.ceil(qty / recipe.yields);
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + times * recipe.yields;
  }
  var ns = {}; for (var k in stack) ns[k] = true; ns[itemName] = true;
  for (var j = 0; j < recipe.ingredients.length; j++) {
    var ingr = recipe.ingredients[j];
    _expandForItemWithAllocation(ingr.name, ingr.qty * times, baseAcc, interAcc, mutableInv, ns);
  }
}


// ── TREE RENDERER ─────────────────────────────────
// Now takes two inventory parameters: invBeforeThisItem (for 'have' display) and invAfterThisItem (for 'need' calculation)
function _renderTree(itemName, qty, depth, stack, invBeforeThisItem, invAfterThisItem) {
  if (!stack) stack = {};
  var recipe  = recipes[itemName];
  var isBase  = !recipe || !!stack[itemName];
  var isInter = !isBase && depth > 0;
  var isRoot  = depth === 0;

  // Inventory numbers
  var required = isRoot ? qty : qty;

  // 'have' is what was available in the shared pool *before* this item consumed it
  var haveAvailableBefore = invBeforeThisItem[itemName] || 0;

  // 'need' is what's still needed *after* this item has consumed from its allocated share.
  // This is calculated by taking the original requirement and subtracting what was *actually consumed* by this item.
  var consumedByThisItem = (invBeforeThisItem[itemName] || 0) - (invAfterThisItem[itemName] || 0);
  var effectiveHaveForThisItem = Math.min(required, consumedByThisItem); // How much of *this item's* requirement was met
  var need     = Math.max(0, required - effectiveHaveForThisItem);

  var needCls  = need === 0 ? 'zero' : effectiveHaveForThisItem > 0 ? 'partial' : 'full';

  var indent = '';
  for (var d = 0; d < depth; d++) {
    indent += '<div class="tree-indent-line"></div>';
  }
  var indentHtml = depth > 0
    ? '<div class="tree-indent">' + indent + '</div>'
    : '';

  var typeLabel = isBase
    ? '<span class="tree-node-type base">base</span>'
    : '<span class="tree-node-type inter">craft</span>';

  var numsHtml =
    '<span class="tree-node-nums">' +
      '<span class="tree-num-req">' + required.toLocaleString() + ' req</span>' +
      (effectiveHaveForThisItem > 0 ? '<span class="tree-num-have">· ' + effectiveHaveForThisItem.toLocaleString() + ' have</span>' : '') +
      '<span class="tree-num-need ' + needCls + '">' +
        (need === 0 ? '✓ Done' : need.toLocaleString() + ' needed') +
      '</span>' +
    '</span>';

  var nameClass = isInter ? ' is-inter' : '';
  var rowHtml =
    '<div class="tree-node-row">' +
      indentHtml +
      '<span class="tree-node-name' + nameClass + '">' + itemName + '</span>' +
      typeLabel +
      numsHtml +
    '</div>';

  if (isBase) return '<div class="tree-node">' + rowHtml + '</div>';

  // Recurse into children
  var childrenHtml = '';
  var ns = {}; for (var k in stack) ns[k] = true; ns[itemName] = true;

  // Times to craft = based on how many we still need (not counting what we have)
  var timesForChildren = Math.ceil(need / recipe.yields);

  for (var j = 0; j < recipe.ingredients.length; j++) {
    var ingr    = recipe.ingredients[j];
    var childQty = ingr.qty * timesForChildren;
    if (childQty > 0) {
      childrenHtml += _renderTree(ingr.name, childQty, depth + 1, ns, invBeforeThisItem, invAfterThisItem); // Pass both inventories
    }
  }

  return '<div class="tree-node">' + rowHtml +
    (childrenHtml ? '<div class="tree-children">' + childrenHtml + '</div>' : '') +
    '</div>';
}

// ══════════════════════════════════════════════════
// INVENTORY INPUT / CLEAR / COPY
// ══════════════════════════════════════════════════
function onInventoryInput(name, input) {
  var val = parseInt(input.value) || 0;
  if (val <= 0) delete inventory[name]; else inventory[name] = val;
  saveLS(LS_INVENT, inventory);
  clearTimeout(_invTimer);
  _invTimer = setTimeout(_patchNetCells, 80);
}

function clearInventory() {
  if (!confirm('Clear all inventory entries?')) return;
  inventory = {};
  saveLS(LS_INVENT, inventory);
  var inputs = document.querySelectorAll('.inv-input');
  for (var i = 0; i < inputs.length; i++) inputs[i].value = '';
  _patchNetCells();
  showToast('Inventory cleared.');
}

function copyNeededToClipboard() {
  if (!craftList.length) { showToast('Nothing to copy yet.', true); return; }
  var net       = netCalc();
  var baseLines = [], interLines = [], k;
  for (k in net.base)  { if (net.base[k]  > 0) baseLines.push(net.base[k].toLocaleString()  + 'x ' + k); }
  for (k in net.inter) { if (net.inter[k] > 0) interLines.push(net.inter[k].toLocaleString() + 'x ' + k); }
  baseLines.sort(); interLines.sort();
  if (!baseLines.length && !interLines.length) { showToast('You already have everything!'); return; }
  var text = '';
  if (baseLines.length)  text += 'Base Ingredients Needed:\n' + baseLines.join('\n');
  if (interLines.length) text += (text ? '\n\n' : '') + 'Intermediate Items To Craft:\n' + interLines.join('\n');
  try {
    navigator.clipboard.writeText(text.trim()).then(function() { showToast('Copied to clipboard!'); });
  } catch(ex) { showToast('Could not access clipboard.', true); }
}
