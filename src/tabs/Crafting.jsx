import { useState, useMemo, useCallback, useRef } from 'preact/hooks';
import recipesData from '../data/recipes.json';

// ── localStorage keys (backwards-compatible with legacy) ──
const LS_RECIPES = 'ic-recipes-v1';
const LS_CRAFT = 'ic-craft-v1';
const LS_INVENT = 'ic-invent-v1';
const LS_CATEGORY = 'ic-category-v1';
const LS_MULTICRAFT = 'ic-multicraft-v1';

// ── Helpers ──
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* noop */ }
}
function loadLS(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; }
}

// ── Build flat recipe map + category map from categorized data ──
function buildMaps(categorizedRecipes) {
  const flat = {};
  const catMap = {};
  for (const cat of Object.keys(categorizedRecipes)) {
    const items = categorizedRecipes[cat];
    for (const name of Object.keys(items)) {
      flat[name] = items[name];
      catMap[name] = cat;
    }
  }
  return { flat, catMap };
}

const defaultMaps = buildMaps(recipesData);

function loadRecipes() {
  const stored = loadLS(LS_RECIPES);
  if (stored && Object.keys(stored).length) return stored;
  return { ...defaultMaps.flat };
}

function loadRecipeCategory() {
  const stored = loadLS(LS_CATEGORY) || {};
  // Merge with defaults to ensure all built-in items have categories
  const merged = { ...defaultMaps.catMap, ...stored };
  return merged;
}

function loadCraftList() {
  return loadLS(LS_CRAFT) || [];
}

function loadInventory() {
  return loadLS(LS_INVENT) || {};
}

function loadMulticraft() {
  const stored = loadLS(LS_MULTICRAFT);
  return typeof stored === 'number' ? stored : 0;
}

// ── Calculation Engine ──
function getEffectiveYield(itemName, recipe, catMap, multicraftLevel) {
  const yields = recipe.yields || 1;
  const cat = catMap[itemName];
  if (cat && cat.toLowerCase() === 'smeltery') {
    if (multicraftLevel === 2) return yields * 2;
    if (multicraftLevel === 4) return yields * 3;
  }
  return yields;
}

function expand(itemName, qty, recipes, catMap, multicraftLevel, baseAcc, interAcc, stack) {
  if (!stack) stack = {};
  const recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }
  const effYield = getEffectiveYield(itemName, recipe, catMap, multicraftLevel);
  const times = Math.ceil(qty / effYield);
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + qty;
  }
  const nextStack = { ...stack, [itemName]: true };
  for (const ingr of recipe.ingredients) {
    expand(ingr.name, ingr.qty * times, recipes, catMap, multicraftLevel, baseAcc, interAcc, nextStack);
  }
}

function rawCalc(craftList, recipes, catMap, multicraftLevel) {
  const base = {}, inter = {};
  for (const c of craftList) {
    expand(c.item, c.qty, recipes, catMap, multicraftLevel, base, inter);
  }
  return { base, inter };
}

function expandNet(itemName, qty, recipes, catMap, multicraftLevel, baseAcc, interAcc, inv, stack) {
  if (!stack) stack = {};
  const have = inv[itemName] || 0;
  const consume = Math.min(have, qty);
  inv[itemName] = have - consume;
  const needed = qty - consume;
  if (needed <= 0) return;

  const recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + needed;
    return;
  }
  const effYield = getEffectiveYield(itemName, recipe, catMap, multicraftLevel);
  const times = Math.ceil(needed / effYield);
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + needed;
  }
  const nextStack = { ...stack, [itemName]: true };
  for (const ingr of recipe.ingredients) {
    expandNet(ingr.name, ingr.qty * times, recipes, catMap, multicraftLevel, baseAcc, interAcc, inv, nextStack);
  }
}

function netCalc(craftList, recipes, catMap, inventory, multicraftLevel) {
  const base = {}, inter = {};
  const inv = { ...inventory };
  for (const c of craftList) {
    expandNet(c.item, c.qty, recipes, catMap, multicraftLevel, base, inter, inv);
  }
  return { base, inter };
}

