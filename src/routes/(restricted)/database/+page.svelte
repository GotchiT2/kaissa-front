<script lang="ts">
  import {ChessQueen, Database, FlaskConical, Folder, Tag, Trash2, XIcon} from '@lucide/svelte';
  import {
    createToaster,
    createTreeViewCollection,
    Dialog,
    Navigation,
    Portal,
    Toast,
    TreeView
  } from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import {_} from '$lib/i18n';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import ImportGame from "$lib/components/ImportGame.svelte";
  import type {CollectionWithGames, GameRow} from '$lib/types/chess.types';
  import CreationCollection from "$lib/components/modales/CreationCollection.svelte";
  import CreationTag from "$lib/components/modales/CreationTag.svelte";
  import {
    buildCollectionTree,
    type CollectionNode,
    countSubCollections,
    countTotalPartiesInCollection,
    findCollectionNode
  } from "$lib/utils/collectionTree";
  import {formatMoves, normalizeResult} from "$lib/utils/gameData";


  interface Props {
    data: {
      collections: CollectionWithGames[];
      partiesInAnalysis: any[];
      tags: any[];
    };
  }

  let {data}: Props = $props();

  const toaster = createToaster();

  const treeNodes = $derived(buildCollectionTree(data.collections));

  const collectionTreeView = $derived(createTreeViewCollection<CollectionNode>({
    nodeToValue: (node) => node.id,
    nodeToString: (node) => node.nom,
    rootNode: {
      id: 'root',
      nom: '',
      partiesCount: 0,
      collection: {} as CollectionWithGames,
      children: treeNodes
    }
  }));

  let selectedCollectionId = $state<string | null>(data.collections[0]?.id || null);
  let selectedTagId = $state<string | null>(null);
  let viewMode = $state<'collection' | 'analysis' | 'tag'>('collection');
  let tagToDelete = $state<{ id: string, nom: string, partiesCount: number } | null>(null);
  let collectionToDelete = $state<{
    id: string,
    nom: string,
    partiesCount: number,
    subCollectionsCount: number
  } | null>(null);
  let isDeleting = $state(false);

  const gamesData = $derived.by((): GameRow[] => {
    if (viewMode === 'analysis') {
      return data.partiesInAnalysis.map((partie: any) => ({
        id: partie.id,
        whitePlayer: partie.blancNom || '?',
        blackPlayer: partie.noirNom || '?',
        tournament: partie.event || '?',
        date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : '?',
        whiteElo: partie.blancElo || 0,
        blackElo: partie.noirElo || 0,
        result: normalizeResult(partie.resultat),
        notation: formatMoves(partie.coups || []),
        isInAnalysis: partie.isInAnalysis || false,
        tagIds: partie.tags?.map((t: any) => t.tagId) || [],
      }));
    }

    if (viewMode === 'tag') {
      if (!selectedTagId) return [];

      const tag = data.tags.find((t) => t.id === selectedTagId);
      if (!tag || !tag.parties) return [];

      return tag.parties.map((partieTag: any) => {
        const partie = partieTag.partie;
        return {
          id: partie.id,
          whitePlayer: partie.blancNom || '?',
          blackPlayer: partie.noirNom || '?',
          tournament: partie.event || '?',
          date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : '?',
          whiteElo: partie.blancElo || 0,
          blackElo: partie.noirElo || 0,
          result: normalizeResult(partie.resultat),
          notation: formatMoves(partie.coups || []),
          isInAnalysis: partie.isInAnalysis || false,
          tagIds: partie.tags?.map((t: any) => t.tagId) || [],
        };
      });
    }

    if (!selectedCollectionId) return [];

    const collection = data.collections.find((c) => c.id === selectedCollectionId);
    if (!collection || !collection.parties) return [];

    return collection.parties.map((partie: any) => ({
      id: partie.id,
      whitePlayer: partie.blancNom || '?',
      blackPlayer: partie.noirNom || '?',
      tournament: partie.event || '?',
      date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : '?',
      whiteElo: partie.blancElo || 0,
      blackElo: partie.noirElo || 0,
      result: normalizeResult(partie.resultat),
      notation: formatMoves(partie.coups || []),
      isInAnalysis: partie.isInAnalysis || false,
      tagIds: partie.tags?.map((t: any) => t.tagId) || [],
    }));
  });

  const selectedCollection = $derived<CollectionWithGames | undefined>(
    data.collections.find((c) => c.id === selectedCollectionId)
  );

  const selectedTag = $derived(
    data.tags.find((t) => t.id === selectedTagId)
  );

  const pageTitle = $derived(
    viewMode === 'analysis'
      ? $_('database.analysis.title')
      : viewMode === 'tag'
        ? selectedTag?.nom || 'Tag'
        : selectedCollection?.nom || 'Collection'
  );

  function handleToastSuccess(message: string) {
    toaster.success({title: $_('common.messages.success'), description: message});
  }

  function handleSelectCollection(id: string) {
    selectedCollectionId = id;
    viewMode = 'collection';
  }

  function handleSelectAnalysis() {
    viewMode = 'analysis';
  }

  function handleSelectTag(id: string) {
    selectedTagId = id;
    viewMode = 'tag';
  }

  function openDeleteTagModal(tagId: string, tagNom: string, partiesCount: number) {
    tagToDelete = {
      id: tagId,
      nom: tagNom,
      partiesCount
    };
  }

  function closeDeleteTagModal() {
    if (!isDeleting) {
      tagToDelete = null;
    }
  }

  async function confirmDeleteTag() {
    if (!tagToDelete) return;

    isDeleting = true;

    try {
      const response = await fetch(`/api/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || $_('errors.tag.deleteFailed'));
      }

      toaster.success({title: $_('common.messages.success'), description: $_('database.tags.deleteSuccess')});

      if (viewMode === 'tag' && selectedTagId === tagToDelete.id) {
        viewMode = 'collection';
        selectedTagId = null;
      }

      tagToDelete = null;

      window.location.reload();
    } catch (err: any) {
      toaster.error({
        title: $_('common.messages.error'),
        description: err.message || $_('errors.tag.deleteFailed')
      });
    } finally {
      isDeleting = false;
    }
  }

  function openDeleteCollectionModal(collectionId: string, collectionNom: string) {
    const node = findCollectionNode(treeNodes, collectionId);
    if (!node) return;

    const subCollectionsCount = countSubCollections(node);
    const partiesCount = countTotalPartiesInCollection(node);

    collectionToDelete = {
      id: collectionId,
      nom: collectionNom,
      partiesCount,
      subCollectionsCount,
    };
  }

  function closeDeleteCollectionModal() {
    if (!isDeleting) {
      collectionToDelete = null;
    }
  }

  async function confirmDeleteCollection() {
    if (!collectionToDelete) return;

    isDeleting = true;

    const deletingCollectionId = collectionToDelete.id;
    collectionToDelete = null;

    try {
      const response = await fetch(`/api/collections/${deletingCollectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || $_('errors.collection.deleteFailed'));
      }

      const result = await response.json();

      toaster.success({
        title: $_('common.messages.success'),
        description: result.message || $_('database.collections.deleteSuccess')
      });

      window.location.reload();
    } catch (err: any) {
      toaster.error({
        title: $_('common.messages.error'),
        description: err.message || $_('errors.collection.deleteFailed')
      });
    } finally {
      isDeleting = false;
    }
  }
