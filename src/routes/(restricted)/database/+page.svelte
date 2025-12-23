<script lang="ts">
  import {ChessQueen, Clock4, Database, Folder, FolderArchive, Hash, Plus, Star, Trash2} from '@lucide/svelte';
  import type { ComponentType } from 'svelte';
  import {Navigation} from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import ImportGame from "$lib/components/ImportGame.svelte";
  import type { CollectionWithGames, GameRow } from '$lib/types/chess.types';

  interface Props {
    data: {
      collections: CollectionWithGames[];
    };
  }

  let { data }: Props = $props();

  interface CollectionDisplay {
    id: string;
    label: string;
    href: string;
    value: number;
    icon: ComponentType;
  }

  const collectionsData: CollectionDisplay[] = data.collections.map((collection) => ({
    id: collection.id,
    label: collection.title,
    href: `#${collection.id}`,
    value: collection.games.length,
    icon: Folder
  }));

  let selectedCollectionId = $state<string | null>(collectionsData[0]?.id || null);

  const gamesData = $derived.by((): GameRow[] => {
    if (!selectedCollectionId) return [];
    
    const collection = data.collections.find((c) => c.id === selectedCollectionId);
    if (!collection) return [];

    return collection.games.map((cg) => ({
      whitePlayer: cg.game.whitePlayer,
      blackPlayer: cg.game.blackPlayer,
      tournament: cg.game.tournament || '?',
      date: cg.game.date ? new Date(cg.game.date).toLocaleDateString() : '?',
      whiteElo: cg.game.whiteElo || 0,
      blackElo: cg.game.blackElo || 0,
      result: cg.game.result || '*'
    }));
  });

  const selectedCollection = $derived<CollectionWithGames | undefined>(
    data.collections.find((c) => c.id === selectedCollectionId)
  );

  const anchorSidebar: string = 'btn hover:preset-tonal justify-between px-2 w-full flex items-center gap-2';
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
                    <button>
                        <Plus class="size-4 hover:preset-filled-primary-500"/>
                        <span class="sr-only">Ajouter une collection</span></button>
                </Navigation.Label>
                <Navigation.Menu class="w-full">
                    {#each collectionsData as collection (collection.id)}
                        {@const Icon = collection.icon}
                        <button
                                onclick={() => selectedCollectionId = collection.id}
                                class={anchorSidebar}
                                class:preset-filled-primary-500={selectedCollectionId === collection.id}
                                title={collection.label}
                                aria-label={collection.label}
                        >
							<span class="flex items-center gap-2">
								<Icon class="size-4"/>
                                {collection.label}
							</span>
                            <span class="opacity-60">{formatNumber(collection.value)}</span>
                        </button>
                    {/each}
                </Navigation.Menu>
            </Navigation.Group>

        </Navigation.Content>
    </Navigation>

    <div class="grow flex flex-col items-center bg-surface-900 overflow-auto">
        <div class="flex gap-4 items-center my-6">
            <h1 class="h2 text-primary-500">{selectedCollection?.title || 'Collection'}</h1>
            <p>{gamesData.length} résultat{gamesData.length > 1 ? 's' : ''}</p>
            <ImportGame/>
        </div>

        {#if gamesData.length > 0}
            <GamesTable data={gamesData}/>
        {:else}
            <div class="flex flex-col items-center justify-center h-64 gap-4">
                <p class="text-lg opacity-60">Aucune partie dans cette collection</p>
                <ImportGame/>
            </div>
        {/if}
    </div>

</div>
