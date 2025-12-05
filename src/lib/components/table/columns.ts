import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/table/render-helpers';
import ColumnSortButton from '$lib/components/table/ColumnSortButton.svelte';

export const columns: ColumnDef<GameRow>[] = [
	{
		accessorKey: 'white',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Blanc',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false); // Set to ascending
					} else if (currentSort === 'asc') {
						column.toggleSorting(true); // Set to descending
					} else {
						column.clearSorting(); // Clear sorting (back to unsorted)
					}
				}
			}),
		cell: (info) => info.getValue()
	},
	{
		accessorKey: 'whiteElo',
		header: 'Elo'
	},
	{
		accessorKey: 'black',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Noir',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false); // Set to ascending
					} else if (currentSort === 'asc') {
						column.toggleSorting(true); // Set to descending
					} else {
						column.clearSorting(); // Clear sorting (back to unsorted)
					}
				}
			})
	},
	{
		accessorKey: 'blackElo',
		header: 'Elo'
	},
	{
		accessorKey: 'result',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Rés.',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false); // Set to ascending
					} else if (currentSort === 'asc') {
						column.toggleSorting(true); // Set to descending
					} else {
						column.clearSorting(); // Clear sorting (back to unsorted)
					}
				}
			})
	},
	{
		accessorKey: 'date',
		header: 'Date'
	},
	{
		accessorKey: 'tournament',
		header: 'Tournoi',
		cell: (info) => info.getValue()
	},
	{
		accessorKey: 'notation',
		header: 'Notation'
	}
];
