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
  var raw = rawCalc();
  var net = netCalc();
  var rawBase = raw.base;
  var rawInter = raw.inter;
  var netBase = net.base;
  var netInter = net.inter;

  var allEntries = [];
  var k;
  for (k in rawBase)  allEntries.push({ name: k, raw: rawBase[k],  type: 'base'  });
  for (k in rawInter) allEntries.push({ name: k, raw: rawInter[k], type: 'inter' });
  allEntries.sort(function(a, b) { return b.raw - a.raw; });

  var total = allEntries.length;
  var satisfied = 0;
  for (var i = 0; i < allEntries.length; i++) {
    var e = allEntries[i];
    var netAcc = e.type === 'base' ? netBase : netInter;
    if ((netAcc[e.name] || 0) <= 0) satisfied++;
  }

  var hasAnyInventory = false;
  for (var invKey in inventory) { if (inventory[invKey] > 0) { hasAnyInventory = true; break; } }

  var html =
    '<div class="summary-row">' +
      '<span class="summary-label">' + total + ' ingredient(s) total</span>' +
      (satisfied > 0 ? '<span class="pill-green">✓ ' + satisfied + ' ready</span>' : '') +
      '<span class="pill-red">' + (total - satisfied) + ' remaining</span>' +
    '</div>' +
    '<div class="table-container">' +
      '<table class="inventory-table">' +
        '<thead>' +
          '<tr>' +
            '<th>Item</th>' +
            '<th style="text-align:right;">Req</th>' +
            '<th style="text-align:right;">Stock</th>' +
            '<th style="text-align:right;">Need</th>' +
          '</tr>' +
        '</thead>' +
        '<tbody>';

  for (var j = 0; j < allEntries.length; j++) {
    var ent = allEntries[j];
    var nAcc = ent.type === 'base' ? netBase : netInter;
    var remain = Math.max(0, nAcc[ent.name] || 0);
    var have = inventory[ent.name] || 0;
    var remCls = remain === 0 ? 'zero' : have > 0 ? 'partial' : 'full';
    
    var cat = recipeCategory[ent.name];
    var typeLabel = ent.type === 'base' ? 'raw' : 'craft';
    var typeCls   = ent.type === 'base' ? 'base' : 'inter';

    if (ent.type !== 'base' && cat && cat.toLowerCase() === 'smeltery') {
      typeLabel = 'smeltery';
      typeCls   = 'smeltery';
    }

    var safe = ent.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    html +=
      '<tr>' +
        '<td>' +
          '<div class="inv-item-name">' + ent.name + '</div>' +
          '<span class="tree-node-type ' + typeCls + '">' + typeLabel + '</span>' +
        '</td>' +
        '<td style="text-align:right;"><span class="inv-required">' + ent.raw.toLocaleString() + '</span></td>' +
        '<td style="text-align:right;">' +
          '<input type="number" class="inv-input" min="0" value="' + (have || '') + '" placeholder="0" oninput="onInventoryInput(\'' + safe + '\', this)" />' +
        '</td>' +
        '<td style="text-align:right;">' +
          '<span class="inv-remaining ' + remCls + '" data-still-name="' + ent.name + '" data-still-type="' + ent.type + '">' +
            (remain === 0 ? '✓' : remain.toLocaleString()) +
          '</span>' +
        '</td>' +
      '</tr>';
  }

  html +=
        '</tbody>' +
      '</table>' +
    '</div>' +
    '<p class="recalc-note">✨ Changes are saved automatically and calculated in real-time.</p>';

  document.getElementById('resultCombined').innerHTML = html;
  var clearBtn = document.getElementById('clearInvBtn');
  if (clearBtn) clearBtn.style.display = hasAnyInventory ? 'inline-flex' : 'none';
}

function _patchNetCells() {
  if (!craftList.length) return;
  var net = netCalc();
  var netBase = net.base;
  var netInter = net.inter;

  var cells = document.querySelectorAll('[data-still-name]');
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];
    var name = cell.getAttribute('data-still-name');
    var type = cell.getAttribute('data-still-type');
    var netAcc = type === 'base' ? netBase : netInter;
    var remain = Math.max(0, netAcc[name] || 0);
    var have = inventory[name] || 0;
    
    cell.className = 'inv-remaining ' + (remain === 0 ? 'zero' : have > 0 ? 'partial' : 'full');
    cell.textContent = remain === 0 ? '✓' : remain.toLocaleString();
  }

  var raw = rawCalc();
  var allRaw = {};
  var k;
  for (k in raw.base) allRaw[k] = raw.base[k];
  for (k in raw.inter) allRaw[k] = raw.inter[k];

  var allNet = {};
  for (k in netBase) allNet[k] = netBase[k];
  for (k in netInter) allNet[k] = netInter[k];

  var total = Object.keys(allRaw).length;
  var satisfied = 0;
  for (var key in allRaw) { if ((allNet[key] || 0) <= 0) satisfied++; }

  var row = document.querySelector('.summary-row');
  if (row) {
    row.innerHTML =
      '<span class="summary-label">' + total + ' ingredient(s) total</span>' +
      (satisfied > 0 ? '<span class="pill-green">✓ ' + satisfied + ' ready</span>' : '') +
      '<span class="pill-red">' + (total - satisfied) + ' remaining</span>';
  }

  var hasAny = false;
  for (var invK in inventory) { if (inventory[invK] > 0) { hasAny = true; break; } }
  var clearBtn = document.getElementById('clearInvBtn');
  if (clearBtn) clearBtn.style.display = hasAny ? 'inline-flex' : 'none';

  _renderByItem();
}

