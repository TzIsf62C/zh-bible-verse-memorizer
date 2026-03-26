# Export & Import Panel Comparison: Legacy vs SvelteKit

## Overview
This document compares the export/import functionality between the legacy vanilla JavaScript app and the SvelteKit refactored version.

---

## Feature Comparison Table

| Feature | Legacy App | SvelteKit App | Status |
|---------|-----------|---------------|--------|
| **Export Section** |
| Selective collection export | ✅ Full tree structure | ❌ Not implemented | **Missing** |
| Master "All verses" checkbox | ✅ Yes, controls all children | ❌ Not implemented | **Missing** |
| Individual collection checkboxes | ✅ Yes, with verse counts | ❌ Not implemented | **Missing** |
| "Not in a collection" option | ✅ Yes, includes uncollected verses | ❌ Not implemented | **Missing** |
| Verse count display per collection | ✅ Shows `(X verses)` | ❌ Not implemented | **Missing** |
| Master/child checkbox synchronization | ✅ Yes, bidirectional | ❌ Not implemented | **Missing** |
| Export review data option | ✅ Checkbox (checked by default) | ✅ Checkbox (checked by default) | **Implemented** |
| Export collection data option | ✅ Checkbox (checked by default) | ✅ Checkbox (checked by default) | **Implemented** |
| Export button | ✅ "Download Data" | ✅ "Export JSON" | **Implemented** |
| **Import Section** |
| File selection input | ✅ Hidden with custom label | ✅ Standard file input | **Implemented** |
| File name display | ✅ Shows selected filename | ❌ Not implemented | **Missing** |
| Import review data option | ✅ Checkbox (checked by default) | ✅ Checkbox (checked by default) | **Implemented** |
| Import collection data option | ✅ Checkbox (checked by default) | ✅ Checkbox (checked by default) | **Implemented** |
| Import button | ✅ "Import Data" | ✅ Auto-imports on file select | **Different** |
| **Export Logic** |
| Export all verses | ✅ Yes | ✅ Yes (only option) | **Implemented** |
| Export selected collections only | ✅ Yes, via checkboxes | ❌ Not implemented | **Missing** |
| Export uncollected verses separately | ✅ Yes, via `__uncollected__` ID | ❌ Not implemented | **Missing** |
| Conditional review data stripping | ✅ Yes | ✅ Yes | **Implemented** |
| Conditional collection inclusion | ✅ Yes | ✅ Yes | **Implemented** |
| Structured payload (version 2) | ✅ Yes | ✅ Yes | **Implemented** |
| **Import Logic** |
| Parse JSON payload | ✅ Yes | ✅ Yes | **Implemented** |
| Support legacy format (array) | ✅ Yes | ✅ Yes | **Implemented** |
| Support v2 format (object) | ✅ Yes | ✅ Yes | **Implemented** |
| Merge verses by reference | ✅ Yes | ✅ Yes | **Implemented** |
| Keep most recent review data | ✅ Yes | ✅ Yes | **Implemented** |
| Merge collections by title | ✅ Yes | ✅ Yes | **Implemented** |
| Preserve imported verse order | ✅ Yes | ✅ Yes | **Implemented** |
| **UI/UX** |
| Separate export/import sections | ✅ Yes | ✅ Yes | **Implemented** |
| Tree-view hierarchy | ✅ Yes | ❌ Not implemented | **Missing** |
| Panel title | ✅ "Export & Import" | ✅ "Data Compatibility" | **Different** |
| Success/error messages | ✅ Modal alerts | ✅ Inline status text | **Different** |
| i18n support | ✅ Full i18n | ✅ Full i18n | **Implemented** |

---

## Detailed Analysis

### 1. Export Functionality

#### Legacy App
The legacy app implements a **sophisticated hierarchical export system**:

```javascript
// Populates tree structure when panel opens
exportBtn.addEventListener('click', () => {
  // Build tree with:
  // - Master checkbox (exportAllVerses)
  // - Individual collection checkboxes with verse counts
  // - "Not in a collection" option (__uncollected__)
  
  // Master checkbox controls all children
  exportAllVerses.addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.export-collection-checkbox');
    checkboxes.forEach(cb => cb.checked = this.checked);
  });
  
  // Child checkboxes update master if all checked
  childCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const allChecked = Array.from(childCheckboxes).every(c => c.checked);
      exportAllVerses.checked = allChecked;
    });
  });
});
```

