// ── DEFAULT RECIPES ───────────────────────────────
var defaultRecipesRaw = {
  "Perfect Fur":              { yields: 5,  ingredients: [{ name: "Furry Fur", qty: 30 }] },
  "Perfect Norse Essence":    { yields: 1,  ingredients: [{ name: "Norse Essence", qty: 30 }] },
  "Artisan's Frame":          { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 10 }, { name: "Chadcoal", qty: 100 }, { name: "Helmet Helmet", qty: 5000 }] },
  "Furstring":                { yields: 1,  ingredients: [{ name: "Perfect Fur", qty: 25 }, { name: "Yellow Feather", qty: 100 }, { name: "Nut", qty: 5000 }] },
  "Cryolite":                 { yields: 1,  ingredients: [{ name: "Cryolite Ore", qty: 15 }, { name: "Norse Essence", qty: 5 }, { name: "Carrot", qty: 5000 }] },
  "Repair Stone 2":           { yields: 1,  ingredients: [{ name: "Thorium Bar", qty: 100 }] },
  "Thorium Boots":            { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 10 }, { name: "Perfect Fur", qty: 25 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 47 }] },
  "Thorium Chestplate":       { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 63 }, { name: "Perfect Fur", qty: 80 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 108 }] },
  "Thorium Gloves":           { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 10 }, { name: "Perfect Fur", qty: 25 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 47 }] },
  "Thorium Helmet":           { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 19 }, { name: "Perfect Fur", qty: 40 }, { name: "Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 62 }] },
  "Thorium Pickaxe":          { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 40 }, { name: "Norse Essence", qty: 5 }, { name: "Thorium Bar", qty: 30 }, { name: "Jotunn Eye", qty: 10 }] },
  "Thorium Axe":              { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 40 }, { name: "Norse Essence", qty: 5 }, { name: "Thorium Bar", qty: 30 }, { name: "Mammoth Bitusk", qty: 10 }] },
  "Thorium Sword":            { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Artisan's Frame", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
  "Thorium Longsword":        { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Artisan's Frame", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
  "Thorium Bow":              { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Furstring", qty: 7 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
  "Thorium Staff":            { yields: 1,  ingredients: [{ name: "Crystalized Yellow Substance", qty: 140 }, { name: "Cryolite", qty: 3 }, { name: "Perfect Norse Essence", qty: 2 }, { name: "Thorium Bar", qty: 98 }] },
  "Copper Bar":               { yields: 1,  ingredients: [{ name: "Copper Ore", qty: 2 }] },
  "Tin Bar":                  { yields: 1,  ingredients: [{ name: "Tin Ore", qty: 3 }] },
  "Bronze Bar":               { yields: 1,  ingredients: [{ name: "Copper Bar", qty: 2 }, { name: "Tin Bar", qty: 1 }] },
  "Iron Bar":                 { yields: 1,  ingredients: [{ name: "Iron Ore", qty: 5 }, { name: "Ash Log", qty: 8 }] },
  "Charcoal":                 { yields: 1,  ingredients: [{ name: "Pyrewood Log", qty: 10 }] },
  "Steel Bar":                { yields: 1,  ingredients: [{ name: "Iron Bar", qty: 3 }, { name: "Charcoal", qty: 1 }] },
  "Chadcoal":                 { yields: 1,  ingredients: [{ name: "Ironwood Log", qty: 10 }] },
  "Thorium Bar":              { yields: 1,  ingredients: [{ name: "Thorium Ore", qty: 42 }, { name: "Chadcoal", qty: 30 }] },
  "Palm Face":                { yields: 1,  ingredients: [{ name: "Palm Tree Log", qty: 50 }] },
  "Sunstone Bar":             { yields: 1,  ingredients: [{ name: "Sunstone Ore", qty: 480 }, { name: "Palm Face", qty: 56 }] },
  "Perfect Silk Fabric":      { yields: 1,  ingredients: [{ name: "Torn Silk Fabric", qty: 3 }, { name: "Crystallized Blue Substance", qty: 3 }] },
  "Perfect Aether Crystal":   { yields: 1,  ingredients: [{ name: "Aether Crystal Shards", qty: 2 }, { name: "Crystallized Blue Substance", qty: 6 }] },
  "Sunstone Pickaxe":         { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 200 }, { name: "Palm Tree Log", qty: 15000 }, { name: "Kangaroo Boomerang", qty: 40000 }, { name: "Perfect Aether Crystal", qty: 1 }] },
  "Sunstone Axe":             { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 600 }, { name: "Palm Tree Log", qty: 15000 }, { name: "Cactus", qty: 30000 }, { name: "Perfect Aether Crystal", qty: 1 }] },
  "Sunstone Boots":           { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 400 }, { name: "Fez Fez", qty: 20000 }, { name: "Perfect Silk Fabric", qty: 3 }] },
  "Sunstone Gloves":          { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 400 }, { name: "Fez Fez", qty: 20000 }, { name: "Perfect Silk Fabric", qty: 3 }] },
  "Sunstone Chestplate":      { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 720 }, { name: "Serpent Feather", qty: 35000 }, { name: "Perfect Silk Fabric", qty: 5 }] },
  "Sunstone Helmet":          { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 1150 }, { name: "Bandiff Star", qty: 45000 }, { name: "Perfect Silk Fabric", qty: 8 }] },
  "Sunstone Longsword":       { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 860 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 100000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
  "Sunstone Bow":             { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 290 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 600000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
  "Sunstone Staff":           { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 600 }, { name: "Beetleman Sting", qty: 70000 }, { name: "Palm Tree Log", qty: 400000 }, { name: "Perfect Aether Crystal", qty: 3 }] },
  "Repair Stone 3":           { yields: 1,  ingredients: [{ name: "Sunstone Bar", qty: 200 }] },
  "Infinite Gloves I":        { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "Death's Flower", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
  "Infinite Longsword I":     { yields: 1,  ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Kangaroo Boomerang", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
  "Infinite Bow I":           { yields: 1,  ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Cactus", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
  "Infinite Staff I":         { yields: 1,  ingredients: [{ name: "Thorium Bar", qty: 15000 }, { name: "Icy Stone I", qty: 300000 }, { name: "Poop Ball", qty: 450000 }, { name: "Death's Flower", qty: 2000 }, { name: "Dragon Horn", qty: 2000 }, { name: "The Crab's Pickaxe", qty: 2000 }] },
  "Grassy Repair Stone I":    { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 5000 }, { name: "Grassy Stone I", qty: 5000 }] },
  "Infinite Boots I":         { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "The Crab's Pickaxe", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
  "Infinite Chestplate I":    { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 19200 }, { name: "Grassy Stone I", qty: 24000 }, { name: "Dragon Horn", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 10 }] },
  "Infinite Helmet I":        { yields: 1,  ingredients: [{ name: "Steel Bar", qty: 57600 }, { name: "Grassy Stone I", qty: 72000 }, { name: "Death's Flower", qty: 1000 }, { name: "Dragon Horn", qty: 1000 }, { name: "The Crab's Pickaxe", qty: 1000 }, { name: "Crystallized Blue Substance", qty: 30 }] }
};

