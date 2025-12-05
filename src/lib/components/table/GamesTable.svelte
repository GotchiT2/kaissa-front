<script generics="TData, TValue" lang="ts">
	import {
		getCoreRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type PaginationState,
		type SortingState
	} from '@tanstack/table-core';

	import { createSvelteTable } from '$lib/components/table/data-table.svelte';
	import PaginationOld from '$lib/components/table/PaginationOld.svelte';
	import { Pagination } from '@skeletonlabs/skeleton-svelte';
	import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
	import FlexRender from '$lib/components/table/FlexRender.svelte';
	import { columns } from '$lib/components/table/columns';

	type DataTableProps<GameRow, TValue> = {
		// columns: ColumnDef<TData, TValue>[];
		data: GameRow[];
	};
	const PAGE_SIZE = 20;

	let { data }: DataTableProps<GameRow, TValue> = $props();
	let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });
	let sorting = $state<SortingState>([]);

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
				</tr>
			{/each}
			</thead>
			<tbody>
			{#each table.getRowModel().rows as row (row.id)}
				<tr class={row.id % 2 === 0 ? 'preset-filled-primary-500' : ''}>
					<td class="table-cell-fit">
						{row.original.white}
					</td>
					<td class="table-cell-fit">
						{row.original.whiteElo}
					</td>
					<td class="table-cell-fit">
						{row.original.black}
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
				</tr>
			{:else}
				<tr>
					<td colspan={columns.length} class="h-24 text-center">No results.</td>
				</tr>
			{/each}
			</tbody>
		</table>
		<footer class="flex justify-between">
			<div class="flex items-center justify-end space-x-2 py-4">

				<PaginationOld tableModel={table} />

				<Pagination count={data.length} onPageChange={(event) => (page = event.page)} {page} pageSize={PAGE_SIZE}>
					<Pagination.PrevTrigger>
						<ArrowLeftIcon class="size-4" />
					</Pagination.PrevTrigger>
					<Pagination.Context>
						{#snippet children(pagination)}
							{#each pagination().pages as page, index (page)}
								{#if page.type === 'page'}
									<Pagination.Item {...page}>
										{page.value}
									</Pagination.Item>
								{:else}
									<Pagination.Ellipsis {index}>&#8230;</Pagination.Ellipsis>
								{/if}
							{/each}
						{/snippet}
					</Pagination.Context>
					<Pagination.NextTrigger>
						<ArrowRightIcon class="size-4" />
					</Pagination.NextTrigger>
				</Pagination>
			</div>
		</footer>
	</div>
</div>