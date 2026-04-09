var App = {
  init: function() {
    // 1. Initialize UI (Theme, etc)
    AppUI.init();

    // 2. Load recipes
    var storedRecipes = loadLS(LS_RECIPES);
    recipes = (storedRecipes && Object.keys(storedRecipes).length)
      ? storedRecipes
      : normalizeRecipes(defaultRecipesRaw);
    
    if (!loadLS(LS_RECIPES)) saveLS(LS_RECIPES, recipes);

    // 3. Load category mapping
    var storedCat = loadLS(LS_CATEGORY) || {};
    for (var k in storedCat) recipeCategory[k] = storedCat[k];
    
    // Ensure all recipes have a category
    for (var k in recipes) {
      if (!recipeCategory[k]) {
        recipeCategory[k] = 'Imported';
        if (!recipeCategories['Imported']) recipeCategories['Imported'] = {};
        recipeCategories['Imported'][k] = recipes[k];
      }
    }
    saveLS(LS_CATEGORY, recipeCategory);

    // 4. State listeners
    var catSel = document.getElementById('recipeCategory');
    if (catSel) {
      catSel.addEventListener('change', function() {
        var newInput = document.getElementById('recipeCategoryNew');
        if (newInput) newInput.style.display = this.value === '__new__' ? '' : 'none';
      });
    }

    // 5. Load user data
    craftList = loadLS(LS_CRAFT) || [];
    inventory = loadLS(LS_INVENT) || {};

    // 6. Initial render
    this.renderAll();
  },

  renderAll: function() {
    updateDatalist();
    renderRecipeList();
    updateItemSelects();
    renderCraftList();
    liveRecalc();
  }
};

// Start the application
document.addEventListener('DOMContentLoaded', function() { App.init(); });
