<script>
	import { createEventDispatcher } from 'svelte';
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
	
	function updateSetting(key, value) {
		console.log('[Settings] Update', { key, value });
		settings.update((current) => ({
			...current,
			[key]: value
		}));
		
		// Force reactive update
		settings.update((value) => value);
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

<div class="settings-container">
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
			<button class="secondary-btn" on:click={showTutorial}>
				{t('view_tutorial')}
			</button>
		</div>
	</div>
	
	<div class="settings-section">
		
		<div class="setting-group">
			<label>{t('check_for_updates')}</label>
			<p class="help-text">{t('update_description')}</p>
			<button 
				class="secondary-btn" 
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
			<button class="danger-btn" on:click={clearAllData}>
				{t('clear_all_data_btn')}
			</button>
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
		padding: 1.5rem;
		background: var(--app-background, #ffffff);
	}
	
	h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-color);
		text-align: center;
	}
	
	h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1em;
		color: var(--text-color);
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
		border-radius: 4px;
		transition: background 0.2s;
	}
	
	.radio-option:hover {
		background: var(--panel-background);
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
		border-radius: 4px;
		transition: background 0.2s;
		align-items: flex-start;
	}
	
	.checkbox-option:hover {
		background: var(--panel-background);
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
	
	input[type="text"] {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--file-border);
		background: var(--file-bg);
		color: var(--text-color);
		border-radius: 4px;
		font-family: inherit;
		font-size: 1em;
	}
	
	.help-text {
		font-size: 0.85em;
		color: var(--subtitle-color);
		margin: 0.25rem 0 0 0;
		line-height: 1.4;
	}
	
	.secondary-btn {
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--accent-color);
		background: var(--nav-button-bg);
		color: var(--nav-button-color);
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
	}
	
	.secondary-btn:hover:not(:disabled) {
		opacity: 0.8;
	}
	
	.secondary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.danger-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		background: #dc3545;
		color: white;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1em;
		font-weight: 500;
		transition: all 0.3s;
	}
	
	.danger-btn:hover {
		background: #c82333;
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
		color: #28a745;
	}
	
	.update-status.error {
		color: #dc3545;
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
</style>
