<script lang="ts">
  import type {FlatMoveNode} from "$lib/utils/variantTree";
  import {_} from '$lib/i18n';
  import {createToaster, Menu, Portal, Toast} from '@skeletonlabs/skeleton-svelte';
  import EditMove from '$lib/components/modales/EditMove.svelte';

  let {
    flattenedMoves,
    currentNodeId,
    onMoveClick
  }: {
    flattenedMoves: FlatMoveNode[];
    currentNodeId: string | null;
    onMoveClick: (nodeId: string) => void;
  } = $props();

  const toaster = createToaster();

  function handleToastSuccess(message: string) {
    toaster.success({title: $_('common.messages.success'), description: message});
  }

  function getMoveNumber(node: FlatMoveNode): string {
    const moveNum = Math.ceil(node.ply / 2);
    const isBlackMove = node.ply % 2 === 0;

    if (isBlackMove) {
      return `${moveNum}...`;
    }
    return `${moveNum}.`;
  }

  function getVariantColor(variantId: string): string {
    const colors = [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
    ];
    
    const hash = variantId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }

  function isNewVariant(node: FlatMoveNode, index: number): boolean {
    if (!node.isVariant) return false;
    if (index === 0) return true;
    
    const prevNode = flattenedMoves[index - 1];
    return prevNode.variantId !== node.variantId;
  }

  function isBackToMainLine(node: FlatMoveNode, index: number): boolean {
    if (index === 0) return false;
    if (node.isVariant) return false;
    
    const prevNode = flattenedMoves[index - 1];
    return prevNode.isVariant;
  }
</script>

<div class="flex flex-col gap-4 items-center w-full mb-16">
    <h2 class="h5">{$_('chessboard.notation.title')}</h2>
    <div class="notation-text w-full bg-surface-800 p-4 rounded max-h-96 overflow-y-auto">
        {#each flattenedMoves as node, i (node.id)}
            {#if isNewVariant(node, i)}
                <br/>
                <div class="variant-line" style="padding-left: {node.variantDepth * 20}px">
                    <span class="variant-marker" style="background-color: {getVariantColor(node.variantId || '')}"></span>
                    <span class="move-number">{getMoveNumber(node)}</span>
                    <Menu>
                        <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                            <button
                                    class="move-btn variant {currentNodeId === node.id ? 'active' : ''}"
                                    onclick={() => onMoveClick(node.id)}
                            >
                                {node.san}
                            </button>
                        </Menu.ContextTrigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content>
                                    <Menu.Item value="edit">
                                        <Menu.ItemText>
                                            <EditMove nodeId={node.id} {handleToastSuccess}/>
                                        </Menu.ItemText>
                                    </Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu>
                </div>
            {:else if isBackToMainLine(node, i)}
                <br/>
                <span class="move-number">{getMoveNumber(node)}</span>
                <Menu>
                    <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                        <button
                                class="move-btn main {currentNodeId === node.id ? 'active' : ''}"
                                onclick={() => onMoveClick(node.id)}
                        >
                            {node.san}
                        </button>
                    </Menu.ContextTrigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content>
                                <Menu.Item value="edit">
                                    <Menu.ItemText>
                                        <EditMove nodeId={node.id} {handleToastSuccess}/>
                                    </Menu.ItemText>
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu>
            {:else if node.isVariant && !isNewVariant(node, i)}
                <span class="move-number">{getMoveNumber(node)}</span>
                <Menu>
                    <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                        <button
                                class="move-btn variant {currentNodeId === node.id ? 'active' : ''}"
                                onclick={() => onMoveClick(node.id)}
                        >
                            {node.san}
                        </button>
                    </Menu.ContextTrigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content>
                                <Menu.Item value="edit">
                                    <Menu.ItemText>
                                        <EditMove nodeId={node.id} {handleToastSuccess}/>
                                    </Menu.ItemText>
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu>
            {:else}
                <span class="move-number">{getMoveNumber(node)}</span>
                <Menu>
                    <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                        <button
                                class="move-btn main {currentNodeId === node.id ? 'active' : ''}"
                                onclick={() => onMoveClick(node.id)}
                        >
                            {node.san}
                        </button>
                    </Menu.ContextTrigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content>
                                <Menu.Item value="edit">
                                    <Menu.ItemText>
                                        <EditMove nodeId={node.id} {handleToastSuccess}/>
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
        line-height: 2;
    }

    .variant-line {
        display: inline;
    }

    .move-number {
        color: #aaa;
        margin-right: 4px;
        font-size: 13px;
    }

    .variant-marker {
        display: inline-block;
        width: 3px;
        height: 14px;
        margin-right: 6px;
        border-radius: 1px;
        vertical-align: middle;
    }

    .move-btn {
        padding: 2px 6px;
        margin: 0 2px;
        border-radius: 3px;
        cursor: pointer;
        background: transparent;
        transition: background 0.15s;
        border: none;
    }

    .move-btn.main {
        color: white;
        font-weight: 600;
    }

    .move-btn.variant {
        color: #aaa;
        font-style: italic;
        font-weight: 400;
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
