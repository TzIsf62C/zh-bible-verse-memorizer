/**
 * Audio and haptic feedback utilities
 * Based on legacy app implementation
 */

let audioCtx = null;

/**
 * Play a short buzzer sound using Web Audio API
 */
export function playBuzzer() {
	if (!audioCtx) {
		try {
			audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		} catch (e) {
			console.warn('Web Audio API not supported', e);
			return;
		}
	}
	
	try {
		const now = audioCtx.currentTime;
		const oscillator = audioCtx.createOscillator();
		const gainNode = audioCtx.createGain();
		
		oscillator.type = 'square';
		oscillator.frequency.setValueAtTime(280, now);
		
		gainNode.gain.setValueAtTime(0.0001, now);
		gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
		gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
		
		oscillator.connect(gainNode);
		gainNode.connect(audioCtx.destination);
		
		oscillator.start(now);
		oscillator.stop(now + 0.15);
	} catch (e) {
		console.warn('Error playing buzzer sound', e);
	}
}

/**
 * Vibrate on error (Android only)
 */
export function vibrateOnError() {
	if (!navigator.vibrate) {
		return;
	}
	
	try {
		navigator.vibrate(100); // vibrate for 100ms
	} catch (e) {
		console.warn('Error triggering vibration', e);
	}
}

/**
 * Trigger error feedback based on settings
 * @param {Object} settings - Settings object with vibrationEnabled and buzzerEnabled
 */
export function triggerErrorFeedback(settings) {
	if (settings.vibrationEnabled) {
		vibrateOnError();
	}
	
	if (settings.buzzerEnabled) {
		playBuzzer();
	}
}
