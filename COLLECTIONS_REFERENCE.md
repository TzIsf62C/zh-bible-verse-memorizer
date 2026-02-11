# Collections Feature - Legacy Implementation Reference

## Data Structure

```javascript
// Collection Object
{
  id: string,           // Timestamp-based unique ID (Date.now().toString())
  title: string,        // User-defined collection name
  verseIds: string[]    // Array of verse IDs that belong to this collection
}

// Stored in localStorage as:
localStorage.getItem('collections') // JSON array of collection objects
```

## Core Functions

### 1. Storage Operations

```javascript
function getCollections() {
  return JSON.parse(localStorage.getItem('collections') || '[]');
}

function saveCollections(cols) {
  localStorage.setItem('collections', JSON.stringify(cols));
}
```

### 2. Collections Panel - Main List

```javascript
function renderCollectionsList() {
  const cols = getCollections();
  collectionsList.innerHTML = '';
  
  cols.forEach((c) => {
    // Each collection item has:
    // - Title display
    // - View button (opens detail view)
    // - Up/Down buttons (reorder collections)
    // - Edit button (rename via prompt)
    // - Delete button (with confirmation)
  });
}
```

### 3. Collection Reordering

```javascript
function moveCollectionUp(id) {
  const cols = getCollections();
  const index = cols.findIndex(c => c.id === id);
  if (index <= 0) return; // Already at top
  
  // Swap with previous
  [cols[index - 1], cols[index]] = [cols[index], cols[index - 1]];
  saveCollections(cols);
  renderCollectionsList();
  loadCollectionsForReview();
}

function moveCollectionDown(id) {
  const cols = getCollections();
  const index = cols.findIndex(c => c.id === id);
  if (index === -1 || index >= cols.length - 1) return; // Already at bottom
  
  // Swap with next
  [cols[index], cols[index + 1]] = [cols[index + 1], cols[index]];
  saveCollections(cols);
  renderCollectionsList();
  loadCollectionsForReview();
}
```

### 4. Collection Detail View

