<script lang="ts">
  import { Switch } from "@skeletonlabs/skeleton-svelte";
  import type { BestMove } from "$lib/services/bestMovesService";
  import { _ } from '$lib/i18n';
  import { convertUciMoveToSan } from '$lib/utils/chessNotation';

  interface Collection {
    id: string;
    nom: string;
  }

  let {
    collections,
    selectedCollectionId = $bindable(),
    meilleursCoups,
    showBestMoves = $bindable(),
    currentFen
  }: {
    collections: Collection[];
    selectedCollectionId: string | null;
    meilleursCoups: BestMove[];
    showBestMoves: boolean;
    currentFen: string;
  } = $props();

  const meilleursCoups$an = $derived(meilleursCoups.map(coup => ({
    ...coup,
    coup: convertUciMoveToSan(coup.coup, currentFen)
  })));
</script>

<div class="flex flex-col gap-4 items-center mb-16">
  <Switch dir="rtl" checked={showBestMoves} onCheckedChange={(details) => showBestMoves = details.checked}>
    <Switch.Control>
      <Switch.Thumb/>
    </Switch.Control>
    <Switch.Label>{$_('chessboard.bestMoves.title')}</Switch.Label>
    <Switch.HiddenInput/>
  </Switch>

  {#if showBestMoves}
    <label class="label w-fit flex gap-4 items-center self-start">
      <span class="label-text">{$_('chessboard.bestMoves.database')}</span>
      <select class="select" bind:value={selectedCollectionId}>
        {#if collections.length === 0}
          <option value="">{$_('chessboard.bestMoves.noCollection')}</option>
        {:else}
          {#each collections as collection (collection.id)}
            <option value={collection.id}>{collection.nom}</option>
          {/each}
        {/if}
      </select>
    </label>

    <div class="table-wrap border border-surface-500">
      <table class="table caption-bottom">
        <thead>
          <tr class="text-white">
            <th>{$_('chessboard.bestMoves.move')}</th>
            <th>{$_('chessboard.bestMoves.gamesCount')}</th>
            <th>{$_('chessboard.bestMoves.winStats')}</th>
            <th class="text-right!">{$_('chessboard.bestMoves.avgElo')}</th>
          </tr>
        </thead>
        <tbody class="[&>tr]:hover:preset-tonal-primary">
          {#each meilleursCoups$an as row}
            <tr>
              <td>{row.coup}</td>
              <td>{row.nbParties}</td>
              <td>
                <div class="flex h-6 w-full overflow-hidden rounded-md text-xs font-semibold">
                  <div
                    class="flex items-center justify-center bg-surface-50 text-black"
                    style="width: {row.statsVictoires[0]}%"
                  >
                    {row.statsVictoires[0]}%
                  </div>
                  <div
                    class="flex items-center justify-center bg-surface-200 text-black"
                    style="width: {row.statsVictoires[1]}%"
                  >
                  </div>
                  <div
                    class="flex items-center justify-center bg-surface-400 text-white"
                    style="width: {row.statsVictoires[2]}%"
                  >
                    {row.statsVictoires[2]}%
                  </div>
                </div>
              </td>
              <td class="text-right">{row.elo !== null ? row.elo : '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-surface-400">{$_('chessboard.bestMoves.disabled')}</p>
  {/if}
</div>
