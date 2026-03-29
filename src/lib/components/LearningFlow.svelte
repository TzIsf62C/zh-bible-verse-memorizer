<script>
	import { verses } from '$lib/stores/verses';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import Keyboard from './Keyboard.svelte';
	import { keyboardLayouts } from '$lib/utils/keyboardLayouts';
	import { spacedRepetitionBinary } from '$lib/utils/spacedRepetition';
	import { zhuyinKeyMap, cangjieKeyMap } from '$lib/utils/inputMaps';
	import { triggerErrorFeedback } from '$lib/utils/feedback';
	import { createVerseReferenceFormatter } from '$lib/utils/bibleBooks';

	let currentVerseIdx = 0;
	let currentStage = 'basic'; // basic, intermediate, advanced - user can choose any
	let intermediateVariant = 'odd'; // or 'even'
	let userInput = '';
	let feedbackMessage = '';
	let feedbackType = ''; // success, error, warning
	let accuracy = 0;
	let showNextButton = false;
	let showRetryButton = false;
	let keyboardLayout = keyboardLayouts.pinyin;
	let versesToLearn = [];
	let learnFullText = '';
	let learnFullInitials = '';
	let charToInputIndex = [];
	let inputIndexToCharIndex = [];
	let showModal = false;
	let modalMessage = '';
	let isNumericKeyboard = false;
	let verseSelectorOpacity = 1;
	let lastErrorIndex = null;
	let lastErrorChar = null;
	let viewportAnchor; // Element to scroll into view for keyboard positioning
	let scrollTrigger = 0; // Increment this to trigger viewport scroll
	
	// Keyboard feedback tracking
	let pressedKey = null;
	let correctKey = null;
	let lastCorrectKey = null;

	// Reset keyboard feedback when verse or difficulty stage changes
	$: {
		// React to verse or stage changes to clear feedback
		const _ = currentVerseIdx;
		const __ = currentStage;
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
	}

	// Check for input method mismatch and show warning
	$: {
		// Explicitly depend on both learnFullInitials and inputMethod
		const currentMethod = $settings.inputMethod;
		const fullInitials = learnFullInitials;
		
		if (fullInitials && currentMethod) {
			const verseInputMethod = detectInputMethod(fullInitials);
			
			if (verseInputMethod && verseInputMethod !== currentMethod) {
				const methodNames = { 
					pinyin: t('input_pinyin'), 
					zhuyin: t('input_zhuyin'), 
					cangjie: t('input_cangjie') 
				};
				feedbackMessage = t('input_method_mismatch').replace('{method}', methodNames[verseInputMethod] || verseInputMethod);
				feedbackType = 'warning';
			} else if (verseInputMethod === currentMethod && feedbackType === 'warning') {
				// Only clear warning if we successfully detected a matching method
				feedbackMessage = '';
				feedbackType = '';
			}
		}
	}

	// Update keyboard layout when input method changes OR when switching to numeric
	$: {
		const nextCharIndex = userInput.length;
		const isNextCharNumber = nextCharIndex < learnFullInitials.length && /[0-9]/.test(learnFullInitials[nextCharIndex]);
		
		if (isNextCharNumber) {
			keyboardLayout = keyboardLayouts.numericCompact;
			isNumericKeyboard = true;
		} else {
			// Use compact layouts (no delete/enter row) for learning mode
			const inputMethod = $settings.inputMethod || 'pinyin';
			keyboardLayout = keyboardLayouts[`${inputMethod}Compact`] || keyboardLayouts.pinyinCompact;
			isNumericKeyboard = false;
		}
	}

	// Fade out verse selector gradually in intermediate/advanced stages to prevent cheating
	$: {
		const totalInputsRequired = learnFullInitials.length;
		const typedRatio = totalInputsRequired > 0 ? (userInput.length / totalInputsRequired) : 0;
		
		if (currentStage === 'intermediate' || currentStage === 'advanced') {
			// No fade below 25%, fully invisible at 50% or above
			if (typedRatio <= 0.25) {
				verseSelectorOpacity = 1;
			} else if (typedRatio >= 0.5) {
				verseSelectorOpacity = 0;
			} else {
				// Linear fade from 1 -> 0 as typedRatio goes 0.25 -> 0.5
				verseSelectorOpacity = 1 - (typedRatio - 0.25) / 0.25;
			}
		} else {
			// Ensure fully visible in basic mode
			verseSelectorOpacity = 1;
		}
	}

	// Scroll viewport to position content above keyboard
	$: {
		if (viewportAnchor && versesToLearn.length > 0 && !showModal) {
			// Include scrollTrigger in reactive dependencies to trigger on errors
			const _ = scrollTrigger;
			
			console.log('=== VIEWPORT SCROLL TRIGGER ===');
			console.log('Anchor element:', viewportAnchor);
			console.log('Anchor bounding rect:', viewportAnchor.getBoundingClientRect());
			
			setTimeout(() => {
				console.log('=== EXECUTING SCROLL ===');
				const anchorRect = viewportAnchor.getBoundingClientRect();
				console.log('Before scroll - Anchor rect:', anchorRect);
				console.log('Before scroll - Window scrollY:', window.scrollY);
				console.log('Before scroll - Document scrollTop:', document.documentElement.scrollTop);
				console.log('Viewport height:', window.innerHeight);
				
				// Find keyboard element (Svelte Keyboard component)
				const keyboard = viewportAnchor.nextElementSibling;
				if (keyboard) {
					const keyboardRect = keyboard.getBoundingClientRect();
					console.log('Keyboard element:', keyboard);
					console.log('Keyboard rect:', keyboardRect);
					console.log('Keyboard top position:', keyboardRect.top);
					
					// Calculate scroll position: we want the anchor to align with the keyboard's top edge
					// The keyboard is fixed/sticky, so we scroll the anchor to match its viewport position
					// scrollTarget = current scroll + (anchor position - desired position)
					// desired position = keyboard top (where we want the anchor to be)
					const scrollTarget = window.scrollY + (anchorRect.top - keyboardRect.top);
					console.log('Calculated scroll target:', scrollTarget);
					console.log('Current scrollY:', window.scrollY);
					console.log('Anchor top from viewport:', anchorRect.top);
					console.log('Keyboard top from viewport:', keyboardRect.top);
					console.log('Scroll adjustment needed:', anchorRect.top - keyboardRect.top);
					
					window.scrollTo({ 
						top: scrollTarget, 
						behavior: 'smooth' 
					});
				} else {
					console.log('WARNING: No keyboard element found after anchor');
				}
				
				setTimeout(() => {
					console.log('=== AFTER SCROLL (500ms) ===');
					const newAnchorRect = viewportAnchor.getBoundingClientRect();
					console.log('After scroll - Anchor rect:', newAnchorRect);
					console.log('After scroll - Anchor top from viewport:', newAnchorRect.top);
					console.log('After scroll - Window scrollY:', window.scrollY);
					if (keyboard) {
						const newKeyboardRect = keyboard.getBoundingClientRect();
						console.log('After scroll - Keyboard rect:', newKeyboardRect);
						console.log('After scroll - Keyboard top from viewport:', newKeyboardRect.top);
						console.log('Alignment check - Anchor vs Keyboard:', newAnchorRect.top - newKeyboardRect.top);
					}
				}, 500);
			}, 300);
		}
	}

	// Filter unlearned verses - verses WITHOUT lastReviewed dates are unlearned
	$: {
		versesToLearn = $verses.filter((v) => !v.lastReviewed);
		console.log('[Learn] Filtered unlearned verses:', {
			total: $verses.length,
			unlearned: versesToLearn.length,
			filtered: versesToLearn.map(v => `${v.bookName} ${v.chapterNumber}:${v.verseNumber}`)
		});
		
		// If we had a verse selected but it's now learned, reset
		if (currentVerseIdx >= versesToLearn.length) {
			currentVerseIdx = 0;
		}
		
		// Initialize first verse if available
		if (versesToLearn.length > 0 && currentVerseIdx === 0) {
			initializeVerse(versesToLearn[0]);
		}
	}

	// Create verse reference formatter that checks ALL verses for duplicates (not just versesToLearn)
	$: formatVerseRef = createVerseReferenceFormatter($verses);

	function selectVerse(idx) {
		currentVerseIdx = idx;
		const verse = versesToLearn[idx];
		if (verse) {
			initializeVerse(verse);
		}
		console.log('[Learn] Selected verse', verse);
	}

	function setStage(stage) {
		currentStage = stage;
		userInput = '';
		feedbackMessage = '';
		showNextButton = false;
		showRetryButton = false;
		console.log('[Learn] Stage changed to', stage);
	}
	
	function toggleIntermediateVariant() {
		intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
		userInput = '';
		feedbackMessage = '';
		console.log('[Learn] Toggled intermediate variant to', intermediateVariant);
	}

	function initializeVerse(verse) {
		userInput = '';
		feedbackMessage = '';
		showNextButton = false;
		showRetryButton = false;

		// Combine verse text and reference like original app
		learnFullText = `${verse.verseText}\n${verse.bookName} ${verse.chapterNumber}:${verse.verseNumber}`;
		
		// Combine all expected inputs: verse initials + book initials + chapter + verse number
		learnFullInitials = `${verse.verseInitials}${verse.bookInitials}${String(verse.chapterNumber)}${String(verse.verseNumber)}`;

		// Build character-to-input mapping (critical for punctuation handling)
		const chars = [...learnFullText];
		charToInputIndex = new Array(chars.length).fill(null);
		inputIndexToCharIndex = [];
		let inputIdx = 0;
		
		for (let i = 0; i < chars.length; i++) {
			const ch = chars[i];
			// Only Chinese characters and digits require input
			if (/[\u4e00-\u9fa5]/.test(ch) || /[0-9]/.test(ch)) {
				charToInputIndex[i] = inputIdx;
				inputIndexToCharIndex[inputIdx] = i;
				inputIdx++;
			} else {
				charToInputIndex[i] = null; // Punctuation/whitespace
			}
		}

		console.log('[Learn] Initialized verse:', {
			fullText: learnFullText,
			fullInitials: learnFullInitials,
			expectedLength: learnFullInitials.length,
			charToInputMap: charToInputIndex
		});
	}

	function detectInputMethod(initials) {
		console.log('[LearningFlow] detectInputMethod called with initials:', initials);
		if (!initials || initials.length === 0) {
			console.log('[LearningFlow] No initials provided, returning null');
			return null;
		}
		
		// Sample first few characters (excluding numbers)
		const sample = initials.split('').filter(c => !/[0-9]/.test(c)).slice(0, 5).join('');
		console.log('[LearningFlow] Filtered sample (first 5 non-numeric chars):', sample);
		
		if (!sample) {
			console.log('[LearningFlow] Sample is empty after filtering, returning null');
			return null;
		}
		
		// Log Unicode values of sample characters
		const charCodes = sample.split('').map(c => `${c} (U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`).join(', ');
		console.log('[LearningFlow] Sample character codes:', charCodes);
		
		// Check for Zhuyin (Bopomofo characters U+3105-U+3129 and tone marks)
		const zhuyinMatch = /[\u3105-\u3129\u02CA\u02C7\u02CB\u02D9]/.test(sample);
		console.log('[LearningFlow] Zhuyin regex test:', zhuyinMatch);
		if (zhuyinMatch) {
			console.log('[LearningFlow] Detected: zhuyin');
			return 'zhuyin';
		}
		
		// Check for Cangjie (Chinese characters used as input)
		const cangjieMatch = /[\u4e00-\u9fa5]/.test(sample);
		console.log('[LearningFlow] Cangjie regex test:', cangjieMatch);
		if (cangjieMatch) {
			console.log('[LearningFlow] Detected: cangjie');
			return 'cangjie';
		}
		
		// Check for Pinyin (lowercase Latin letters)
		const pinyinMatch = /[a-z]/.test(sample);
		console.log('[LearningFlow] Pinyin regex test:', pinyinMatch);
		if (pinyinMatch) {
			console.log('[LearningFlow] Detected: pinyin');
			return 'pinyin';
		}
		
		console.log('[LearningFlow] No match found, returning null');
		return null;
	}

	function getCurrentVerse() {
		if (!versesToLearn.length) return null;
		return versesToLearn[currentVerseIdx];
	}

	function getExpectedInitials() {
		return learnFullInitials;
	}

	function handleKeyInput(event) {
		console.log('[Learn] ========== handleKeyInput CALLED ==========');
		console.log('[Learn] Event:', event);
		const key = event.detail;
		console.log('[Learn] Keyboard key pressed:', key);
		console.log('[Learn] Current userInput before processing:', userInput);

		if (key === '⌫' || key === 'Backspace') {
			// Backspace is disabled during learning - ignore
			console.log('[Learn] Backspace disabled during learning');
			return;
		}

		if (key === '↵' || key === 'Enter') {
			if (userInput.length === learnFullInitials.length) {
				submitAnswer();
			}
			return;
		}

		// Clear previous feedback before adding new input
		pressedKey = null;
		correctKey = null;
		lastCorrectKey = null;
		
		// Determine what the expected key is at this position
		const inputMethod = $settings.inputMethod || 'pinyin';
		const nextExpectedChar = learnFullInitials[userInput.length];
		const normalizedKey = inputMethod === 'pinyin' ? key.toLowerCase() : key;
		const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
		
		// Check if input is correct
		if (normalizedKey === normalizedExpected) {
			// Correct input - show success feedback
			lastCorrectKey = key;
		} else {
			// Incorrect input - show error feedback
			pressedKey = key;
			correctKey = nextExpectedChar;
		}

		userInput += key;
		console.log('[Learn] User input now:', userInput, 'expected:', learnFullInitials);

		// Update error feedback for incorrect input
		console.log('[Learn] Calling updateErrorFeedback after key press');
		try {
			updateErrorFeedback();
			console.log('[Learn] updateErrorFeedback completed successfully');
		} catch (error) {
			console.error('[Learn] ERROR in updateErrorFeedback:', error);
		}

		// Auto-submit when input matches expected length
		if (userInput.length === learnFullInitials.length) {
			submitAnswer();
		}
	}

	function updateErrorFeedback() {
		console.log('=== UPDATE ERROR FEEDBACK CALLED ===');
		console.log('userInput:', userInput);
		console.log('learnFullInitials:', learnFullInitials);
		console.log('userInput.length:', userInput.length);
		console.log('learnFullInitials.length:', learnFullInitials.length);
		
		const inputMethod = $settings.inputMethod || 'pinyin';
		console.log('inputMethod:', inputMethod);
		
		let latestErrorIndex = -1;
		let latestErrorChar = '';
		let mappedCharIndex = -1;

		// Find the most recent (latest) error
		for (let i = 0; i < userInput.length; i++) {
			const expected = learnFullInitials[i];
			const typed = userInput[i];
			const expectedNorm = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
			const typedNorm = inputMethod === 'pinyin' ? typed.toLowerCase() : typed;
			
			console.log(`Comparing index ${i}: typed="${typedNorm}" vs expected="${expectedNorm}"`);
			
			if (typedNorm !== expectedNorm) {
				console.log(`ERROR FOUND at index ${i}: typed="${typedNorm}" != expected="${expectedNorm}"`);
				latestErrorIndex = i;
				latestErrorChar = expected;
				mappedCharIndex = inputIndexToCharIndex[i] !== undefined ? inputIndexToCharIndex[i] : -1;
			}
		}

		console.log('Latest error index:', latestErrorIndex);
		console.log('Latest error char:', latestErrorChar);
		console.log('Mapped char index:', mappedCharIndex);

		// Update error tracking for audio/haptic feedback
		if (latestErrorIndex === -1) {
			// No error
			console.log('No errors found');
			lastErrorIndex = null;
			lastErrorChar = null;
		} else {
			console.log('Error at index:', latestErrorIndex);
			
			// Only trigger feedback if this is a new or different error
			if (lastErrorIndex !== latestErrorIndex || lastErrorChar !== latestErrorChar) {
				console.log('NEW/DIFFERENT ERROR - triggering feedback');
				lastErrorIndex = latestErrorIndex;
				lastErrorChar = latestErrorChar;
				
				// Trigger audio/haptic feedback
				triggerErrorFeedback($settings);
				
				// Trigger viewport scroll
				scrollTrigger++;
				console.log('Scroll trigger incremented to:', scrollTrigger);
			} else {
				console.log('Same error as before - not updating feedback');
			}
		}
		console.log('=== END UPDATE ERROR FEEDBACK ===');
	}

	function submitAnswer() {
		const expected = getExpectedInitials();

		if (!expected) {
			feedbackMessage = t('fill_all_fields');
			feedbackType = 'error';
			console.log('[Learn] Submit failed - no expected initials');
			return;
		}

		// Calculate accuracy
		let correctChars = 0;
		const inputMethod = $settings.inputMethod || 'pinyin';
		for (let i = 0; i < expected.length; i++) {
			const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
			const expectedChar = inputMethod === 'pinyin' ? expected[i].toLowerCase() : expected[i];
			if (typedChar === expectedChar) {
				correctChars++;
			}
		}

		accuracy = Math.round((correctChars / expected.length) * 100);
		console.log('[Learn] Submitted answer', {
			stage: currentStage,
			accuracy,
			inputLength: userInput.length,
			expectedLength: expected.length,
			correctChars,
			totalExpected: expected.length
		});

		if (accuracy >= 90) {
			// Success!
			console.log('[Learn] Success at', currentStage, 'stage');
			
			if (currentStage === 'basic') {
				console.log('[Learn] Completed basic stage - showing modal');
				modalMessage = t('great_job_basic');
				showModal = true;
				feedbackMessage = '';
				feedbackType = '';
				userInput = '';
			} else if (currentStage === 'intermediate') {
				console.log('[Learn] Completed intermediate stage - showing modal');
				modalMessage = t('great_job_intermediate');
				showModal = true;
				feedbackMessage = '';
				feedbackType = '';
				userInput = '';
			} else if (currentStage === 'advanced') {
				console.log('[Learn] Completed advanced stage - verse learned');
				// Mark verse as learned
				updateVerseProgress(getCurrentVerse());
				// Show modal for completion
				modalMessage = `${t('congratulations_mastered')} (${accuracy}%)`;
				showModal = true;
				feedbackMessage = '';
				feedbackType = '';
				userInput = '';
				// Set a flag to indicate we need to advance to next verse
				window._advancedCompleted = true;
			}
		} else {
			// Failed - show error feedback
			console.log('[Learn] Failed with accuracy:', accuracy);
			let mismatchIndex = -1;
			for (let i = 0; i < Math.max(userInput.length, expected.length); i++) {
				const typedChar = inputMethod === 'pinyin' ? (userInput[i] || '').toLowerCase() : (userInput[i] || '');
				const expectedChar = inputMethod === 'pinyin' ? expected[i].toLowerCase() : expected[i];
				if (typedChar !== expectedChar) {
					mismatchIndex = i;
					break;
				}
			}
			if (currentStage === 'intermediate') {
				// Show modal for intermediate failure - NO retry button below verse
				modalMessage = `${t('nice_try')} (${accuracy}%)`;
				showModal = true;
				feedbackMessage = '';
				feedbackType = '';
				userInput = '';
				// Don't set showRetryButton - modal handles retry
			} else {
				showRetryButton = true;
				feedbackMessage = `${t('nice_try')} (${accuracy}%)`;
				feedbackType = 'error';
				userInput = '';
			}
		}
	}

	function updateVerseProgress(verse) {
		const today = new Date();
		const updatedVerse = spacedRepetitionBinary(verse, true, today);

		verses.update((list) =>
			list.map((v) => (v.id === verse.id ? { ...updatedVerse, lastReviewed: today.toISOString() } : v))
		);
	}

	function handleRetry() {
		// Toggle intermediate variant on retry if in intermediate mode
		if (currentStage === 'intermediate') {
			intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
		}
		userInput = '';
		feedbackMessage = '';
		accuracy = 0;
		showNextButton = false;
		showRetryButton = false;
	}
	
	function closeModal() {
		showModal = false;
		
		// Check if this was an advanced completion using our flag
		if (window._advancedCompleted) {
			window._advancedCompleted = false; // Clear the flag
			// Advanced completion: move to next verse at basic stage
			// Note: the completed verse has already been filtered out of versesToLearn
			// so currentVerseIdx now points to the next verse (or is out of bounds)
			if (versesToLearn.length > 0) {
				// Select the first verse (which is now the "next" verse after filtering)
				currentVerseIdx = 0;
				selectVerse(0);
				setStage('basic');
				console.log('[Learn] Advanced completed - moved to next verse at basic stage');
			} else {
				feedbackMessage = t('completed_all_verses');
				feedbackType = 'warning';
				console.log('[Learn] Advanced completed - no more verses');
			}
		} else if (currentStage === 'basic') {
			// Advance to next stage on success
			currentStage = 'intermediate';
			userInput = '';
			feedbackMessage = '';
			showNextButton = false;
			showRetryButton = false;
		} else if (currentStage === 'intermediate') {
			// Check if this was a success or failure modal
			if (modalMessage.includes(t('great_job_intermediate'))) {
				// Success - advance to advanced
				currentStage = 'advanced';
				userInput = '';
				feedbackMessage = '';
				showNextButton = false;
				showRetryButton = false;
			} else {
				// Failure - toggle variant and allow immediate retry (no retry button)
				intermediateVariant = intermediateVariant === 'odd' ? 'even' : 'odd';
				// Don't show retry button - user can type immediately
				showRetryButton = false;
				userInput = '';
				feedbackMessage = '';
			}
		}
	}

	function handleNext() {
		if (currentVerseIdx < versesToLearn.length - 1) {
			selectVerse(currentVerseIdx + 1);
			setStage('basic'); // Reset to basic for new verse
		} else {
			// No more verses
			feedbackMessage = t('completed_all_verses');
			feedbackType = 'warning';
		}
	}

	// Character rendering logic matching original app
	function renderCharacter(char, charIndex) {
		const map = charToInputIndex[charIndex];

		if (map !== null) {
			// Input-requiring character (Chinese or digit)
			const expected = learnFullInitials[map];
			let className = 'verse-character';
			let hidden = false;
			let intermediateHidden = false;

			// Determine visibility based on stage
			if (currentStage === 'intermediate') {
				const isOdd = ((map + 1) % 2) === 1;
				const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
				if (!visibleByVariant) {
					hidden = true;
					intermediateHidden = true;
				}
			} else if (currentStage === 'advanced') {
				hidden = true;
			}

			// If hidden, only reveal when user has typed that index
			if (hidden) {
				if (userInput.length > map) {
					const inputMethod = $settings.inputMethod || 'pinyin';
					const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
					const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
					const isCorrect = typedChar === expectedChar;
					return { char, className: className + (isCorrect ? ' correct' : ' incorrect'), hidden: false, intermediateHidden: false };
				} else {
					// Return different hidden state for intermediate vs advanced
					if (intermediateHidden) {
						return { char, className: className + ' intermediate-hidden', hidden: true, intermediateHidden: true };
					} else {
						return { char, className: className + ' hidden', hidden: true, intermediateHidden: false };
					}
				}
			}

			// Not hidden: mark correct/incorrect if user has typed
			if (userInput.length > map) {
				const inputMethod = $settings.inputMethod || 'pinyin';
				const typedChar = inputMethod === 'pinyin' ? userInput[map].toLowerCase() : userInput[map];
				const expectedChar = inputMethod === 'pinyin' ? expected.toLowerCase() : expected;
				const isCorrect = typedChar === expectedChar;
				className += isCorrect ? ' correct' : ' incorrect';
			}

			return { char, className, hidden: false, intermediateHidden: false };
		} else {
			// Punctuation/whitespace - complex visibility logic from original
			let className = 'verse-character punctuation';
			let shown = false;

			// Find nearest previous input-requiring character
			let prevMap = null;
			for (let k = charIndex - 1; k >= 0; k--) {
				if (charToInputIndex[k] !== null) {
					prevMap = charToInputIndex[k];
					break;
				}
			}

			// Find nearest next input-requiring character  
			let nextMap = null;
			for (let k = charIndex + 1; k < charToInputIndex.length; k++) {
				if (charToInputIndex[k] !== null) {
					nextMap = charToInputIndex[k];
					break;
				}
			}

			const isInitialPunct = (prevMap === null);

			// Show initial punctuation immediately in all modes
			if (isInitialPunct) {
				shown = true;
				className = 'verse-character correct'; // Initial punctuation always shown as correct (white)
			}

			// Stage-specific logic for non-initial punctuation
			if (!isInitialPunct) {
				if (currentStage === 'basic') {
					// Basic mode: show all punctuation, but only turn white after preceding char is typed
					shown = true;
					if (prevMap !== null && userInput.length > prevMap) {
						className = 'verse-character punctuation correct';
					} else {
						className = 'verse-character punctuation';
					}
				} else if (currentStage === 'intermediate') {
					// Intermediate: show if previous char is visible OR user has typed past it
					const isOdd = ((prevMap + 1) % 2) === 1;
					const visibleByVariant = (intermediateVariant === 'odd') ? isOdd : !isOdd;
					if (visibleByVariant || (prevMap !== null && userInput.length > prevMap)) {
						shown = true;
						// Inherit opacity from preceding character
						if (prevMap !== null && userInput.length > prevMap) {
							className = 'verse-character punctuation correct';
						} else {
							// Preceding char is visible but not typed yet - use default opacity
							className = 'verse-character punctuation';
						}
					}
				} else if (currentStage === 'advanced') {
					// Advanced: only show when user has typed past preceding character
					if (prevMap !== null && userInput.length > prevMap) {
						shown = true;
						// Punctuation appears as correct (white) when revealed
						className = 'verse-character punctuation correct';
					}
				}
			}

			return { char, className, hidden: !shown };
		}
	}

	// Physical keyboard handler
	function handlePhysicalKeyboard(e) {
		if (!getCurrentVerse()) return;
		if (showNextButton || showRetryButton) return;

		if (e.key === 'Enter' && userInput.length === learnFullInitials.length) {
			e.preventDefault();
			submitAnswer();
			return;
		}

		// Backspace is disabled in learning mode
		if (e.key === 'Backspace' || e.key === 'Delete') {
			e.preventDefault();
			return;
		}

		const inputMethod = $settings.inputMethod || 'pinyin';
		const key = e.key.toLowerCase();
		let mappedValue = '';

		if (inputMethod === 'zhuyin') {
			mappedValue = zhuyinKeyMap[key] || '';
		} else if (inputMethod === 'cangjie') {
			mappedValue = cangjieKeyMap[key] || '';
		} else if (/^[a-z0-9]$/i.test(key)) {
			mappedValue = key;
		}

		if (mappedValue) {
			e.preventDefault();
			
			// Clear previous feedback before adding new input
			pressedKey = null;
			correctKey = null;
			lastCorrectKey = null;
			
			// Determine what the expected key is at this position
			const nextExpectedChar = learnFullInitials[userInput.length];
			const normalizedKey = inputMethod === 'pinyin' ? mappedValue.toLowerCase() : mappedValue;
			const normalizedExpected = inputMethod === 'pinyin' ? (nextExpectedChar || '').toLowerCase() : (nextExpectedChar || '');
			
			// Check if input is correct
			if (normalizedKey === normalizedExpected) {
				// Correct input - show success feedback
				lastCorrectKey = key; // Use the physical key for highlighting
			} else {
				// Incorrect input - show error feedback
				pressedKey = key; // Use the physical key for highlighting
				correctKey = nextExpectedChar;
			}
			
			userInput += mappedValue;
			console.log('[Learn] Physical keyboard input:', userInput, 'expected:', learnFullInitials);
			
			// Update error feedback for incorrect input
			try {
				updateErrorFeedback();
				console.log('[Learn] updateErrorFeedback completed from physical keyboard');
			} catch (error) {
				console.error('[Learn] ERROR in updateErrorFeedback from physical keyboard:', error);
			}
			
			if (userInput.length === learnFullInitials.length) {
				submitAnswer();
			}
		}
	}
