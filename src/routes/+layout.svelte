<script lang="ts">
  import {onMount} from 'svelte';
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import Header from '$lib/components/common/Header.svelte';
  import Footer from "$lib/components/common/Footer.svelte";
  import type {LayoutData} from './$types';
  import {updateLocale} from '$lib/i18n';

  let {children, data}: { children: any; data: LayoutData } = $props();

  onMount(() => {
    updateLocale(data.user?.language);
  });
</script>

<svelte:head>
    <link href={favicon} rel="icon"/>
</svelte:head>

<Header user={data.user}/>

{@render children()}

<Footer/>
