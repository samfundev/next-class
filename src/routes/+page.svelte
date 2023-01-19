<script lang="ts">
	import type { Class } from 'src/lib/types';
	import { TimerBasedCronScheduler as scheduler, parseCronExpression } from 'cron-schedule';

	let url = localStorage.getItem('url') ?? '';
	let dialog: HTMLDialogElement;

	let bigText = '';
	let smallerText = '';
	let afterText = '';

	let classes: Class[] | null = null;

	const dateFormat = new Intl.DateTimeFormat(undefined, {
		dateStyle: 'short',
		timeStyle: 'short'
	});

	$: url, getClasses();
	async function getClasses() {
		localStorage.setItem('url', url);

		if (url.trim() === '') {
			bigText = 'No URL';
			smallerText = '(Set one in the top right.)';
			classes = null;
		} else {
			const response = await fetch('/get-classes', {
				method: 'POST',
				body: JSON.stringify(url)
			});

			classes = JSON.parse(await response.text(), (key, value) => {
				if (key !== 'start' && key !== 'end') return value;

				return new Date(value);
			});
		}
	}

	$: classes, getNext();
	function getNext() {
		if (classes === null) return;

		classes.sort((a, b) => b.end.getTime() - a.end.getTime());

		let nextClass = null;
		let afterClass = null;
		for (const _class of classes) {
			if (_class.end < new Date()) continue;

			afterClass = nextClass;
			nextClass = _class;
		}

		if (nextClass === null) {
			bigText = 'No next class.';
			smallerText = '';
		} else {
			bigText = nextClass.name;
			smallerText = `in ${nextClass.location}, from ${dateFormat.formatRange(
				nextClass.start,
				nextClass.end
			)}`;
		}

		afterText =
			afterClass !== null
				? `Then: ${afterClass.name} at ${dateFormat.format(afterClass.start)}`
				: '';
	}

	scheduler.setInterval(parseCronExpression('*/1 * * * *'), getNext);
</script>

<title>{bigText} {smallerText}</title>

<div class="wrapper">
	<h1 class="bigText">{bigText}</h1>
	<div>{smallerText}</div>
	{#if afterText != ''}
		<div class="after">{afterText}</div>
	{/if}
</div>

<button class="edit-url" on:click={() => dialog.showModal()}>Edit URL</button>

<dialog bind:this={dialog}>
	<b>Enter calendar URL:</b>
	<a
		href="https://myhu.harrisburgu.edu/ICS/Academics/Academics.jnz?portlet=Calendar&screen=MainView&screenType=change#/manage-my-calendar"
		target="_blank">(find it here)</a
	>
	<br />
	<input bind:value={url} />
	<button on:click={() => dialog.close()}>Close</button>
</dialog>

<style>
	* {
		font-family: sans-serif;
	}

	.wrapper {
		width: 100%;
		height: 100%;

		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		text-align: center;
	}

	.after {
		margin-top: 3em;
		font-size: 80%;
	}

	button {
		border-radius: 5px;
		border: none;
		background-color: rgb(180, 180, 180);
		padding: 10px 15px;
	}

	button.edit-url {
		position: absolute;
		top: 10px;
		right: 10px;
	}
</style>
