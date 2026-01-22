<script lang="ts">
  import {Tabs} from "@skeletonlabs/skeleton-svelte";
  import {XIcon} from "@lucide/svelte";
  import {_} from '$lib/i18n';

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

  async function closeGame(event: MouseEvent, partieId: string) {
    event.stopPropagation();

    try {
      const response = await fetch(`/api/parties/${partieId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isInAnalysis: false,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to close game');
      }
    } catch (error) {
      console.error('Error closing game:', error);
    }
  }
</script>

<Tabs onValueChange={handleChange} value={stringValue}>
    <Tabs.List>
        {#each parties as partie (partie.id)}
            <Tabs.Trigger class="flex-1 relative group" value={partie.id.toString()}>
                <span class="flex-1">{partie.titre || $_('chessboard.game.untitled')}</span>
                <button
                        class="ml-2 p-1 rounded hover:bg-error-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        onclick={(e) => closeGame(e, partie.id)}
                        title={$_('chessboard.game.close')}
                        type="button"
                >
                    <XIcon class="size-3"/>
                </button>
            </Tabs.Trigger>
        {/each}
    </Tabs.List>
</Tabs>
