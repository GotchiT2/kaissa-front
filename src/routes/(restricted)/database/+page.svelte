<script lang="ts">
  import {ChessQueen, Database, Folder} from '@lucide/svelte';
  import {createToaster, createTreeViewCollection, Navigation, Toast, TreeView} from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import ImportGame from "$lib/components/ImportGame.svelte";
  import type {CollectionWithGames, GameRow} from '$lib/types/chess.types';
  import CreationCollection from "$lib/components/modales/CreationCollection.svelte";

  interface Props {
    data: {
      collections: CollectionWithGames[];
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

  function handleToastSuccess(message: string) {
    toaster.success({title: 'Succès', description: message});
  }

  function handleSelectCollection(id: string) {
    selectedCollectionId = id;
  }
</script>

<div class="flex h-[90vh] w-full">
    <Navigation
            class="w-auto h-full bg-[#121212] flex flex-col gap-4"
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

        </Navigation.Content>
    </Navigation>

    <div class="grow flex flex-col items-center bg-surface-900 overflow-auto">
        <div class="flex gap-4 items-center my-6">
            <h1 class="h2 text-primary-500">{selectedCollection?.nom || 'Collection'}</h1>
            <p>{gamesData.length} résultat{gamesData.length > 1 ? 's' : ''}</p>
            <ImportGame
                    collectionId={selectedCollectionId || ''}
                    onError={(message) => toaster.error({ title: 'Erreur', description: message })}
                    onSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
            />
        </div>

        {#if gamesData.length > 0}
            <GamesTable
                    data={gamesData}
                    onDeleteSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                    onDeleteError={(message) => toaster.error({ title: 'Erreur', description: message })}
                    onAnalysisToggleSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                    onAnalysisToggleError={(message) => toaster.error({ title: 'Erreur', description: message })}
            />
        {:else}
            <div class="flex flex-col items-center justify-center h-64 gap-4">
                <p class="text-lg opacity-60">Aucune partie dans cette collection</p>
                <ImportGame
                        collectionId={selectedCollectionId || ''}
                        onSuccess={(message) => toaster.success({ title: 'Succès', description: message })}
                        onError={(message) => toaster.error({ title: 'Erreur', description: message })}
                />
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
