<script lang="ts">
  import { Chess } from "chess.js";
  import { onMount, onDestroy } from "svelte";
  import Tile from "$lib/components/chessboard/Tile.svelte";
  import GameSelector from "$lib/components/chessboard/GameSelector.svelte";
  import NavigationControls from "$lib/components/chessboard/NavigationControls.svelte";
  import MoveNotation from "$lib/components/chessboard/MoveNotation.svelte";
  import BestMovesPanel from "$lib/components/chessboard/BestMovesPanel.svelte";
  import AnalysisPanel from "$lib/components/chessboard/AnalysisPanel.svelte";
  import { buildBoard, updateStatus } from "$lib/utils/chessboard";
  import { hashFEN } from "$lib/utils/positionHash";
  import { convertUciToSan, groupMovesByPair, rebuildGamePosition } from "$lib/utils/chessNotation";
  import { fetchBestMoves, type BestMove } from "$lib/services/bestMovesService";
  import { StockfishService, type StockfishAnalysis } from "$lib/services/stockfishService";

  const { parties, collections } = $props();

  let game = new Chess();
  let selectedGameIndex = $state(parties[0]?.id || null);
  let currentIndex = $state(0);
  let board = $state<{ square: string; piece: Piece | null }[][]>([]);
  let selectedSquare = $state<string | null>(null);
  let possibleMoves = $state<string[]>([]);
  let statusMessage = $state<string>("Trait aux Blancs");
  let selectedCollectionId = $state<string | null>(collections[0]?.id || null);
  let meilleursCoups: BestMove[] = $state([]);
  let showBestMoves = $state(true);
  let showAnalysis = $state(true);
  let stockfishAnalysis = $state<StockfishAnalysis>({
    lines: [],
    bestmove: "",
    isAnalyzing: false
  });

  let stockfishService: StockfishService;

  const selectedPartie = $derived(parties.find((p: any) => p.id === selectedGameIndex));

  const moves = $derived(() => {
    if (!selectedPartie?.coups || selectedPartie.coups.length === 0) {
      return [];
    }
    return convertUciToSan(selectedPartie.coups);
  });

  const groupedMoves = $derived(groupMovesByPair(moves()));

  onMount(() => {
    board = buildBoard(game);
    stockfishService = new StockfishService((analysis) => {
      stockfishAnalysis = analysis;
    });
  });

  onDestroy(() => {
    stockfishService?.destroy();
  });

  $effect(() => {
    if (!selectedCollectionId || !showBestMoves) {
      meilleursCoups = [];
      return;
    }

    currentIndex;

    const fen = game.fen();
    const hashPosition = hashFEN(fen);

    fetchBestMoves(selectedCollectionId, hashPosition.toString()).then((fetchedMoves) => {
      meilleursCoups = fetchedMoves;
    });
  });

  $effect(() => {
    currentIndex;

    if (!showAnalysis) {
      return;
    }

    game = rebuildGamePosition(moves(), currentIndex);
    const fen = game.fen();
    stockfishService.analyze(fen, 1000, 300);
  });

  function selectSquare(square: string) {
    selectedSquare = square;
    const moves = game.moves({ square: square as any, verbose: true }) as any[];
    possibleMoves = moves.map((m) => m.to);
  }

  function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
  }

  function handleTileClick(square: string) {
    const clickedPiece = game.get(square as any);

    if (currentIndex !== moves().length) return;

    if (!selectedSquare) {
      if (clickedPiece && clickedPiece.color === game.turn()) {
        selectSquare(square);
      }
      return;
    }

    if (square === selectedSquare) {
      clearSelection();
      return;
    }

    if (possibleMoves.includes(square)) {
      const move = game.move({ from: selectedSquare, to: square, promotion: "q" });

      if (move) {
        currentIndex = moves().length;
        board = buildBoard(game);
        clearSelection();
        statusMessage = updateStatus(game);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === game.turn()) {
      selectSquare(square);
    } else {
      clearSelection();
    }
  }

  function rebuildPosition() {
    game = rebuildGamePosition(moves(), currentIndex);
    board = buildBoard(game);
    statusMessage = updateStatus(game);
  }

  function firstMove() {
    currentIndex = 0;
    rebuildPosition();
    clearSelection();
  }

  function prevMove() {
    if (currentIndex > 0) {
      currentIndex--;
      rebuildPosition();
      clearSelection();
    }
  }

  function nextMove() {
    if (currentIndex < moves().length) {
      currentIndex++;
      rebuildPosition();
      clearSelection();
    }
  }

  function lastMove() {
    currentIndex = moves().length;
    rebuildPosition();
  }

  function handleMoveClick(index: number) {
    currentIndex = index;
    rebuildPosition();
  }
</script>

<div class="flex gap-8 items-start p-8 bg-surface-900 overflow-auto">
  <div class="flex flex-col items-center gap-4 max-w-[50%]">
    <GameSelector {parties} bind:selectedGameIndex />

    <div class="board">
      {#each board as row, r (r)}
        <div class="rank">
          {#each row as cell, c (cell.square)}
            <Tile
              {cell}
              {r}
              {c}
              isSelected={selectedSquare === cell.square}
              isPossibleMove={possibleMoves.includes(cell.square)}
              {handleTileClick}
            />
          {/each}
        </div>
      {/each}
    </div>
    <h2 class="h4">{statusMessage}</h2>
    <NavigationControls
      {currentIndex}
      totalMoves={moves().length}
      onFirst={firstMove}
      onPrevious={prevMove}
      onNext={nextMove}
      onLast={lastMove}
    />
  </div>

  <div class="flex h-full flex-col justify-start grow gap-4">
    <MoveNotation {groupedMoves} {currentIndex} onMoveClick={handleMoveClick} />

    <BestMovesPanel
      {collections}
      bind:selectedCollectionId
      {meilleursCoups}
      bind:showBestMoves
    />

    <AnalysisPanel analysis={stockfishAnalysis} bind:showAnalysis />
  </div>
</div>

<style>
  .board {
    display: flex;
    width: fit-content;
    flex-direction: column;
    border: 2px solid #333;
  }

  .rank {
    display: flex;
  }
</style>
