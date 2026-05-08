import chapterVerseCountsCsv from '../../../chapter-verse-counts.csv?raw';
import { findBookByName } from '$lib/utils/bibleBooks';

function parseChapterCountsCsv() {
	const lines = chapterVerseCountsCsv.trim().split('\n');
	const rows = [];

	for (let i = 1; i < lines.length; i++) {
		const [bookName, chapterRaw, verseCountRaw] = lines[i].split(',');
		if (!bookName || !chapterRaw || !verseCountRaw) continue;

		rows.push({
			bookName: bookName.trim(),
			chapter: Number(chapterRaw),
			verseCount: Number(verseCountRaw)
		});
	}

	return rows;
}

export function normalizeBookName(bookName) {
	const match = findBookByName(bookName);
	return match ? match.simplified : String(bookName || '').trim();
}

const parsedRows = parseChapterCountsCsv();

const chapterVerseCounts = new Map();
const bookChapterCounts = new Map();
const bookVerseTotals = new Map();

parsedRows.forEach((row) => {
	const normalizedBook = normalizeBookName(row.bookName);
	const chapterKey = `${normalizedBook}-${row.chapter}`;

	chapterVerseCounts.set(chapterKey, row.verseCount);
	bookChapterCounts.set(normalizedBook, Math.max(bookChapterCounts.get(normalizedBook) || 0, row.chapter));
	bookVerseTotals.set(normalizedBook, (bookVerseTotals.get(normalizedBook) || 0) + row.verseCount);
});

export function getChapterKey(bookName, chapterNumber) {
	return `${normalizeBookName(bookName)}-${Number(chapterNumber)}`;
}

export function getChapterVerseCount(bookName, chapterNumber) {
	return chapterVerseCounts.get(getChapterKey(bookName, chapterNumber)) || 0;
}

export function getBookChapterCount(bookName) {
	return bookChapterCounts.get(normalizeBookName(bookName)) || 0;
}

export function getBookVerseTotal(bookName) {
	return bookVerseTotals.get(normalizeBookName(bookName)) || 0;
}

export function getAllBooksWithTotals() {
	return Array.from(bookChapterCounts.keys()).map((bookName) => ({
		bookName,
		chapterCount: bookChapterCounts.get(bookName) || 0,
		verseTotal: bookVerseTotals.get(bookName) || 0
	}));
}

export const PREDEFINED_RANGES = {
	sermon_on_mount: {
		id: 'sermon_on_mount',
		labelKey: 'achievement_range_sermon_on_mount',
		bookName: '马太福音',
		startChapter: 5,
		endChapter: 7
	}
};

export const SPECIAL_PASSAGES = {
	romans_road: {
		id: 'romans_road',
		type: 'refs',
		nameKeyLearned: 'achievement_passage_romans_road_learned',
		nameKeyMastered: 'achievement_passage_romans_highway_mastered',
		refs: [
			{ bookName: '罗马书', chapter: 3, verse: 23 },
			{ bookName: '罗马书', chapter: 6, verse: 23 },
			{ bookName: '罗马书', chapter: 5, verse: 8 },
			{ bookName: '罗马书', chapter: 10, verse: 9 },
			{ bookName: '罗马书', chapter: 10, verse: 10 },
			{ bookName: '罗马书', chapter: 10, verse: 13 },
			{ bookName: '罗马书', chapter: 8, verse: 1 }
		]
	},
	good_news: {
		id: 'good_news',
		type: 'refs',
		nameKeyLearned: 'achievement_passage_four_spiritual_laws_learned',
		nameKeyMastered: 'achievement_passage_good_news_mastered',
		refs: [
			{ bookName: '约翰福音', chapter: 3, verse: 16 },
			{ bookName: '约翰福音', chapter: 10, verse: 10 },
			{ bookName: '罗马书', chapter: 3, verse: 23 },
			{ bookName: '罗马书', chapter: 6, verse: 23 },
			{ bookName: '罗马书', chapter: 5, verse: 8 },
			{ bookName: '哥林多前书', chapter: 15, verse: 3 },
			{ bookName: '哥林多前书', chapter: 15, verse: 4 },
			{ bookName: '约翰福音', chapter: 14, verse: 6 },
			{ bookName: '约翰福音', chapter: 1, verse: 12 },
			{ bookName: '以弗所书', chapter: 2, verse: 8 },
			{ bookName: '以弗所书', chapter: 2, verse: 9 },
			{ bookName: '启示录', chapter: 3, verse: 20 }
		]
	},
	psalm_23: {
		id: 'psalm_23',
		type: 'range',
		nameKeyLearned: 'achievement_passage_my_shepherd_learned',
		nameKeyMastered: 'achievement_passage_goodness_mercy_mastered',
		bookName: '诗篇',
		startChapter: 23,
		endChapter: 23
	},
	psalm_119: {
		id: 'psalm_119',
		type: 'range',
		nameKeyLearned: 'achievement_passage_hidden_in_heart_learned',
		nameKeyMastered: 'achievement_passage_sweeter_than_honey_mastered',
		bookName: '诗篇',
		startChapter: 119,
		endChapter: 119
	},
	sermon_on_mount: {
		id: 'sermon_on_mount',
		type: 'range',
		nameKeyLearned: 'achievement_passage_sermon_on_mount_learned',
		nameKeyMastered: 'achievement_passage_kingdom_life_mastered',
		bookName: '马太福音',
		startChapter: 5,
		endChapter: 7
	},
	farewell_discourse: {
		id: 'farewell_discourse',
		type: 'range',
		nameKeyLearned: 'achievement_passage_farewell_discourse_learned',
		nameKeyMastered: 'achievement_passage_red_letters_mastered',
		bookName: '约翰福音',
		startChapter: 14,
		endChapter: 17
	},
	dead_to_sin: {
		id: 'dead_to_sin',
		type: 'range',
		nameKeyLearned: 'achievement_passage_dead_to_sin_learned',
		nameKeyMastered: 'achievement_passage_nothing_separates_mastered',
		bookName: '罗马书',
		startChapter: 6,
		endChapter: 8
	}
};

export function getVerseReferenceKey(bookName, chapter, verse) {
	return `${normalizeBookName(bookName)}-${Number(chapter)}-${Number(verse)}`;
}

export function getPassageReferenceKeys(passageDef) {
	if (passageDef.type === 'refs') {
		return passageDef.refs.map((ref) => getVerseReferenceKey(ref.bookName, ref.chapter, ref.verse));
	}

	const keys = [];
	for (let chapter = passageDef.startChapter; chapter <= passageDef.endChapter; chapter++) {
		const verseCount = getChapterVerseCount(passageDef.bookName, chapter);
		for (let verse = 1; verse <= verseCount; verse++) {
			keys.push(getVerseReferenceKey(passageDef.bookName, chapter, verse));
		}
	}

	return keys;
}

export function getRangeChapterKeys(rangeDef) {
	const keys = [];
	for (let chapter = rangeDef.startChapter; chapter <= rangeDef.endChapter; chapter++) {
		keys.push(getChapterKey(rangeDef.bookName, chapter));
	}
	return keys;
}

export function getRangeVerseTotal(rangeDef) {
	let total = 0;
	for (let chapter = rangeDef.startChapter; chapter <= rangeDef.endChapter; chapter++) {
		total += getChapterVerseCount(rangeDef.bookName, chapter);
	}
	return total;
}
