import recipesData from '../data/recipes.json';
import gearData from '../data/gear.json';

/** Build a flat recipe lookup: recipeName → recipe object (from any category). */
function buildRecipeLookup() {
  const flat = {};
  for (const category of Object.values(recipesData)) {
    for (const [name, recipe] of Object.entries(category)) {
      flat[name] = recipe;
    }
  }
  return flat;
}
const recipeLookup = buildRecipeLookup();

/** Recursively expand a recipe into base materials. Returns a map of
 *  { materialName: totalNeeded } aggregated across the recursion tree.
 *  Items with no recipe are treated as base materials (leaf). */
function expandRecipe(recipeName, qty, accum = {}) {
  const recipe = recipeLookup[recipeName];
  if (!recipe) {
    accum[recipeName] = (accum[recipeName] || 0) + qty;
    return accum;
  }
  const yields = recipe.yields || 1;
  const runs = Math.ceil(qty / yields);
  for (const ing of recipe.ingredients || []) {
    expandRecipe(ing.name, ing.qty * runs, accum);
  }
  return accum;
}

/**
 * Expand a progression target into a flat base-material list.
 *
 * target shape: { type, value } where type is one of:
 *   - 'gearPiece'     — value is a recipe name (e.g. "Thorium Boots")
 *   - 'gearSet'       — value is a tier name (e.g. "Thorium"); expands all
 *                       craftable items whose name starts with that tier
 *   - 'autoNextTier'  — delegates to Upgrade Advisor's next-tier suggestion
 *                       (stubbed for this MVP — returns empty until wired)
 */
export function expandTargetToMaterials(target, profile) {
  if (!target) return [];

  let recipeNames = [];
  if (target.type === 'gearPiece') {
    if (recipeLookup[target.value]) recipeNames = [target.value];
  } else if (target.type === 'gearSet') {
    // Placeholder — implemented in Task 3
    return [];
  } else if (target.type === 'autoNextTier') {
    // Placeholder — implemented in Task 3b (follow-up) or a later pass
    return [];
  }

  const accum = {};
  for (const name of recipeNames) {
    expandRecipe(name, 1, accum);
  }

  return Object.entries(accum).map(([material, totalNeeded]) => ({
    material,
    totalNeeded,
  }));
}
