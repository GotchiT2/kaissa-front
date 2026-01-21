<script lang="ts">
  import { Switch } from "@skeletonlabs/skeleton-svelte";
  import type { BestMove } from "$lib/services/bestMovesService";

  interface Collection {
    id: string;
    nom: string;
  }

  let {
    collections,
    selectedCollectionId = $bindable(),
    meilleursCoups,
    showBestMoves = $bindable()
  }: {
    collections: Collection[];
    selectedCollectionId: string | null;
    meilleursCoups: BestMove[];
    showBestMoves: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-4 items-center mb-16">
  <Switch dir="rtl" checked={showBestMoves} onCheckedChange={(details) => showBestMoves = details.checked}>
    <Switch.Control>
      <Switch.Thumb/>
    </Switch.Control>
    <Switch.Label>Meilleurs coups joués</Switch.Label>
    <Switch.HiddenInput/>
  </Switch>

  {#if showBestMoves}
    <label class="label w-fit flex gap-4 items-center self-start">
      <span class="label-text">Database</span>
      <select class="select" bind:value={selectedCollectionId}>
        {#if collections.length === 0}
          <option value="">Aucune collection disponible</option>
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
            <th>Coup</th>
            <th>Nombre de parties</th>
            <th>Blanc / Neutre / Noir</th>
            <th class="text-right!">ELO Moyen</th>
          </tr>
        </thead>
        <tbody class="[&>tr]:hover:preset-tonal-primary">
          {#each meilleursCoups as row}
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
    <p class="text-surface-400">Les meilleurs coups joués dans la base de données ne sont pas affichés.</p>
  {/if}
</div>
