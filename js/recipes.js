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
// Tracks which category each recipe belongs to (including user-added ones)
var recipeCategory = {}; // { "Item Name": "Act 1", ... }

// Build the flat defaultRecipesRaw and recipeCategory from all categories
var defaultRecipesRaw = {};
for (var _cat in recipeCategories) {
  for (var _item in recipeCategories[_cat]) {
    defaultRecipesRaw[_item] = recipeCategories[_cat][_item];
    recipeCategory[_item]    = _cat;
  }
}

// ── CATEGORY PERSISTENCE KEY ──────────────────────
var LS_CATEGORY = 'ic-category-v1';

function normalizeRecipes(raw) {
  var out = {};
  for (var k in raw) {
    var v = raw[k];
    out[k] = {
      yields: v.yields,
      ingredients: v.ingredients.map(function(i) {
        return { name: i.name, qty: i.qty };
      })
    };
  }
  return out;
}

// ── RECIPE CRUD ───────────────────────────────────
function renderRecipeList() {
  var list  = document.getElementById('recipeList');
  var names = Object.keys(recipes).sort();
  if (!names.length) {
    list.innerHTML = '<div class="empty-state">No recipes yet.</div>';
    return;
  }
  list.innerHTML = names.map(function(name) {
    var r      = recipes[name];
    var ingStr = r.ingredients.map(function(i) { return i.qty + '× ' + i.name; }).join(', ');
    var yNote  = r.yields > 1 ? ' <span style="color:var(--text-muted)">(yields ' + r.yields + ')</span>' : '';
    var cat    = recipeCategory[name] || '';
    var catNote = cat ? ' <span style="color:var(--text-muted);font-size:0.7rem;">[' + cat + ']</span>' : '';
    var safe   = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return '<div class="recipe-item">' +
      '<div>' +
        '<div class="recipe-item-name">' + name + yNote + catNote + '</div>' +
        '<div class="recipe-item-ingr">' + ingStr + '</div>' +
      '</div>' +
      '<button class="btn btn-danger" onclick="deleteRecipe(\'' + safe + '\')">✕</button>' +
    '</div>';
  }).join('');
}

function addIngredientRow() {
  var b   = document.getElementById('ingredientsBuilder');
  var row = document.createElement('div');
  row.className = 'ingredient-row';
  row.innerHTML =
    '<input type="number" class="ingr-qty" min="1" placeholder="Qty" />' +
    '<input type="text" class="ingr-name" placeholder="Ingredient" />' +
    '<button class="btn btn-danger" onclick="removeIngredientRow(this)">✕</button>';
  b.appendChild(row);
}

function removeIngredientRow(btn) {
  var b = document.getElementById('ingredientsBuilder');
  if (b.children.length > 1) btn.parentElement.remove();
}

function saveRecipe() {
  var name   = document.getElementById('recipeName').value.trim();
  var yields = parseInt(document.getElementById('recipeYields').value) || 1;
  var errEl  = document.getElementById('recipeError');
  if (!name) { errEl.textContent = 'Please enter an item name.'; return; }

  // Resolve category
  var catSel = document.getElementById('recipeCategory').value;
  var cat;
  if (catSel === '__new__') {
    cat = document.getElementById('recipeCategoryNew').value.trim();
    if (!cat) { errEl.textContent = 'Please enter a name for the new category.'; return; }
  } else {
    cat = catSel;
  }

  var rows        = document.querySelectorAll('#ingredientsBuilder .ingredient-row');
  var ingredients = [];
  for (var i = 0; i < rows.length; i++) {
    var qty     = parseInt(rows[i].querySelector('.ingr-qty').value);
    var ingName = rows[i].querySelector('.ingr-name').value.trim();
    if (!ingName || !qty || qty < 1) { errEl.textContent = 'Fill in all ingredient fields.'; return; }
    ingredients.push({ name: ingName, qty: qty });
  }
  if (!ingredients.length) { errEl.textContent = 'Add at least one ingredient.'; return; }
  for (var i = 0; i < ingredients.length; i++) {
    if (ingredients[i].name === name) { errEl.textContent = 'An item cannot contain itself.'; return; }
  }

  errEl.textContent = '';
  var isNew = !recipes[name];
  recipes[name] = { yields: yields, ingredients: ingredients };
  saveLS(LS_RECIPES, recipes);

  // Save category mapping
  recipeCategory[name] = cat;
  saveLS(LS_CATEGORY, recipeCategory);

  // If it's a new category not in recipeCategories, add it
  if (!recipeCategories[cat]) recipeCategories[cat] = {};
  recipeCategories[cat][name] = recipes[name];

  // Reset form
  document.getElementById('recipeName').value   = '';
  document.getElementById('recipeYields').value = '1';
  document.getElementById('recipeCategoryNew').value  = '';
  document.getElementById('recipeCategoryNew').style.display = 'none';
  document.getElementById('recipeCategory').value = 'Act 1';
  document.getElementById('ingredientsBuilder').innerHTML =
    '<div class="ingredient-row">' +
      '<input type="number" class="ingr-qty" min="1" placeholder="Qty" />' +
      '<input type="text" class="ingr-name" placeholder="Ingredient" />' +
      '<button class="btn btn-danger" onclick="removeIngredientRow(this)">✕</button>' +
    '</div>';

  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Recipe "' + name + '" ' + (isNew ? 'saved' : 'updated') + '! [' + cat + ']');
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
  showToast('Recipe "' + name + '" deleted.');
}

