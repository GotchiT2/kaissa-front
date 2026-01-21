<script lang="ts">
  import { Switch } from "@skeletonlabs/skeleton-svelte";
  import type { StockfishAnalysis } from "$lib/services/stockfishService";

  let {
    analysis,
    showAnalysis = $bindable()
  }: {
    analysis: StockfishAnalysis;
    showAnalysis: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-4 items-center">
  <Switch dir="rtl" checked={showAnalysis} onCheckedChange={(details) => showAnalysis = details.checked}>
    <Switch.Control>
      <Switch.Thumb/>
    </Switch.Control>
    <Switch.Label>Analyse</Switch.Label>
    <Switch.HiddenInput/>
  </Switch>

  {#if showAnalysis}
    <div class="flex flex-col gap-4 border border-surface-500 p-4 rounded w-full">
      {#if analysis.bestmove}
        <div class="flex items-start gap-4 flex-wrap">
          <span class="font-semibold">Meilleur coup: {analysis.bestmove}</span>
        </div>
      {/if}

      <div class="bg-surface-900 p-3 rounded max-h-64 overflow-y-auto">
        {#if analysis.lines.length === 0}
          <p class="text-surface-400">Analyse en cours...</p>
        {:else}
          <pre class="text-xs font-mono whitespace-pre-wrap">{analysis.lines.join("\n")}</pre>
        {/if}
      </div>
    </div>
  {:else}
    <p class="text-surface-400">L'analyse Stockfish est désactivée.</p>
  {/if}
</div>