</script>

<div class="flex h-[90vh] w-full">
    <Navigation
            class="w-auto px-4 h-full bg-[#121212] flex flex-col items-center gap-4"
            layout="sidebar"
    >
        <Navigation.Header class="flex flex-col gap-2 py-4">
            <a class="btn-icon btn-icon-lg preset-filled-primary-500" href="/chessboard" title="Mode échiquier">
                <ChessQueen class="size-6"/>
                <span class="sr-only">Mode échiquier</span>
            </a>
            <a class="btn-icon btn-icon-lg preset-filled-primary-500" href="/database"
               title="Bases de données">
                <Database class="size-6"/>
                <span class="sr-only">Bases de données</span>
            </a>
        </Navigation.Header>
    </Navigation>

    <Navigation
            class="w-auto h-full grid grid-rows-[auto_1fr_auto] gap-4 border-r-1 border-b-primary-100 py-8"
            layout="sidebar"
    >
        <Navigation.Content class="ml-4 overflow-y-auto">
            <Navigation.Group class="w-full">
                <Navigation.Label class="capitalize pl-2 flex justify-between">{$_('database.collections.title')}
                    <CreationCollection {handleToastSuccess} label={$_('database.collections.create')}/>
                </Navigation.Label>
                <TreeView collection={collectionTreeView}>
                    <TreeView.Tree>
                        {#each collectionTreeView.rootNode.children || [] as node, index (node)}
                            {@render collectionNode(node, [index])}
                        {/each}
                    </TreeView.Tree>
                </TreeView>
            </Navigation.Group>

            <Navigation.Group class="w-full mt-4">
                <Navigation.Label class="capitalize pl-2">{$_('database.analysis.title')}</Navigation.Label>
                <button
                        class="flex items-center gap-2 w-full text-left px-4 py-2 rounded hover:preset-tonal"
                        class:preset-filled-primary-500={viewMode === 'analysis'}
                        onclick={handleSelectAnalysis}
                >
                    <FlaskConical class="size-4"/>
                    <span>{$_('database.analysis.inAnalysis')}</span>
                    <span class="opacity-60 ml-auto">({data.partiesInAnalysis.length}/5)</span>
                </button>
            </Navigation.Group>

            <Navigation.Group class="w-full mt-4">
                <Navigation.Label class="capitalize pl-2 flex justify-between">{$_('database.tags.title')}
                    <CreationTag {handleToastSuccess} label={$_('database.tags.create')}/>
                </Navigation.Label>
                {#if data.tags.length === 0}
                    <p class="text-sm opacity-60 px-4 py-2">{$_('database.tags.noTags')}</p>
                {:else}
                    {#each data.tags as tag (tag.id)}
                        <div class="flex items-center gap-2 w-full px-4 py-2 rounded hover:preset-tonal group">
                            <button
                                    class="flex items-center gap-2 flex-1 text-left"
                                    class:preset-filled-primary-500={viewMode === 'tag' && selectedTagId === tag.id}
                                    onclick={() => handleSelectTag(tag.id)}
                            >
                                <Tag class="size-4"/>
                                <span>{tag.nom}</span>
                                <span class="opacity-60 ml-auto">({tag._count.parties})</span>
                            </button>
                            <button
                                    class="btn-icon btn-icon-sm hover:preset-filled-error-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        openDeleteTagModal(tag.id, tag.nom, tag._count.parties);
                                    }}
                                    disabled={isDeleting}
                                    title={`${$_('database.tags.delete')} ${tag.nom}`}
                                    aria-label={`${$_('database.tags.delete')} ${tag.nom}`}
                            >
                                <Trash2 class="size-4"/>
                            </button>
                        </div>
                    {/each}
                {/if}
            </Navigation.Group>

        </Navigation.Content>
    </Navigation>

    <div class="grow flex flex-col items-center bg-surface-900 overflow-auto">
        <div class="flex gap-4 items-center my-6">
            <h1 class="h2 text-primary-500">{pageTitle}</h1>
            <p>{$_('database.games.resultsPlural', {values: {count: gamesData.length}})}</p>
            {#if viewMode === 'collection'}
                <ImportGame
                        collectionId={selectedCollectionId || ''}
                        onError={(message) => toaster.error({ title: $_('common.messages.error'), description: message })}
                        onSuccess={(message) => toaster.success({ title: $_('common.messages.success'), description: message })}
                />
            {/if}
        </div>

        {#if gamesData.length > 0}
            <GamesTable
                    data={gamesData}
                    availableTags={data.tags}
                    onDeleteSuccess={(message) => toaster.success({ title: $_('common.messages.success'), description: message })}
                    onDeleteError={(message) => toaster.error({ title: $_('common.messages.error'), description: message })}
                    onAnalysisToggleSuccess={(message) => toaster.success({ title: $_('common.messages.success'), description: message })}
                    onAnalysisToggleError={(message) => toaster.error({ title: $_('common.messages.error'), description: message })}
                    onTagsUpdateSuccess={(message) => toaster.success({ title: $_('common.messages.success'), description: message })}
                    onTagsUpdateError={(message) => toaster.error({ title: $_('common.messages.error'), description: message })}
            />
        {:else}
            <div class="flex flex-col items-center justify-center h-64 gap-4">
                {#if viewMode === 'analysis'}
                    <FlaskConical class="size-12 opacity-60"/>
                    <p class="text-lg opacity-60">{$_('database.analysis.noParties')}</p>
                    <p class="text-sm opacity-40">{$_('database.games.noGames')}</p>
                {:else}
                    <p class="text-lg opacity-60">{$_('database.analysis.addInfo')}</p>
                    <ImportGame
                            collectionId={selectedCollectionId || ''}
                            onSuccess={(message) => toaster.success({ title: $_('common.messages.success'), description: message })}
                            onError={(message) => toaster.error({ title: $_('common.messages.error'), description: message })}
                    />
                {/if}
            </div>
        {/if}
    </div>

</div>

{#snippet collectionNode(node: CollectionNode, indexPath: number[])}
    <TreeView.NodeProvider value={{ node, indexPath }}>
        {#if node.children && node.children.length > 0}
            <TreeView.Branch>
                <TreeView.BranchControl>
                    <TreeView.BranchIndicator/>
                    <TreeView.BranchText>
                        <div class="flex items-center gap-2 flex-1 group">
                            <button
                                    onclick={() => handleSelectCollection(node.id)}
                                    class="flex items-center gap-2 flex-1 text-left"
                                    class:preset-filled-primary-500={selectedCollectionId === node.id}
                            >
                                <Folder class="size-4"/>
                                <span>{node.nom}</span>
                                <span class="opacity-60 ml-2">({formatNumber(node.partiesCount)})</span>
                            </button>
                            <button
                                    class="btn-icon btn-icon-sm hover:preset-filled-error-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onclick={(e) => {
                                        e.stopPropagation();
                                        openDeleteCollectionModal(node.id, node.nom);
                                    }}
                                    disabled={isDeleting}
                                    title={`${$_('database.collections.delete')} ${node.nom}`}
                                    aria-label={`${$_('database.collections.delete')} ${node.nom}`}
                            >
                                <Trash2 class="size-4"/>
                            </button>
                        </div>
                    </TreeView.BranchText>
                    <CreationCollection
                            {handleToastSuccess}
                            label={`${$_('database.collections.createSubCollection')} ${node.nom}`}
                            parentId={node.id}
                    />
                </TreeView.BranchControl>
                <TreeView.BranchContent>
                    <TreeView.BranchIndentGuide/>
                    {#each node.children as childNode, childIndex (childNode)}
                        {@render collectionNode(childNode, [...indexPath, childIndex])}
                    {/each}
                </TreeView.BranchContent>
            </TreeView.Branch>
        {:else}
            <TreeView.Item>
                <div class="flex items-center gap-2 w-full group">
                    <button
                            onclick={() => handleSelectCollection(node.id)}
                            class="flex items-center gap-2 flex-1 text-left px-2 py-1 rounded hover:preset-tonal"
                            class:preset-filled-primary-500={selectedCollectionId === node.id}
                    >
                        <Folder class="size-4"/>
                        <span>{node.nom}</span>
                        <span class="opacity-60 ml-2">({formatNumber(node.partiesCount)})</span>
                    </button>
                    <button
                            class="btn-icon btn-icon-sm hover:preset-filled-error-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onclick={(e) => {
                                e.stopPropagation();
                                openDeleteCollectionModal(node.id, node.nom);
                            }}
                            disabled={isDeleting}
                            title={`${$_('database.collections.delete')} ${node.nom}`}
                            aria-label={`${$_('database.collections.delete')} ${node.nom}`}
                    >
                        <Trash2 class="size-4"/>
                    </button>
                </div>
                <CreationCollection
                        {handleToastSuccess}
                        label={`${$_('database.collections.createSubCollection')} ${node.nom}`}
                        parentId={node.id}
                />
            </TreeView.Item>
        {/if}
    </TreeView.NodeProvider>
{/snippet}

{#if collectionToDelete}
    <Dialog open={collectionToDelete !== null}>
        <Portal>
            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={closeDeleteCollectionModal}/>
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
                    <header class="flex justify-between items-center">
                        <Dialog.Title
                                class="text-lg font-bold">{$_('database.collections.confirmDelete')}</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeDeleteCollectionModal}
                                             disabled={isDeleting}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>{$_('database.collections.deleteWarning')}</p>
                        <p class="font-semibold text-primary-500">{collectionToDelete.nom}</p>

                        {#if collectionToDelete.subCollectionsCount > 0 || collectionToDelete.partiesCount > 0}
                            <div class="bg-error-500/10 border border-error-500/30 rounded p-3 space-y-1">
                                <p class="text-sm font-semibold text-error-400">
                                    ⚠️ {$_('database.collections.willDelete')}</p>
                                {#if collectionToDelete.partiesCount > 0}
                                    <p class="text-sm opacity-90">
                                        • {$_('database.collections.partiesPlural', {values: {count: collectionToDelete.partiesCount}})}
                                    </p>
                                {/if}
                                {#if collectionToDelete.subCollectionsCount > 0}
                                    <p class="text-sm opacity-90">
                                        • {$_('database.collections.subCollectionsPlural', {values: {count: collectionToDelete.subCollectionsCount}})}
                                    </p>
                                {/if}
                            </div>
                        {/if}

                        <p class="text-sm opacity-75">{$_('database.collections.irreversible')}</p>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeDeleteCollectionModal}
                                disabled={isDeleting}
                        >
                            $_('common.messages.cancel')
                        </button>
                        <button
                                class="btn preset-filled-error-500"
                                onclick={confirmDeleteCollection}
                                disabled={isDeleting}
                        >
                            {isDeleting ? $_('common.messages.deleting') : $_('common.actions.delete')}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog>
{/if}

{#if tagToDelete}
    <Dialog open={tagToDelete !== null}>
        <Portal>
            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={closeDeleteTagModal}/>
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
                    <header class="flex justify-between items-center">
                        <Dialog.Title class="text-lg font-bold">{$_('database.tags.confirmDelete')}</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeDeleteTagModal}
                                             disabled={isDeleting}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>{$_('database.tags.deleteWarning')}</p>
                        <p class="font-semibold text-primary-500">{tagToDelete.nom}</p>
                        <p class="text-sm opacity-75">
                            {$_('database.tags.linkedToPlural', {values: {count: tagToDelete.partiesCount}})}
                            {$_('database.tags.associationsWillBeDeleted')})}
                        </p>
                        <p class="text-sm opacity-75">{$_('database.tags.irreversible')})}</p>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeDeleteTagModal}
                                disabled={isDeleting}
                        >
                            {$_('common.actions.cancel')})}
                        </button>
                        <button
                                class="btn preset-filled-error-500"
                                onclick={confirmDeleteTag}
                                disabled={isDeleting}
                        >
                            {isDeleting ? $_('common.messages.deleting') : $_('common.actions.delete')}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog>
{/if}


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
