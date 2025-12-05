<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/common/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link href={favicon} rel="icon" />
</svelte:head>

<Header />

{@render children()}
