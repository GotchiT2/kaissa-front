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
		header: 'Elo',
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue) return true;
			const { min, max } = filterValue;
			const value = row.getValue(columnId) as number;
			if (!value) return true;
			if (min !== undefined && value < min) return false;
			if (max !== undefined && value > max) return false;
			return true;
		}
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
		header: 'Elo',
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue) return true;
			const { min, max } = filterValue;
			const value = row.getValue(columnId) as number;
			if (!value) return true;
			if (min !== undefined && value < min) return false;
			if (max !== undefined && value > max) return false;
			return true;
		}
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
						column.toggleSorting(false);
					} else if (currentSort === 'asc') {
						column.toggleSorting(true);
					} else {
						column.clearSorting();
					}
				}
			}),
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue || filterValue === '') return true;
			const value = row.getValue(columnId) as string;
			return value === filterValue;
		}
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
		},
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue) return true;
			const { min, max } = filterValue;
			const dateStr = row.getValue(columnId) as string;
			
			if (!dateStr || dateStr === '?') return true;
			
			const parts = dateStr.split('/');
			if (parts.length !== 3) return true;
			
			const [day, month, year] = parts.map(p => parseInt(p, 10));
			const dateTimestamp = new Date(year, month - 1, day).getTime();
			
			if (min && dateTimestamp < new Date(min).getTime()) return false;
			if (max && dateTimestamp > new Date(max).getTime()) return false;
			
			return true;
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
