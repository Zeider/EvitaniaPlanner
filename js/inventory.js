var _recalcTimer = null;
var _invTimer    = null;

// ── LIVE RECALC ───────────────────────────────────
function liveRecalc() {
  clearTimeout(_recalcTimer);
  _recalcTimer = setTimeout(_doRender, 80);
}

function _doRender() {
  var card = document.getElementById('resultCard');
  if (!craftList.length) { card.style.display = 'none'; return; }
  card.style.display = 'block';

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

  document.getElementById('resultContent').innerHTML = html;
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
    navigator.clipboard.writeText(text.trim()).then(function() {
      showToast('Copied to clipboard!');
    });
  } catch(ex) { showToast('Could not access clipboard.', true); }
}