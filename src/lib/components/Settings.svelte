<script>
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { t } from '$lib/i18n';
	import { browser } from '$app/environment';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();
	
	let updateStatus = '';
	let updateStatusType = 'info'; // 'info', 'success', 'error'
	let waitingWorker = null;
	let checkingUpdate = false;
	
	let showModal = false;
	let modalMessage = '';
	let modalType = 'alert';
	let confirmAction = null;
	let feedbackCopied = false;
	let feedbackCopyTimeout = null;
	
	function updateSetting(key, value) {
		console.log('[Settings] Update', { key, value });
		settings.update((current) => ({
			...current,
			[key]: value
		}));
		
		// Force reactive update
		settings.update((value) => value);
	}

	function updateNeedsPracticeThresholds(key, rawValue) {
		const parsed = Number(rawValue);
		const clamped = Number.isFinite(parsed) ? Math.max(0, Math.min(99, parsed)) : 0;

		settings.update((current) => {
			const includeBelow = key === 'needsPracticeIncludeBelow'
				? clamped
				: Number(current.needsPracticeIncludeBelow ?? 80);
			const ignoreAbove = key === 'needsPracticeIgnoreAbove'
				? clamped
				: Number(current.needsPracticeIgnoreAbove ?? 94);

			return {
				...current,
				needsPracticeIncludeBelow: Math.max(0, Math.min(99, includeBelow)),
				needsPracticeIgnoreAbove: Math.max(
					Math.max(0, Math.min(99, ignoreAbove)),
					Math.max(0, Math.min(99, includeBelow))
				)
			};
		});
	}
	
	function showTutorial() {
		dispatch('viewtutorial');
	}
	
	async function checkForUpdates() {
		if (!browser || !('serviceWorker' in navigator)) {
			updateStatus = 'Service Workers require HTTPS or localhost';
			updateStatusType = 'error';
			return;
		}
		
		try {
			checkingUpdate = true;
			updateStatus = t('checking_updates');
			updateStatusType = 'info';
			
			let registration = await navigator.serviceWorker.getRegistration();
			
			if (!registration) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				registration = await navigator.serviceWorker.getRegistration();
			}
			
			if (!registration) {
				updateStatus = 'Service Worker not registered. Try reloading the page.';
				updateStatusType = 'error';
				checkingUpdate = false;
				return;
			}
			
			await registration.update();
			await new Promise(resolve => setTimeout(resolve, 500));
			
			if (registration.waiting) {
				waitingWorker = registration.waiting;
				updateStatus = t('update_available');
				updateStatusType = 'success';
			} else if (registration.installing) {
				registration.installing.addEventListener('statechange', (e) => {
					if (e.target.state === 'installed') {
						waitingWorker = registration.waiting;
						updateStatus = t('update_available');
						updateStatusType = 'success';
					}
				});
			} else {
				updateStatus = t('no_updates');
				updateStatusType = 'success';
			}
			
		} catch (error) {
			console.error('Error checking for updates:', error);
			updateStatus = t('update_error');
			updateStatusType = 'error';
		} finally {
			checkingUpdate = false;
		}
	}
	
	function applyUpdate() {
		if (waitingWorker) {
			waitingWorker.postMessage({ type: 'SKIP_WAITING' });
			waitingWorker.addEventListener('statechange', (e) => {
				if (e.target.state === 'activated') {
					window.location.reload();
				}
			});
		}
	}
	
	function clearAllData() {
		modalMessage = t('clear_data_confirm');
		modalType = 'confirm';
		confirmAction = () => {
			if (browser) {
				localStorage.clear();
				window.location.reload();
			}
		};
		showModal = true;
	}
	
	function handleModalConfirm() {
		showModal = false;
		if (confirmAction) {
			confirmAction();
			confirmAction = null;
		}
		modalType = 'alert';
	}
	
	function closeModal() {
		showModal = false;
		modalType = 'alert';
		confirmAction = null;
	}

	function getFeedbackEmail() {
		return t('feedback_email_value');
	}

	function getFeedbackSubject() {
		return t('feedback_default_subject', {
			appSubtitle: t('app_subtitle')
		});
	}

	function getFeedbackMailtoHref() {
		const email = getFeedbackEmail();
		const rawSubject = getFeedbackSubject();
		const subject = encodeURIComponent(rawSubject);
		return `mailto:${email}?subject=${subject}`;
	}

	function sendFeedbackEmail() {
		if (!browser) {
			return;
		}
	}

	async function copyFeedbackEmail() {
		const email = getFeedbackEmail();

		if (!browser) {
			return;
		}

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(email);
			} else {
				const tempInput = document.createElement('input');
				tempInput.value = email;
				document.body.appendChild(tempInput);
				tempInput.select();
				const copied = document.execCommand('copy');
				document.body.removeChild(tempInput);

				if (!copied) {
					throw new Error('Clipboard copy failed');
				}
			}

			feedbackCopied = true;
			if (feedbackCopyTimeout) {
				clearTimeout(feedbackCopyTimeout);
			}

			feedbackCopyTimeout = setTimeout(() => {
				feedbackCopied = false;
			}, 2000);
		} catch (error) {
			console.error('Error copying feedback email:', error);
			modalMessage = getFeedbackEmail();
			modalType = 'alert';
			showModal = true;
		}
	}

	onDestroy(() => {
		if (feedbackCopyTimeout) {
			clearTimeout(feedbackCopyTimeout);
		}
	});
	
	// Check for updates silently on mount (once per week)
	if (browser) {
		const lastUpdateCheck = localStorage.getItem('lastUpdateCheck');
		const now = Date.now();
		const oneWeek = 7 * 24 * 60 * 60 * 1000;
		
		if (!lastUpdateCheck || (now - parseInt(lastUpdateCheck)) > oneWeek) {
			localStorage.setItem('lastUpdateCheck', now.toString());
			setTimeout(() => checkForUpdates(), 1000);
		}
	}
