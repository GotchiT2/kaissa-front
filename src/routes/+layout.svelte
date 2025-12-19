<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import Header from '$lib/components/common/Header.svelte';
  import Footer from "$lib/components/common/Footer.svelte";
  import type { LayoutData } from './$types';

  let { children, data }: { children: any; data: LayoutData } = $props();
</script>

<svelte:head>
    <link href={favicon} rel="icon"/>
</svelte:head>

<Header user={data.user} />

{@render children()}

<Footer/>
