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
