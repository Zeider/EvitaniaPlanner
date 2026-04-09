// ── DEFAULT RECIPES BY CATEGORY ───────────────────
var recipeCategories = {
  'Act 1': {
    "Copper Axe":        { yields: 1, ingredients: [{ name: "Copper Bar", qty: 3 }, { name: "Ash Log", qty: 1 }] },
    "Copper Sword":      { yields: 1, ingredients: [{ name: "Copper Bar", qty: 10 }, { name: "Stoney Mcstoneface", qty: 10 }, { name: "Death's Flower", qty: 1 }] },
    "Copper Bow":        { yields: 1, ingredients: [{ name: "Ash Log", qty: 30 }, { name: "Leaf", qty: 10 }, { name: "Death's Flower", qty: 1 }] },
    "Copper Staff":      { yields: 1, ingredients: [{ name: "Ash Log", qty: 15 }, { name: "Copper Bar", qty: 5 }, { name: "Honeycomb", qty: 10 }, { name: "Death's Flower", qty: 1 }] },
    "Copper Boots":      { yields: 1, ingredients: [{ name: "Copper Bar", qty: 2 }, { name: "Honeycomb", qty: 4 }] },
    "Copper Chestplate": { yields: 1, ingredients: [{ name: "Copper Bar", qty: 8 }, { name: "Stoney Mcstoneface", qty: 20 }] },
    "Copper Gloves":     { yields: 1, ingredients: [{ name: "Copper Bar", qty: 4 }, { name: "Leaf", qty: 10 }] },
    "Copper Helmet":     { yields: 1, ingredients: [{ name: "Copper Bar", qty: 5 }, { name: "Mini Plants", qty: 12 }] },
    "Copper Pickaxe":    { yields: 1, ingredients: [{ name: "Copper Bar", qty: 3 }, { name: "Ash Log", qty: 1 }] },
    "Bronze Boots":      { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 20 }, { name: "Wolf Fang", qty: 50 }] },
    "Bronze Chestplate": { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 20 }, { name: "Fruit", qty: 50 }] },
    "Bronze Gloves":     { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 20 }, { name: "Ectoplasm", qty: 50 }] },
    "Bronze Helmet":     { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 20 }, { name: "Crab Claw", qty: 50 }] },
    "Bronze Pickaxe":    { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 3 }, { name: "Goak Log", qty: 15 }] },
    "Bronze Axe":        { yields: 1, ingredients: [{ name: "Bronze Bar", qty: 20 }, { name: "Goak Log", qty: 15 }] },
    "Goak":              { yields: 1, ingredients: [{ name: "Pyrewood Log", qty: 50 }] },
    "Essence Sword":     { yields: 1, ingredients: [{ name: "Blue Essence", qty: 1 }, { name: "Red Essence", qty: 1 }, { name: "Pink Essence", qty: 1 }, { name: "Black Essence", qty: 1 }] },
    "Iron Boots":        { yields: 1, ingredients: [{ name: "Iron Bar", qty: 16 }, { name: "Candle", qty: 50 }] },
    "Iron Chestplate":   { yields: 1, ingredients: [{ name: "Iron Bar", qty: 36 }, { name: "Weird Page", qty: 50 }] },
    "Iron Gloves":       { yields: 1, ingredients: [{ name: "Iron Bar", qty: 16 }, { name: "D20 Dice", qty: 50 }] },
    "Iron Helmet":       { yields: 1, ingredients: [{ name: "Iron Bar", qty: 16 }, { name: "Fire Essence", qty: 50 }] },
    "Iron Axe":          { yields: 1, ingredients: [{ name: "Iron Bar", qty: 20 }, { name: "Pyrewood Log", qty: 15 }] },
    "Iron Pickaxe":      { yields: 1, ingredients: [{ name: "Iron Bar", qty: 3 }, { name: "Pyrewood Log", qty: 15 }] },
    "Steel Sword":       { yields: 1, ingredients: [{ name: "Steel Bar", qty: 15 }, { name: "Yellow Feather", qty: 2 }] },
    "Steel Longsword":   { yields: 1, ingredients: [{ name: "Steel Bar", qty: 15 }, { name: "Yellow Feather", qty: 2 }] },
    "Steel Bow":         { yields: 1, ingredients: [{ name: "Pyrewood Log", qty: 30 }, { name: "Yellow Feather", qty: 2 }] },
    "Steel Staff":       { yields: 1, ingredients: [{ name: "Pyrewood Log", qty: 30 }, { name: "Yellow Feather", qty: 2 }] },
    "Steel Belt":        { yields: 1, ingredients: [{ name: "Steel Bar", qty: 20 }, { name: "Death's Flower", qty: 2 }, { name: "Dragon Horn", qty: 2 }] },
    "Repair Stone 1":    { yields: 1, ingredients: [{ name: "Steel Bar", qty: 100 }] },
    "Bone Dagger":       { yields: 1, ingredients: [{ name: "Animal Bone", qty: 1 }] }
  },
  'Act 2': {
    "Perfect Fur":           { yields: 5, ingredients: [{ name: "Furry Fur", qty: 30 }] },
    "Perfect Norse Essence": { yields: 1, ingredients: [{ name: "Norse Essence", qty: 30 }] },
    "Artisan's Frame":       { yields: 1, ingredients: [{ name: "Steel Bar", qty: 10 }, { name: "Chadcoal", qty: 100 }, { name: "Helmet Helmet", qty: 5000 }] },
    "Furstring":             { yields: 1, ingredients: [{ name: "Perfect Fur", qty: 25 }, { name: "Yellow Feather", qty: 100 }, { name: "Nut", qty: 5000 }] },
    "Cryolite":              { yields: 1, ingredients: [{ name: "Cryolite Ore", qty: 15 }, { name: "Norse Essence", qty: 5 }, { name: "Carrot", qty: 5000 }] },
    "Repair Stone 2":        { yields: 1, ingredients: [{ name: "Thorium Bar", qty: 100 }] },
    "Thorium Boots":         { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 10 }, { name: "Perfect Fur", qty: 25 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 47 }] },
    "Thorium Chestplate":    { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 63 }, { name: "Perfect Fur", qty: 80 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 108 }] },
    "Thorium Gloves":        { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 10 }, { name: "Perfect Fur", qty: 25 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 47 }] },
    "Thorium Helmet":        { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 19 }, { name: "Perfect Fur", qty: 40 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 62 }] },
    "Thorium Pickaxe":       { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 40 }, { name: "Norse Essence", qty: 5 }, { name: "Thorium Bar", qty: 30 }, { name: "Jotunn Eye", qty: 10 }] },
    "Thorium Axe":           { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 40 }, { name: "Norse Essence", qty: 5 }, { name: "Thorium Bar", qty: 30 }, { name: "Mammoth Bitusk", qty: 10 }] },
    "Thorium Sword":         { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Artisan's Frame", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
    "Thorium Longsword":     { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Artisan's Frame", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
    "Thorium Bow":           { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Furstring", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
    "Thorium Staff":         { yields: 1, ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Cryolite", qty: 3 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] }
  },
  'Act 3': {
    "Perfect Silk Fabric":    { yields: 1, ingredients: [{ name: "Torn Silk Fabric", qty: 3 }, { name: "Crystallized Blue Substance", qty: 3 }] },
    "Perfect Aether Crystal": { yields: 1, ingredients: [{ name: "Aether Crystal Shards", qty: 2 }, { name: "Crystallized Blue Substance", qty: 6 }] },
    "Sunstone Pickaxe":       { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 200 }, { name: "Palm Tree Log", qty: 15000 }, { name: "Kangaroo Boomerang", qty: 40000 }, { name: "Perfect Aether Crystal", qty: 1 }] },
    "Sunstone Axe":           { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 600 }, { name: "Palm Tree Log", qty: 15000 }, { name: "Cactus", qty: 30000 }, { name: "Perfect Aether Crystal", qty: 1 }] },
    "Sunstone Boots":         { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 400 }, { name: "Fez Fez", qty: 20000 }, { name: "Perfect Silk Fabric", qty: 3 }] },
    "Sunstone Gloves":        { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 400 }, { name: "Fez Fez", qty: 20000 }, { name: "Perfect Silk Fabric", qty: 3 }] },
    "Sunstone Chestplate":    { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 720 }, { name: "Serpent Feather", qty: 35000 }, { name: "Perfect Silk Fabric", qty: 5 }] },
    "Sunstone Helmet":        { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 1150 }, { name: "Bandiff Star", qty: 45000 }, { name: "Perfect Silk Fabric", qty: 8 }] },
    "Sunstone Longsword":     { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 860 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 100000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
    "Sunstone Bow":           { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 290 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 600000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
    "Sunstone Staff":         { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 600 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 400000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
    "Repair Stone 3":         { yields: 1, ingredients: [{ name: "Sunstone Bar", qty: 200 }] }
  },
  'Hard': {
    "Infinite Gloves I":      { yields: 1, ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "Death's Flower", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
    "Infinite Longsword I":   { yields: 1, ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Kangaroo Boomerang", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
    "Infinite Bow I":         { yields: 1, ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Cactus", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
    "Infinite Staff I":       { yields: 1, ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Poop Ball", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
    "Infinite Boots I":       { yields: 1, ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "The Crab's Pickaxe", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
    "Infinite Chestplate I":  { yields: 1, ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "Dragon Horn", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
    "Infinite Helmet I":      { yields: 1, ingredients: [{ name: "Steel Bar", qty: 57600 }, { name: "Grassy Stone I", qty: 72000 }, { name: "Death's Flower", qty: 1000 }, { name: "Dragon Horn", qty: 1000 }, { name: "The Crab's Pickaxe", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 30 }] },
    "Grassy Repair Stone I":  { yields: 1, ingredients: [{ name: "Steel Bar", qty: 5000 }, { name: "Grassy Stone I", qty: 5000 }] }
  },
  'Smeltery': {
    "Copper Bar":   { yields: 1, ingredients: [{ name: "Copper Ore", qty: 2 }] },
    "Tin Bar":      { yields: 1, ingredients: [{ name: "Tin Ore", qty: 3 }] },
    "Bronze Bar":   { yields: 1, ingredients: [{ name: "Copper Bar", qty: 2 }, { name: "Tin Bar", qty: 1 }] },
    "Iron Bar":     { yields: 1, ingredients: [{ name: "Iron Ore", qty: 5 }, { name: "Ash Log", qty: 8 }] },
    "Charcoal":     { yields: 1, ingredients: [{ name: "Pyrewood Log", qty: 10 }] },
    "Steel Bar":    { yields: 1, ingredients: [{ name: "Iron Bar", qty: 3 }, { name: "Charcoal", qty: 1 }] },
    "Chadcoal":     { yields: 1, ingredients: [{ name: "Ironwood Log", qty: 10 }] },
    "Thorium Bar":  { yields: 1, ingredients: [{ name: "Thorium Ore", qty: 42 }, { name: "Chadcoal", qty: 30 }] },
    "Palm Face":    { yields: 1, ingredients: [{ name: "Palm Tree Log", qty: 50 }] },
    "Sunstone Bar": { yields: 1, ingredients: [{ name: "Sunstone Ore", qty: 480 }, { name: "Palm Face", qty: 56 }] }
  }
};

// ── CATEGORY METADATA ─────────────────────────────
var recipeCategory = {};
var defaultRecipesRaw = {};

for (var cat in recipeCategories) {
  var items = recipeCategories[cat];
  for (var name in items) {
    defaultRecipesRaw[name] = items[name];
    recipeCategory[name] = cat;
  }
}

function normalizeRecipes(raw) {
  var out = {};
  var keys = Object.keys(raw);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = raw[k];
    out[k] = {
      yields: v.yields,
      ingredients: v.ingredients.map(function(ingr) {
        return { name: ingr.name, qty: ingr.qty };
      })
    };
  }
  return out;
}

function updateDatalist() {
  var dl = document.getElementById('itemsDatalist');
  if (!dl) return;
  var names = Object.keys(recipes).sort();
  var html = '';
  for (var i = 0; i < names.length; i++) {
    html += '<option value="' + names[i] + '">';
  }
  dl.innerHTML = html;
}

// ── RECIPE CRUD ───────────────────────────────────
function renderRecipeList() {
  var list = document.getElementById('recipeList');
  if (!list) return;
  
  var names = Object.keys(recipes).sort();
  if (!names.length) {
    list.innerHTML = '<div class="empty-state">No recipes yet.</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    var r = recipes[name];
    var ings = [];
    for (var j = 0; j < r.ingredients.length; j++) {
      ings.push(r.ingredients[j].qty + '× ' + r.ingredients[j].name);
    }
    var ingStr = ings.join(', ');
    var yNote = r.yields > 1 ? ' <span style="opacity:0.6">(yields ' + r.yields + ')</span>' : '';
    var cat = recipeCategory[name] || 'Unknown';
    var safe = name.replace(/'/g, "\\'");
    
    html +=
      '<div class="recipe-item">' +
        '<div style="flex:1">' +
          '<div class="recipe-item-name">' +
            name + yNote +
            ' <span style="font-size:0.65rem; font-weight:700; background:hsla(var(--p-hue),70%,65%,0.15); color:var(--primary); padding:1px 6px; border-radius:4px; margin-left:8px; vertical-align:middle; text-transform:uppercase; letter-spacing:0.02em;">' + cat + '</span>' +
          '</div>' +
          '<div class="recipe-item-ingr">' + ingStr + '</div>' +
        '</div>' +
        '<div style="display:flex; gap:0.5rem;">' +
          '<button class="btn btn-edit btn-sm" style="min-width:32px; height:32px; justify-content:center; padding:0; border-radius:10px;" onclick="editRecipe(\'' + safe + '\')">✎</button>' +
          '<button class="btn btn-danger btn-sm" style="min-width:32px; height:32px; justify-content:center; padding:0; border-radius:10px;" onclick="deleteRecipe(\'' + safe + '\')">✕</button>' +
        '</div>' +
      '</div>';
  }
  list.innerHTML = html;
}

function addIngredientRow(name, qty) {
  var b = document.getElementById('ingredientsBuilder');
  var row = document.createElement('div');
  row.className = 'ingredient-row';
  row.innerHTML =
    '<input type="number" class="ingr-qty" min="1" placeholder="Qty" value="' + (qty || '') + '" />' +
    '<input type="text" class="ingr-name" placeholder="Ingredient" list="itemsDatalist" value="' + (name || '') + '" />' +
    '<button class="btn btn-danger btn-sm" onclick="removeIngredientRow(this)">✕</button>';
  b.appendChild(row);
}

function removeIngredientRow(btn) {
  var b = document.getElementById('ingredientsBuilder');
  if (b.children.length > 1) btn.parentElement.remove();
}

function editRecipe(name) {
  var r = recipes[name];
  if (!r) return;
  
  var body = document.getElementById('addRecipeBody');
  if (body && body.classList.contains('collapsed')) {
    toggleSection('addRecipeBody', 'addRecipeToggle');
  }

  document.getElementById('recipeName').value = name;
  document.getElementById('recipeYields').value = r.yields;
  
  var cat = recipeCategory[name] || 'Act 1';
  var catSel = document.getElementById('recipeCategory');
  catSel.value = cat;
  document.getElementById('recipeCategoryNew').style.display = 'none';

  var builder = document.getElementById('ingredientsBuilder');
  builder.innerHTML = '';
  for (var i = 0; i < r.ingredients.length; i++) {
    var ing = r.ingredients[i];
    addIngredientRow(ing.name, ing.qty);
  }
  
  document.getElementById('addRecipeBody').scrollIntoView({ behavior: 'smooth' });
  showToast('Recipe loaded for editing.');
}

function saveRecipe() {
  var name = document.getElementById('recipeName').value.trim();
  var yields = parseInt(document.getElementById('recipeYields').value) || 1;
  var errEl = document.getElementById('recipeError');
  if (!name) { errEl.textContent = 'Please enter an item name.'; return; }

  var catSel = document.getElementById('recipeCategory').value;
  var cat;
  if (catSel === '__new__') {
    cat = document.getElementById('recipeCategoryNew').value.trim();
    if (!cat) { errEl.textContent = 'Please enter a name for the new category.'; return; }
  } else {
    cat = catSel;
  }

  var rows = document.querySelectorAll('#ingredientsBuilder .ingredient-row');
  var ingredients = [];
  for (var i = 0; i < rows.length; i++) {
    var qtyVal = rows[i].querySelector('.ingr-qty').value;
    var qty = parseInt(qtyVal);
    var ingName = rows[i].querySelector('.ingr-name').value.trim();
    if (ingName && qty > 0) ingredients.push({ name: ingName, qty: qty });
  }

  if (!ingredients.length) { errEl.textContent = 'Add at least one ingredient.'; return; }
  
  var selfFound = false;
  for (var j = 0; j < ingredients.length; j++) {
    if (ingredients[j].name === name) { selfFound = true; break; }
  }
  if (selfFound) { errEl.textContent = 'An item cannot contain itself.'; return; }

  recipes[name] = { yields: yields, ingredients: ingredients };
  saveLS(LS_RECIPES, recipes);

  recipeCategory[name] = cat;
  saveLS(LS_CATEGORY, recipeCategory);

  if (!recipeCategories[cat]) recipeCategories[cat] = {};
  recipeCategories[cat][name] = recipes[name];

  // Reset form
  document.getElementById('recipeName').value = '';
  document.getElementById('recipeYields').value = '1';
  document.getElementById('recipeCategoryNew').value = '';
  document.getElementById('recipeCategoryNew').style.display = 'none';
  document.getElementById('recipeCategory').value = 'Act 1';
  document.getElementById('ingredientsBuilder').innerHTML =
    '<div class="ingredient-row">' +
      '<input type="number" class="ingr-qty" min="1" placeholder="Qty" />' +
      '<input type="text" class="ingr-name" placeholder="Ingredient" list="itemsDatalist" />' +
      '<button class="btn btn-danger btn-sm" onclick="removeIngredientRow(this)">✕</button>' +
    '</div>';

  updateDatalist();
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Recipe "' + name + '" saved!');
}

function deleteRecipe(name) {
  if (!confirm('Delete recipe for "' + name + '"?')) return;
  var cat = recipeCategory[name];
  delete recipes[name];
  delete recipeCategory[name];
  if (cat && recipeCategories[cat]) delete recipeCategories[cat][name];
  
  saveLS(LS_RECIPES, recipes);
  saveLS(LS_CATEGORY, recipeCategory);
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Recipe deleted.');
}

function restoreDefaults() {
  if (!confirm('Restore the default recipes? Custom additions will be lost.')) return;
  recipes = normalizeRecipes(defaultRecipesRaw);
  recipeCategory = {};
  
  for (var cat in recipeCategories) {
    var items = recipeCategories[cat];
    for (var n in items) {
      recipeCategory[n] = cat;
    }
  }

  saveLS(LS_RECIPES, recipes);
  saveLS(LS_CATEGORY, recipeCategory);
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Defaults restored.');
}

// ── IMPORT / EXPORT ───────────────────────────────
function exportRecipes() {
  if (!Object.keys(recipes).length) { showToast('No recipes to export.', true); return; }
  var blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'recipes.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Export successful.');
}

function handleImportFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) { processImport(ev.target.result); e.target.value = ''; };
  reader.readAsText(file);
}

function importFromPaste() {
  var raw = document.getElementById('jsonPasteArea').value.trim();
  if (!raw) { showToast('Paste area is empty.', true); return; }
  processImport(raw);
}

function processImport(raw) {
  var parsed;
  try { parsed = JSON.parse(raw); } catch(ex) { showToast('Invalid JSON.', true); return; }
  
  var norm = normalizeRecipes(parsed);
  var mode = document.querySelector('input[name="importMode"]:checked').value;
  
  if (mode === 'replace') {
    recipes = norm;
  } else {
    for (var k in norm) recipes[k] = norm[k];
  }

  var keys = Object.keys(norm);
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!recipeCategory[k]) recipeCategory[k] = 'Imported';
  }

  saveLS(LS_RECIPES, recipes);
  saveLS(LS_CATEGORY, recipeCategory);
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Import successful!');
}
