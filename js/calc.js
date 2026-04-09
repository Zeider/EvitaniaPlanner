// ── CRAFT LIST ────────────────────────────────────
function addToCraftList(category) {
  var selId  = 'craftItemSelect_' + category.replace(/\s/g, '_');
  var qtyId  = 'craftQty_' + category.replace(/\s/g, '_');
  var item   = document.getElementById(selId) ? document.getElementById(selId).value : '';
  var qty    = parseInt(document.getElementById(qtyId) ? document.getElementById(qtyId).value : 1) || 1;
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

// ── ITEM SELECT DROPDOWNS ─────────────────────────
function updateItemSelects() {
  // Collect all known categories dynamically
  var allCats = Object.keys(recipeCategories);

  // Also rebuild the category dropdown in the add-recipe form
  var catSel = document.getElementById('recipeCategory');
  if (catSel) {
    var currentVal = catSel.value;
    catSel.innerHTML = allCats.map(function(c) {
      return '<option value="' + c + '"' + (c === currentVal ? ' selected' : '') + '>' + c + '</option>';
    }).join('') + '<option value="__new__"' + (currentVal === '__new__' ? ' selected' : '') + '>＋ New category…</option>';
  }

  // Update each known dropdown; for dynamic new categories, add a row if needed
  allCats.forEach(function(cat) {
    var safeId = 'craftItemSelect_' + cat.replace(/\s/g, '_');
    var sel    = document.getElementById(safeId);

    // If this category has no dropdown yet, create one
    if (!sel) {
      _createCategoryRow(cat);
      sel = document.getElementById(safeId);
    }
    if (!sel) return;

    var cur   = sel.value;
    var names = Object.keys(recipeCategories[cat] || {}).sort();
    sel.innerHTML = '<option value="">— Select an item —</option>' +
      names.map(function(n) {
        if (!recipes[n]) return '';
        return '<option value="' + n + '"' + (n === cur ? ' selected' : '') + '>' + n + '</option>';
      }).join('');
  });
}

function _createCategoryRow(cat) {
  var container = document.querySelector('.category-selects');
  if (!container) return;
  var safeId  = cat.replace(/\s/g, '_');
  var row     = document.createElement('div');
  row.className = 'category-row';
  row.innerHTML =
    '<span class="category-label">' + cat + '</span>' +
    '<div class="calc-row">' +
      '<select id="craftItemSelect_' + safeId + '"><option value="">— Select an item —</option></select>' +
      '<input type="number" class="craft-qty-input" id="craftQty_' + safeId + '" min="1" value="1" />' +
      '<button class="btn btn-primary btn-sm" onclick="addToCraftList(\'' + cat.replace(/'/g, "\\'") + '\')">+ Add</button>' +
    '</div>';
  container.appendChild(row);
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

function itemBaseCalc(itemName, qty) {
  var base = {}, inter = {};
  _expandForItem(itemName, qty, base, inter, {});
  return { base: base, inter: inter };
}
