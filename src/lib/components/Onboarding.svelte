<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { collections } from '$lib/stores/collections';
	import { browser } from '$app/environment';
	import Modal from './Modal.svelte';
	
	const dispatch = createEventDispatcher();
	
	let step = 1; // 1: welcome, 2: input method, 3: language, 4: sample data
	let selectedInputMethod = 'pinyin';
	let selectedLanguage = 'english';
	let loadSampleData = true;
	let loading = false;
	
	let showModal = false;
	let modalMessage = '';
	
	const inputMethods = [
		{ value: 'pinyin', label: 'Pinyin (拼音)', description: 'Type using Latin alphabet (a-z)' },
		{ value: 'zhuyin', label: 'Zhuyin (注音/ㄅㄆㄇ)', description: 'Type using Bopomofo symbols' },
		{ value: 'cangjie', label: 'Cangjie (倉頡)', description: 'Type using Chinese radicals' }
	];
	
	const languages = [
		{ value: 'english', label: 'English' },
		{ value: 'simplified', label: '简体中文 (Simplified Chinese)' },
		{ value: 'traditional', label: '繁體中文 (Traditional Chinese)' }
	];
	
	function nextStep() {
		if (step < 4) {
			step++;
		}
	}
	
	function prevStep() {
		if (step > 1) {
			step--;
		}
	}
	
	async function finish() {
		loading = true;
		
		// Update settings
		settings.update(s => ({
			...s,
			inputMethod: selectedInputMethod,
			languagePreference: selectedLanguage,
			hasCompletedOnboarding: true
		}));
		
		// Load sample data if requested
		if (loadSampleData && browser) {
			try {
				let sampleFile = '';
				if (selectedInputMethod === 'pinyin') {
					// Choose simplified or traditional based on language
					sampleFile = selectedLanguage === 'simplified' 
						? '/samples/PY-Samples-zhs.json'
						: '/samples/PY-Samples-zht.json';
				} else if (selectedInputMethod === 'zhuyin') {
					sampleFile = '/samples/ZY-Samples.json';
				} else if (selectedInputMethod === 'cangjie') {
					sampleFile = '/samples/CJ-Samples.json';
				}
				
				const response = await fetch(sampleFile);
				if (!response.ok) throw new Error('Failed to load sample data');
				
				const data = await response.json();
				
				// Import verses
				if (data.verses && Array.isArray(data.verses)) {
					verses.set(data.verses);
				}
				
				// Import collections (resolve verse references to IDs)
				if (data.collections && Array.isArray(data.collections)) {
					const importedCollections = data.collections.map(col => {
						if (col.verseRefs && Array.isArray(col.verseRefs)) {
							// Resolve verse references to IDs
							const verseIds = col.verseRefs.map(ref => {
								const verse = data.verses.find(v => 
									v.bookName === ref.bookName && 
									v.chapterNumber === ref.chapterNumber && 
									v.verseNumber === ref.verseNumber
								);
								return verse ? verse.id : null;
							}).filter(id => id !== null);
							
							return {
								id: col.id || Date.now() + Math.random(),
								title: col.title,
								verseIds: verseIds
							};
						}
						return col;
					});
					
					collections.set(importedCollections);
				}
				
			} catch (error) {
				console.error('Error loading sample data:', error);
				modalMessage = 'Failed to load sample data. You can add verses manually or import data later.';
				showModal = true;
			}
		}
		
		loading = false;
		dispatch('complete');
	}
	
	function skip() {
		// Just set onboarding complete without loading data
		settings.update(s => ({
			...s,
			hasCompletedOnboarding: true
		}));
		dispatch('complete');
	}
</script>

