(function init() {
  // Theme
  var t = 'light';
  try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch(e) {}
  applyTheme(t);

  // Load recipes
  var storedR = loadLS(LS_RECIPES);
  recipes = (storedR && Object.keys(storedR).length)
    ? storedR
    : normalizeRecipes(defaultRecipesRaw);
  if (!loadLS(LS_RECIPES)) saveLS(LS_RECIPES, recipes);

  // Load craft list and inventory
  craftList = loadLS(LS_CRAFT)  || [];
  inventory = loadLS(LS_INVENT) || {};

  // Render
  renderRecipeList();
  updateItemSelect();
  renderCraftList();
  liveRecalc();
})();
