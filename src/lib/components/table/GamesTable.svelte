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
  import {Dialog, Portal} from '@skeletonlabs/skeleton-svelte';
  import {Trash2Icon, XIcon, FlaskConicalIcon} from '@lucide/svelte';
  import FlexRender from '$lib/components/table/FlexRender.svelte';
  import {columns} from '$lib/components/table/columns';
  import {invalidateAll} from '$app/navigation';

  type DataTableProps<GameRow, TValue> = {
    data: GameRow[];
    onDeleteSuccess?: (message: string) => void;
    onDeleteError?: (message: string) => void;
    onAnalysisToggleSuccess?: (message: string) => void;
    onAnalysisToggleError?: (message: string) => void;
  };
  const PAGE_SIZE = 20;

  let {data, onDeleteSuccess, onDeleteError, onAnalysisToggleSuccess, onAnalysisToggleError}: DataTableProps<GameRow, TValue> = $props();
  let pagination = $state<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
  let sorting = $state<SortingState>([]);
  let partieToDelete = $state<{ id: string, name: string } | null>(null);
  let isDeleting = $state(false);
  let togglingAnalysisIds = $state<Set<string>>(new Set());

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
        body: JSON.stringify({ isInAnalysis: !currentStatus }),
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
            {#each table.getRowModel().rows as row (row.id)}
                <tr class={row.id % 2 === 0 ? 'bg-surface-500' : ''}>
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
                        <div class="flex gap-2">
                            <button
                                    onclick={() => toggleAnalysis(row.original.id, row.original.isInAnalysis)}
                                    class="btn-icon btn-icon-sm {row.original.isInAnalysis ? 'preset-filled-primary-500' : 'hover:preset-filled-primary-500'}"
                                    title={row.original.isInAnalysis ? "Retirer de l'analyse" : "Ajouter à l'analyse"}
                                    aria-label={row.original.isInAnalysis ? "Retirer de l'analyse" : "Ajouter à l'analyse"}
                                    disabled={togglingAnalysisIds.has(row.original.id)}
                            >
                                <FlaskConicalIcon class="size-4"/>
                            </button>
                            <button
                                    onclick={() => openDeleteModal(row.original.id, row.original.whitePlayer, row.original.blackPlayer)}
                                    class="btn-icon btn-icon-sm hover:preset-filled-error-500"
                                    title="Supprimer cette partie"
                                    aria-label="Supprimer cette partie"
                            >
                                <Trash2Icon class="size-4"/>
                            </button>
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