**Export logic:**
- Reads checkboxes to determine selected collections
- Handles special `__uncollected__` ID for verses not in any collection
- Builds verse ID set from selected collections
- Supports exporting empty selection (exports nothing)
- Creates versioned payload with metadata

#### SvelteKit App
The SvelteKit app has a **simplified export system**:

```javascript
function handleExport() {
  const payload = buildExportPayload($verses, $collections, {
    includeReview,
    includeCollections
  });
  // Always exports ALL verses - no selective export
}
```

**Missing features:**
- No collection selection UI
- Cannot export specific collections
- Cannot separate uncollected verses
- No master/child checkbox hierarchy

---

### 2. Import Functionality

#### Legacy App
```javascript
importFile.addEventListener('change', (e) => {
  // Update file name display
  importFileName.textContent = e.target.files[0].name;
});

importDataBtn.addEventListener('click', () => {
  // Explicit button click required
  // Shows success/error modal alert
});
```

#### SvelteKit App
```javascript
function handleImportFile(event) {
  // Auto-imports immediately on file selection
  // Shows inline status message
}
```

**Differences:**
- **Legacy**: Requires explicit button click after file selection
- **SvelteKit**: Auto-imports on file selection (no confirmation)
- **Legacy**: Shows file name before import
- **SvelteKit**: No file name display

---

### 3. UI/UX Differences

#### Layout Structure

**Legacy App:**
```html
<div id="exportImportPanel">
  <h2>Export & Import</h2>
  
  <div class="export-section">
    <!-- Tree structure -->
    <div id="exportSelectionTree" class="export-tree">
      <div class="tree-item">
        <input id="exportAllVerses" type="checkbox" checked>
        <strong>All verses</strong>
        <div id="exportCollectionsList" class="tree-children">
          <!-- Dynamically populated collection checkboxes -->
        </div>
      </div>
    </div>
    
    <label><input id="exportIncludeReview" type="checkbox" checked> Include review data</label>
    <label><input id="exportIncludeCollections" type="checkbox" checked> Include collection data</label>
    <button id="downloadBtn">Download Data</button>
  </div>
  
  <div class="import-section">
    <label for="importFile" class="file-input-label">Choose File</label>
    <input type="file" id="importFile" style="display:none;">
    <div id="importFileName">No file selected</div>
    
    <label><input id="importIncludeReview" type="checkbox" checked> Import review data</label>
    <label><input id="importIncludeCollections" type="checkbox" checked> Import collection data</label>
    <button id="importDataBtn">Import Data</button>
  </div>
</div>
```

**SvelteKit App:**
```svelte
<section class="panel">
  <h2>{t('data_compatibility')}</h2>
  <p>{t('data_compatibility_description')}</p>
  
  <div class="control-row">
    <label>
      <input type="checkbox" bind:checked={includeReview} />
      {t('include_review_data')}
    </label>
    <label>
      <input type="checkbox" bind:checked={includeCollections} />
      {t('include_collections')}
    </label>
  </div>
  
  <div class="control-row">
    <input type="file" accept="application/json" on:change={handleImportFile} />
    <button on:click={handleExport}>{t('export_json')}</button>
  </div>
  
  {#if importStatus}
    <p class="status">{importStatus}</p>
  {/if}
  {#if exportStatus}
    <p class="status">{exportStatus}</p>
  {/if}
</section>
```

**Key UI Differences:**
1. **Layout**: Legacy has separate export/import sections; SvelteKit combines controls
2. **File input**: Legacy uses hidden input with custom label; SvelteKit uses standard input
3. **Feedback**: Legacy uses modal alerts; SvelteKit uses inline status text
4. **Panel title**: Legacy "Export & Import"; SvelteKit "Data Compatibility"

---

### 4. Export/Import Utilities

Both apps share similar utility logic in `importExport.js`, which is **well-implemented**:

```javascript
// ✅ Implemented in both
- parseImportPayload()     // Parse JSON, handle arrays vs objects
- mergeVerses()            // Smart merge with review data preference
- mergeCollections()       // Merge by title, preserve order
- buildExportPayload()     // Create versioned export structure
```

