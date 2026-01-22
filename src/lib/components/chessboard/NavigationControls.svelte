<script lang="ts">
  import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from "@lucide/svelte";
  import { _ } from '$lib/i18n';

  let {
    currentIndex,
    totalMoves,
    onFirst,
    onPrevious,
    onNext,
    onLast
  }: {
    currentIndex: number;
    totalMoves: number;
    onFirst: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onLast: () => void;
  } = $props();

  const isAtStart = $derived(currentIndex === 0);
  const isAtEnd = $derived(currentIndex === totalMoves);
</script>

<div class="buttons flex gap-2">
  <button class="btn preset-tonal" disabled={isAtStart} onclick={onFirst}>
    <ChevronFirst/>
    <span class="sr-only">{$_('chessboard.navigation.first')}</span>
  </button>
  <button class="btn preset-tonal" disabled={isAtStart} onclick={onPrevious}>
    <ChevronLeft/>
    <span class="sr-only">{$_('chessboard.navigation.previous')}</span>
  </button>
  <button class="btn preset-tonal" disabled={isAtEnd} onclick={onNext}>
    <ChevronRight/>
    <span class="sr-only">{$_('chessboard.navigation.next')}</span>
  </button>
  <button class="btn preset-tonal" disabled={isAtEnd} onclick={onLast}>
    <ChevronLast/>
    <span class="sr-only">{$_('chessboard.navigation.last')}</span>
  </button>
</div>

<style>
  .buttons button {
    margin: 4px 0;
    width: 100%;
  }
</style>
