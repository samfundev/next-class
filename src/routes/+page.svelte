<script lang="ts">
	import type { Class } from 'src/lib/types';
	import { TimerBasedCronScheduler as scheduler, parseCronExpression } from 'cron-schedule';

	let url = localStorage.getItem('url') ?? '';
	let dialog: HTMLDialogElement;

	let bigText = '';
	let smallerText = '';

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

			classes = await response.json();
		}
	}

	$: classes, getNext();
	function getNext() {
		if (classes === null) return;

		classes.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());

		let nextClass = null;
		for (const _class of classes) {
			if (new Date(_class.end) < new Date()) continue;

			nextClass = _class;
		}

		if (nextClass === null) {
			bigText = 'No next class.';
			smallerText = '';
		} else {
			bigText = nextClass.name;
			smallerText = `in ${nextClass.location}, from ${dateFormat.formatRange(
				new Date(nextClass.start),
				new Date(nextClass.end)
			)}`;
		}
	}

	scheduler.setInterval(parseCronExpression('*/1 * * * *'), getNext);
</script>

<div class="wrapper">
	<h1>{bigText}</h1>
	<div>{smallerText}</div>
</div>

<button class="edit-url" on:click={() => dialog.showModal()}>Edit URL</button>

<dialog bind:this={dialog}>
	<b>Enter calendar URL:</b>
	<a
		href="https://myhu.harrisburgu.edu/ICS/Academics/Academics.jnz?portlet=Calendar&screen=MainView&screenType=change#/manage-my-calendar"
		>(find it here)</a
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
	}

	button {
		border-radius: 5px;
		border: none;
		background-color: rgb(75, 75, 75);
		padding: 10px 15px;
	}

	button.edit-url {
		position: absolute;
		top: 10px;
		right: 10px;
	}
</style>