// ══════════════════════════════════════════════════
// BY ITEM VIEW
// ══════════════════════════════════════════════════
function _renderByItem() {
  var container = document.getElementById('byItemContent');
  if (!container || !craftList.length) { if (container) container.innerHTML = ''; return; }

  var collapsed = {};
  var blocks = document.querySelectorAll('.by-item-block');
  for (var i = 0; i < blocks.length; i++) {
    var key = blocks[i].getAttribute('data-item-key');
    var body = blocks[i].querySelector('.by-item-body');
    if (key && body && body.classList.contains('collapsed')) collapsed[key] = true;
  }

  var individualCrafts = [];
  for (var j = 0; j < craftList.length; j++) {
    var c = craftList[j];
    for (var k = 0; k < c.qty; k++) {
      individualCrafts.push({ item: c.item, originalIndex: j, instanceIndex: k + 1 });
    }
  }

  var currentInventory = {};
  for (var invK in inventory) currentInventory[invK] = inventory[invK];

  var html = '';
  for (var m = 0; m < individualCrafts.length; m++) {
    var ic = individualCrafts[m];
    var itemKey = ic.item + '::' + ic.originalIndex + '::' + ic.instanceIndex;
    var isCollapsed = !!collapsed[itemKey];
    
    var invBefore = {};
    for (var k1 in currentInventory) invBefore[k1] = currentInventory[k1];

    var baseReq = {};
    var interReq = {};
    _expandForItemWithAllocation(ic.item, 1, baseReq, interReq, currentInventory, {});
    var invAfter = {};
    for (var k2 in currentInventory) invAfter[k2] = currentInventory[k2];

    var totalReq = 0, totalGot = 0;
    for (var bn in baseReq) {
      totalReq += baseReq[bn];
      totalGot += (invBefore[bn] || 0) - (invAfter[bn] || 0);
    }

    var pct = totalReq > 0 ? Math.round((totalGot / totalReq) * 100) : 100;
    var isComplete = pct >= 100;
    var safeKey = itemKey.replace(/'/g, "\\'");

    html +=
      '<div class="by-item-block" data-item-key="' + safeKey + '">' +
        '<div class="by-item-header" onclick="toggleByItemBlock(this)">' +
          '<div class="by-item-name">' + ic.item + ' <small>#' + ic.instanceIndex + '</small></div>' +
          '<div class="by-item-progress-wrap">' +
            '<div class="progress-bar-bg">' +
              '<div class="progress-bar-fill ' + (isComplete ? 'complete' : '') + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="progress-pct ' + (isComplete ? 'complete' : '') + '">' + (isComplete ? '✓' : pct + '%') + '</span>' +
          '</div>' +
          '<button class="by-item-collapse-btn">' + (isCollapsed ? '▼' : '▲') + '</button>' +
        '</div>' +
        '<div class="by-item-body ' + (isCollapsed ? 'collapsed' : '') + '">' +
          '<div class="tree-root">' +
            _renderTree(ic.item, 1, 0, {}, invBefore, invAfter) +
          '</div>' +
        '</div>' +
      '</div>';
  }

  container.innerHTML = html;
}

function toggleByItemBlock(header) {
  var body = header.nextElementSibling;
  var btn = header.querySelector('.by-item-collapse-btn');
  var isCollapsed = body.classList.toggle('collapsed');
  btn.textContent = isCollapsed ? '▼' : '▲';
}

function _expandForItemWithAllocation(itemName, qty, baseAcc, interAcc, mutableInv, stack) {
  if (!stack) stack = {};
  
  // 1. Consume what we already have (even if it's a craftable item)
  var have = mutableInv[itemName] || 0;
  var consume = Math.min(have, qty);
  mutableInv[itemName] = have - consume;
  
  var remaining = qty - consume;
  
  // 2. If satisfied, just update baseAcc (used for summary) and return
  if (remaining <= 0) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }

  var recipe = recipes[itemName];
  // 3. If no recipe or circular, it's a base ingredient (or handled as such)
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }

  // 4. Expand recipe for the REMAINING quantity
  var effYield = getEffectiveYield(itemName, recipe);
  var times = Math.ceil(remaining / effYield);
  if (Object.keys(stack).length > 0) interAcc[itemName] = (interAcc[itemName] || 0) + remaining;
  
  var nextStack = {};
  for (var k in stack) nextStack[k] = true;
  nextStack[itemName] = true;

  for (var i = 0; i < recipe.ingredients.length; i++) {
    var ingr = recipe.ingredients[i];
    _expandForItemWithAllocation(ingr.name, ingr.qty * times, baseAcc, interAcc, mutableInv, nextStack);
  }
}