</script>

<svelte:document on:keydown={handlePhysicalKeyboard} />

<span class="visually-hidden" aria-hidden="true">{$settings.languagePreference}</span>

<div class="learning-container">
	<h2>{t('learn_mode')}</h2>

	<!-- Stage Selection Buttons (Always Visible in Learn Mode) -->
	<div class="difficulty-controls">
		<button
			class="mode-btn"
			class:active={currentStage === 'basic'}
			on:click={() => setStage('basic')}
		>
			{t('basic')}
		</button>
		<button
			class="mode-btn"
			class:active={currentStage === 'intermediate'}
			on:click={() => {
				console.log('[Learn] Intermediate button clicked, currentStage is:', currentStage);
				if (currentStage === 'intermediate') {
					console.log('[Learn] Already in intermediate, toggling variant');
					toggleIntermediateVariant();
				} else {
					console.log('[Learn] Not in intermediate, setting stage');
					setStage('intermediate');
				}
			}}
		>
			{t('intermediate')}
		</button>
		<button
			class="mode-btn"
			class:active={currentStage === 'advanced'}
			on:click={() => setStage('advanced')}
		>
			{t('advanced')}
		</button>
	</div>

	{#if versesToLearn.length === 0}
		<div class="empty-state">
			<p>{t('no_verses_to_learn')}</p>
		</div>
	{:else}
		<!-- Verse Selector -->
		<div class="learning-controls">
			<label for="verse-selector">{t('select_verse')}</label>
			<select 
				id="verse-selector" 
				bind:value={currentVerseIdx} 
				on:change={(e) => selectVerse(parseInt(e.target.value))}
				style="opacity: {verseSelectorOpacity}; transition: opacity 0.3s ease;"
			>
				{#each versesToLearn as verse, idx}
					<option value={idx}>
						{formatVerseRef(verse)}
					</option>
				{/each}
			</select>
		</div>

		{#if getCurrentVerse()}
			{@const verse = getCurrentVerse()}
			{@const chars = [...learnFullText]}
			{@const refIndex = learnFullText.indexOf('\n')}

			{#key `${currentVerseIdx}-${currentStage}-${intermediateVariant}-${userInput.length}`}
				<!-- Helper Text -->
				<div class="learn-helper-text">
					{#if $settings.inputMethod === 'pinyin'}
						<p>{t('pinyin_helper')}</p>
					{:else if $settings.inputMethod === 'zhuyin'}
						<p>{t('zhuyin_helper')}</p>
					{:else if $settings.inputMethod === 'cangjie'}
						<p>{t('cangjie_helper')}</p>
					{/if}
				</div>

				<!-- Verse Display (includes inline reference) -->
				<div class="verse-display">
					{#each chars as char, i}
						{@const rendered = renderCharacter(char, i)}
						{#if rendered.hidden}
							{#if rendered.intermediateHidden}
								<!-- Intermediate mode: show full-width low line for hidden characters -->
								<span class={rendered.className}>＿</span>
							{/if}
							<!-- Advanced mode: show nothing (completely hidden) -->
						{:else}
							<span class={rendered.className}>{rendered.char}</span>
						{/if}
					{/each}
				</div>
			{/key}

			<!-- Hidden input for accessibility (not visible to user) -->
			<input
				type="text"
				class="visually-hidden-input"
				bind:value={userInput}
				readonly
				aria-hidden="true"
				tabindex="-1"
			/>

			<!-- Feedback -->
			{#if feedbackMessage}
				<div class="feedback" class:success={feedbackType === 'success'} class:error={feedbackType === 'error'} class:warning={feedbackType === 'warning'}>
					{feedbackMessage}
				</div>
			{/if}

			<!-- Invisible viewport anchor for keyboard positioning -->
			<div bind:this={viewportAnchor} class="viewport-anchor" aria-hidden="true"></div>

			<!-- Onscreen Keyboard (no backspace/enter during learning) -->
			<!-- Hide keyboard in intermediate mode when showRetryButton is true -->
			{#if !showNextButton && !showRetryButton}
			<Keyboard 
				layout={keyboardLayout} 
				on:key={handleKeyInput} 
				showBackspace={false} 
				showEnter={false} 
				isNumeric={isNumericKeyboard}
				pressedKey={pressedKey}
				correctKey={correctKey}
				lastCorrectKey={lastCorrectKey}
			/>
		{:else if currentStage === 'intermediate' && showRetryButton}
			<!-- Keyboard hidden in intermediate until retry pressed -->
		{:else if showRetryButton}
			<!-- Show keyboard for other stages even with retry button -->
			<Keyboard 
				layout={keyboardLayout} 
				on:key={handleKeyInput} 
				showBackspace={false} 
				showEnter={false} 
				isNumeric={isNumericKeyboard}
				pressedKey={pressedKey}
				correctKey={correctKey}
				lastCorrectKey={lastCorrectKey}
			/>
		{/if}

		<!-- Action Buttons -->
		<div class="control-buttons">
			{#if showRetryButton}
				<button class="retry-btn" on:click={handleRetry}>{t('retry')}</button>
			{/if}
			{#if showNextButton}
				<button class="next-btn" on:click={handleNext}>{t('next')}</button>
			{/if}
		</div>
	{/if}
{/if}

<!-- Modal for Stage Completion -->
{#if showModal}
	<div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-message">{modalMessage}</div>
			{#if currentStage === 'intermediate' && modalMessage.includes(t('nice_try'))}
				<!-- Intermediate failure: show Retry button -->
				<button class="modal-btn" on:click={closeModal}>{t('retry')}</button>
			{:else}
				<!-- Success modals: show Continue button -->
				<button class="modal-btn" on:click={closeModal}>{t('continue')}</button>
			{/if}
		</div>
	</div>
{/if}

</div>

<style>
	.learning-container {
		display: grid;
		gap: 1.5rem;
		padding: 1rem;
		padding-bottom: 400px; /* Add space for keyboard at bottom */
		max-width: 1000px;
		margin: 0 auto;
	}

	h2 {
		margin: 0;
		color: var(--text-color);
	}

	.difficulty-controls {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.mode-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--accent-color);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
	}

	.mode-btn.active {
		background: var(--accent-color);
		color: white;
	}

	.mode-btn:hover:not(.active) {
		opacity: 0.8;
	}

	.learning-controls {
		display: grid;
		gap: 0.5rem;
	}

	.learning-controls label {
		font-weight: 500;
		color: var(--subtitle-color);
	}

	.learning-controls select {
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
	}

	.verse-display {
		font-size: 1.5em;
		line-height: 2;
		padding: 1.5rem;
		background: var(--panel-background);
		border-radius: 8px;
		min-height: 150px;
		font-weight: 500;
	}

	.verse-character {
		display: inline;
		transition: all 0.3s;
		opacity: 0.5;
	}

	.verse-character.correct {
		color: var(--correct-color);
		opacity: 1;
	}

	.verse-character.incorrect {
		color: var(--error-color);
		opacity: 1;
	}

	.verse-character.punctuation {
		/* Punctuation inherits opacity from preceding character */
		/* Default opacity when not typed */
		opacity: 0.5;
	}

	.verse-character.punctuation.correct {
		/* When punctuation is revealed (preceding char typed), show as white */
		color: var(--correct-color);
		opacity: 1;
	}

	.verse-character.hidden {
		/* Advanced mode: completely invisible */
		visibility: hidden;
	}

	.verse-character.intermediate-hidden {
		/* Intermediate mode: show underscore placeholder */
		visibility: visible;
		opacity: 0.5;
		color: var(--text-color);
	}

	.visually-hidden-input {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		opacity: 0;
	}

	.feedback {
		padding: 1rem;
		border-radius: 6px;
		text-align: center;
		font-weight: 500;
		transition: all 0.3s;
	}

	.feedback.success {
		background: #e8f5e9;
		color: #2e7d32;
		border: 1px solid #4caf50;
	}

	.feedback.error {
		background: #ffebee;
		color: #c62828;
		border: 1px solid #f44336;
	}

	.feedback.warning {
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ff9800;
	}

	[data-theme='dark'] .feedback.success {
		background: #1b5e20;
		color: #81c784;
	}

	[data-theme='dark'] .feedback.error {
		background: #b71c1c;
		color: #ef5350;
	}

	[data-theme='dark'] .feedback.warning {
		background: #e65100;
		color: #ffb74d;
	}

	.viewport-anchor {
		height: 1px;
		width: 100%;
		visibility: hidden;
		pointer-events: none;
		margin: 0;
		padding: 0;
	}

	.control-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.retry-btn,
	.next-btn {
		padding: 0.75rem 2rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
	}

	.retry-btn {
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
	}

	.next-btn {
		background: var(--accent-color);
		color: white;
	}

	.retry-btn:hover,
	.next-btn:hover {
		opacity: 0.9;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--subtitle-color);
	}

	.visually-hidden {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: var(--panel-background);
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		max-width: 500px;
		text-align: center;
	}
	
	.modal-message {
		font-size: 1.2em;
		margin-bottom: 1.5rem;
		color: var(--text-color);
	}
	
	.modal-btn {
		padding: 0.75rem 2rem;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
	}
	
	.modal-btn:hover {
		opacity: 0.9;
	}
</style>
