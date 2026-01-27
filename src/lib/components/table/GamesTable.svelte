<script generics="TData, TValue" lang="ts">
  import {
    type ColumnFiltersState,
    getCoreRowModel,
    type PaginationState,
    type SortingState
  } from '@tanstack/table-core';

  import {createSvelteTable} from '$lib/components/table/data-table.svelte';
  import PaginationOld from '$lib/components/table/PaginationOld.svelte';
  import {Dialog, Menu, Portal} from '@skeletonlabs/skeleton-svelte';
  import {
    EllipsisVertical,
    FlaskConicalIcon,
    Loader2,
    PencilIcon,
    RotateCcw,
    TagIcon,
    Trash2Icon,
    XIcon
  } from '@lucide/svelte';
  import FlexRender from '$lib/components/table/FlexRender.svelte';
  import {columns} from '$lib/components/table/columns';
  import {invalidateAll} from '$app/navigation';
  import {_} from '$lib/i18n';

  type DataTableProps<GameRow, TValue> = {
    collectionId?: string | null;
    tagId?: string | null;
    isInAnalysis?: boolean;
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
    collectionId = null,
    tagId = null,
    isInAnalysis = false,
    availableTags,
    onDeleteSuccess,
    onDeleteError,
    onAnalysisToggleSuccess,
    onAnalysisToggleError,
    onTagsUpdateSuccess,
    onTagsUpdateError
  }: DataTableProps<GameRow, TValue> = $props();

  let data = $state<any[]>([]);
  let total = $state(0);
  let isLoading = $state(false);
  let pagination = $state<PaginationState>({pageIndex: 0, pageSize: PAGE_SIZE});
  let sorting = $state<SortingState>([]);
  let columnFilters = $state<ColumnFiltersState>([]);
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

  const table = createSvelteTable({
    get data() {
      return data;
    },
    get columns() {
      return $columns;
    },
    state: {
      get pagination() {
        return pagination;
      },
      get sorting() {
        return sorting;
      },
      get columnFilters() {
        return columnFilters;
      }
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    get pageCount() {
      return Math.ceil(total / PAGE_SIZE);
    },
    onSortingChange: (updater) => {
      if (typeof updater === 'function') {
        sorting = updater(sorting);
      } else {
        sorting = updater;
      }
    },
    onColumnFiltersChange: (updater) => {
      if (typeof updater === 'function') {
        columnFilters = updater(columnFilters);
      } else {
        columnFilters = updater;
      }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        pagination = updater(pagination);
      } else {
        pagination = updater;
      }
    },
    getCoreRowModel: getCoreRowModel()
  });

  function resetFiltersAndSorts() {
    columnFilters = [];
    sorting = [];
    pagination = {pageIndex: 0, pageSize: PAGE_SIZE};
  }

  async function fetchData() {
    isLoading = true;

    try {
      const params = new URLSearchParams();
      params.set('page', (pagination.pageIndex + 1).toString());
      params.set('pageSize', pagination.pageSize.toString());

      if (collectionId) params.set('collectionId', collectionId);
      if (tagId) params.set('tagId', tagId);
      if (isInAnalysis) params.set('isInAnalysis', 'true');

      if (sorting.length > 0) {
        params.set('sortBy', sorting[0].id);
        params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
      }

      for (const filter of columnFilters) {
        if (filter.id === 'whiteElo' && filter.value) {
          if (filter.value.min) params.set('whiteEloMin', filter.value.min.toString());
          if (filter.value.max) params.set('whiteEloMax', filter.value.max.toString());
        } else if (filter.id === 'blackElo' && filter.value) {
          if (filter.value.min) params.set('blackEloMin', filter.value.min.toString());
          if (filter.value.max) params.set('blackEloMax', filter.value.max.toString());
        } else if (filter.id === 'date' && filter.value) {
          if (filter.value.min) params.set('dateMin', filter.value.min);
          if (filter.value.max) params.set('dateMax', filter.value.max);
        } else if (filter.id === 'whitePlayer' && filter.value) {
          params.set('whitePlayer', filter.value.toString());
        } else if (filter.id === 'blackPlayer' && filter.value) {
          params.set('blackPlayer', filter.value.toString());
        } else if (filter.id === 'tournament' && filter.value) {
          params.set('tournament', filter.value.toString());
        } else if (filter.id === 'result' && filter.value) {
          let resultValue = filter.value.toString();
          if (resultValue === '1-0') resultValue = 'BLANCS';
          else if (resultValue === '0-1') resultValue = 'NOIRS';
          else if (resultValue === '½-½') resultValue = 'NULLE';
          params.set('result', resultValue);
        }
      }

      const response = await fetch(`/api/parties?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch parties');
      }

      const result = await response.json();
      data = result.data;
      total = result.total;
    } catch (error) {
      console.error('Error fetching parties:', error);
      data = [];
      total = 0;
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    fetchData();
  });

  $effect(() => {
    pagination.pageIndex;
    sorting;
    columnFilters;
    collectionId;
    tagId;
    isInAnalysis;
    fetchData();
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
        throw new Error(error.message || $_('database.games.deleteError'));
      }

      await fetchData();
      await invalidateAll();

      if (onDeleteSuccess) {
        onDeleteSuccess($_('database.games.deleteSuccess'));
      }

      partieToDelete = null;
    } catch (error: any) {
      if (onDeleteError) {
        onDeleteError(error.message || $_('database.games.deleteError'));
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
        throw new Error(error.message || $_('database.table.updateError'));
      }

      await fetchData();
      await invalidateAll();

      if (onAnalysisToggleSuccess) {
        const message = !currentStatus
          ? $_('database.table.addedToAnalysis')
          : $_('database.table.removedFromAnalysis');
        onAnalysisToggleSuccess(message);
      }
    } catch (error: any) {
      if (onAnalysisToggleError) {
        onAnalysisToggleError(error.message || $_('database.table.updateError'));
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
        throw new Error(error.message || $_('database.table.tagsUpdateError'));
      }

      await fetchData();
      await invalidateAll();

      if (onTagsUpdateSuccess) {
        onTagsUpdateSuccess($_('database.table.tagsUpdateSuccess'));
      }

      partieForTags = null;
      selectedTagIds = new Set();
    } catch (error: any) {
      if (onTagsUpdateError) {
        onTagsUpdateError(error.message || $_('database.table.tagsUpdateError'));
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
        throw new Error(error.message || $_('database.table.updateError'));
      }

      await fetchData();
      await invalidateAll();

      if (onDeleteSuccess) {
        onDeleteSuccess($_('database.table.metadataUpdateSuccess'));
      }

      partieToEdit = null;
    } catch (error: any) {
      if (onDeleteError) {
        onDeleteError(error.message || $_('database.table.updateError'));
      }
    } finally {
      isUpdatingMetadata = false;
    }
  }
</script>

<div class="max-w-4/5 table-container space-y-4">
    <div class="flex justify-between items-center mb-2">
        <button
                class="btn btn-sm preset-tonal flex items-center gap-2"
                disabled={isLoading || (columnFilters.length === 0 && sorting.length === 0)}
                onclick={resetFiltersAndSorts}
                title={$_('database.table.resetFilters')}
        >
            <RotateCcw class="size-4"/>
            {$_('database.table.resetFilters')}
        </button>
        {#if columnFilters.length > 0 || sorting.length > 0}
            <span class="text-xs opacity-60">
                {columnFilters.length} {$_('database.table.activeFilters')}
                · {sorting.length} {$_('database.table.activeSorts')}
            </span>
        {/if}
    </div>

    {#if isLoading}
        <div class="flex justify-center items-center py-8">
            <Loader2 class="size-8 animate-spin text-primary-500"/>
        </div>
    {/if}

    <div class="overflow-x-auto pl-0" class:opacity-50={isLoading}>
        <table class="md:table table-hover md:table-compact text-xs">
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
                    <th>{$_('database.table.actions')}</th>
                </tr>
                <tr>
                    {#each headerGroup.headers as header (header.id)}
                        <th>
                            {#if header.column.getCanFilter()}
                                {#if header.column.id === 'whiteElo' || header.column.id === 'blackElo'}
                                    <div class="flex flex-col gap-1">
                                        <input
                                                type="number"
                                                class="input input-sm w-full text-xs"
                                                value={header.column.getFilterValue()?.min ?? ''}
                                                onchange={(e) => {
                                                    const currentValue = header.column.getFilterValue() || {};
                                                    header.column.setFilterValue({
                                                        ...currentValue,
                                                        min: e.currentTarget.value ? parseInt(e.currentTarget.value) : undefined
                                                    });
                                                }}
                                                placeholder={$_('database.table.min')}
                                                disabled={isLoading}
                                        />
                                        <input
                                                type="number"
                                                class="input input-sm w-full text-xs"
                                                value={header.column.getFilterValue()?.max ?? ''}
                                                onchange={(e) => {
                                                    const currentValue = header.column.getFilterValue() || {};
                                                    header.column.setFilterValue({
                                                        ...currentValue,
                                                        max: e.currentTarget.value ? parseInt(e.currentTarget.value) : undefined
                                                    });
                                                }}
                                                placeholder={$_('database.table.max')}
                                                disabled={isLoading}
                                        />
                                    </div>
                                {:else if header.column.id === 'date'}
                                    <div class="flex flex-col gap-1">
                                        <input
                                                type="date"
                                                class="input input-sm w-full text-xs"
                                                value={header.column.getFilterValue()?.min ?? ''}
                                                oninput={(e) => {
                                                    const currentValue = header.column.getFilterValue() || {};
                                                    header.column.setFilterValue({
                                                        ...currentValue,
                                                        min: e.currentTarget.value || undefined
                                                    });
                                                }}
                                                disabled={isLoading}
                                        />
                                        <input
                                                type="date"
                                                class="input input-sm w-full text-xs"
                                                value={header.column.getFilterValue()?.max ?? ''}
                                                oninput={(e) => {
                                                    const currentValue = header.column.getFilterValue() || {};
                                                    header.column.setFilterValue({
                                                        ...currentValue,
                                                        max: e.currentTarget.value || undefined
                                                    });
                                                }}
                                                disabled={isLoading}
                                        />
                                    </div>
                                {:else if header.column.id === 'result'}
                                    <select
                                            class="select select-sm w-full text-xs"
                                            value={header.column.getFilterValue() ?? ''}
                                            onchange={(e) => header.column.setFilterValue(e.currentTarget.value || undefined)}
                                            disabled={isLoading}
                                    >
                                        <option value="">{$_('database.table.all')}</option>
                                        <option value="1-0">1-0</option>
                                        <option value="0-1">0-1</option>
                                        <option value="½-½">½-½</option>
                                    </select>
                                {:else}
                                    <input
                                            type="text"
                                            class="input input-sm w-full text-xs"
                                            value={header.column.getFilterValue() ?? ''}
                                            oninput={(e) => header.column.setFilterValue(e.currentTarget.value)}
                                            placeholder={`${$_('common.actions.filter')}...`}
                                            disabled={isLoading}
                                    />
                                {/if}
                            {/if}
                        </th>
                    {/each}
                    <th></th>
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
                            <Menu.Trigger class="btn" title={$_('database.table.openActions')}
                                          aria-label={$_('database.table.openActions')}>
                                <EllipsisVertical focusable="false" aria-hidden="true"/>
                                <span class="sr-only">{$_('database.table.openActions')}</span></Menu.Trigger>
                            <Portal>
                                <Menu.Positioner>
                                    <Menu.Content>
                                        <Menu.Item value="edit-metadata">
                                            <button
                                                    onclick={() => openEditModal(row.original)}
                                                    title={$_('database.table.editMetadata')}
                                                    aria-label={$_('database.table.editMetadata')}
                                            >
                                                <PencilIcon focusable="false" aria-hidden="true"
                                                            class="size-4 btn-icon btn-icon-sm"/>
                                                {$_('database.table.editMetadata')}
                                            </button>
                                        </Menu.Item>
                                        <Menu.Item value="manage-tags">
                                            <button
                                                    onclick={() => openTagsModal(row.original.id, row.original.whitePlayer, row.original.blackPlayer)}
                                                    title={$_('database.table.manageTags')}
                                                    aria-label={$_('database.table.manageTags')}
                                            >
                                                <TagIcon class="size-4 btn-icon btn-icon-sm"/>
                                                {$_('database.table.manageTags')}
                                            </button>
                                        </Menu.Item>
                                        <Menu.Item value="toggle-analysis">
                                            <button
                                                    onclick={() => toggleAnalysis(row.original.id, row.original.isInAnalysis)}
                                                    title={row.original.isInAnalysis ? $_('database.analysis.removeFromAnalysis') : $_('database.analysis.addToAnalysis')}
                                                    aria-label={row.original.isInAnalysis ? $_('database.analysis.removeFromAnalysis') : $_('database.analysis.addToAnalysis')}
                                                    disabled={togglingAnalysisIds.has(row.original.id)}
                                            >
                                                <FlaskConicalIcon focusable="false" aria-hidden="true"
                                                                  class="size-4 btn-icon btn-icon-sm"/>
                                                {row.original.isInAnalysis ? $_('database.analysis.removeFromAnalysis') : $_('database.analysis.addToAnalysis')}
                                            </button>
                                        </Menu.Item>
                                        <Menu.Separator/>
                                        <Menu.Item value="delete-game">
                                            <button
                                                    onclick={() => openDeleteModal(row.original.id, row.original.whitePlayer, row.original.blackPlayer)}
                                                    title={$_('database.table.deleteGame')}
                                                    aria-label={$_('database.table.deleteGame')}
                                            >
                                                <Trash2Icon focusable="false" aria-hidden="true"
                                                            class="size-4 btn-icon btn-icon-sm"/>
                                                {$_('database.table.deleteGame')}
                                            </button>
                                        </Menu.Item>
                                    </Menu.Content>
                                </Menu.Positioner>
                            </Portal>
                        </Menu>
                    </td>
                </tr>
            {:else}
                <tr>
                    <td colspan={$columns.length + 1} class="h-24 text-center">
                        {#if isLoading}
                            {$_('database.table.loading')}
                        {:else}
                            {$_('database.table.noResults')}
                        {/if}
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
        <footer class="flex justify-between">
            <div class="flex items-center justify-end space-x-2 py-4">
                <PaginationOld tableModel={table}/>
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
                        <Dialog.Title class="text-lg font-bold">{$_('database.table.manageTags')}</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeTagsModal}
                                             disabled={isUpdatingTags}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>{$_('database.table.selectTagsFor')}</p>
                        <p class="font-semibold text-primary-500">{partieForTags.name}</p>

                        <div class="space-y-2 mt-4 max-h-64 overflow-y-auto">
                            {#if availableTags.length === 0}
                                <p class="text-sm opacity-60">{$_('database.table.noTagsAvailable')}</p>
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
                            {$_('common.actions.cancel')}
                        </button>
                        <button
                                class="btn preset-filled-primary-500"
                                onclick={saveTags}
                                disabled={isUpdatingTags}
                        >
                            {isUpdatingTags ? $_('common.messages.saving') : $_('common.actions.save')}
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
                        <Dialog.Title class="text-lg font-bold">{$_('database.table.editMetadata')}</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeEditModal}
                                             disabled={isUpdatingMetadata}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-4">
                        <div class="space-y-2">
                            <label class="label" for="whitePlayer">
                                <span>{$_('database.table.whitePlayer')}</span>
                                <input
                                        id="whitePlayer"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.whitePlayer}
                                        disabled={isUpdatingMetadata}
                                        placeholder={$_('database.table.whitePlayerName')}
                                />
                            </label>

                            <label class="label" for="whiteElo">
                                <span>{$_('database.table.whiteElo')}</span>
                                <input
                                        id="whiteElo"
                                        type="number"
                                        class="input"
                                        bind:value={partieToEdit.whiteElo}
                                        disabled={isUpdatingMetadata}
                                        placeholder={$_('database.table.whitePlayerElo')}
                                />
                            </label>

                            <label class="label" for="blackPlayer">
                                <span>{$_('database.table.blackPlayer')}</span>
                                <input
                                        id="blackPlayer"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.blackPlayer}
                                        disabled={isUpdatingMetadata}
                                        placeholder={$_('database.table.blackPlayerName')}
                                />
                            </label>

                            <label class="label" for="blackElo">
                                <span>{$_('database.table.blackElo')}</span>
                                <input
                                        id="blackElo"
                                        type="number"
                                        class="input"
                                        bind:value={partieToEdit.blackElo}
                                        disabled={isUpdatingMetadata}
                                        placeholder={$_('database.table.blackPlayerElo')}
                                />
                            </label>

                            <label class="label" for="tournament">
                                <span>{$_('database.table.tournament')}</span>
                                <input
                                        id="tournament"
                                        type="text"
                                        class="input"
                                        bind:value={partieToEdit.tournament}
                                        disabled={isUpdatingMetadata}
                                        placeholder={$_('database.table.tournamentName')}
                                />
                            </label>

                            <label class="label" for="date">
                                <span>{$_('database.table.date')}</span>
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
                            {$_('common.actions.cancel')}
                        </button>
                        <button
                                class="btn preset-filled-primary-500"
                                onclick={saveMetadata}
                                disabled={isUpdatingMetadata}
                        >
                            {isUpdatingMetadata ? $_('common.messages.saving') : $_('common.actions.save')}
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
                        <Dialog.Title class="text-lg font-bold">{$_('database.table.confirmDelete')}</Dialog.Title>
                        <Dialog.CloseTrigger class="btn-icon hover:preset-tonal" onclick={closeDeleteModal}
                                             disabled={isDeleting}>
                            <XIcon class="size-4"/>
                        </Dialog.CloseTrigger>
                    </header>

                    <Dialog.Description class="space-y-2">
                        <p>{$_('database.table.deleteGameWarning')}</p>
                        <p class="font-semibold text-primary-500">{partieToDelete.name}</p>
                        <p class="text-sm opacity-75">{$_('database.table.irreversible')}</p>
                    </Dialog.Description>

                    <footer class="flex justify-end gap-2">
                        <button
                                class="btn preset-tonal"
                                onclick={closeDeleteModal}
                                disabled={isDeleting}
                        >
                            {$_('common.actions.cancel')}
                        </button>
                        <button
                                class="btn preset-filled-error-500"
                                onclick={confirmDelete}
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
