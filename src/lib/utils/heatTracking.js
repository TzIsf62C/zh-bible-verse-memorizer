/**
 * Heat Array Tracking Utilities
 * 
 * Tracks character-level accuracy for verses using a heat array.
 * Each character (Chinese chars + digits) has a score 0-99:
 * - 99: Perfect/untested
 * - High scores: Consistently correct
 * - Low scores: Frequently incorrect
 */

/**
 * Initialize a heat array for a verse
 * Creates an array of 99s for all trackable characters (Chinese chars + digits)
 * Punctuation is not tracked
 * 
 * @param {string} verseText - The verse text
 * @param {string} bookName - The book name
 * @param {number} chapterNumber - The chapter number
 * @param {number} verseNumber - The verse number
 * @returns {number[]} Array of 99s matching trackable character count
 */
export function initializeHeatArray(verseText, bookName, chapterNumber, verseNumber) {
	// Combine verse text and reference (same format as display)
	const fullText = `${verseText}\n${bookName} ${chapterNumber}:${verseNumber}`;
	
	// Count trackable characters (Chinese chars + digits, excluding punctuation)
	const chars = [...fullText];
	const trackableCount = chars.filter(char => 
		/[\u4e00-\u9fa5]/.test(char) || /[0-9]/.test(char)
	).length;
	
	// Initialize all to 99 (perfect/untested)
	return new Array(trackableCount).fill(99);
}

/**
 * Update heat array based on user input correctness
 * 
 * @param {number[]} heatArray - Current heat array
 * @param {boolean[]} correctnessMap - Array of booleans (true=correct, false=incorrect) matching heatArray length
 * @returns {number[]} Updated heat array
 */
export function updateHeatArray(heatArray, correctnessMap) {
	if (!heatArray || !correctnessMap) {
		return heatArray;
	}
	
	if (heatArray.length !== correctnessMap.length) {
		console.warn('[heatTracking] Array length mismatch:', {
			heatArrayLength: heatArray.length,
			correctnessMapLength: correctnessMap.length
		});
		return heatArray;
	}
	
	return heatArray.map((score, index) => {
		const isCorrect = correctnessMap[index];
		
		if (isCorrect === true) {
			// Correct character: add 5 (max 99)
			return Math.min(score + 5, 99);
		} else if (isCorrect === false) {
			// Incorrect character: subtract 10 (min 0)
			return Math.max(score - 10, 0);
		} else {
			// null/undefined: no change (character not attempted)
			return score;
		}
	});
}

/**
 * Calculate score from heat array using weakest quartile average.
 * 
 * This focuses the verse score on the weakest 25% of tracked characters
 * instead of a simple full-array average.
 * 
 * @param {number[]} heatArray - Heat array to calculate score from
 * @returns {number} Weakest quartile average (0-99), or 99 if array is empty/undefined
 */
export function calculateHeatScore(heatArray) {
	if (!heatArray || heatArray.length === 0) {
		return 99; // Perfect score for untracked verses
	}

	const numericScores = heatArray.filter(score => Number.isFinite(score));
	if (numericScores.length === 0) {
		return 99;
	}

	const sortedScores = [...numericScores].sort((a, b) => a - b);
	const weakestQuartileSize = Math.max(1, Math.ceil(sortedScores.length * 0.25));
	const weakestQuartile = sortedScores.slice(0, weakestQuartileSize);
	const weakestSum = weakestQuartile.reduce((acc, val) => acc + val, 0);

	return weakestSum / weakestQuartile.length;
}

/**
 * Transform a raw weakest-quartile score into a user-facing score.
 * Uses distance-from-perfection scaling to make progress near perfection clearer.
 *
 * @param {number} rawScore - Raw score from weakest quartile average (0-99)
 * @returns {number} Scaled score (0-99)
 */
export function transformHeatScore(rawScore) {
	const safeRaw = Number.isFinite(rawScore) ? Math.max(0, Math.min(99, rawScore)) : 99;
	return 99 - 99 * Math.pow((99 - safeRaw) / 99, 0.60);
}

