// ── CRAFT LIST ────────────────────────────────────
function addToCraftList(category) {
  var safeId = category.replace(/\s/g, '_');
  var sel = document.getElementById('craftItemSelect_' + safeId);
  var qtyInput = document.getElementById('craftQty_' + safeId);
  
  var item = sel ? sel.value : '';
  var qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
  
  if (!item) { showToast('Select an item first.', true); return; }
  
  var existing = null;
  for (var i = 0; i < craftList.length; i++) {
    if (craftList[i].item === item) {
      existing = craftList[i];
      break;
    }
  }

  if (existing) {
    existing.qty += qty;
  } else {
    craftList.push({ item: item, qty: qty });
  }
  
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
  showToast('Added ' + qty + 'x ' + item);
}

function removeFromCraftList(index) {
  var item = craftList[index];
  craftList.splice(index, 1);
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
  if (item) showToast('Removed ' + item.item);
}

function clearCraftList() {
  if (!craftList.length) return;
  if (!confirm('Clear the entire farming list?')) return;
  craftList = [];
  saveLS(LS_CRAFT, craftList);
  renderCraftList();
  liveRecalc();
  showToast('Farming list cleared.');
}

function renderCraftList() {
  var el = document.getElementById('craftList');
  if (!el) return;
  
  if (!craftList.length) {
    el.innerHTML = '<div class="empty-state">No items yet — add something above.</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < craftList.length; i++) {
    var c = craftList[i];
    html +=
      '<div class="craft-item">' +
        '<div class="craft-item-left">' +
          '<span class="craft-item-qty">' + c.qty + '×</span>' +
          '<span class="craft-item-name">' + c.item + '</span>' +
        '</div>' +
        '<button class="btn btn-danger btn-sm" onclick="removeFromCraftList(' + i + ')">✕</button>' +
      '</div>';
  }
  el.innerHTML = html;
}

// ── ITEM SELECT DROPDOWNS ─────────────────────────
function updateItemSelects() {
  var allCats = Object.keys(recipeCategories);

  // Update recipe creation category dropdown
  var catSel = document.getElementById('recipeCategory');
  if (catSel) {
    var cur = catSel.value;
    var html = '';
    for (var i = 0; i < allCats.length; i++) {
      var c = allCats[i];
      html += '<option value="' + c + '"' + (c === cur ? ' selected' : '') + '>' + c + '</option>';
    }
    catSel.innerHTML = html + '<option value="__new__"' + (cur === '__new__' ? ' selected' : '') + '>＋ New category…</option>';
  }

  // Update each category selector
  for (var j = 0; j < allCats.length; j++) {
    var cat = allCats[j];
    var safeId = cat.replace(/\s/g, '_');
    var sel = document.getElementById('craftItemSelect_' + safeId);

    if (!sel) {
      _createCategoryRow(cat);
      sel = document.getElementById('craftItemSelect_' + safeId);
    }
    
    if (!sel) continue;

    var curVal = sel.value;
    var items = Object.keys(recipeCategories[cat] || {}).sort();
    
    var itemsHtml = '<option value="">— Select an item —</option>';
    for (var k = 0; k < items.length; k++) {
      var n = items[k];
      if (recipes[n]) {
        itemsHtml += '<option value="' + n + '"' + (n === curVal ? ' selected' : '') + '>' + n + '</option>';
      }
    }
    sel.innerHTML = itemsHtml;
  }
}

function _createCategoryRow(cat) {
  var container = document.querySelector('.category-selects');
  if (!container) return;
  
  var safeId = cat.replace(/\s/g, '_');
  var row = document.createElement('div');
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
function getEffectiveYield(itemName, recipe) {
  var yields = recipe.yields || 1;
  var cat = recipeCategory[itemName];
  if (cat && cat.toLowerCase() === 'smeltery') {
    if (multicraftLevel === 2) return yields * 2;
    if (multicraftLevel === 4) return yields * 3;
  }
  return yields;
}

function expand(itemName, qty, baseAcc, interAcc, stack) {
  if (!stack) stack = {};
  var recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }
  
  var effYield = getEffectiveYield(itemName, recipe);
  var times = Math.ceil(qty / effYield);
  
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + qty;
  }
  
  var nextStack = {};
  for (var k in stack) nextStack[k] = true;
  nextStack[itemName] = true;
 
  for (var i = 0; i < recipe.ingredients.length; i++) {
    var ingr = recipe.ingredients[i];
    expand(ingr.name, ingr.qty * times, baseAcc, interAcc, nextStack);
  }
}

function rawCalc() {
  var base = {}, inter = {};
  for (var i = 0; i < craftList.length; i++) {
    var c = craftList[i];
    expand(c.item, c.qty, base, inter);
  }
  return { base: base, inter: inter };
}

function expandNet(itemName, qty, baseAcc, interAcc, inv, stack) {
  if (!stack) stack = {};
  var have = inv[itemName] || 0;
  var consume = Math.min(have, qty);
  inv[itemName] = have - consume;
  
  var needed = qty - consume;
  if (needed <= 0) return;

  var recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + needed;
    return;
  }

  var effYield = getEffectiveYield(itemName, recipe);
  var times = Math.ceil(needed / effYield);
  
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + needed;
  }

  var nextStack = {};
  for (var k in stack) nextStack[k] = true;
  nextStack[itemName] = true;

  for (var i = 0; i < recipe.ingredients.length; i++) {
    var ingr = recipe.ingredients[i];
    expandNet(ingr.name, ingr.qty * times, baseAcc, interAcc, inv, nextStack);
  }
}

function netCalc() {
  var base = {}, inter = {}, inv = {};
  for (var k in inventory) inv[k] = inventory[k];

  for (var i = 0; i < craftList.length; i++) {
    var c = craftList[i];
    expandNet(c.item, c.qty, base, inter, inv);
  }
  return { base: base, inter: inter };
}
