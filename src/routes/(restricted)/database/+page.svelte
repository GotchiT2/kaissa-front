<script lang="ts">
  import {ChessQueen, Database, Folder, Plus, XIcon} from '@lucide/svelte';
  import type {ComponentType} from 'svelte';
  import {createToaster, Dialog, Navigation, Portal, Toast} from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import ImportGame from "$lib/components/ImportGame.svelte";
  import type {CollectionGame, CollectionWithGames, GameRow} from '$lib/types/chess.types';
  import {invalidateAll} from '$app/navigation';

  interface Props {
    data: {
      collections: CollectionWithGames[];
    };
  }

  let {data}: Props = $props();

  let collectionName = $state('');
  let isSubmitting = $state(false);
  let errorMessage = $state('');

  const toaster = createToaster();

  async function handleCreateCollection() {
    errorMessage = '';

    if (!collectionName.trim()) {
      errorMessage = 'Le nom de la collection est requis';
      return;
    }

    if (collectionName.trim().length > 100) {
      errorMessage = 'Le nom de la collection ne peut pas dépasser 100 caractères';
      return;
    }

    isSubmitting = true;

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({nom: collectionName.trim()}),
      });

      if (!response.ok) {
        const error = await response.json();
        errorMessage = error.message || 'Erreur lors de la création de la collection';
        return;
      }

      toaster.success({
        title: 'Succès',
        description: 'Collection créée avec succès',
      })

      dialogOpen = false;
      collectionName = '';
      await invalidateAll();
    } catch (err) {
      errorMessage = 'Erreur lors de la création de la collection';
    } finally {
      isSubmitting = false;
    }
  }

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

    return collection.parties.map((partie: CollectionGame) => ({
      whitePlayer: partie.game.whitePlayer || '?',
      blackPlayer: partie.game.blackPlayer || '?',
      tournament: partie.game.tournament || '?',
      date: partie.game.date ? new Date(partie.game.date).toLocaleDateString() : '?',
      whiteElo: partie.game.whiteElo || 0,
      blackElo: partie.game.blackElo || 0,
      result: partie.game.result || 'INCONNU'
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
                    <Dialog>
                        <Dialog.Trigger class="btn preset-filled">
                            <Plus class="size-4 hover:preset-filled-primary-500"/>
                            <span class="sr-only">Ajouter une collection</span></Dialog.Trigger>
                        <Portal>
                            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50"/>
                            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                                <Dialog.Content
                                        class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl">
                                    <header class="flex justify-between items-center">
                                        <Dialog.Title class="text-lg font-bold">Créer une nouvelle collection
                                        </Dialog.Title>
                                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                                            <XIcon class="size-4"/>
                                        </Dialog.CloseTrigger>
                                    </header>

                                    <form class="space-y-4"
                                          onsubmit={(e) => { e.preventDefault(); handleCreateCollection(); }}>
                                        <div>
                                            <label class="block text-sm font-medium mb-2" for="collection-name">
                                                Nom de la collection
                                            </label>
                                            <input
                                                    bind:value={collectionName}
                                                    class="input w-full"
                                                    disabled={isSubmitting}
                                                    id="collection-name"
                                                    maxlength="100"
                                                    placeholder="Ex: Mes parties de tournoi"
                                                    required
                                                    type="text"
                                            />
                                            {#if errorMessage}
                                                <p class="text-error-500 text-sm mt-2">{errorMessage}</p>
                                            {/if}
                                        </div>

                                        <Dialog.CloseTrigger class="btn preset-tonal">Annuler</Dialog.CloseTrigger>
                                        <button
                                                class="btn preset-filled-primary-500"
                                                disabled={isSubmitting}
                                                type="submit"
                                        >
                                            {isSubmitting ? 'Création...' : 'Créer'}
                                        </button>
                                    </form>
                                </Dialog.Content>
                            </Dialog.Positioner>
                        </Portal>
                    </Dialog>

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