```javascript
function viewCollection(id) {
  const cols = getCollections();
  const col = cols.find(c => c.id === id);
  if (!col) return;
  
  collectionDetail.style.display = 'block';
  collectionDetailTitle.textContent = col.title;
  
  // Populate verse selector with all verses sorted by Biblical order
  const verses = JSON.parse(localStorage.getItem('verses') || '[]');
  const sortedVerses = sortVersesByBibleOrder(verses);
  addVerseToCollection.innerHTML = '';
  sortedVerses.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`;
    addVerseToCollection.appendChild(opt);
  });
  
  renderCollectionVerses(col);
}
```

### 5. Collection Verses Management

```javascript
function renderCollectionVerses(col) {
  collectionVerses.innerHTML = '';
  const verses = JSON.parse(localStorage.getItem('verses') || '[]');
  col.verseIds = col.verseIds || [];
  
  col.verseIds.forEach((vid, idx) => {
    const v = verses.find(x => x.id === vid);
    // Display verse with:
    // - Up/Down buttons to reorder verses within collection
    // - Remove button to remove verse from collection
  });
  
  function saveAndRerender(updatedCol) {
    const cols = getCollections();
    const out = cols.map(c => c.id === updatedCol.id ? updatedCol : c);
    saveCollections(out);
    renderCollectionsList();
    populateCollectionSelector();
    loadCollectionsForReview();
    renderCollectionVerses(updatedCol);
  }
}
```

### 6. Collection Selectors

```javascript
function populateCollectionSelector() {
  const cols = getCollections();
  
  // Add-verse panel selector (optional - "none" by default)
  if (addToCollectionSelect) {
    addToCollectionSelect.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = t('none');
    addToCollectionSelect.appendChild(empty);
    
    cols.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      addToCollectionSelect.appendChild(opt);
    });
  }
  
  // Bulk-add modal selector (includes "Create new" option)
  if (bulkAddCollectionSelect) {
    bulkAddCollectionSelect.innerHTML = '';
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = t('choose_collection');
    bulkAddCollectionSelect.appendChild(empty);
    
    cols.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.title;
      bulkAddCollectionSelect.appendChild(opt);
    });
    
    const createOpt = document.createElement('option');
    createOpt.value = 'create_new';
    createOpt.textContent = t('create_collection');
    bulkAddCollectionSelect.appendChild(createOpt);
  }
}
```

## Event Handlers

### 1. Collections Panel Button
```javascript
collectionsBtn.addEventListener('click', () => {
  setActiveNavButton(collectionsBtn);
  showPanel(collectionsPanel);
  renderCollectionsList();
  populateCollectionSelector();
  collectionDetail.style.display = 'none'; // Hide detail view initially
});
```

### 2. Create New Collection
```javascript
createCollectionBtn.addEventListener('click', () => {
  const title = (newCollectionTitle.value || '').trim();
  if (!title) {
    showAlert('', t('enter_title'));
    return;
  }
  
  const cols = getCollections();
  cols.push({
    id: Date.now().toString(),
    title,
    verseIds: []
  });
  saveCollections(cols);
  
  newCollectionTitle.value = '';
  renderCollectionsList();
  populateCollectionSelector();
  loadCollectionsForReview();
});
```

### 3. Add Verse to Collection (from detail view)
```javascript
addToCollectionBtn.addEventListener('click', () => {
  const title = collectionDetailTitle.textContent;
  const cols = getCollections();
  const col = cols.find(c => c.title === title);
  
  if (!col) {
    showAlert('', t('select_collection_msg'));
    return;
  }
  
  const vid = addVerseToCollection.value;
  if (!vid) return;
  
  col.verseIds = col.verseIds || [];
  if (!col.verseIds.includes(vid)) {
    col.verseIds.push(vid);
  }
  
  saveCollections(cols);
  renderCollectionsList();
  populateCollectionSelector();
  loadCollectionsForReview();
  renderCollectionVerses(col);
});
```

### 4. Bulk Add to Collection (from Add Verse panel)
```javascript
bulkAddToCollectionBtn.addEventListener('click', () => {
  populateCollectionSelector();
  bulkAddModal.style.display = 'block';
  bulkAddModal.setAttribute('aria-hidden', 'false');
});

bulkAddCollectionSelect.addEventListener('change', () => {
  // Show "create new" input if that option selected
  if (bulkAddCollectionSelect.value === 'create_new') {
    bulkCreateNew.style.display = 'block';
  } else {
    bulkCreateNew.style.display = 'none';
  }
});

bulkAddConfirmBtn.addEventListener('click', () => {
  const checked = Array.from(document.querySelectorAll('.add-verse-checkbox:checked'));
  if (checked.length === 0) {
    showAlert('', t('select_at_least_one'));
    return;
  }
  
  let chosen = bulkAddCollectionSelect.value;
  let cols = getCollections();
  
  if (!chosen) {
    showAlert('', t('select_or_create_collection'));
    return;
  }
  
  // Handle "create new" option
  if (chosen === 'create_new') {
    const name = (bulkNewCollectionName.value || '').trim();
    if (!name) {
      showAlert('', t('enter_collection_name'));
      return;
    }
    const newCol = {
      id: Date.now().toString(),
      title: name,
      verseIds: []
    };
    cols.push(newCol);
    chosen = newCol.id;
  }
  
  const col = cols.find(c => c.id === chosen);
  if (!col) {
    showAlert('', t('collection_not_found'));
    return;
  }
  
  col.verseIds = col.verseIds || [];
  checked.forEach(cb => {
    const vid = cb.dataset.verseId;
    if (!col.verseIds.includes(vid)) {
      col.verseIds.push(vid);
    }
  });
  
  saveCollections(cols);
  renderCollectionsList();
  populateCollectionSelector();
  loadCollectionsForReview();
  
  // Close modal and refresh
  bulkAddModal.style.display = 'none';
  bulkNewCollectionName.value = '';
  bulkActions.style.display = 'none';
  loadVersesForEdit();
  showAlert('', t('verses_added_to_collection'));
});
```

## Integration with Add Verse Panel

### Verse List Display
Each verse in the Add Verse panel shows collection membership tags:

```javascript
// In loadVersesForEdit() / renderVerseItem()
const cols = getCollections();
const memberships = cols.filter(c => 
  Array.isArray(c.verseIds) && c.verseIds.includes(v.id)
);

