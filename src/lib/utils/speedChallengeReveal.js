export function shouldRevealPunctuationAtIndex(charToInputIndex, charIndex, typedLength) {
	if (!Array.isArray(charToInputIndex)) return false;
	if (charIndex < 0 || charIndex >= charToInputIndex.length) return false;
	if (charToInputIndex[charIndex] !== null) return false;

	let prevCharInputIndex = null;
	for (let i = charIndex - 1; i >= 0; i--) {
		if (charToInputIndex[i] !== null) {
			prevCharInputIndex = charToInputIndex[i];
			break;
		}
	}

	return prevCharInputIndex === null ? true : typedLength > prevCharInputIndex;
}