function normalizeRecipes(raw) {
  var out = {};
  for (var k in raw) {
    var v = raw[k];
    out[toTitleCase(k)] = {
      yields: v.yields,
      ingredients: v.ingredients.map(function(i) {
        return { name: toTitleCase(i.name), qty: i.qty };
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
    var safe   = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return '<div class="recipe-item">' +
      '<div>' +
        '<div class="recipe-item-name">' + name + yNote + '</div>' +
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
  var name   = toTitleCase(document.getElementById('recipeName').value.trim());
  var yields = parseInt(document.getElementById('recipeYields').value) || 1;
  var errEl  = document.getElementById('recipeError');
  if (!name) { errEl.textContent = 'Please enter an item name.'; return; }

  var rows        = document.querySelectorAll('#ingredientsBuilder .ingredient-row');
  var ingredients = [];
  for (var i = 0; i < rows.length; i++) {
    var qty     = parseInt(rows[i].querySelector('.ingr-qty').value);
    var ingName = toTitleCase(rows[i].querySelector('.ingr-name').value.trim());
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

  document.getElementById('recipeName').value   = '';
  document.getElementById('recipeYields').value = '1';
  document.getElementById('ingredientsBuilder').innerHTML =
    '<div class="ingredient-row">' +
      '<input type="number" class="ingr-qty" min="1" placeholder="Qty" />' +
      '<input type="text" class="ingr-name" placeholder="Ingredient" />' +
      '<button class="btn btn-danger" onclick="removeIngredientRow(this)">✕</button>' +
    '</div>';

  renderRecipeList();
  updateItemSelect();
  liveRecalc();
  showToast('Recipe "' + name + '" ' + (isNew ? 'saved' : 'updated') + '!');
}

function deleteRecipe(name) {
  if (!confirm('Delete recipe for "' + name + '"?')) return;
  delete recipes[name];
  saveLS(LS_RECIPES, recipes);
  renderRecipeList();
  updateItemSelect();
  liveRecalc();
  showToast('Recipe "' + name + '" deleted.');
}

function restoreDefaults() {
  if (!confirm('Remove all custom recipes and restore the default set?')) return;
  recipes = normalizeRecipes(defaultRecipesRaw);
  saveLS(LS_RECIPES, recipes);
  renderRecipeList();
  updateItemSelect();
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
  saveLS(LS_RECIPES, recipes);
  renderRecipeList();
  updateItemSelect();
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