function restoreDefaults() {
  if (!confirm('Remove all custom recipes and restore the default set?')) return;
  recipes = normalizeRecipes(defaultRecipesRaw);

  // Reset recipeCategories and recipeCategory to defaults
  recipeCategories = {};
  recipeCategory   = {};
  var _defaultCats = {
    'Act 1': ["Copper Axe","Copper Sword","Copper Bow","Copper Staff","Copper Boots","Copper Chestplate","Copper Gloves","Copper Helmet","Copper Pickaxe","Bronze Boots","Bronze Chestplate","Bronze Gloves","Bronze Helmet","Bronze Pickaxe","Bronze Axe","Goak","Essence Sword","Iron Boots","Iron Chestplate","Iron Gloves","Iron Helmet","Iron Axe","Iron Pickaxe","Steel Sword","Steel Longsword","Steel Bow","Steel Staff","Steel Belt","Repair Stone 1","Bone Dagger"],
    'Act 2': ["Perfect Fur","Perfect Norse Essence","Artisan's Frame","Furstring","Cryolite","Repair Stone 2","Thorium Boots","Thorium Chestplate","Thorium Gloves","Thorium Helmet","Thorium Pickaxe","Thorium Axe","Thorium Sword","Thorium Longsword","Thorium Bow","Thorium Staff"],
    'Act 3': ["Perfect Silk Fabric","Perfect Aether Crystal","Sunstone Pickaxe","Sunstone Axe","Sunstone Boots","Sunstone Gloves","Sunstone Chestplate","Sunstone Helmet","Sunstone Longsword","Sunstone Bow","Sunstone Staff","Repair Stone 3"],
    'Hard':  ["Infinite Gloves I","Infinite Longsword I","Infinite Bow I","Infinite Staff I","Infinite Boots I","Infinite Chestplate I","Infinite Helmet I","Grassy Repair Stone I"],
    'Smeltery': ["Copper Bar","Tin Bar","Bronze Bar","Iron Bar","Charcoal","Steel Bar","Chadcoal","Thorium Bar","Palm Face","Sunstone Bar"]
  };
  for (var c in _defaultCats) {
    recipeCategories[c] = {};
    _defaultCats[c].forEach(function(n) {
      recipeCategories[c][n] = recipes[n];
      recipeCategory[n]      = c;
    });
  }

  saveLS(LS_RECIPES,  recipes);
  saveLS(LS_CATEGORY, recipeCategory);
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast('Default recipes restored.');
}

// ── IMPORT / EXPORT ───────────────────────────────
function exportRecipes() {
  if (!Object.keys(recipes).length) { showToast('No recipes to export.', true); return; }
  _downloadJSON(recipes, 'recipes.json');
  showToast('Recipes exported.');
}

function handleImportFile(e) {
  var file = e.target.files[0]; if (!file) return;
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
  if (typeof parsed !== 'object' || Array.isArray(parsed)) { showToast('JSON must be an object.', true); return; }

  var errors = [];
  for (var n in parsed) {
    var r = parsed[n];
    if (typeof r.yields !== 'number' || r.yields < 1) { errors.push('"' + n + '": bad yields'); continue; }
    if (!Array.isArray(r.ingredients) || !r.ingredients.length) { errors.push('"' + n + '": empty ingredients'); continue; }
    for (var i = 0; i < r.ingredients.length; i++) {
      var ingr = r.ingredients[i];
      if (typeof ingr.name !== 'string' || typeof ingr.qty !== 'number' || ingr.qty < 1)
        errors.push('"' + n + '": bad ingredient');
    }
  }
  if (errors.length) { showToast('Import failed — see console.', true); console.error(errors); return; }

  var norm = normalizeRecipes(parsed);
  var mode = document.querySelector('input[name="importMode"]:checked').value;
  if (mode === 'replace') {
    recipes = norm;
  } else {
    for (var k in norm) recipes[k] = norm[k];
  }

  // Assign imported items to a generic "Imported" category if unknown
  for (var k in norm) {
    if (!recipeCategory[k]) {
      recipeCategory[k] = 'Imported';
      if (!recipeCategories['Imported']) recipeCategories['Imported'] = {};
      recipeCategories['Imported'][k] = norm[k];
    }
  }

  saveLS(LS_RECIPES,  recipes);
  saveLS(LS_CATEGORY, recipeCategory);
  renderRecipeList();
  updateItemSelects();
  liveRecalc();
  showToast(Object.keys(parsed).length + ' recipe(s) imported (' + (mode === 'replace' ? 'replaced all' : 'merged') + ').');
}

function _downloadJSON(obj, filename) {
  var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
