function normalizeVerseNumbers(value) {
	return String(value ?? '').trim();
}

export function parseImportPayload(payload) {
	const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
	if (Array.isArray(parsed)) {
		return { verses: parsed, collections: [], raw: parsed };
	}

	return {
		verses: parsed?.verses ?? [],
		collections: parsed?.collections ?? [],
		raw: parsed
	};
}

export function mergeVerses(currentVerses, importedVerses, options = {}) {
	const { includeReview = true } = options;
	const merged = [...currentVerses];
	const conflicts = [];

	importedVerses.forEach((importedVerse, importIndex) => {
		const incoming = { ...importedVerse };
		if (!includeReview) {
			delete incoming.lastReviewed;
			delete incoming.interval;
			delete incoming.repetitions;
			delete incoming.dueDate;
		}

		const existingIndex = merged.findIndex((v) =>
			v.bookName === importedVerse.bookName &&
			normalizeVerseNumbers(v.chapterNumber) === normalizeVerseNumbers(importedVerse.chapterNumber) &&
			normalizeVerseNumbers(v.verseNumber) === normalizeVerseNumbers(importedVerse.verseNumber)
		);

		if (existingIndex !== -1) {
			const existing = merged[existingIndex];
			
			// Check if content is identical (same translation/version)
			const isIdenticalContent = 
				existing.verseText === incoming.verseText &&
				existing.verseInitials === incoming.verseInitials;
			
			if (isIdenticalContent) {
				// Same content - merge normally, keeping most recent review data
				const existingReviewDate = existing?.lastReviewed ? new Date(existing.lastReviewed) : null;
				const importedReviewDate = incoming?.lastReviewed ? new Date(incoming.lastReviewed) : null;

				if (importedReviewDate && (!existingReviewDate || importedReviewDate > existingReviewDate)) {
					merged[existingIndex] = incoming;
				}
			} else {
				// Different content - this is a conflict (different translation)
				conflicts.push({
					existing,
					imported: incoming,
					existingIndex,
					importIndex
				});
			}
		} else {
			// New verse - add it
			merged.push(incoming);
		}
	});

	return { merged, conflicts };
}

function findVerseIdByRef(verses, ref) {
	return verses.find(
		(v) =>
			v.bookName === ref.bookName &&
			normalizeVerseNumbers(v.chapterNumber) === normalizeVerseNumbers(ref.chapterNumber) &&
			normalizeVerseNumbers(v.verseNumber) === normalizeVerseNumbers(ref.verseNumber)
	)?.id;
}

export function mergeCollections(currentCollections, importedCollections, verses) {
	const merged = [...currentCollections];
	importedCollections.forEach((collection) => {
		const ids = (collection.verseRefs || [])
			.map((ref) => findVerseIdByRef(verses, ref))
			.filter(Boolean);

		if (ids.length === 0) return;

		const existing = merged.find((c) => c.title === collection.title);
		if (!existing) {
			merged.push({
				id: `${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
				title: collection.title,
				verseIds: ids
			});
			return;
		}

		const set = new Set();
		const combined = [];
		ids.forEach((id) => {
			if (!set.has(id)) {
				set.add(id);
				combined.push(id);
			}
		});
		(existing.verseIds || []).forEach((id) => {
			if (!set.has(id)) {
				set.add(id);
				combined.push(id);
			}
		});
		existing.verseIds = combined;
	});

	return merged;
}

export function buildExportPayload(verses, collections, options = {}) {
	const { includeReview = true, includeCollections = false, collectionIds = [] } = options;

	const cleaned = verses.map((verse) => {
		const entry = { ...verse };
		if (!includeReview) {
			delete entry.lastReviewed;
			delete entry.interval;
			delete entry.repetitions;
			delete entry.dueDate;
		}
		return entry;
	});

	if (!includeCollections) {
		return cleaned;
	}

	const includeCols = collectionIds.length
		? collections.filter((c) => collectionIds.includes(c.id))
		: collections;

	const idToVerse = new Map(verses.map((verse) => [verse.id, verse]));
	const collectionsExport = includeCols.map((collection) => {
		const verseRefs = (collection.verseIds || [])
			.map((id) => idToVerse.get(id))
			.filter(Boolean)
			.map((verse) => ({
				bookName: verse.bookName,
				chapterNumber: verse.chapterNumber,
				verseNumber: verse.verseNumber
			}));

		return { title: collection.title, verseRefs };
	});

	return {
		type: 'cbm-export',
		version: 2,
		generatedAt: new Date().toISOString(),
		verses: cleaned,
		collections: collectionsExport
	};
}

/**
 * Apply user's conflict resolution choices
 * @param {Array} mergedVerses - The merged verses array
 * @param {Array} conflicts - The conflicts array from mergeVerses
 * @param {Array} resolutions - Array of resolution choices: 'existing', 'imported', or 'both'
 * @returns {Array} Final verses array with conflicts resolved
 */
export function applyConflictResolutions(mergedVerses, conflicts, resolutions) {
	const result = [...mergedVerses];
	
	conflicts.forEach((conflict, i) => {
		const resolution = resolutions[i];
		const { existing, imported, existingIndex } = conflict;
		
		if (resolution === 'imported') {
			// Replace existing with imported
			result[existingIndex] = imported;
		} else if (resolution === 'both') {
			// Keep existing and add imported as new verse
			result.push(imported);
		}
		// If resolution === 'existing', do nothing (keep current state)
	});
	
	return result;
}
