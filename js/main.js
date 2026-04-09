(function init() {
  var t = 'light';
  try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch(e) {}
  applyTheme(t);

  // Load recipes
  var storedR = loadLS(LS_RECIPES);
  recipes = (storedR && Object.keys(storedR).length)
    ? storedR
    : normalizeRecipes(defaultRecipesRaw);
  if (!loadLS(LS_RECIPES)) saveLS(LS_RECIPES, recipes);

  // Load category mapping — merge with defaults so built-in items are always categorised
  var storedCat = loadLS(LS_CATEGORY) || {};
  for (var k in storedCat) recipeCategory[k] = storedCat[k];
  // Ensure any saved recipe not in recipeCategory gets an "Imported" fallback
  for (var k in recipes) {
    if (!recipeCategory[k]) {
      recipeCategory[k] = 'Imported';
      if (!recipeCategories['Imported']) recipeCategories['Imported'] = {};
      recipeCategories['Imported'][k] = recipes[k];
    }
  }
  saveLS(LS_CATEGORY, recipeCategory);

  // Wire up the "New category" toggle in the form
  var catSel = document.getElementById('recipeCategory');
  if (catSel) {
    catSel.addEventListener('change', function() {
      var newInput = document.getElementById('recipeCategoryNew');
      newInput.style.display = this.value === '__new__' ? '' : 'none';
    });
  }

  // Load craft list and inventory
  craftList = loadLS(LS_CRAFT)  || [];
  inventory = loadLS(LS_INVENT) || {};

  renderRecipeList();
  updateItemSelects();
  renderCraftList();
  liveRecalc();
})();