const tagsDiv = document.createElement('div');
tagsDiv.className = 'collection-tags';
memberships.forEach(mc => {
  const span = document.createElement('span');
  span.className = 'collection-tag';
  span.textContent = mc.title;
  tagsDiv.appendChild(span);
});
```

### Add Verse Form
- Optional dropdown to add verse to collection on save
- Pre-selected if editing a verse that's already in a collection
- When saving, adds verse ID to selected collection's verseIds array

## Review Mode Integration

### Collections for Review
```javascript
function loadCollectionsForReview() {
  const collections = getCollections();
  const verses = JSON.parse(localStorage.getItem('verses') || '[]');
  
  if (collections.length === 0) {
    // Show "no collections" message
    return;
  }
  
  collections.forEach(col => {
    // Filter for learned verses only (those with lastReviewed)
    const learnedVerses = (col.verseIds || [])
      .map(id => verses.find(v => v.id === id))
      .filter(v => v && v.lastReviewed);
    
    // Display collection with:
    // - Checkbox for selection
    // - Title with due count
    // - Learned verse count
    // - Expandable list of verses in collection
  });
}
```

### Due Verse Counter
```javascript
function countDueVerses(verseIds, allVerses) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return verseIds.reduce((count, vid) => {
    const verse = allVerses.find(v => v.id === vid);
    if (!verse || !verse.dueDate) return count;
    
    const due = new Date(verse.dueDate);
    due.setHours(0, 0, 0, 0);
    
    return due <= today ? count + 1 : count;
  }, 0);
}
```

## Key UI Behaviors

1. **Collections Panel**:
   - List all collections (can be reordered)
   - Click "View" to open detail view
   - Edit/rename via prompt
   - Delete with confirmation
   - Create new collection with title input

2. **Collection Detail View**:
   - Shows collection title
   - Dropdown to select verse to add
   - List of verses in collection (can reorder, remove)
   - Verses maintain their order in verseIds array

3. **Add Verse Panel**:
   - Shows collection tags on each verse
   - Optional dropdown on save form to add to collection
   - Bulk actions: select multiple verses → "Add to collection"
   - Bulk modal: choose existing or create new collection

4. **Review Mode**:
   - Collections show learned verse count and due count
   - Can review entire collection
   - Maintains verse order from collection

## Translation Keys Used

```javascript
// Collections panel
'collections', 'collections_title', 'new_collection_title', 'create_collection'
'view', 'move_up', 'move_down', 'rename', 'delete'
'delete_collection_confirmation', 'enter_title'

// Add verse integration
'add_to_collection_optional', 'none', 'not_in_collection'

// Bulk actions
'add_selected_to_collection', 'choose_collection', 'new_collection_name'
'select_or_create_collection', 'enter_collection_name', 'collection_not_found'
'verses_added_to_collection', 'select_at_least_one'

// Review
'select_collection', 'review_collection_learned', 'no_collections'
'no_learned_verses_collection', 'due_count', 'learned_count'
```

## Notes

- Collections store verse IDs, not verse data directly
- Order matters: both collection order and verse order within collections
- Collections can be empty (verseIds = [])
- Verses can belong to multiple collections
- Only learned verses (with lastReviewed) appear in review mode collections
- Bulk operations support creating new collection on-the-fly
