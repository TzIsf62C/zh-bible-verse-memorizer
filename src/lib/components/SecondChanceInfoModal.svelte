<script>
	import { createEventDispatcher } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import { verses } from '$lib/stores/verses';
	import { t } from '$lib/i18n';

	export let show = false;

	const dispatch = createEventDispatcher();

	$: firstUserVerse = $verses?.[0] ?? null;
	$: previewVerseReference = firstUserVerse
		? `${firstUserVerse.bookName ?? ''} ${firstUserVerse.chapterNumber ?? ''}:${firstUserVerse.verseNumber ?? ''}`.trim()
		: t('second_chance_preview_reference');
	$: previewVerseText = firstUserVerse?.verseText ?? '';
	$: recoveryPercent = $settings.secondChanceRecoveryPercent ?? 60;
	$: recoveredDays = Math.floor(24 * (recoveryPercent / 100));

	function close() {
		dispatch('close');
	}

	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			close();
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

{#if show}
	<div
		class="modal-overlay"
		on:click={handleOverlayClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="second-chance-info-title"
		tabindex="0"
	>
		<div class="modal-content" role="document">
			<button class="back-btn modal-close-btn" type="button" on:click={close} aria-label={t('close')}>✕</button>
			<h3 id="second-chance-info-title">{t('second_chance_review_title')}</h3>

			<div class="info-sections">
				<section class="info-section">
					<p>{t('second_chance_review_info')}</p>
				</section>

				<section class="info-section">
					<h4>{t('enable_second_chance_indicator_in_reviews')}</h4>
					<p>{t('second_chance_indicator_info_body')}</p>
					<div class="review-preview" aria-label={t('second_chance_indicator_info_aria')}>
						<div class="preview-header">
						</div>
						<div class="preview-progress-bar">
							<div class="preview-progress-fill"></div>
							<div class="preview-progress-text">1 / 2</div>
						</div>
						<div class="preview-verse-header">
							<h3>{previewVerseReference}</h3>
						</div>
						<div class="preview-verse-display is-second-chance">
							{#if previewVerseText}
								{previewVerseText}
							{:else}
								<span class="preview-placeholder">{t('second_chance_preview_text')}</span>
							{/if}
						</div>
					</div>
				</section>

				<section class="info-section">
					<h4>{t('second_chance_recovery_percent_label')}</h4>
					<p>{t('second_chance_recovery_info_body', {
						originalDays: 24,
						percent: recoveryPercent,
						recoveredDays
					})}</p>
				</section>
			</div>

			<div class="modal-buttons">
				<button class="modal-btn" type="button" on:click={close}>{t('ok')}</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-content {
		position: relative;
		max-width: 680px;
		max-height: min(88vh, 760px);
		overflow-y: auto;
	}

	.modal-close-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
	}

	.modal-content h3 {
		margin: 0 2rem 1.5rem;
		color: var(--text-color);
		text-align: center;
	}

	.info-sections {
		display: grid;
		gap: 1rem;
	}

	.info-section {
		padding: 1rem;
		border: 1px solid var(--file-border);
		border-radius: 8px;
		background: var(--file-bg);
	}

	.info-section h4 {
		margin: 0 0 0.5rem;
		color: var(--accent-color);
		font-size: 1em;
	}

	.info-section p {
		margin: 0;
		line-height: 1.5;
	}

	.review-preview {
		margin-top: 1rem;
		padding: 0.75rem;
		border-radius: 8px;
		background: var(--panel-background);
	}

	.preview-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: -0.5rem;
	}

	.preview-progress-bar {
		position: relative;
		height: 1.75rem;
		border: 1px solid var(--file-border);
		border-radius: 8px;
		background: var(--file-bg);
		overflow: hidden;
	}

	.preview-progress-fill {
		position: absolute;
		inset: 0 auto 0 0;
		width: 50%;
		background: var(--accent-color);
	}

	.preview-progress-text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color);
		font-weight: 600;
		font-size: 0.85em;
	}

	.preview-verse-header {
		display: flex;
		align-items: center;
		min-height: 2rem;
		margin-top: 0.75rem;
	}

	.preview-verse-header h3 {
		margin: 0;
		font-weight: 600;
	}

	.preview-verse-display {
		min-height: 7rem;
		max-height: 14rem;
		margin-top: 0.5rem;
		padding: 1rem;
		background: var(--panel-background);
		border: 1px solid var(--file-border);
		border-radius: 8px;
		color: var(--text-color);
		font-size: 1.15em;
		line-height: 1.8;
		overflow-y: auto;
        text-align:left;
	}

	.preview-verse-display.is-second-chance {
		border-color: var(--warning-color);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--warning-color) 30%, transparent);
	}

	.preview-placeholder {
		color: var(--subtitle-color);
		font-size: 0.85em;
	}
</style>
