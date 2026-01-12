<script lang="ts">
  import {ChessQueen, Database, Folder} from '@lucide/svelte';
  import type {ComponentType} from 'svelte';
  import {createToaster, Navigation, Toast} from '@skeletonlabs/skeleton-svelte';
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

  interface CollectionDisplay {
    id: string;
    label: string;
    href: string;
    value: number;
    icon: ComponentType;
  }

  const collectionsData: CollectionDisplay[] = data.collections.map((collection) => ({
    id: collection.id,
    label: collection.nom,
    href: `#${collection.id}`,
    value: collection.parties.length || 0,
    icon: Folder
  }));

  let selectedCollectionId = $state<string | null>(collectionsData[0]?.id || null);

  const gamesData = $derived.by((): GameRow[] => {
    if (!selectedCollectionId) return [];

    const collection = data.collections.find((c) => c.id === selectedCollectionId);
    if (!collection || !collection.parties) return [];

    return collection.parties.map((partie: any) => ({
      whitePlayer: partie.blancNom || '?',
      blackPlayer: partie.noirNom || '?',
      tournament: partie.event || '?',
      date: partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : '?',
      whiteElo: partie.blancElo || 0,
      blackElo: partie.noirElo || 0,
      result: partie.resultat || 'INCONNU'
    }));
  });

  const selectedCollection = $derived<CollectionWithGames | undefined>(
    data.collections.find((c) => c.id === selectedCollectionId)
  );

  function handleToastSuccess(message: string) {
    toaster.success({title: 'Succès', description: message});
  }

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
                    <CreationCollection {handleToastSuccess} label="Créer une collection"/>
                </Navigation.Label>
                <Navigation.Menu class="w-full">
                    {#each collectionsData as collection (collection.id)}
                        {@const Icon = collection.icon}
                        <div class="flex items-center gap-1 w-full">
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
                            <CreationCollection {handleToastSuccess}
                                                label="Créer une sous-collection de {collection.label}"
                                                parentId={collection.id}/>
                        </div>
                    {/each}
                </Navigation.Menu>
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
            <GamesTable data={gamesData}/>
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