However, `buildExportPayload()` in SvelteKit **does not support selective collection export** (option exists but UI doesn't use it):

```javascript
export function buildExportPayload(verses, collections, options = {}) {
  const { includeReview = true, includeCollections = false, collectionIds = [] } = options;
  // collectionIds parameter exists but is never passed from UI
}
```

---

## Missing Features Summary

### Critical Missing Features
1. **Collection-specific export** - Cannot select which collections to export
2. **Uncollected verses handling** - No way to export verses not in any collection separately
3. **Master checkbox** - No "All verses" toggle to select/deselect all collections
4. **Verse counts** - No display of how many verses are in each collection
5. **File name display** - No indication of which file was selected for import

### Nice-to-Have Missing Features
6. **Tree structure** - No hierarchical display of export options
7. **Explicit import button** - Auto-imports without user confirmation
8. **Custom file input styling** - Uses browser default file input

---

## Recommendations

### Phase 1: Core Functionality (High Priority)
1. **Add collection selection UI** with checkboxes for each collection
2. **Implement master checkbox** to toggle all collections
3. **Add "Not in a collection" option** for uncollected verses
4. **Display verse counts** next to each collection name
5. **Show selected file name** before importing

### Phase 2: Enhanced UX (Medium Priority)
6. **Recreate tree structure** with proper hierarchy styling
7. **Add explicit import button** (don't auto-import on file select)
8. **Improve file input styling** (custom label like legacy app)
9. **Update panel title** to "Export & Import" for consistency

### Phase 3: Polish (Low Priority)
10. **Add loading states** during import/export operations
11. **Improve error messages** with more detail
12. **Add export preview** showing what will be exported
13. **Add import dry-run** option to preview before importing

---

## Code Migration Path

To restore legacy functionality, the SvelteKit app needs:

1. **New component**: `ExportImportPanel.svelte` (separate from Settings)
2. **Enhanced UI state**:
   ```javascript
   let selectedCollectionIds = [];  // Track selected collections
   let exportAllChecked = true;     // Master checkbox state
   let selectedFileName = '';       // Display file name
   ```

3. **Collection tree rendering**:
   ```svelte
   <div class="export-tree">
     <label>
       <input type="checkbox" bind:checked={exportAllChecked} on:change={toggleAll} />
       <strong>{t('all_verses')}</strong>
     </label>
     <div class="tree-children">
       {#each $collections as collection}
         <label>
           <input 
             type="checkbox" 
             value={collection.id}
             bind:group={selectedCollectionIds}
             on:change={updateMasterCheckbox}
           />
           {collection.title} ({collection.verseIds.length} {t('verses')})
         </label>
       {/each}
       <label>
         <input 
           type="checkbox" 
           value="__uncollected__"
           bind:group={selectedCollectionIds}
         />
         {t('not_in_collection')} ({uncollectedCount} {t('verses')})
       </label>
     </div>
   </div>
   ```

4. **Enhanced export handler**:
   ```javascript
   function handleExport() {
     // Build verse set from selected collections
     const verseIdSet = new Set();
     const actualColIds = selectedCollectionIds.filter(id => id !== '__uncollected__');
     
     // Add collection verses
     $collections.filter(c => actualColIds.includes(c.id)).forEach(c => {
       c.verseIds.forEach(id => verseIdSet.add(id));
     });
     
     // Add uncollected if selected
     if (selectedCollectionIds.includes('__uncollected__')) {
       const collectedIds = new Set();
       $collections.forEach(c => c.verseIds.forEach(id => collectedIds.add(id)));
       $verses.filter(v => !collectedIds.has(v.id)).forEach(v => verseIdSet.add(v.id));
     }
     
     const versesToExport = $verses.filter(v => verseIdSet.has(v.id));
     
     const payload = buildExportPayload(versesToExport, $collections, {
       includeReview,
       includeCollections,
       collectionIds: actualColIds
     });
     
     // Export logic...
   }
   ```

---

## Conclusion

The SvelteKit refactored app has **well-implemented core import/export utilities**, but the **UI and user-facing features are significantly simplified** compared to the legacy app. The most critical missing feature is **selective collection export**, which was a key capability of the original app.

**Overall Status**: 
- ✅ **Core logic**: Well-implemented (80% complete)
- ⚠️ **UI/Features**: Significantly reduced (40% complete)
- ❌ **Feature parity**: Not achieved - missing critical functionality

**Effort Estimate**: ~6-8 hours to restore full legacy functionality with proper Svelte component architecture.
