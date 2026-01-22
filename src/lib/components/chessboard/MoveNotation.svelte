<script lang="ts">
  import type { DisplayLine } from "$lib/utils/variations";
  import { _ } from '$lib/i18n';
  import { createToaster, Menu, Portal, Toast } from '@skeletonlabs/skeleton-svelte';
  import EditMove from '$lib/components/modales/EditMove.svelte';

  let {
    displayLines,
    currentNodeId,
    onMoveClick
  }: {
    displayLines: DisplayLine[];
    currentNodeId: string | null;
    onMoveClick: (nodeId: string) => void;
  } = $props();

  const toaster = createToaster();

  function handleToastSuccess(message: string) {
    toaster.success({ title: $_('common.messages.success'), description: message });
  }
</script>

<div class="flex flex-col gap-4 items-center w-full mb-16">
  <h2 class="h5">{$_('chessboard.notation.title')}</h2>
  <div class="notation-text w-full bg-surface-800 p-4 rounded max-h-96 overflow-y-auto">
    {#each displayLines as line}
      <div class="move-line" style="margin-left: {line.depth * 20}px;">
        {#if line.type === 'variation'}
          <span class="variation-marker">(</span>
        {/if}
        
        {#each line.moves as move, idx}
          {#if move.isWhite}
            <span class="move-number">{move.moveNumber}.</span>
          {:else if idx === 0 || line.moves[idx - 1]?.moveNumber !== move.moveNumber}
            <span class="move-number">{move.moveNumber}...</span>
          {/if}

          <Menu>
            <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
              <button
                class="move-btn {currentNodeId === move.id ? 'active' : ''} {move.isVariation ? 'variation' : ''}"
                onclick={() => onMoveClick(move.id)}
              >
                {move.san}
              </button>
            </Menu.ContextTrigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="edit">
                    <Menu.ItemText>
                      <EditMove nodeId={move.id} {handleToastSuccess} />
                    </Menu.ItemText>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu>
        {/each}

        {#if line.type === 'variation'}
          <span class="variation-marker">)</span>
        {/if}
      </div>
    {/each}
  </div>
</div>

<Toast.Group {toaster}>
  {#snippet children(toast)}
    <Toast {toast}>
      <Toast.Message>
        <Toast.Title>{toast.title}</Toast.Title>
        <Toast.Description>{toast.description}</Toast.Description>
      </Toast.Message>
      <Toast.CloseTrigger />
    </Toast>
  {/snippet}
</Toast.Group>

<style>
  .notation-text {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.8;
  }

  .move-line {
    margin-bottom: 4px;
  }

  .move-number {
    color: #aaa;
    margin-right: 4px;
    margin-left: 8px;
  }

  .move-number:first-child {
    margin-left: 0;
  }

  .move-btn {
    padding: 2px 4px;
    margin: 0 2px;
    border-radius: 3px;
    cursor: pointer;
    background: transparent;
    color: inherit;
    transition: background 0.15s;
  }

  .move-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .move-btn.active {
    background: rgba(59, 130, 246, 0.5);
    color: white;
    font-weight: 600;
  }

  .move-btn.variation {
    color: #bbb;
    font-style: italic;
  }

  .variation-marker {
    color: #888;
    margin: 0 4px;
    font-weight: bold;
  }
</style>
