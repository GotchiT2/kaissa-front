<script lang="ts">
  import type {FlatMoveNode} from "$lib/utils/variantTree";
  import {_} from '$lib/i18n';
  import {createToaster, Menu, Portal, Toast} from '@skeletonlabs/skeleton-svelte';
  import EditMove from '$lib/components/modales/EditMove.svelte';
  import {invalidateAll} from '$app/navigation';
  import {TrashIcon, ArrowUpIcon, ArrowUpFromLineIcon, ArrowDownIcon} from '@lucide/svelte';

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
  let isDeleting = $state(false);

  function handleToastSuccess(message: string) {
    toaster.success({title: $_('common.messages.success'), description: message});
  }

  function handleToastError(message: string) {
    toaster.error({title: $_('common.messages.error'), description: message});
  }

  async function promoteVariantToMain(nodeId: string) {
    if (isDeleting) return;
    isDeleting = true;

    try {
      const response = await fetch(`/api/parties/${nodeId.split('-')[0]}/moves/${nodeId}/promote`, {
        method: 'POST',
      });

      if (response.ok) {
        handleToastSuccess('Variante promue en principale');
        await invalidateAll();
      } else {
        const error = await response.json();
        handleToastError(error.error || 'Erreur lors de la promotion de la variante');
      }
    } catch (error) {
      console.error('Error promoting variant to main:', error);
      handleToastError('Erreur lors de la promotion de la variante');
    } finally {
      isDeleting = false;
    }
  }

  async function promoteVariantOneLevel(nodeId: string) {
    if (isDeleting) return;
    isDeleting = true;

    try {
      const response = await fetch(`/api/nodes/${nodeId}/promote-one-level`, {
        method: 'POST',
      });

      if (response.ok) {
        handleToastSuccess('Variante promue d\'un niveau');
        await invalidateAll();
      } else {
        const error = await response.json();
        handleToastError(error.error || 'Erreur lors de la promotion de la variante');
      }
    } catch (error) {
      console.error('Error promoting variant one level:', error);
      handleToastError('Erreur lors de la promotion de la variante');
    } finally {
      isDeleting = false;
    }
  }

  async function demoteVariantOneLevel(nodeId: string) {
    if (isDeleting) return;
    isDeleting = true;

    try {
      const response = await fetch(`/api/nodes/${nodeId}/demote-one-level`, {
        method: 'POST',
      });

      if (response.ok) {
        handleToastSuccess('Variante abaissée d\'un niveau');
        await invalidateAll();
      } else {
        const error = await response.json();
        handleToastError(error.error || 'Erreur lors de l\'abaissement de la variante');
      }
    } catch (error) {
      console.error('Error demoting variant one level:', error);
      handleToastError('Erreur lors de l\'abaissement de la variante');
    } finally {
      isDeleting = false;
    }
  }

  async function deleteVariant(nodeId: string) {
    if (isDeleting) return;
    isDeleting = true;

    try {
      const response = await fetch(`/api/nodes/${nodeId}/delete-variant`, {
        method: 'DELETE',
      });

      if (response.ok) {
        handleToastSuccess('Variante supprimée avec succès');
        await invalidateAll();
      } else {
        const error = await response.json();
        handleToastError(error.error || 'Erreur lors de la suppression de la variante');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      handleToastError('Erreur lors de la suppression de la variante');
    } finally {
      isDeleting = false;
    }
  }

  async function deleteAfterNode(nodeId: string) {
    if (isDeleting) return;
    isDeleting = true;

    try {
      const response = await fetch(`/api/nodes/${nodeId}/delete-after`, {
        method: 'DELETE',
      });

      if (response.ok) {
        handleToastSuccess('Coups supprimés avec succès');
        await invalidateAll();
      } else {
        const error = await response.json();
        handleToastError(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting after node:', error);
      handleToastError('Erreur lors de la suppression');
    } finally {
      isDeleting = false;
    }
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

  function getNagSymbol(nag: number | null | undefined): string {
    if (!nag) return '';
    
    const nagSymbols: Record<number, string> = {
      1: '!',
      2: '?',
      3: '!!',
      4: '??',
      5: '!?',
      6: '?!',
      7: '□',
      10: '=',
      13: '∞',
      14: '⩲',
      15: '⩱',
      16: '±',
      17: '∓',
      18: '+-',
      19: '-+',
    };
    
    return nagSymbols[nag] || '';
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

  function getCommentaireAvant(node: FlatMoveNode): string {
    if (!node.commentaires || node.commentaires.length === 0) return '';
    
    const commentaireAvant = node.commentaires.find(c => c.type === 'AVANT');
    return commentaireAvant?.contenu || '';
  }

  function getCommentaireApres(node: FlatMoveNode): string {
    if (!node.commentaires || node.commentaires.length === 0) return '';
    
    const commentaireApres = node.commentaires.find(c => c.type === 'APRES');
    return commentaireApres?.contenu || '';
  }

  function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function getTooltipContent(node: FlatMoveNode): string {
    const nags = [
      getNagSymbol(node.nagCoup),
      getNagSymbol(node.nagPosition)
    ].filter(Boolean).join('');
    
    const commentaireAvant = getCommentaireAvant(node);
    const commentaireApres = getCommentaireApres(node);
    
    let tooltip = node.san + nags;
    if (commentaireAvant) tooltip = `[${commentaireAvant}] ${tooltip}`;
    if (commentaireApres) tooltip += ` - ${commentaireApres}`;
    
    return tooltip;
  }
</script>

<div class="flex flex-col gap-4 items-center w-full mb-16">
    <h2 class="h5">{$_('chessboard.notation.title')}</h2>
    <div class="notation-text w-full bg-surface-800 p-4 rounded max-h-96 overflow-y-auto">
        {#each flattenedMoves as node, i (node.id)}
            {#if isNewVariant(node, i)}
                <br/>
                <div class="variant-line" style="padding-left: {node.variantDepth * 20}px">
                    <Menu>
                        <Menu.ContextTrigger>
                            <span class="variant-marker clickable" style="background-color: {getVariantColor(node.variantId || '')}"></span>
                        </Menu.ContextTrigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content>
                                    {#if !node.estPrincipal}
                                        <Menu.Item value="promote-to-main" onclick={() => promoteVariantToMain(node.id)} disabled={isDeleting}>
                                            <ArrowUpFromLineIcon class="size-4 mr-2" />
                                            <Menu.ItemText>Promouvoir en principale</Menu.ItemText>
                                        </Menu.Item>
                                        <Menu.Item value="promote-one-level" onclick={() => promoteVariantOneLevel(node.id)} disabled={isDeleting}>
                                            <ArrowUpIcon class="size-4 mr-2" />
                                            <Menu.ItemText>Promouvoir d'un niveau</Menu.ItemText>
                                        </Menu.Item>
                                        <Menu.Item value="demote-one-level" onclick={() => demoteVariantOneLevel(node.id)} disabled={isDeleting}>
                                            <ArrowDownIcon class="size-4 mr-2" />
                                            <Menu.ItemText>Abaisser d'un niveau</Menu.ItemText>
                                        </Menu.Item>
                                        <Menu.Separator />
                                        <Menu.Item value="delete-variant" onclick={() => deleteVariant(node.id)} disabled={isDeleting}>
                                            {#if isDeleting}
                                                <span class="loader size-4 mr-2"></span>
                                            {:else}
                                                <TrashIcon class="size-4 mr-2" />
                                            {/if}
                                            <Menu.ItemText>{isDeleting ? 'Suppression...' : 'Supprimer la variante'}</Menu.ItemText>
                                        </Menu.Item>
                                    {/if}
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu>
                    <span class="move-number">{getMoveNumber(node)}</span>
                    <Menu>
                        <Menu.ContextTrigger class="card border border-dashed border-surface-200-800">
                    <button
                            class="move-btn variant {currentNodeId === node.id ? 'active' : ''}"
                            onclick={() => onMoveClick(node.id)}
                            title={getTooltipContent(node)}
                    >
                        {#if getCommentaireAvant(node)}<span class="comment-text comment-avant">[{truncateText(getCommentaireAvant(node), 50)}]</span>{/if}{node.san}{#if node.nagCoup}<span class="nag-annotation">{getNagSymbol(node.nagCoup)}</span>{/if}{#if node.nagPosition}<span class="nag-annotation">{getNagSymbol(node.nagPosition)}</span>{/if}{#if getCommentaireApres(node)}<span class="comment-text">{truncateText(getCommentaireApres(node), 100)}</span>{/if}
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
                                    <Menu.Item value="delete-after" onclick={() => deleteAfterNode(node.id)}>
                                        <TrashIcon class="size-4 mr-2" />
                                        <Menu.ItemText>Supprimer après ce coup</Menu.ItemText>
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
                                title={getTooltipContent(node)}
                        >
                            {#if getCommentaireAvant(node)}<span class="comment-text comment-avant">[{truncateText(getCommentaireAvant(node), 50)}]</span>{/if}{node.san}{#if node.nagCoup}<span class="nag-annotation">{getNagSymbol(node.nagCoup)}</span>{/if}{#if node.nagPosition}<span class="nag-annotation">{getNagSymbol(node.nagPosition)}</span>{/if}{#if getCommentaireApres(node)}<span class="comment-text">{truncateText(getCommentaireApres(node), 100)}</span>{/if}
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
                                <Menu.Item value="delete-after" onclick={() => deleteAfterNode(node.id)}>
                                    <TrashIcon class="size-4 mr-2" />
                                    <Menu.ItemText>Supprimer après ce coup</Menu.ItemText>
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
                                title={getTooltipContent(node)}
                        >
                            {#if getCommentaireAvant(node)}<span class="comment-text comment-avant">[{truncateText(getCommentaireAvant(node), 50)}]</span>{/if}{node.san}{#if node.nagCoup}<span class="nag-annotation">{getNagSymbol(node.nagCoup)}</span>{/if}{#if node.nagPosition}<span class="nag-annotation">{getNagSymbol(node.nagPosition)}</span>{/if}{#if getCommentaireApres(node)}<span class="comment-text">{truncateText(getCommentaireApres(node), 100)}</span>{/if}
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
                                <Menu.Item value="delete-after" onclick={() => deleteAfterNode(node.id)}>
                                    <TrashIcon class="size-4 mr-2" />
                                    <Menu.ItemText>Supprimer après ce coup</Menu.ItemText>
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
                                title={getTooltipContent(node)}
                        >
                            {#if getCommentaireAvant(node)}<span class="comment-text comment-avant">[{truncateText(getCommentaireAvant(node), 50)}]</span>{/if}{node.san}{#if node.nagCoup}<span class="nag-annotation">{getNagSymbol(node.nagCoup)}</span>{/if}{#if node.nagPosition}<span class="nag-annotation">{getNagSymbol(node.nagPosition)}</span>{/if}{#if getCommentaireApres(node)}<span class="comment-text">{truncateText(getCommentaireApres(node), 100)}</span>{/if}
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
                                <Menu.Item value="delete-after" onclick={() => deleteAfterNode(node.id)}>
                                    <TrashIcon class="size-4 mr-2" />
                                    <Menu.ItemText>Supprimer après ce coup</Menu.ItemText>
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

    .variant-marker.clickable {
        cursor: pointer;
        transition: opacity 0.15s;
    }

    .variant-marker.clickable:hover {
        opacity: 0.7;
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

    .nag-annotation {
        color: #f59e0b;
        font-weight: 600;
        margin-left: 2px;
        font-size: 13px;
    }

    .comment-text {
        color: #10b981;
        font-style: italic;
        margin-left: 4px;
        font-size: 12px;
    }

    .comment-avant {
        margin-left: 0;
        margin-right: 4px;
    }

    .loader {
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top: 2px solid white;
        animation: spin 0.6s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