function toggleTreeBranch(btn) {
  var row = btn.parentElement;
  var node = row.parentElement;
  var branch = node.querySelector('.tree-branch-content');
  if (branch) {
    var isCollapsed = branch.classList.toggle('collapsed');
    btn.classList.toggle('collapsed', isCollapsed);
  }
}

function _renderTree(itemName, qty, depth, stack, invBefore, invAfter) {
  if (!stack) stack = {};
  var recipe = recipes[itemName];
  var isBase = !recipe || !!stack[itemName];
  
  var consumed = (invBefore[itemName] || 0) - (invAfter[itemName] || 0);
  var got = Math.min(qty, consumed);
  
  var pct = qty > 0 ? Math.floor((got / qty) * 100) : 100;
  var isDone = got >= qty;
  var needCls = isDone ? 'zero' : got > 0 ? 'partial' : 'full';

  var cat = recipeCategory[itemName];
  var typeLabel = isBase ? 'raw' : 'craft';
  var typeCls   = isBase ? 'base' : 'inter';

  if (!isBase && cat && cat.toLowerCase() === 'smeltery') {
    typeLabel = 'smeltery';
    typeCls   = 'smeltery';
  }

  var indent = '';
  for (var d = 0; d < depth; d++) {
    indent += '<div class="tree-indent-line"></div>';
  }

  var html =
    '<div class="tree-node">' +
      '<div class="tree-node-row">' +
        (depth > 0 ? '<div class="tree-indent">' + indent + '</div>' : '') +
        (!isBase ? '<button class="tree-branch-toggle" onclick="toggleTreeBranch(this)">▼</button>' : '<div class="tree-branch-spacer"></div>') +
        '<span class="tree-node-type ' + typeCls + '">' + typeLabel + '</span>' +
        '<span class="tree-node-name ' + (!isBase && depth > 0 ? 'is-inter' : '') + '">' + itemName + '</span>' +
        '<div style="flex:1"></div>' +
        '<div class="tree-node-nums">' +
          '<span class="tree-progress ' + needCls + '">' +
            got.toLocaleString() + ' / ' + qty.toLocaleString() +
            ' <small>(' + pct + '%)</small>' +
          '</span>' +
          (isDone ? '<span class="pill-done">DONE</span>' : '') +
        '</div>' +
      '</div>';

  if (!isBase) {
    var nextStack = {};
    for (var k in stack) nextStack[k] = true;
    nextStack[itemName] = true;

    var branchNeed = Math.max(0, qty - got);
    var times = Math.ceil(branchNeed / recipe.yields);
    
    var grouped = {};
    for (var i = 0; i < recipe.ingredients.length; i++) {
      var ing = recipe.ingredients[i];
      grouped[ing.name] = (grouped[ing.name] || 0) + (ing.qty * times);
    }
    
    var children = '';
    var ingNames = Object.keys(grouped).sort();
    for (var j = 0; j < ingNames.length; j++) {
      var ingName = ingNames[j];
      var cQty = grouped[ingName];
      if (cQty > 0) children += _renderTree(ingName, cQty, depth + 1, nextStack, invBefore, invAfter);
    }
    if (children) {
      html += '<div class="tree-branch-content">' + children + '</div>';
    }
  }
  
  html += '</div>';
  return html;
}

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
  var net = netCalc();
  
  var format = function(obj) {
    var res = [];
    for (var n in obj) {
      if (obj[n] > 0) res.push(obj[n].toLocaleString() + 'x ' + n);
    }
    res.sort();
    return res.join('\n');
  };

  var baseText = format(net.base);
  var interText = format(net.inter);
  
  if (!baseText && !interText) { showToast('You already have everything!'); return; }
  
  var text = '';
  if (baseText) text += 'Needed:\n' + baseText;
  if (interText) text += (text ? '\n\n' : '') + 'To Craft:\n' + interText;
  
  try {
    navigator.clipboard.writeText(text.trim());
    showToast('Requirements copied!');
  } catch (ex) {
    showToast('Copy failed.', true);
  }
}
