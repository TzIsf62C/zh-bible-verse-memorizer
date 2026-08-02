export function resolveCurrentVerse(versesToLearn, currentVerseIdx) {
	if (!Array.isArray(versesToLearn) || versesToLearn.length === 0) {
		return null;
	}

	const normalizedIndex = Number(currentVerseIdx);
	if (!Number.isInteger(normalizedIndex) || normalizedIndex < 0 || normalizedIndex >= versesToLearn.length) {
		return null;
	}

	return versesToLearn[normalizedIndex] || null;
}
