<script generics="TData, TValue" lang="ts">
  import {
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type PaginationState,
    type SortingState
  } from '@tanstack/table-core';

  import {createSvelteTable} from '$lib/components/table/data-table.svelte';
  import PaginationOld from '$lib/components/table/PaginationOld.svelte';
  import {Dialog, Menu, Portal} from '@skeletonlabs/skeleton-svelte';
  import {EllipsisVertical, FlaskConicalIcon, PencilIcon, TagIcon, Trash2Icon, XIcon} from '@lucide/svelte';
  import FlexRender from '$lib/components/table/FlexRender.svelte';
  import {columns} from '$lib/components/table/columns';
  import {invalidateAll} from '$app/navigation';

  type DataTableProps<GameRow, TValue> = {
    data: GameRow[];
    availableTags: any[];
    onDeleteSuccess?: (message: string) => void;
    onDeleteError?: (message: string) => void;
    onAnalysisToggleSuccess?: (message: string) => void;
    onAnalysisToggleError?: (message: string) => void;
    onTagsUpdateSuccess?: (message: string) => void;
    onTagsUpdateError?: (message: string) => void;
  };

  const PAGE_SIZE = 20;

  let {
    data,
    availableTags,
    onDeleteSuccess,
    onDeleteError,
    onAnalysisToggleSuccess,
    onAnalysisToggleError,
    onTagsUpdateSuccess,
    onTagsUpdateError
  }: DataTableProps<GameRow, TValue> = $props();
  let pagination = $state<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
  let sorting = $state<SortingState>([]);
  let partieToDelete = $state<{ id: string, name: string } | null>(null);
  let isDeleting = $state(false);
  let togglingAnalysisIds = $state<Set<string>>(new Set());
  let partieForTags = $state<{ id: string, name: string } | null>(null);
  let selectedTagIds = $state<Set<string>>(new Set());
  let isUpdatingTags = $state(false);

  let partieToEdit = $state<{
    id: string;
    whitePlayer: string;
    blackPlayer: string;
    whiteElo: string;
    blackElo: string;
    tournament: string;
    date: string;
  } | null>(null);
  let isUpdatingMetadata = $state(false);

  let page = $state(1);
  const start = $derived((page - 1) * PAGE_SIZE);
  const end = $derived(start + PAGE_SIZE);

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    state: {
      get pagination() {
        return pagination;
      },
      get sorting() {
        return sorting;
      }
    },

    getSortedRowModel: getSortedRowModel(),
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },

    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        pagination = updater(pagination);
      } else {
        pagination = updater;
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  function openDeleteModal(id: string, whitePlayer: string, blackPlayer: string) {
    partieToDelete = {
      id,
      name: `${whitePlayer} vs ${blackPlayer}`
    };
  }

  function closeDeleteModal() {
    if (!isDeleting) {
      partieToDelete = null;
    }
  }

  async function confirmDelete() {
    if (!partieToDelete) return;

    isDeleting = true;

    try {
      const response = await fetch(`/api/parties/${partieToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }

      await invalidateAll();

      if (onDeleteSuccess) {
        onDeleteSuccess('Partie supprimée avec succès');
      }

      partieToDelete = null;
    } catch (error: any) {
      if (onDeleteError) {
        onDeleteError(error.message || 'Erreur lors de la suppression');
      }
    } finally {
      isDeleting = false;
    }
  }

  async function toggleAnalysis(id: string, currentStatus: boolean) {
    togglingAnalysisIds.add(id);
    togglingAnalysisIds = togglingAnalysisIds;

    try {
      const response = await fetch(`/api/parties/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({isInAnalysis: !currentStatus}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      await invalidateAll();

      if (onAnalysisToggleSuccess) {
        const message = !currentStatus
          ? 'Partie ajoutée à l\'analyse'
          : 'Partie retirée de l\'analyse';
        onAnalysisToggleSuccess(message);
      }
    } catch (error: any) {
      if (onAnalysisToggleError) {
        onAnalysisToggleError(error.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      togglingAnalysisIds.delete(id);
      togglingAnalysisIds = togglingAnalysisIds;
    }
  }

  function openTagsModal(id: string, whitePlayer: string, blackPlayer: string) {
    partieForTags = {
      id,
      name: `${whitePlayer} vs ${blackPlayer}`
    };

    const resultat = availableTags.filter(tag =>
      tag.parties.some(partie => partie.partieId === id)
    ).map(tag => tag.id);
    selectedTagIds = new Set(resultat);
  }

  function closeTagsModal() {
    if (!isUpdatingTags) {
      partieForTags = null;
      selectedTagIds = new Set();
    }
  }

  function toggleTag(tagId: string) {
    if (selectedTagIds.has(tagId)) {
      selectedTagIds.delete(tagId);
    } else {
      selectedTagIds.add(tagId);
    }
    selectedTagIds = selectedTagIds;
  }

  async function saveTags() {
    if (!partieForTags) return;

    isUpdatingTags = true;

    try {
      const response = await fetch(`/api/parties/${partieForTags.id}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({tagIds: Array.from(selectedTagIds)}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour des tags');
      }

      await invalidateAll();

      if (onTagsUpdateSuccess) {
        onTagsUpdateSuccess('Tags mis à jour avec succès');
      }

      partieForTags = null;
      selectedTagIds = new Set();
    } catch (error: any) {
      if (onTagsUpdateError) {
        onTagsUpdateError(error.message || 'Erreur lors de la mise à jour des tags');
      }
    } finally {
      isUpdatingTags = false;
    }
  }

  function openEditModal(row: any) {
    let dateValue = '';
    if (row.date) {
      const parts = row.date.split('/');
      if (parts.length === 3) {
        dateValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    partieToEdit = {
      id: row.id,
      whitePlayer: row.whitePlayer || '',
      blackPlayer: row.blackPlayer || '',
      whiteElo: row.whiteElo?.toString() || '',
      blackElo: row.blackElo?.toString() || '',
      tournament: row.tournament || '',
      date: dateValue,
    };
  }

  function closeEditModal() {
    if (!isUpdatingMetadata) {
      partieToEdit = null;
    }
  }

  async function saveMetadata() {
    if (!partieToEdit) return;

    isUpdatingMetadata = true;

    try {
      const dateValue = partieToEdit.date ? new Date(partieToEdit.date).toISOString() : null;

      const response = await fetch(`/api/parties/${partieToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blancNom: partieToEdit.whitePlayer || null,
          noirNom: partieToEdit.blackPlayer || null,
          blancElo: partieToEdit.whiteElo ? parseInt(partieToEdit.whiteElo) : null,
          noirElo: partieToEdit.blackElo ? parseInt(partieToEdit.blackElo) : null,
          event: partieToEdit.tournament || null,
          datePartie: dateValue,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      await invalidateAll();

      if (onDeleteSuccess) {
        onDeleteSuccess('Métadonnées mises à jour avec succès');
      }

      partieToEdit = null;
    } catch (error: any) {
      if (onDeleteError) {
        onDeleteError(error.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      isUpdatingMetadata = false;
    }
  }
</script>

<div class="table-container space-y-4">
    <div class="overflow-x-auto pl-0">
        <table class="md:table table-hover md:table-compact table-auto w-full text-xs">
            <thead>
            {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
                <tr>
                    {#each headerGroup.headers as header (header.id)}
                        <th>
                            {#if !header.isPlaceholder}
                                <FlexRender
                                        content={header.column.columnDef.header}
                                        context={header.getContext()}
                                />
                            {/if}
                        </th>
                    {/each}
                    <th>Actions</th>
                </tr>
            {/each}
            </thead>
            <tbody>
            {#each table.getRowModel().rows as row, index (row.id)}
                <tr class={index % 2 === 0 ? 'bg-surface-500' : ''}>
                    <td class="table-cell-fit">
                        {row.original.whitePlayer}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.whiteElo}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.blackPlayer}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.blackElo}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.result}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.date}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.tournament}
                    </td>
                    <td class="table-cell-fit">
                        {row.original.notation}
                    </td>
                    <td class="table-cell-fit">
                        <Menu>
                            <Menu.Trigger class="btn" title="Ouvrir les actions"
                                          aria-label="Ouvrir les actions">
                                <EllipsisVertical focusable="false" aria-hidden="true"/>
                                <span class="sr-only">Ouvrir les actions</span></Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.Item value="edit-metadata">
                                            <button
                                                    onclick={() => openEditModal(row.original)}
                                                    title="Éditer les métadonnées"
                                                    aria-label="Éditer les métadonnées"
                                            >
                                                <PencilIcon focusable="false" aria-hidden="true"
                                                            class="size-4 btn-icon btn-icon-sm"/>
                                                Éditer les métadonnées
                                            </button>
                                        </Menu.Item>
                                        <Menu.Item value="manage-tags">
                                            <button
                                                    onclick={() => openTagsModal(row.original.id, row.original.whitePlayer, row.original.blackPlayer)}
                                                    title="Gérer les tags"
                                                    aria-label="Gérer les tags"
                                            >
                                                <TagIcon class="size-4 btn-icon btn-icon-sm"/>
                                                Gérer les tags
                                            </button>
                                        </Menu.Item>
                                        <Menu.Item value="toggle-analysis">
                                            <button
                                                    onclick={() => toggleAnalysis(row.original.id, row.original.isInAnalysis)}
                                                    title={row.original.isInAnalysis ? "Retirer de l'analyse" : "Ajouter à l'analyse"}
                                                    aria-label={row.original.isInAnalysis ? "Retirer de l'analyse" : "Ajouter à l'analyse"}
                                                    disabled={togglingAnalysisIds.has(row.original.id)}
                                            >
                                                <FlaskConicalIcon focusable="false" aria-hidden="true"
                                                                  class="size-4 btn-icon btn-icon-sm"/>
                                                {row.original.isInAnalysis ? "Retirer de l'analyse" : "Ajouter à l'analyse"}
                                            </button>
                                        </Menu.Item>
                                        <Menu.Separator/>
                                        <Menu.Item value="delete-game">
                                            <button
                                                    onclick={() => openDeleteModal(row.original.id, row.original.whitePlayer, row.original.blackPlayer)}
                                                    title="Supprimer cette partie"
                                                    aria-label="Supprimer cette partie"
                                            >
                                                <Trash2Icon focusable="false" aria-hidden="true"
                                                            class="size-4 btn-icon btn-icon-sm"/>
                                                Supprimer la partie
                                            </button>
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu>
                        <div class="flex gap-2">


                        </div>
                    </td>
                </tr>
            {:else}
                <tr>
                    <td colspan={columns.length + 1} class="h-24 text-center">No results.</td>
                </tr>
            {/each}
            </tbody>
        </table>
        <footer class="flex justify-between">
            <div class="flex items-center justify-end space-x-2 py-4">

                <PaginationOld tableModel={table}/>

                <!--                <Pagination count={data.length} onPageChange={(event) => (page = event.page)} {page}-->
                <!--                            pageSize={PAGE_SIZE}>-->
                <!--                    <Pagination.PrevTrigger>-->
                <!--                        <ArrowLeftIcon class="size-4"/>-->
                <!--                    </Pagination.PrevTrigger>-->
                <!--                    <Pagination.Context>-->
                <!--                        {#snippet children(pagination)}-->
                <!--                            {#each pagination().pages as page, index (page)}-->
                <!--                                {#if page.type === 'page'}-->
                <!--                                    <Pagination.Item {...page}>-->
                <!--                                        {page.value}-->
                <!--                                    </Pagination.Item>-->
                <!--                                {:else}-->
                <!--                                    <Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>-->
                <!--                                {/if}-->
                <!--                            {/each}-->
                <!--                        {/snippet}-->
                <!--                    </Pagination.Context>-->
                <!--                    <Pagination.NextTrigger>-->
                <!--                        <ArrowRightIcon class="size-4"/>-->
                <!--                    </Pagination.NextTrigger>-->
                <!--                </Pagination>-->
            </div>
        </footer>
    </div>
</div>

{#if partieForTags}
    <Dialog open={partieForTags !== null}>
        <Portal>
            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={closeTagsModal}/>
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
                    <header class="flex justify-between items-center">
                        <Dialog.Title class="text-lg font-bold">Gérer les tags</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeTagsModal}
                                             disabled={isUpdatingTags}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>Sélectionnez les tags pour :</p>
                        <p class="font-semibold text-primary-500">{partieForTags.name}</p>

                        <div class="space-y-2 mt-4 max-h-64 overflow-y-auto">
                            {#if availableTags.length === 0}
                                <p class="text-sm opacity-60">Aucun tag disponible. Créez-en un d'abord.</p>
                            {:else}
                                {#each availableTags as tag (tag.id)}
                                    <label class="flex items-center gap-2 p-2 rounded hover:preset-tonal cursor-pointer">
                                        <input
                                                type="checkbox"
                                                class="checkbox"
                                                checked={selectedTagIds.has(tag.id)}
                                                onchange={() => toggleTag(tag.id)}
                                                disabled={isUpdatingTags}
                                        />
                                        <span>{tag.nom}</span>
                                    </label>
                                {/each}
                            {/if}
                        </div>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeTagsModal}
                                disabled={isUpdatingTags}
                        >
                            Annuler
                        </button>
                        <button
                                class="btn preset-filled-primary-500"
                                onclick={saveTags}
                                disabled={isUpdatingTags}
                        >
                            {isUpdatingTags ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog>
{/if}

{#if partieToEdit}
    <Dialog open={partieToEdit !== null}>
        <Portal>
            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={closeEditModal}/>
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
                    <header class="flex justify-between items-center">
                        <Dialog.Title class="text-lg font-bold">Éditer les métadonnées</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeEditModal}
                                             disabled={isUpdatingMetadata}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-4">
                        <div class="space-y-2">
                            <label class="label" for="whitePlayer">
                                <span>Joueur blanc</span>
                                <input
                                        id="whitePlayer"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.whitePlayer}
                                        disabled={isUpdatingMetadata}
                                        placeholder="Nom du joueur blanc"
                                />
                            </label>

                            <label class="label" for="whiteElo">
                                <span>ELO blanc</span>
                                <input
                                        id="whiteElo"
                                        type="number"
                                        class="input"
                                        bind:value={partieToEdit.whiteElo}
                                        disabled={isUpdatingMetadata}
                                        placeholder="ELO du joueur blanc"
                                />
                            </label>

                            <label class="label" for="blackPlayer">
                                <span>Joueur noir</span>
                                <input
                                        id="blackPlayer"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.blackPlayer}
                                        disabled={isUpdatingMetadata}
                                        placeholder="Nom du joueur noir"
                                />
                            </label>

                            <label class="label" for="blackElo">
                                <span>ELO noir</span>
                                <input
                                        id="blackElo"
                                        type="number"
                                        class="input"
                                        bind:value={partieToEdit.blackElo}
                                        disabled={isUpdatingMetadata}
                                        placeholder="ELO du joueur noir"
                                />
                            </label>

                            <label class="label" for="tournament">
                                <span>Tournoi</span>
                                <input
                                        id="tournament"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.tournament}
                                        disabled={isUpdatingMetadata}
                                        placeholder="Nom du tournoi"
                                />
                            </label>

                            <label class="label" for="date">
                                <span>Date</span>
                                <input
                                        id="date"
                                        type="date"
                                        class="input"
                                        bind:value={partieToEdit.date}
                                        disabled={isUpdatingMetadata}
                                />
                            </label>
                        </div>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeEditModal}
                                disabled={isUpdatingMetadata}
                        >
                            Annuler
                        </button>
                        <button
                                class="btn preset-filled-primary-500"
                                onclick={saveMetadata}
                                disabled={isUpdatingMetadata}
                        >
                            {isUpdatingMetadata ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog>
{/if}

{#if partieToDelete}
    <Dialog open={partieToDelete !== null}>
        <Portal>
            <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" onclick={closeDeleteModal}/>
            <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                <Dialog.Content class="card bg-surface-100-900 w-full max-w-md p-4 space-y-4 shadow-xl">
                    <header class="flex justify-between items-center">
                        <Dialog.Title class="text-lg font-bold">Confirmer la suppression</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeDeleteModal}
                                             disabled={isDeleting}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>Êtes-vous sûr de vouloir supprimer la partie :</p>
                        <p class="font-semibold text-primary-500">{partieToDelete.name}</p>
                        <p class="text-sm opacity-75">Cette action est irréversible.</p>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeDeleteModal}
                                disabled={isDeleting}
                        >
                            Annuler
                        </button>
                        <button
                                class="btn preset-filled-error-500"
                                onclick={confirmDelete}
                                disabled={isDeleting}
                        >
                            {isDeleting ? 'Suppression...' : 'Supprimer'}
                        </button>
                    </footer>
                </Dialog.Content>
            </Dialog.Positioner>
        </Portal>
    </Dialog>
{/if}