// By-item allocation expand (for individual item breakdowns)
function expandForItemWithAllocation(itemName, qty, recipes, catMap, multicraftLevel, baseAcc, interAcc, mutableInv, stack) {
  if (!stack) stack = {};
  const have = mutableInv[itemName] || 0;
  const consume = Math.min(have, qty);
  mutableInv[itemName] = have - consume;
  const remaining = qty - consume;

  if (remaining <= 0) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }

  const recipe = recipes[itemName];
  if (!recipe || stack[itemName]) {
    baseAcc[itemName] = (baseAcc[itemName] || 0) + qty;
    return;
  }

  const effYield = getEffectiveYield(itemName, recipe, catMap, multicraftLevel);
  const times = Math.ceil(remaining / effYield);
  if (Object.keys(stack).length > 0) {
    interAcc[itemName] = (interAcc[itemName] || 0) + remaining;
  }

  const nextStack = { ...stack, [itemName]: true };
  for (const ingr of recipe.ingredients) {
    expandForItemWithAllocation(ingr.name, ingr.qty * times, recipes, catMap, multicraftLevel, baseAcc, interAcc, mutableInv, nextStack);
  }
}

// ── Build categories from flat recipes + catMap ──
function buildCategories(recipes, catMap) {
  const cats = {};
  for (const name of Object.keys(recipes)) {
    const cat = catMap[name] || 'Imported';
    if (!cats[cat]) cats[cat] = {};
    cats[cat][name] = recipes[name];
  }
  // Ensure default category order
  const ordered = {};
  for (const cat of Object.keys(recipesData)) {
    if (cats[cat]) { ordered[cat] = cats[cat]; delete cats[cat]; }
  }
  for (const cat of Object.keys(cats)) { ordered[cat] = cats[cat]; }
  return ordered;
}

// ── Toast component ──
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, isError = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, isError });
    timerRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  return { toast, showToast };
}

