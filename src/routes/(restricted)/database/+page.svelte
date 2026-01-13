<script lang="ts">
  import {ChessQueen, Database, FlaskConical, Folder, Tag} from '@lucide/svelte';
  import {createToaster, createTreeViewCollection, Navigation, Toast, TreeView} from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import ImportGame from "$lib/components/ImportGame.svelte";
  import type {CollectionWithGames, GameRow} from '$lib/types/chess.types';
  import CreationCollection from "$lib/components/modales/CreationCollection.svelte";
  import CreationTag from "$lib/components/modales/CreationTag.svelte";

  interface Props {
    data: {
      collections: CollectionWithGames[];
      partiesInAnalysis: any[];
      tags: any[];
    };
  }

  let {data}: Props = $props();

  const toaster = createToaster();

  interface CollectionNode {
    id: string;
    nom: string;
    partiesCount: number;
    collection: CollectionWithGames;
    children?: CollectionNode[];
  }

  function buildCollectionTree(collections: CollectionWithGames[]): CollectionNode[] {
    const collectionMap = new Map<string, CollectionNode>();
    const rootNodes: CollectionNode[] = [];

    collections.forEach(collection => {
      collectionMap.set(collection.id, {
        id: collection.id,
        nom: collection.nom,
        partiesCount: collection.parties.length || 0,
        collection,
        children: []
      });
    });

    collections.forEach(collection => {
      const node = collectionMap.get(collection.id)!;
      if (collection.parentId) {
        const parent = collectionMap.get(collection.parentId);
        if (parent) {
          parent.children!.push(node);
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  }

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

  function formatMoves(coups: any[]): string {
    if (!coups || coups.length === 0) return '—';

    const moves = coups.slice(0, 8).map((coup, index) => {
      const moveNumber = Math.floor(index / 2) + 1;
      const move = coup.coupUci || '';

      if (index % 2 === 0) {
        return `${moveNumber}. ${move}`;
      } else {
        return move;
      }
    });

    return moves.join(' ');
  }

  function normalizeResult(result: string | null | undefined): "1-0" | "0-1" | "½-½" {
    if (result === "BLANCS") return "1-0";
    if (result === "NOIRS") return "0-1";
    if (result === "NULLE") return "½-½";
    return "½-½";
  }

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
      ? 'En Analyse' 
      : viewMode === 'tag' 
        ? selectedTag?.nom || 'Tag'
        : selectedCollection?.nom || 'Collection'
  );

  function handleToastSuccess(message: string) {
    toaster.success({title: 'Succès', description: message});
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
                <Navigation.Label class="capitalize pl-2 flex justify-between">Collections
                    <CreationCollection {handleToastSuccess} label="Créer une collection"/>
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
                <Navigation.Label class="capitalize pl-2">En Analyse</Navigation.Label>
                <button
                        class="flex items-center gap-2 w-full text-left px-4 py-2 rounded hover:preset-tonal"
                        class:preset-filled-primary-500={viewMode === 'analysis'}
                        onclick={handleSelectAnalysis}
                >
                    <FlaskConical class="size-4"/>
                    <span>Parties en analyse</span>
                    <span class="opacity-60 ml-auto">({data.partiesInAnalysis.length}/5)</span>
                </button>
            </Navigation.Group>

            <Navigation.Group class="w-full mt-4">
                <Navigation.Label class="capitalize pl-2 flex justify-between">Tags
                    <CreationTag {handleToastSuccess} label="Créer un tag"/>
                </Navigation.Label>
                {#if data.tags.length === 0}
                    <p class="text-sm opacity-60 px-4 py-2">Aucun tag disponible</p>
                {:else}
                    {#each data.tags as tag (tag.id)}
                        <button
                                class="flex items-center gap-2 w-full text-left px-4 py-2 rounded hover:preset-tonal"
                                class:preset-filled-primary-500={viewMode === 'tag' && selectedTagId === tag.id}
                                onclick={() => handleSelectTag(tag.id)}
                        >
                            <Tag class="size-4"/>
                            <span>{tag.nom}</span>
                            <span class="opacity-60 ml-auto">({tag._count.parties})</span>
                        </button>
                    {/each}
                {/if}
            </Navigation.Group>

        </Navigation.Content>
    </Navigation>

    <div class="grow flex flex-col items-center bg-surface-900 overflow-auto">
        <div class="flex gap-4 items-center my-6">
            <h1 class="h2 text-primary-500">{pageTitle}</h1>
            <p>{gamesData.length} résultat{gamesData.length > 1 ? 's' : ''}</p>
            {#if viewMode === 'collection'}
                <ImportGame
                        collectionId={selectedCollectionId || ''}
                        onError={(message) => toaster.error({ title: 'Erreur', description: message })}
                        onSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                />
            {/if}
        </div>

        {#if gamesData.length > 0}
            <GamesTable
                    data={gamesData}
                    availableTags={data.tags}
                    onDeleteSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                    onDeleteError={(message) => toaster.error({ title: 'Erreur', description: message })}
                    onAnalysisToggleSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                    onAnalysisToggleError={(message) => toaster.error({ title: 'Erreur', description: message })}
                    onTagsUpdateSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                    onTagsUpdateError={(message) => toaster.error({ title: 'Erreur', description: message })}
            />
        {:else}
            <div class="flex flex-col items-center justify-center h-64 gap-4">
                {#if viewMode === 'analysis'}
                    <FlaskConical class="size-12 opacity-60"/>
                    <p class="text-lg opacity-60">Aucune partie en analyse</p>
                    <p class="text-sm opacity-40">Ajoutez jusqu'à 5 parties pour les analyser</p>
                {:else}
                    <p class="text-lg opacity-60">Aucune partie dans cette collection</p>
                    <ImportGame
                            collectionId={selectedCollectionId || ''}
                            onSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                            onError={(message) => toaster.error({ title: 'Erreur', description: message })}
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
                        <button
                                onclick={() => handleSelectCollection(node.id)}
                                class="flex items-center gap-2 flex-1 text-left"
                                class:preset-filled-primary-500={selectedCollectionId === node.id}
                        >
                            <Folder class="size-4"/>
                            <span>{node.nom}</span>
                            <span class="opacity-60 ml-2">({formatNumber(node.partiesCount)})</span>
                        </button>
                    </TreeView.BranchText>
                    <CreationCollection
                            {handleToastSuccess}
                            label="Créer une sous-collection de {node.nom}"
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
                <button
                        onclick={() => handleSelectCollection(node.id)}
                        class="flex items-center gap-2 flex-1 text-left px-2 py-1 rounded hover:preset-tonal"
                        class:preset-filled-primary-500={selectedCollectionId === node.id}
                >
                    <Folder class="size-4"/>
                    <span>{node.nom}</span>
                    <span class="opacity-60 ml-2">({formatNumber(node.partiesCount)})</span>
                </button>
                <CreationCollection
                        {handleToastSuccess}
                        label="Créer une sous-collection de {node.nom}"
                        parentId={node.id}
                />
            </TreeView.Item>
        {/if}
    </TreeView.NodeProvider>
{/snippet}

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
