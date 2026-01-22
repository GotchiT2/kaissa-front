<script lang="ts">
  import type {GroupedMove} from "$lib/utils/chessNotation";
  import {_} from '$lib/i18n';
  import {createToaster, Menu, Portal, Toast} from '@skeletonlabs/skeleton-svelte';
  import EditMove from '$lib/components/modales/EditMove.svelte';

  let {
    groupedMoves,
    currentIndex,
    onMoveClick
  }: {
    groupedMoves: GroupedMove[];
    currentIndex: number;
    onMoveClick: (index: number) => void;
  } = $props();

  let selectedNodeId = $state<string | null>(null);

  const toaster = createToaster();

  $effect(() => {
    const selectedMove = groupedMoves.flatMap(row => [
      {index: row.whiteIndex, nodeId: row.whiteNodeId},
      {index: row.blackIndex, nodeId: row.blackNodeId}
    ]).find(m => m.index === currentIndex);

    if (selectedMove?.nodeId) {
      selectedNodeId = selectedMove.nodeId;
    } else {
      selectedNodeId = null;
    }
  });

  function handleToastSuccess(message: string) {
    toaster.success({title: $_('common.messages.success'), description: message});
  }
</script>

<div class="flex flex-col gap-4 items-center w-full mb-16">
    <h2 class="h5">{$_('chessboard.notation.title')}</h2>
    <div class="notation-text w-full bg-surface-800 p-4 rounded max-h-96 overflow-y-auto">
        {#each groupedMoves as row}
            <span class="move-number">{row.moveNumber}.</span>

            <Menu>
                <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                    <button
                            class="move-btn {currentIndex === row.whiteIndex ? 'active' : ''}"
                            onclick={() => onMoveClick(row.whiteIndex)}
                    >
                        {row.white}
                    </button>
                </Menu.ContextTrigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            <Menu.Item value="edit">
                                <Menu.ItemText>
                                    {#if row.whiteNodeId}
                                        <EditMove nodeId={row.whiteNodeId} {handleToastSuccess}/>
                                    {/if}
                                </Menu.ItemText>
                            </Menu.Item>
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu>
            {#if row.black}
                <Menu>
                    <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                        <button
                                class="move-btn {currentIndex === row.blackIndex ? 'active' : ''}"
                                onclick={() => onMoveClick(row.blackIndex)}
                        >
                            {row.black}
                        </button>
                    </Menu.ContextTrigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content>
                                <Menu.Item value="edit">
                                    <Menu.ItemText>
                                        {#if row.blackNodeId}
                                            <EditMove nodeId={row.blackNodeId} {handleToastSuccess}/>
                                        {/if}
                                    </Menu.ItemText>
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu>
            {/if}
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
            <Toast.CloseTrigger/>
        </Toast>
    {/snippet}
</Toast.Group>

<style>
    .notation-text {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.8;
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
</style>