<div class="onboarding-overlay" style="background: #f7f7f9;">
	<div class="onboarding-card" style="background: white; color: #1b1b1f;">
		{#if step === 1}
			<div class="step">
				<h2>Welcome to ZH Bible Verse Memorizer! 📖</h2>
				<p>Memorize Chinese Bible verses using spaced repetition.</p>
				<p>This is a Progressive Web App (PWA) that works offline and can be installed on your device.</p>
				<div class="button-group">
					<button class="btn btn-primary" on:click={nextStep} style="background: #3264ff; color: white;">
						Get Started
					</button>
					<button class="btn btn-text" on:click={skip}>
						Skip & Start Empty
					</button>
				</div>
			</div>
			
		{:else if step === 2}
			<div class="step">
				<h2>Choose Input Method</h2>
				<p>Select how you'll type Chinese character initials:</p>
				<div class="option-group">
					{#each inputMethods as method}
						<label class="option-card" class:selected={selectedInputMethod === method.value}>
							<input 
								type="radio" 
								name="inputMethod" 
								value={method.value}
								bind:group={selectedInputMethod}
							/>
							<div class="option-content">
								<div class="option-label">{method.label}</div>
								<div class="option-description">{method.description}</div>
							</div>
						</label>
					{/each}
				</div>
				<div class="button-group">
					<button class="btn btn-secondary" on:click={prevStep} style="background: #d7d7df; color: #1b1b1f;">Back</button>
					<button class="btn btn-primary" on:click={nextStep} style="background: #3264ff; color: white;">Next</button>
				</div>
			</div>
			
		{:else if step === 3}
			<div class="step">
				<h2>Choose Language</h2>
				<p>Select your preferred interface language:</p>
				<div class="option-group">
					{#each languages as lang}
						<label class="option-card" class:selected={selectedLanguage === lang.value}>
							<input 
								type="radio" 
								name="language" 
								value={lang.value}
								bind:group={selectedLanguage}
							/>
							<div class="option-content">
								<div class="option-label">{lang.label}</div>
							</div>
						</label>
					{/each}
				</div>
				<div class="button-group">
					<button class="btn btn-secondary" on:click={prevStep} style="background: #d7d7df; color: #1b1b1f;">Back</button>
					<button class="btn btn-primary" on:click={nextStep} style="background: #3264ff; color: white;">Next</button>
				</div>
			</div>
			
		{:else if step === 4}
			<div class="step">
				<h2>Load Sample Verses?</h2>
				<p>Would you like to start with sample Bible verses to try out the app?</p>
				<p class="note">You can always add your own verses or import data later.</p>
				<label class="checkbox-option">
					<input type="checkbox" bind:checked={loadSampleData} />
					<span>Load sample verses and collections</span>
				</label>
				<div class="button-group">
					<button class="btn btn-secondary" on:click={prevStep} style="background: #d7d7df; color: #1b1b1f;">Back</button>
					<button class="btn btn-primary" on:click={finish} disabled={loading} style="background: #3264ff; color: white;">
						{#if loading}
							Loading...
						{:else}
							{loadSampleData ? 'Load & Start' : 'Start Empty'}
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<Modal 
	show={showModal} 
	message={modalMessage}
	type="alert"
	on:confirm={() => { showModal = false; dispatch('complete'); }}
	on:cancel={() => { showModal = false; dispatch('complete'); }}
/>

<style>
	.onboarding-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--app-background, #f7f7f9);
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		overflow-y: auto;
	}
	
	.onboarding-card {
		background: var(--panel-background, #ffffff);
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: var(--panel-shadow, 0 4px 20px rgba(0, 0, 0, 0.15));
	}
	
	.step h2 {
		margin: 0 0 1rem 0;
		color: var(--text-color, #1b1b1f);
		font-size: 1.5em;
	}
	
	.step p {
		color: var(--text-color, #1b1b1f);
		margin: 0.5rem 0;
		line-height: 1.6;
	}
	
	.step .note {
		font-size: 0.9em;
		color: var(--subtitle-color, #4b4b56);
		font-style: italic;
	}
	
	.option-group {
		margin: 1.5rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.option-card {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem;
		border: 2px solid var(--file-border, #d7d7df);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		background: transparent;
	}
	
	.option-card:hover {
		border-color: var(--accent-color, #3264ff);
		background: rgba(50, 100, 255, 0.05);
	}
	
	.option-card.selected {
		border-color: var(--accent-color, #3264ff);
		background: rgba(50, 100, 255, 0.1);
	}
	
	.option-card input[type="radio"] {
		margin-top: 0.25rem;
		cursor: pointer;
		width: 20px;
		height: 20px;
	}
	
	.option-content {
		flex: 1;
	}
	
	.option-label {
		font-weight: 600;
		color: var(--text-color, #1b1b1f);
		margin-bottom: 0.25rem;
	}
	
	.option-description {
		font-size: 0.9em;
		color: var(--subtitle-color, #4b4b56);
	}
	
	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		margin: 1.5rem 0;
		border: 2px solid var(--file-border, #d7d7df);
		border-radius: 8px;
		cursor: pointer;
		font-size: 1em;
		color: var(--text-color, #1b1b1f);
		background: transparent;
	}
	
	.checkbox-option input {
		cursor: pointer;
		width: 20px;
		height: 20px;
	}
	
	.button-group {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
		justify-content: flex-end;
	}
	
	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-size: 1em;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
	}
	
	.btn-primary {
		background: var(--accent-color, #3264ff);
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}
	
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-secondary {
		background: var(--file-border, #d7d7df);
		color: var(--text-color, #1b1b1f);
	}
	
	.btn-secondary:hover {
		background: rgba(50, 100, 255, 0.1);
	}
	
	.btn-text {
		background: transparent;
		color: var(--subtitle-color, #4b4b56);
		text-decoration: underline;
	}
	
	.btn-text:hover {
		color: var(--text-color, #1b1b1f);
	}
	
	@media (max-width: 768px) {
		.onboarding-card {
			padding: 1.5rem;
		}
		
		.step h2 {
			font-size: 1.3em;
		}
		
		.button-group {
			flex-direction: column-reverse;
		}
		
		.btn {
			width: 100%;
		}
	}
</style>
