import type { ColumnDef } from '@tanstack/table-core';
import { renderComponent } from '$lib/components/table/render-helpers';
import ColumnSortButton from '$lib/components/table/ColumnSortButton.svelte';

export const columns: ColumnDef<GameRow>[] = [
	{
		accessorKey: 'whitePlayer',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Blanc',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false);
					} else if (currentSort === 'asc') {
						column.toggleSorting(true);
					} else {
						column.clearSorting();
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
		accessorKey: 'blackPlayer',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Noir',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false);
					} else if (currentSort === 'asc') {
						column.toggleSorting(true);
					} else {
						column.clearSorting();
					}
				}
			}),
		cell: (info) => info.getValue()
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
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Date',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false);
					} else if (currentSort === 'asc') {
						column.toggleSorting(true);
					} else {
						column.clearSorting();
					}
				}
			}),
		sortingFn: (rowA, rowB, columnId) => {
			const dateA = rowA.getValue(columnId) as string;
			const dateB = rowB.getValue(columnId) as string;
			
			const parseDate = (dateStr: string): number => {
				if (!dateStr || dateStr === '?') return 0;
				const parts = dateStr.split('/');
				if (parts.length === 3) {
					const [day, month, year] = parts.map(p => parseInt(p, 10));
					return new Date(year, month - 1, day).getTime();
				}
				return 0;
			};
			
			return parseDate(dateA) - parseDate(dateB);
		}
	},
	{
		accessorKey: 'tournament',
		header: ({ column }) =>
			renderComponent(ColumnSortButton, {
				columnTitle: 'Tournoi',
				sortDirection: column.getIsSorted(),
				onclick: () => {
					const currentSort = column.getIsSorted();
					if (currentSort === false) {
						column.toggleSorting(false);
					} else if (currentSort === 'asc') {
						column.toggleSorting(true);
					} else {
						column.clearSorting();
					}
				}
			}),
		cell: (info) => info.getValue()
	},
	{
		accessorKey: 'notation',
		header: 'Notation'
	}
];
