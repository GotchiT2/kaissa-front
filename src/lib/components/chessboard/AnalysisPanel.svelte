<script lang="ts">
  import {Switch} from "@skeletonlabs/skeleton-svelte";
  import type {StockfishAnalysis} from "$lib/services/stockfishService";
  import {_} from '$lib/i18n';
  import { convertUciMoveToSan, convertUciSequenceToSan } from '$lib/utils/chessNotation';

  let {
    analysis,
    showAnalysis = $bindable(),
    currentFen
  }: {
    analysis: StockfishAnalysis;
    showAnalysis: boolean;
    currentFen: string;
  } = $props();

  const bestmoveSan = $derived(analysis.bestmove ? convertUciMoveToSan(analysis.bestmove, currentFen) : '');

  const formattedLine = $derived(() => {
    if (!analysis.evaluation || !analysis.principalVariation) {
      return null;
    }

    const evalSign = analysis.evaluation >= 0 ? '+' : '';
    const evalStr = `(${evalSign}${analysis.evaluation.toFixed(2)})`;

    const pvSan = convertUciSequenceToSan(analysis.principalVariation, currentFen);

    return `${evalStr} ${pvSan}`;
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

            <div class="bg-surface-900 p-3 rounded">
                {#if !formattedLine()}
                    <p class="text-surface-400">{$_('chessboard.analysis.analyzing')}</p>
                {:else}
                    <pre class="text-sm font-mono whitespace-pre-wrap">{formattedLine()}</pre>
                {/if}
            </div>
        </div>
    {:else}
        <p class="text-surface-400">{$_('chessboard.analysis.disabled')}</p>
    {/if}
</div>
