<script lang="ts">
  import { Tabs } from "@skeletonlabs/skeleton-svelte";
  import { _ } from '$lib/i18n';

  interface Partie {
    id: string;
    titre: string | null;
  }

  let {
    parties,
    selectedGameIndex = $bindable()
  }: {
    parties: Partie[];
    selectedGameIndex: string | null;
  } = $props();

  const stringValue = $derived(selectedGameIndex ?? null);

  function handleChange(tab: { value: string }) {
    selectedGameIndex = tab.value;
  }
</script>

<Tabs value={stringValue} onValueChange={handleChange}>
  <Tabs.List>
    {#each parties as partie (partie.id)}
      <Tabs.Trigger class="flex-1" value={partie.id.toString()}>
        {partie.titre || $_('chessboard.game.untitled')}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs>
