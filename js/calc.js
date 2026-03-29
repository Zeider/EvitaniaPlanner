// ── CRAFT LIST ────────────────────────────────────
function addToCraftList() {
  var item = document.getElementById('craftItemSelect').value;
  var qty  = parseInt(document.getElementById('craftQty').value) || 1;
  if (!item) { showToast('Select an item first.', true); return; }
  var ex = null;
  for (var i = 0; i < craftList.length; i++) {
    if (craftList[i].item === item) { ex = craftList[i]; break; }
  }
  if (ex) ex.qty += qty; else craftList.push({ item: item, qty: qty });
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
}

function removeFromCraftList(i) {
  craftList.splice(i, 1);
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
}

function clearCraftList() {
  if (!craftList.length) return;
  if (!confirm('Clear the entire farming list?')) return;
  craftList = [];
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
}

function renderCraftList() {
  var el = document.getElementById('craftList');
  if (!craftList.length) {
    el.innerHTML = '<div class="empty-state">No items yet — add something above.</div>';
    return;
  }
  el.innerHTML = craftList.map(function(c, i) {
    return '<div class="craft-item">' +
      '<div class="craft-item-left">' +
        '<span class="craft-item-qty">' + c.qty + '×</span>' +
        '<span class="craft-item-name">' + c.item + '</span>' +
      '</div>' +
      '<button class="btn btn-danger" onclick="removeFromCraftList(' + i + ')">✕</button>' +
    '</div>';
  }).join('');
}

function updateItemSelect() {
  var sel   = document.getElementById('craftItemSelect');
  var cur   = sel.value;
  var names = Object.keys(recipes).sort();
  sel.innerHTML = '<option value="">— Select An Item —</option>' +
    names.map(function(n) {
      return '<option value="' + n + '"' + (n === cur ? ' selected' : '') + '>' + n + '</option>';
    }).join('');
}

// ── CALCULATION ENGINE ────────────────────────────
function expand(itemName, qty, baseAcc, interAcc, stack) {
  if (!stack) stack = {};
  var recipe = recipes[itemName];
  if (!recipe) { baseAcc[itemName] = (baseAcc[itemName] || 0) + qty; return; }
  if (stack[itemName]) { baseAcc[itemName] = (baseAcc[itemName] || 0) + qty; return; }
  var times = Math.ceil(qty / recipe.yields);
  if (Object.keys(stack).length > 0) interAcc[itemName] = (interAcc[itemName] || 0) + times * recipe.yields;
  var ns = {};
  for (var k in stack) ns[k] = true;
  ns[itemName] = true;
  for (var j = 0; j < recipe.ingredients.length; j++) {
    var ingr = recipe.ingredients[j];
    expand(ingr.name, ingr.qty * times, baseAcc, interAcc, ns);
  }
}

function rawCalc() {
  var base = {}, inter = {};
  for (var i = 0; i < craftList.length; i++) expand(craftList[i].item, craftList[i].qty, base, inter, {});
  return { base: base, inter: inter };
}

function expandNet(itemName, qty, baseAcc, interAcc, inv, stack) {
  if (!stack) stack = {};
  var have    = inv[itemName] || 0;
  var consume = Math.min(have, qty);
  inv[itemName] = have - consume;
  var needed = qty - consume;
  if (needed <= 0) return;
  var recipe = recipes[itemName];
  if (!recipe) { baseAcc[itemName] = (baseAcc[itemName] || 0) + needed; return; }
  if (stack[itemName]) { baseAcc[itemName] = (baseAcc[itemName] || 0) + needed; return; }
  var times = Math.ceil(needed / recipe.yields);
  if (Object.keys(stack).length > 0) interAcc[itemName] = (interAcc[itemName] || 0) + times * recipe.yields;
  var ns = {};
  for (var k in stack) ns[k] = true;
  ns[itemName] = true;
  for (var j = 0; j < recipe.ingredients.length; j++) {
    var ingr = recipe.ingredients[j];
    expandNet(ingr.name, ingr.qty * times, baseAcc, interAcc, inv, ns);
  }
}

function netCalc() {
  var base = {}, inter = {}, inv = {};
  for (var k in inventory) inv[k] = inventory[k];
  for (var i = 0; i < craftList.length; i++) expandNet(craftList[i].item, craftList[i].qty, base, inter, inv, {});
  return { base: base, inter: inter };
}