</script>

<div class="settings-container panel">
	<h2>{t('settings')}</h2>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label>{t('theme')}</label>
			<div class="radio-group">
				<label class="radio-option">
					<input 
						type="radio" 
						name="theme" 
						value="system" 
						checked={$settings.themePreference === 'system'}
						on:change={() => updateSetting('themePreference', 'system')}
					/>
					<span>{t('theme_system')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="theme" 
						value="light" 
						checked={$settings.themePreference === 'light'}
						on:change={() => updateSetting('themePreference', 'light')}
					/>
					<span>{t('theme_light')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="theme" 
						value="dark" 
						checked={$settings.themePreference === 'dark'}
						on:change={() => updateSetting('themePreference', 'dark')}
					/>
					<span>{t('theme_dark')}</span>
				</label>
			</div>
		</div>
		
		<div class="setting-group">
			<label>{t('text_size')}</label>
			<div class="radio-group">
				<label class="radio-option">
					<input 
						type="radio" 
						name="textSize" 
						value="1.0" 
						checked={$settings.textSizePreference === 1.0}
						on:change={() => updateSetting('textSizePreference', 1.0)}
					/>
					<span>{t('text_size_normal')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="textSize" 
						value="1.2" 
						checked={$settings.textSizePreference === 1.2}
						on:change={() => updateSetting('textSizePreference', 1.2)}
					/>
					<span>{t('text_size_large')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="textSize" 
						value="1.5" 
						checked={$settings.textSizePreference === 1.5}
						on:change={() => updateSetting('textSizePreference', 1.5)}
					/>
					<span>{t('text_size_extra_large')}</span>
				</label>
			</div>
		</div>
	</div>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label>{t('language')}</label>
			<div class="radio-group">
				<label class="radio-option">
					<input 
						type="radio" 
						name="language" 
						value="english" 
						checked={$settings.languagePreference === 'english'}
						on:change={() => updateSetting('languagePreference', 'english')}
					/>
					<span>{t('lang_english')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="language" 
						value="simplified" 
						checked={$settings.languagePreference === 'simplified'}
						on:change={() => updateSetting('languagePreference', 'simplified')}
					/>
					<span>{t('lang_simplified')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="language" 
						value="traditional" 
						checked={$settings.languagePreference === 'traditional'}
						on:change={() => updateSetting('languagePreference', 'traditional')}
					/>
					<span>{t('lang_traditional')}</span>
				</label>
			</div>
		</div>
		
		<div class="setting-group">
			<label>{t('input_method')}</label>
			<div class="radio-group">
				<label class="radio-option">
					<input 
						type="radio" 
						name="inputMethod" 
						value="pinyin" 
						checked={$settings.inputMethod === 'pinyin'}
						on:change={() => updateSetting('inputMethod', 'pinyin')}
					/>
					<span>{t('input_pinyin')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="inputMethod" 
						value="zhuyin" 
						checked={$settings.inputMethod === 'zhuyin'}
						on:change={() => updateSetting('inputMethod', 'zhuyin')}
					/>
					<span>{t('input_zhuyin')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="inputMethod" 
						value="cangjie" 
						checked={$settings.inputMethod === 'cangjie'}
						on:change={() => updateSetting('inputMethod', 'cangjie')}
					/>
					<span>{t('input_cangjie')}</span>
				</label>
			</div>
		</div>
		
		<div class="setting-group">
			<label>{t('book_name_charset')}</label>
			<div class="radio-group">
				<label class="radio-option">
					<input 
						type="radio" 
						name="bookCharset" 
						value="simplified" 
						checked={$settings.bookNameCharset === 'simplified'}
						on:change={() => updateSetting('bookNameCharset', 'simplified')}
					/>
					<span>{t('charset_simplified')}</span>
				</label>
				<label class="radio-option">
					<input 
						type="radio" 
						name="bookCharset" 
						value="traditional" 
						checked={$settings.bookNameCharset === 'traditional'}
						on:change={() => updateSetting('bookNameCharset', 'traditional')}
					/>
					<span>{t('charset_traditional')}</span>
				</label>
			</div>
		</div>
	</div>
	
	<div class="settings-section">
		<div class="setting-group">
			<label>{t('needs_practice_collection_settings')}</label>
			<label for="needsPracticeIncludeBelow">{t('needs_practice_include_below_label')}</label>
			<input
				id="needsPracticeIncludeBelow"
				type="number"
				min="0"
				max="99"
				value={$settings.needsPracticeIncludeBelow}
				on:input={(e) => updateNeedsPracticeThresholds('needsPracticeIncludeBelow', e.currentTarget.value)}
			/>
			<p class="help-text">{t('needs_practice_include_below_help')}</p>
		</div>

		<div class="setting-group">
			<label for="needsPracticeIgnoreAbove">{t('needs_practice_ignore_above_label')}</label>
			<input
				id="needsPracticeIgnoreAbove"
				type="number"
				min="0"
				max="99"
				value={$settings.needsPracticeIgnoreAbove}
				on:input={(e) => updateNeedsPracticeThresholds('needsPracticeIgnoreAbove', e.currentTarget.value)}
			/>
			<p class="help-text">{t('needs_practice_ignore_above_help')}</p>
		</div>

	</div>

	<div class="settings-section">
		
		<div class="setting-group">
			<label for="defaultBibleVersion">{t('default_bible_version')}</label>
			<input 
				id="defaultBibleVersion"
				type="text" 
				value={$settings.defaultBibleVersion}
				on:input={(e) => updateSetting('defaultBibleVersion', e.currentTarget.value)}
				placeholder="e.g., ESV, CUNP"
			/>
		</div>
	</div>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label class="checkbox-option">
				<input 
					type="checkbox" 
					checked={$settings.vibrationEnabled}
					on:change={(e) => updateSetting('vibrationEnabled', e.currentTarget.checked)}
				/>
				<div>
					<span>{t('enable_vibration')}</span>
					<p class="help-text">{t('vibration_note')}</p>
				</div>
			</label>
		</div>
		
		<div class="setting-group">
			<label class="checkbox-option">
				<input 
					type="checkbox" 
					checked={$settings.buzzerEnabled}
					on:change={(e) => updateSetting('buzzerEnabled', e.currentTarget.checked)}
				/>
				<div>
					<span>{t('enable_buzzer')}</span>
					<p class="help-text">{t('buzzer_note')}</p>
				</div>
			</label>
		</div>
		
		<div class="setting-group">
			<label class="checkbox-option">
				<input 
					type="checkbox" 
					checked={$settings.backupReminderEnabled}
					on:change={(e) => updateSetting('backupReminderEnabled', e.currentTarget.checked)}
				/>
				<div>
					<span>{t('enable_backup_reminders')}</span>
					<p class="help-text">{t('backup_reminder_frequency')}</p>
				</div>
			</label>
		</div>
	</div>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label>{t('view_tutorial')}</label>
			<p class="help-text">{t('view_tutorial_description')}</p>
			<button class="btn-secondary" on:click={showTutorial}>
				{t('view_tutorial')}
			</button>
		</div>
	</div>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label>{t('check_for_updates')}</label>
			<p class="help-text">{t('update_description')}</p>
			<button
				class="btn-secondary"
				on:click={waitingWorker ? applyUpdate : checkForUpdates}
				disabled={checkingUpdate}
			>
				{#if waitingWorker}
					{t('update_now')}
				{:else if checkingUpdate}
					{t('checking_updates')}
				{:else}
					{t('check_update_btn')}
				{/if}
			</button>
			{#if updateStatus}
				<p class="update-status" class:success={updateStatusType === 'success'} class:error={updateStatusType === 'error'}>
					{updateStatus}
				</p>
			{/if}
		</div>
		
		<div class="setting-group danger-zone">
			<label>{t('clear_all_data')}</label>
			<p class="help-text">{t('clear_data_warning')}</p>
			<button class="btn-danger" on:click={clearAllData}>
				{t('clear_all_data_btn')}
			</button>
		</div>
	</div>

	<div class="settings-section feedback-section">
		<div class="setting-group">
			<h3 class="feedback-heading">{t('feedback_section_title')}</h3>
			<p class="help-text feedback-intro">{t('feedback_section_intro')}</p>
			<div class="feedback-card card">
				<div class="feedback-email-row">
					<div>
						<p class="feedback-label">{t('feedback_email_label')}</p>
						<a class="feedback-email-link" href={getFeedbackMailtoHref()}>{t('feedback_email_value')}</a>
					</div>
					<div class="feedback-actions">
						<a class="feedback-send-link btn-secondary btn-sm" href={getFeedbackMailtoHref()} on:click={sendFeedbackEmail}>
							{t('feedback_send_button')}
						</a>
						<button class="btn-outline btn-sm" on:click={copyFeedbackEmail}>
							{t('feedback_copy_button')}
						</button>
					</div>
				</div>
				<p class="feedback-help-text">{t('feedback_send_help')}</p>
				<p class="feedback-help-text feedback-help-fallback">{t('feedback_send_fallback')}</p>
				{#if feedbackCopied}
					<p class="feedback-toast" role="status">{t('feedback_copied_toast')}</p>
				{/if}
			</div>
		</div>
	</div>
	
	<div class="app-info">
		<p>ZH Bible Verse Memorizer PWA</p>
		<p>(Version 1.0 Beta)</p>
		<p>Copyright © 2026 TzIsf62C</p>
	</div>
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	type={modalType}
	on:confirm={handleModalConfirm}
	on:cancel={closeModal}
/>

<style>
	.settings-container {
		max-width: 100%;
		margin: 0 auto;
	}
	
	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
		text-align: center;
	}

	.settings-section {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--file-border);
	}
	
	.settings-section:last-of-type {
		border-bottom: none;
	}
	
	.setting-group {
		margin-bottom: 1.5rem;
	}
	
	.setting-group:last-child {
		margin-bottom: 0;
	}
	
	.setting-group > label:first-child:not(.checkbox-option) {
		display: block;
		font-weight: 500;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}
	
	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.radio-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background 0.2s;
	}
	
	.radio-option:hover {
		background: var(--file-bg);
	}
	
	.radio-option input[type="radio"] {
		cursor: pointer;
	}
	
	.radio-option span {
		color: var(--text-color);
	}
	
	.checkbox-option {
		display: flex;
		flex-direction: row;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem;
		border-radius: 8px;
		transition: background 0.2s;
		align-items: flex-start;
	}
	
	.checkbox-option:hover {
		background: var(--file-bg);
	}
	
	.checkbox-option input[type="checkbox"] {
		cursor: pointer;
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		margin-top: 0.15rem;
	}
	
	.checkbox-option div {
		flex: 1;
	}
	
	.checkbox-option span {
		display: block;
		color: var(--text-color);
		font-weight: 500;
	}
	
	/* Look comes from the shared input styles in app.css */
	input[type="text"],
	input[type="number"] {
		width: 100%;
	}
	
	.help-text {
		font-size: 0.85em;
		color: var(--subtitle-color);
		margin: 0.25rem 0 0 0;
		line-height: 1.4;
	}
	
	.danger-zone {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--file-border);
	}
	
	.update-status {
		margin-top: 0.5rem;
		font-size: 0.85em;
		color: var(--subtitle-color);
	}
	
	.update-status.success {
		color: var(--success-color);
	}
	
	.update-status.error {
		color: var(--danger-color);
	}

	.feedback-section {
		padding-bottom: 1.5rem;
	}

	.feedback-heading {
		margin: 0;
		font-size: 1em;
		font-weight: 500;
		color: var(--text-color);
	}

	.feedback-intro {
		margin-bottom: 1rem;
	}

	.feedback-card {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feedback-email-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.feedback-label {
		margin: 0 0 0.35rem 0;
		font-size: 0.85em;
		color: var(--subtitle-color);
	}

	.feedback-email-link {
		color: var(--accent-color);
		font-weight: 500;
		text-decoration: none;
		word-break: break-word;
	}

	.feedback-email-link:hover {
		text-decoration: underline;
	}

	.feedback-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.feedback-send-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.9rem;
		border-radius: 999px;
		font-size: 0.85em;
		font-weight: 500;
		text-decoration: none;
		transition: opacity 0.2s ease, background 0.2s ease, transform 0.15s ease;
	}

	.feedback-send-link:hover {
		opacity: 0.92;
	}

	.feedback-send-link:active {
		transform: scale(0.95);
		transition-duration: 75ms;
	}

	.feedback-toast {
		margin: 0;
		font-size: 0.85em;
		color: var(--success-color);
	}

	.feedback-help-text {
		margin: 0;
		font-size: 0.85em;
		color: var(--subtitle-color);
		line-height: 1.4;
	}

	.feedback-help-fallback {
		margin-top: -0.25rem;
	}
	
	.app-info {
		text-align: center;
		font-size: 0.85em;
		color: var(--subtitle-color);
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--file-border);
	}
	
	.app-info p {
		margin: 0.25em 0;
	}

	@media (max-width: 767px) {
		.feedback-actions {
			width: 100%;
		}

		.feedback-actions :global(button),
		.feedback-send-link {
			flex: 1;
		}
	}
</style>