/**
 * Build correctness map from user input and expected initials
 * Maps each character position to correct/incorrect/null
 * 
 * @param {string} verseText - The verse text
 * @param {string} bookName - Book name
 * @param {number} chapterNumber - Chapter number
 * @param {number} verseNumber - Verse number
 * @param {string} verseInitials - Expected verse initials
 * @param {string} bookInitials - Expected book initials
 * @param {string} userInput - User's input
 * @param {string} inputMethod - Input method ('pinyin', 'zhuyin', 'cangjie')
 * @param {boolean} verseTextOnly - If true, only track verse text (not reference) - for SingleTextReview
 * @returns {boolean[]} Correctness map matching heat array length
 */
export function buildCorrectnessMap(
	verseText,
	bookName,
	chapterNumber,
	verseNumber,
	verseInitials,
	bookInitials,
	userInput,
	inputMethod = 'pinyin',
	verseTextOnly = false
) {
	// Build full text and full initials
	const fullText = `${verseText}\n${bookName} ${chapterNumber}:${verseNumber}`;
	const fullInitials = `${verseInitials}${bookInitials}${String(chapterNumber)}${String(verseNumber)}`;
	
	// Build character-to-input mapping (same logic as review modes)
	const chars = [...fullText];
	const charToInputIndex = new Array(chars.length).fill(null);
	let inputIdx = 0;
	
	for (let i = 0; i < chars.length; i++) {
		const ch = chars[i];
		if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
			charToInputIndex[i] = inputIdx;
			inputIdx++;
		}
	}
	
	// Find where reference starts (after newline)
	const verseTextLength = verseText.length;
	const referenceStartCharIndex = verseTextLength + 1; // +1 for newline
	
	// Build correctness map
	const correctnessMap = [];
	
	for (let i = 0; i < chars.length; i++) {
		const inputIndex = charToInputIndex[i];
		
		// Skip punctuation
		if (inputIndex === null) {
			continue;
		}
		
		// If verseTextOnly mode and this is a reference character, mark as null (no update)
		if (verseTextOnly && i >= referenceStartCharIndex) {
			correctnessMap.push(null);
			continue;
		}
		
		// Check if user input matches expected
		if (inputIndex < userInput.length && inputIndex < fullInitials.length) {
			const expected = fullInitials[inputIndex];
			const typed = userInput[inputIndex];
			const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
			const typedNorm = inputMethod === 'pinyin' ? typed.toLowerCase() : typed;
			
			correctnessMap.push(typedNorm === expectedNorm);
		} else {
			// Character not attempted
			correctnessMap.push(null);
		}
	}
	
	return correctnessMap;
}

/**
 * Get heat color for a character based on its score
 * Returns rgb color string
 * 
 * Gradient: Cyan (high scores) to Vivid Coral (low scores)
 * - Score 99: Cyan rgb(0, 255, 255)
 * - Score 60 and below: Vivid Coral rgb(255, 99, 71)
 * - Scores 61-98: Linear interpolation between cyan and coral
 * 
 * @param {number} score - Heat score (0-99)
 * @returns {string} CSS rgb color string
 */
export function getHeatColor(score) {
	if (score >= 99) {
		// Perfect: cyan
		return 'rgb(0, 255, 255)';
	} else if (score <= 60) {
		// Low score: vivid coral
		return 'rgb(255, 99, 71)';
	} else {
		// 61-98: linear interpolation from coral to cyan
		// At score 61: nearly coral
		// At score 98: nearly cyan
		const t = (score - 61) / 37; // 0 at score 61, 1 at score 98
		
		// Interpolate between coral (255, 99, 71) and cyan (0, 255, 255)
		const r = Math.round(255 * (1 - t) + 0 * t);
		const g = Math.round(99 * (1 - t) + 255 * t);
		const b = Math.round(71 * (1 - t) + 255 * t);
		
		return `rgb(${r}, ${g}, ${b})`;
	}
}
