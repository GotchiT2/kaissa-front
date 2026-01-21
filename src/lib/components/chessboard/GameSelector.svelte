<script lang="ts">
  import { Tabs } from "@skeletonlabs/skeleton-svelte";

  interface Partie {
    id: number;
    titre: string | null;
  }

  let {
    parties,
    selectedGameIndex = $bindable()
  }: {
    parties: Partie[];
    selectedGameIndex: number | null;
  } = $props();

  const stringValue = $derived(selectedGameIndex?.toString() ?? null);

  function handleChange(tab: { value: string }) {
    selectedGameIndex = parseInt(tab.value);
  }
</script>

<Tabs value={stringValue} onValueChange={handleChange}>
  <Tabs.List>
    {#each parties as partie (partie.id)}
      <Tabs.Trigger class="flex-1" value={partie.id.toString()}>
        {partie.titre || 'Partie sans titre'}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs>