// ── Main Component ──
export function Crafting() {
  const [recipes, setRecipes] = useState(loadRecipes);
  const [recipeCategory, setRecipeCategory] = useState(loadRecipeCategory);
  const [craftList, setCraftList] = useState(loadCraftList);
  const [inventory, setInventory] = useState(loadInventory);
  const [multicraftLevel, setMulticraftLevel] = useState(loadMulticraft);
  const [viewMode, setViewMode] = useState('combined');
  const [collapsedItems, setCollapsedItems] = useState({});
  const [collapsedBranches, setCollapsedBranches] = useState({});
  const { toast, showToast } = useToast();

  // Recipe editor state
  const [editName, setEditName] = useState('');
  const [editYields, setEditYields] = useState(1);
  const [editCategory, setEditCategory] = useState('Act 1');
  const [editNewCategory, setEditNewCategory] = useState('');
  const [editIngredients, setEditIngredients] = useState([{ name: '', qty: '' }]);
  const [recipeError, setRecipeError] = useState('');
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [showRecipeList, setShowRecipeList] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState('merge');
  const importFileRef = useRef(null);
  const invTimerRef = useRef(null);

  // Derived data
  const categories = useMemo(() => buildCategories(recipes, recipeCategory), [recipes, recipeCategory]);

  const rawResult = useMemo(
    () => rawCalc(craftList, recipes, recipeCategory, multicraftLevel),
    [craftList, recipes, recipeCategory, multicraftLevel]
  );
  const netResult = useMemo(
    () => netCalc(craftList, recipes, recipeCategory, inventory, multicraftLevel),
    [craftList, recipes, recipeCategory, inventory, multicraftLevel]
  );

  // ── Craft list actions ──
  const addToCraftList = useCallback((category, item, qty) => {
    if (!item) { showToast('Select an item first.', true); return; }
    const q = parseInt(qty) || 1;
    setCraftList(prev => {
      const existing = prev.find(c => c.item === item);
      let next;
      if (existing) {
        next = prev.map(c => c.item === item ? { ...c, qty: c.qty + q } : c);
      } else {
        next = [...prev, { item, qty: q }];
      }
      saveLS(LS_CRAFT, next);
      return next;
    });
    showToast(`Added ${q}x ${item}`);
  }, [showToast]);

  const removeFromCraftList = useCallback((index) => {
    setCraftList(prev => {
      const item = prev[index];
      const next = prev.filter((_, i) => i !== index);
      saveLS(LS_CRAFT, next);
      if (item) showToast(`Removed ${item.item}`);
      return next;
    });
  }, [showToast]);

  const clearCraftList = useCallback(() => {
    if (!craftList.length) return;
    if (!confirm('Clear the entire farming list?')) return;
    setCraftList([]);
    saveLS(LS_CRAFT, []);
    showToast('Farming list cleared.');
  }, [craftList.length, showToast]);

  // ── Inventory actions ──
  const onInventoryInput = useCallback((name, value) => {
    const val = parseInt(value) || 0;
    setInventory(prev => {
      const next = { ...prev };
      if (val <= 0) delete next[name]; else next[name] = val;
      if (invTimerRef.current) clearTimeout(invTimerRef.current);
      invTimerRef.current = setTimeout(() => saveLS(LS_INVENT, next), 80);
      return next;
    });
  }, []);

  const clearInventory = useCallback(() => {
    if (!confirm('Clear all inventory entries?')) return;
    setInventory({});
    saveLS(LS_INVENT, {});
    showToast('Inventory cleared.');
  }, [showToast]);

  // ── Multicraft ──
  const changeMulticraft = useCallback((lvl) => {
    setMulticraftLevel(lvl);
    saveLS(LS_MULTICRAFT, lvl);
  }, []);

  // ── Recipe CRUD ──
  const saveRecipe = useCallback(() => {
    const name = editName.trim();
    const yields = parseInt(editYields) || 1;
    if (!name) { setRecipeError('Please enter an item name.'); return; }

    const cat = editCategory === '__new__' ? editNewCategory.trim() : editCategory;
    if (!cat) { setRecipeError('Please enter a name for the new category.'); return; }

    const ingredients = editIngredients
      .filter(ing => ing.name.trim() && parseInt(ing.qty) > 0)
      .map(ing => ({ name: ing.name.trim(), qty: parseInt(ing.qty) }));

    if (!ingredients.length) { setRecipeError('Add at least one ingredient.'); return; }
    if (ingredients.some(ing => ing.name === name)) { setRecipeError('An item cannot contain itself.'); return; }

    setRecipes(prev => {
      const next = { ...prev, [name]: { yields, ingredients } };
      saveLS(LS_RECIPES, next);
      return next;
    });
    setRecipeCategory(prev => {
      const next = { ...prev, [name]: cat };
      saveLS(LS_CATEGORY, next);
      return next;
    });

    // Reset form
    setEditName('');
    setEditYields(1);
    setEditCategory('Act 1');
    setEditNewCategory('');
    setEditIngredients([{ name: '', qty: '' }]);
    setRecipeError('');
    showToast(`Recipe "${name}" saved!`);
  }, [editName, editYields, editCategory, editNewCategory, editIngredients, showToast]);

  const editRecipe = useCallback((name) => {
    const r = recipes[name];
    if (!r) return;
    setEditName(name);
    setEditYields(r.yields);
    setEditCategory(recipeCategory[name] || 'Act 1');
    setEditIngredients(r.ingredients.map(ing => ({ name: ing.name, qty: String(ing.qty) })));
    setRecipeError('');
    setShowRecipeEditor(true);
    showToast('Recipe loaded for editing.');
  }, [recipes, recipeCategory, showToast]);

  const deleteRecipe = useCallback((name) => {
    if (!confirm(`Delete recipe for "${name}"?`)) return;
    setRecipes(prev => {
      const next = { ...prev };
      delete next[name];
      saveLS(LS_RECIPES, next);
      return next;
    });
    setRecipeCategory(prev => {
      const next = { ...prev };
      delete next[name];
      saveLS(LS_CATEGORY, next);
      return next;
    });
    showToast('Recipe deleted.');
  }, [showToast]);

  const restoreDefaults = useCallback(() => {
    if (!confirm('Restore the default recipes? Custom additions will be lost.')) return;
    const flat = { ...defaultMaps.flat };
    const catMap = { ...defaultMaps.catMap };
    setRecipes(flat);
    setRecipeCategory(catMap);
    saveLS(LS_RECIPES, flat);
    saveLS(LS_CATEGORY, catMap);
    showToast('Defaults restored.');
  }, [showToast]);

  // ── Import / Export ──
  const exportRecipes = useCallback(() => {
    if (!Object.keys(recipes).length) { showToast('No recipes to export.', true); return; }
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'recipes.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Export successful.');
  }, [recipes, showToast]);

  const processImport = useCallback((raw) => {
    let parsed;
    try { parsed = JSON.parse(raw); } catch (ex) { showToast('Invalid JSON.', true); return; }

    const norm = {};
    for (const k of Object.keys(parsed)) {
      const v = parsed[k];
      norm[k] = { yields: v.yields || 1, ingredients: (v.ingredients || []).map(ing => ({ name: ing.name, qty: ing.qty })) };
    }

    setRecipes(prev => {
      const next = importMode === 'replace' ? norm : { ...prev, ...norm };
      saveLS(LS_RECIPES, next);
      return next;
    });
    setRecipeCategory(prev => {
      const next = { ...prev };
      for (const k of Object.keys(norm)) {
        if (!next[k]) next[k] = 'Imported';
      }
      saveLS(LS_CATEGORY, next);
      return next;
    });
    showToast('Import successful!');
  }, [importMode, showToast]);

  const handleImportFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { processImport(ev.target.result); e.target.value = ''; };
    reader.readAsText(file);
  }, [processImport]);

  // ── Copy to clipboard ──
  const copyNeeded = useCallback(() => {
    if (!craftList.length) { showToast('Nothing to copy yet.', true); return; }
    const net = netCalc(craftList, recipes, recipeCategory, inventory, multicraftLevel);
    const format = (obj) => Object.keys(obj).filter(n => obj[n] > 0).sort().map(n => `${obj[n].toLocaleString()}x ${n}`).join('\n');
    const baseText = format(net.base);
    const interText = format(net.inter);
    if (!baseText && !interText) { showToast('You already have everything!'); return; }
    let text = '';
    if (baseText) text += 'Needed:\n' + baseText;
    if (interText) text += (text ? '\n\n' : '') + 'To Craft:\n' + interText;
    try { navigator.clipboard.writeText(text.trim()); showToast('Requirements copied!'); }
    catch (ex) { showToast('Copy failed.', true); }
  }, [craftList, recipes, recipeCategory, inventory, multicraftLevel, showToast]);

  // ── Combined view data ──
  const combinedEntries = useMemo(() => {
    const entries = [];
    for (const k of Object.keys(rawResult.base)) entries.push({ name: k, raw: rawResult.base[k], type: 'base' });
    for (const k of Object.keys(rawResult.inter)) entries.push({ name: k, raw: rawResult.inter[k], type: 'inter' });
    entries.sort((a, b) => b.raw - a.raw);
    return entries;
  }, [rawResult]);

  const hasAnyInventory = useMemo(() => Object.values(inventory).some(v => v > 0), [inventory]);

  // ── By-item view data ──
  const byItemData = useMemo(() => {
    if (!craftList.length) return [];
    const individualCrafts = [];
    for (let j = 0; j < craftList.length; j++) {
      const c = craftList[j];
      for (let k = 0; k < c.qty; k++) {
        individualCrafts.push({ item: c.item, originalIndex: j, instanceIndex: k + 1 });
      }
    }

    const currentInv = { ...inventory };
    const results = [];

    for (const ic of individualCrafts) {
      const invBefore = { ...currentInv };
      const baseReq = {};
      const interReq = {};
      expandForItemWithAllocation(ic.item, 1, recipes, recipeCategory, multicraftLevel, baseReq, interReq, currentInv, {});
      const invAfter = { ...currentInv };

      let totalReq = 0, totalGot = 0;
      for (const bn of Object.keys(baseReq)) {
        totalReq += baseReq[bn];
        totalGot += (invBefore[bn] || 0) - (invAfter[bn] || 0);
      }
      const pct = totalReq > 0 ? Math.round((totalGot / totalReq) * 100) : 100;

      results.push({
        ...ic,
        key: `${ic.item}::${ic.originalIndex}::${ic.instanceIndex}`,
        pct,
        isComplete: pct >= 100,
        invBefore,
        invAfter,
      });
    }
    return results;
  }, [craftList, inventory, recipes, recipeCategory, multicraftLevel]);

  // ── Toggle handlers ──
  const toggleByItemBlock = useCallback((key) => {
    setCollapsedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleTreeBranch = useCallback((branchKey) => {
    setCollapsedBranches(prev => ({ ...prev, [branchKey]: !prev[branchKey] }));
  }, []);

  // ── Tree renderer ──
  function renderTree(itemName, qty, depth, stack, invBefore, invAfter, parentKey) {
    const recipe = recipes[itemName];
    const isBase = !recipe || !!stack[itemName];
    const consumed = (invBefore[itemName] || 0) - (invAfter[itemName] || 0);
    const got = Math.min(qty, consumed);
    const pct = qty > 0 ? Math.floor((got / qty) * 100) : 100;
    const isDone = got >= qty;
    const needCls = isDone ? 'zero' : got > 0 ? 'partial' : 'full';
    const cat = recipeCategory[itemName];
    let typeLabel = isBase ? 'raw' : 'craft';
    let typeCls = isBase ? 'base' : 'inter';
    if (!isBase && cat && cat.toLowerCase() === 'smeltery') {
      typeLabel = 'smeltery';
      typeCls = 'smeltery';
    }

    const branchKey = `${parentKey}::${itemName}::${depth}`;
    const isBranchCollapsed = !!collapsedBranches[branchKey];

    const indentLines = [];
    for (let d = 0; d < depth; d++) {
      indentLines.push(<div class="crafting__tree-indent-line" key={d} />);
    }

    let childrenHtml = null;
    if (!isBase) {
      const nextStack = { ...stack, [itemName]: true };
      const branchNeed = Math.max(0, qty - got);
      const times = Math.ceil(branchNeed / (recipe.yields || 1));
      const grouped = {};
      for (const ing of recipe.ingredients) {
        grouped[ing.name] = (grouped[ing.name] || 0) + (ing.qty * times);
      }
      const ingNames = Object.keys(grouped).sort();
      const children = ingNames
        .filter(n => grouped[n] > 0)
        .map(n => renderTree(n, grouped[n], depth + 1, nextStack, invBefore, invAfter, branchKey));

      if (children.length > 0) {
        childrenHtml = (
          <div class={`crafting__tree-branch-content ${isBranchCollapsed ? 'collapsed' : ''}`}>
            {children}
          </div>
        );
      }
    }

    return (
      <div class="crafting__tree-node" key={branchKey}>
        <div class="crafting__tree-node-row">
          {depth > 0 && <div class="crafting__tree-indent">{indentLines}</div>}
          {!isBase ? (
            <button
              class={`crafting__tree-branch-toggle ${isBranchCollapsed ? 'collapsed' : ''}`}
              onClick={() => toggleTreeBranch(branchKey)}
            >&#9660;</button>
          ) : (
            <div class="crafting__tree-branch-spacer" />
          )}
          <span class={`crafting__tree-node-type ${typeCls}`}>{typeLabel}</span>
          <span class={`crafting__tree-node-name ${!isBase && depth > 0 ? 'is-inter' : ''}`}>{itemName}</span>
          <div style="flex:1" />
          <div class="crafting__tree-node-nums">
            <span class={`crafting__tree-progress ${needCls}`}>
              {got.toLocaleString()} / {qty.toLocaleString()} <small>({pct}%)</small>
            </span>
            {isDone && <span class="crafting__pill-done">DONE</span>}
          </div>
        </div>
        {childrenHtml}
      </div>
    );
  }

  // ── Category selector refs ──
  const categoryRefs = useRef({});

  return (
    <div class="crafting">
      {/* ── Multicraft Toggle ── */}
      <div class="crafting__card">
        <div class="crafting__status-row">
          <div>
            <div class="crafting__status-label">Multicraft Level</div>
            <div class="crafting__status-desc">Smeltery items get bonus yields at higher levels</div>
          </div>
          <div class="crafting__multicraft-selector">
            {[0, 2, 4].map(lvl => (
              <button
                key={lvl}
                class={`crafting__mc-btn ${multicraftLevel === lvl ? 'active' : ''}`}
                onClick={() => changeMulticraft(lvl)}
              >
                {lvl === 0 ? 'Off' : `Lv${lvl}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Selectors ── */}
      <div class="crafting__card">
        <div class="crafting__card-header">
          <h3 class="crafting__card-title">Add Items to Craft</h3>
        </div>
        <div class="crafting__category-selects">
          {Object.keys(categories).map(cat => {
            const items = Object.keys(categories[cat]).sort();
            if (!categoryRefs.current[cat]) {
              categoryRefs.current[cat] = { item: '', qty: '1' };
            }
            return (
              <div class="crafting__category-row" key={cat}>
                <span class="crafting__category-label">{cat}</span>
                <div class="crafting__calc-row">
                  <select
                    value={categoryRefs.current[cat].item}
                    onChange={(e) => { categoryRefs.current[cat].item = e.target.value; }}
                  >
                    <option value="">-- Select an item --</option>
                    {items.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    class="crafting__craft-qty-input"
                    min="1"
                    value={categoryRefs.current[cat].qty}
                    onInput={(e) => { categoryRefs.current[cat].qty = e.target.value; }}
                  />
                  <button
                    class="crafting__btn crafting__btn-primary crafting__btn-sm"
                    onClick={() => {
                      const ref = categoryRefs.current[cat];
                      addToCraftList(cat, ref.item, ref.qty);
                      ref.item = '';
                      ref.qty = '1';
                    }}
                  >+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Craft List ── */}
      <div class="crafting__card">
        <div class="crafting__card-header">
          <h3 class="crafting__card-title">Farming List</h3>
          <div class="crafting__header-actions">
            {craftList.length > 0 && (
              <button class="crafting__btn crafting__btn-danger crafting__btn-sm" onClick={clearCraftList}>Clear All</button>
            )}
          </div>
        </div>
        <div class="crafting__craft-list">
          {!craftList.length ? (
            <div class="crafting__empty-state">No items yet -- add something above.</div>
          ) : (
            craftList.map((c, i) => (
              <div class="crafting__craft-item" key={`${c.item}-${i}`}>
                <div class="crafting__craft-item-left">
                  <span class="crafting__craft-item-qty">{c.qty}x</span>
                  <span class="crafting__craft-item-name">{c.item}</span>
                </div>
                <button class="crafting__btn crafting__btn-danger crafting__btn-sm" onClick={() => removeFromCraftList(i)}>&#10005;</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {craftList.length > 0 && (
        <div class="crafting__card">
          <div class="crafting__card-header">
            <h3 class="crafting__card-title">Ingredients Required</h3>
            <div class="crafting__header-actions">
              <button class="crafting__btn crafting__btn-outline crafting__btn-sm" onClick={copyNeeded}>Copy Needed</button>
              {hasAnyInventory && (
                <button class="crafting__btn crafting__btn-danger crafting__btn-sm" onClick={clearInventory}>Clear Inventory</button>
              )}
            </div>
          </div>

          {/* View toggle */}
          <div class="crafting__view-toggle">
            <button
              class={`crafting__view-btn ${viewMode === 'combined' ? 'active' : ''}`}
              onClick={() => setViewMode('combined')}
            >Combined</button>
            <button
              class={`crafting__view-btn ${viewMode === 'byItem' ? 'active' : ''}`}
              onClick={() => setViewMode('byItem')}
            >By Item</button>
          </div>

          {/* Combined View */}
          {viewMode === 'combined' && (
            <div class="crafting__result-combined">
              <CombinedSummary entries={combinedEntries} netResult={netResult} />
              <div class="crafting__table-container">
                <table class="crafting__inventory-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style="text-align:right;">Req</th>
                      <th style="text-align:right;">Stock</th>
                      <th style="text-align:right;">Need</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedEntries.map(ent => {
                      const netAcc = ent.type === 'base' ? netResult.base : netResult.inter;
                      const remain = Math.max(0, netAcc[ent.name] || 0);
                      const have = inventory[ent.name] || 0;
                      const remCls = remain === 0 ? 'zero' : have > 0 ? 'partial' : 'full';
                      const cat = recipeCategory[ent.name];
                      let typeLabel = ent.type === 'base' ? 'raw' : 'craft';
                      let typeCls = ent.type === 'base' ? 'base' : 'inter';
                      if (ent.type !== 'base' && cat && cat.toLowerCase() === 'smeltery') {
                        typeLabel = 'smeltery';
                        typeCls = 'smeltery';
                      }

                      return (
                        <tr key={ent.name}>
                          <td>
                            <div class="crafting__inv-item-name">{ent.name}</div>
                            <span class={`crafting__tree-node-type ${typeCls}`}>{typeLabel}</span>
                          </td>
                          <td style="text-align:right;"><span class="crafting__inv-required">{ent.raw.toLocaleString()}</span></td>
                          <td style="text-align:right;">
                            <input
                              type="number"
                              class="crafting__inv-input"
                              min="0"
                              value={have || ''}
                              placeholder="0"
                              onInput={(e) => onInventoryInput(ent.name, e.target.value)}
                            />
                          </td>
                          <td style="text-align:right;">
                            <span class={`crafting__inv-remaining ${remCls}`}>
                              {remain === 0 ? '\u2713' : remain.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p class="crafting__recalc-note">Changes are saved automatically and calculated in real-time.</p>
            </div>
          )}

          {/* By Item View */}
          {viewMode === 'byItem' && (
            <div class="crafting__result-byitem">
              {byItemData.map(ic => {
                const isCollapsed = !!collapsedItems[ic.key];
                return (
                  <div class="crafting__by-item-block" key={ic.key}>
                    <div class="crafting__by-item-header" onClick={() => toggleByItemBlock(ic.key)}>
                      <div class="crafting__by-item-name">{ic.item} <small>#{ic.instanceIndex}</small></div>
                      <div class="crafting__by-item-progress-wrap">
                        <div class="crafting__progress-bar-bg">
                          <div class={`crafting__progress-bar-fill ${ic.isComplete ? 'complete' : ''}`} style={`width:${ic.pct}%`} />
                        </div>
                        <span class={`crafting__progress-pct ${ic.isComplete ? 'complete' : ''}`}>
                          {ic.isComplete ? '\u2713' : `${ic.pct}%`}
                        </span>
                      </div>
                      <button class="crafting__by-item-collapse-btn">{isCollapsed ? '\u25BC' : '\u25B2'}</button>
                    </div>
                    {!isCollapsed && (
                      <div class="crafting__by-item-body">
                        <div class="crafting__tree-root">
                          {renderTree(ic.item, 1, 0, {}, ic.invBefore, ic.invAfter, ic.key)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Recipe Management ── */}
      <div class="crafting__card">
        <div class="crafting__card-header">
          <h3 class="crafting__card-title">Recipe Management</h3>
          <div class="crafting__header-actions">
            <button
              class="crafting__btn crafting__btn-outline crafting__btn-sm"
              onClick={() => setShowRecipeEditor(!showRecipeEditor)}
            >{showRecipeEditor ? 'Hide Editor' : 'Add/Edit Recipe'}</button>
            <button
              class="crafting__btn crafting__btn-outline crafting__btn-sm"
              onClick={() => setShowRecipeList(!showRecipeList)}
            >{showRecipeList ? 'Hide Recipes' : 'View All Recipes'}</button>
            <button
              class="crafting__btn crafting__btn-outline crafting__btn-sm"
              onClick={() => setShowImportExport(!showImportExport)}
            >{showImportExport ? 'Hide Import/Export' : 'Import/Export'}</button>
          </div>
        </div>

        {/* Recipe Editor */}
        {showRecipeEditor && (
          <div class="crafting__recipe-editor">
            <div class="crafting__form-row">
              <label>Item Name</label>
              <input type="text" value={editName} onInput={e => setEditName(e.target.value)} placeholder="e.g. Steel Sword" />
            </div>
            <div class="crafting__form-row">
              <label>Yields</label>
              <input type="number" value={editYields} min="1" onInput={e => setEditYields(parseInt(e.target.value) || 1)} />
            </div>
            <div class="crafting__form-row">
              <label>Category</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                {Object.keys(categories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__new__">+ New category...</option>
              </select>
            </div>
            {editCategory === '__new__' && (
              <div class="crafting__form-row">
                <label>New Category Name</label>
                <input type="text" value={editNewCategory} onInput={e => setEditNewCategory(e.target.value)} />
              </div>
            )}
            <div class="crafting__form-row">
              <label>Ingredients</label>
              <div class="crafting__ingredients-builder">
                {editIngredients.map((ing, idx) => (
                  <div class="crafting__ingredient-row" key={idx}>
                    <input
                      type="number"
                      class="crafting__ingr-qty"
                      min="1"
                      placeholder="Qty"
                      value={ing.qty}
                      onInput={e => {
                        const next = [...editIngredients];
                        next[idx] = { ...next[idx], qty: e.target.value };
                        setEditIngredients(next);
                      }}
                    />
                    <input
                      type="text"
                      class="crafting__ingr-name"
                      placeholder="Ingredient"
                      value={ing.name}
                      onInput={e => {
                        const next = [...editIngredients];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setEditIngredients(next);
                      }}
                    />
                    {editIngredients.length > 1 && (
                      <button
                        class="crafting__btn crafting__btn-danger crafting__btn-sm"
                        onClick={() => setEditIngredients(editIngredients.filter((_, i) => i !== idx))}
                      >&#10005;</button>
                    )}
                  </div>
                ))}
                <button
                  class="crafting__btn crafting__btn-outline crafting__btn-sm"
                  onClick={() => setEditIngredients([...editIngredients, { name: '', qty: '' }])}
                >+ Add Ingredient</button>
              </div>
            </div>
            {recipeError && <div class="crafting__recipe-error">{recipeError}</div>}
            <div class="crafting__form-actions">
              <button class="crafting__btn crafting__btn-primary" onClick={saveRecipe}>Save Recipe</button>
              <button class="crafting__btn crafting__btn-outline" onClick={restoreDefaults}>Restore Defaults</button>
            </div>
          </div>
        )}

        {/* Recipe List */}
        {showRecipeList && (
          <div class="crafting__recipe-list">
            {Object.keys(recipes).sort().map(name => {
              const r = recipes[name];
              const ingStr = r.ingredients.map(i => `${i.qty}x ${i.name}`).join(', ');
              const cat = recipeCategory[name] || 'Unknown';
              return (
                <div class="crafting__recipe-item" key={name}>
                  <div style="flex:1">
                    <div class="crafting__recipe-item-name">
                      {name}
                      {r.yields > 1 && <span class="crafting__yields-note"> (yields {r.yields})</span>}
                      <span class="crafting__recipe-cat-badge">{cat}</span>
                    </div>
                    <div class="crafting__recipe-item-ingr">{ingStr}</div>
                  </div>
                  <div class="crafting__recipe-actions">
                    <button class="crafting__btn crafting__btn-edit crafting__btn-sm" onClick={() => editRecipe(name)}>&#9998;</button>
                    <button class="crafting__btn crafting__btn-danger crafting__btn-sm" onClick={() => deleteRecipe(name)}>&#10005;</button>
                  </div>
                </div>
              );
            })}
            {!Object.keys(recipes).length && <div class="crafting__empty-state">No recipes yet.</div>}
          </div>
        )}

        {/* Import/Export */}
        {showImportExport && (
          <div class="crafting__import-export">
            <div class="crafting__form-actions">
              <button class="crafting__btn crafting__btn-primary crafting__btn-sm" onClick={exportRecipes}>Export Recipes</button>
              <button class="crafting__btn crafting__btn-outline crafting__btn-sm" onClick={() => importFileRef.current?.click()}>Import from File</button>
              <input type="file" ref={importFileRef} accept=".json" style="display:none" onChange={handleImportFile} />
            </div>
            <div class="crafting__import-mode">
              <label>
                <input type="radio" name="importMode" value="merge" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                {' '}Merge with existing
              </label>
              <label>
                <input type="radio" name="importMode" value="replace" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
                {' '}Replace all
              </label>
            </div>
            <textarea
              class="crafting__json-paste"
              placeholder="Or paste JSON here..."
              value={importText}
              onInput={e => setImportText(e.target.value)}
              rows={4}
            />
            <button class="crafting__btn crafting__btn-primary crafting__btn-sm" onClick={() => { processImport(importText); setImportText(''); }}>Import from Paste</button>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div class={`crafting__toast ${toast.isError ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Summary sub-component ──
function CombinedSummary({ entries, netResult }) {
  const total = entries.length;
  let satisfied = 0;
  for (const e of entries) {
    const netAcc = e.type === 'base' ? netResult.base : netResult.inter;
    if ((netAcc[e.name] || 0) <= 0) satisfied++;
  }
  return (
    <div class="crafting__summary-row">
      <span class="crafting__summary-label">{total} ingredient(s) total</span>
      {satisfied > 0 && <span class="crafting__pill-green">{'\u2713'} {satisfied} ready</span>}
      <span class="crafting__pill-red">{total - satisfied} remaining</span>
    </div>
  );
}
