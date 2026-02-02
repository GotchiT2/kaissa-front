<script lang="ts">
  import {Switch} from "@skeletonlabs/skeleton-svelte";
  import type {StockfishAnalysis} from "$lib/services/stockfishService";
  import {_} from '$lib/i18n';
  import { convertUciMoveToSan, convertUciSequenceToSan } from '$lib/utils/chessNotation';

  let {
    analysis,
    showAnalysis = $bindable(),
    currentFen,
    onExtendAnalysis
  }: {
    analysis: StockfishAnalysis;
    showAnalysis: boolean;
    currentFen: string;
    onExtendAnalysis?: () => void;
  } = $props();

  const bestmoveSan = $derived(analysis.bestmove ? convertUciMoveToSan(analysis.bestmove, currentFen) : '');

  const formattedVariants = $derived(() => {
    if (!analysis.variants || analysis.variants.length === 0) {
      return null;
    }

    return analysis.variants.map(variant => {
      if (variant.evaluation === null || variant.pv.length === 0) {
        return null;
      }

      const evalSign = variant.evaluation >= 0 ? '+' : '';
      const evalStr = `(${evalSign}${variant.evaluation.toFixed(2)})`;

      const pvSan = convertUciSequenceToSan(variant.pv.join(' '), currentFen);

      return `${evalStr} ${pvSan}`;
    }).filter(line => line !== null);
  });
</script>

<div class="flex flex-col gap-4 items-center">
    <Switch checked={showAnalysis} dir="rtl" onCheckedChange={(details) => showAnalysis = details.checked}>
        <Switch.Control>
            <Switch.Thumb/>
        </Switch.Control>
        <Switch.Label>{$_('chessboard.analysis.title')}</Switch.Label>
        <Switch.HiddenInput/>
    </Switch>

    {#if showAnalysis}
        <div class="flex flex-col gap-4 border border-surface-500 p-4 rounded w-full">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge preset-filled-surface-500">
                {analysis.version}
              </span>

                {#if analysis.depth !== null}
                <span class="badge preset-filled-surface-500">
                  Depth: {analysis.depth}
                </span>
                {/if}

                {#if analysis.bestmove}
                <span class="badge preset-filled-primary-500">
                  {$_('chessboard.analysis.bestMove')}: {bestmoveSan}
                </span>
                {/if}
            </div>

            <div class="bg-surface-900 p-3 rounded flex flex-col gap-2">
                {#if !formattedVariants() || formattedVariants().length === 0}
                    <p class="text-surface-400">{$_('chessboard.analysis.analyzing')}</p>
                {:else}
                    {#each formattedVariants() as variant, i}
                        <div class="flex flex-col gap-1">
                            <span class="text-xs text-surface-500">Variante {i + 1}</span>
                            <pre class="text-sm font-mono whitespace-pre-wrap">{variant}</pre>
                        </div>
                    {/each}
                {/if}
            </div>

            {#if !analysis.isAnalyzing && analysis.depth !== null && analysis.depth < 40 && onExtendAnalysis}
                <button
                    class="btn preset-filled-primary-500 w-full"
                    onclick={onExtendAnalysis}
                    type="button"
                >
                    Approfondir l'analyse (profondeur 40)
                </button>
            {/if}
        </div>
    {:else}
        <p class="text-surface-400">{$_('chessboard.analysis.disabled')}</p>
    {/if}
</div>
