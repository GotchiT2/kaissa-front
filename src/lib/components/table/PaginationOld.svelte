<script lang="ts">
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/svelte';

	let { tableModel } = $props();
	const buttonSize = 16;
	const buttonPreset = 'btn btn-sm preset-outlined-primary-100-900 p-0';
</script>

<div class="flex items-center justify-between px-2">
	<div class="flex items-center space-x-6 lg:space-x-8">
		<div class="flex items-center space-x-2">
			<button
				class={buttonPreset}
				disabled={!tableModel.getCanPreviousPage()}
				onclick={() => tableModel.firstPage()}
				type="button"
			>
				<span class="sr-only">Go to first page</span>
				<ChevronsLeft size={buttonSize} />
			</button>
			<button
				class={buttonPreset}
				disabled={!tableModel.getCanPreviousPage()}
				onclick={() => tableModel.previousPage()}
				type="button"
			>
				<span class="sr-only">Go to previous page</span>
				<ChevronLeft size={buttonSize} />
			</button>
			<div class="items-center justify-center text-sm font-medium">
				{tableModel.getState().pagination.pageIndex + 1} / {tableModel.getPageCount()}
			</div>
			<button
				class={buttonPreset}
				disabled={!tableModel.getCanNextPage()}
				onclick={() => tableModel.nextPage()}
				type="button"
			>
				<span class="sr-only">Go to next page</span>
				<ChevronRight size={buttonSize} />
			</button>
			<button
				class={buttonPreset}
				disabled={!tableModel.getCanNextPage()}
				onclick={() => tableModel.lastPage()}
				type="button"
			>
				<span class="sr-only">Go to last page</span>
				<ChevronsRight size={buttonSize} />
			</button>
		</div>

		<div class="flex items-center space-x-2">
			<!-- <p class="text-sm font-medium">Rows</p> -->
			<select
				class="select select-sm preset-outlined-primary-100-900 p-1"
				onchange={(e) => tableModel.setPageSize(e.currentTarget.value)}
				value={String(tableModel.getState().pagination.pageSize)}
			>
				<option value="10">10 Rows</option>
				<option value="25">25 Rows</option>
				<option value="50">50 Rows</option>
			</select>
		</div>
	</div>
</div>