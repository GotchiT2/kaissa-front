<script lang="ts">
  import {Chess} from "chess.js";
  import {onDestroy, onMount} from "svelte";
  import Tile from "$lib/components/chessboard/Tile.svelte";
  import GameSelector from "$lib/components/chessboard/GameSelector.svelte";
  import NavigationControls from "$lib/components/chessboard/NavigationControls.svelte";
  import MoveNotation from "$lib/components/chessboard/MoveNotation.svelte";
  import BestMovesPanel from "$lib/components/chessboard/BestMovesPanel.svelte";
  import AnalysisPanel from "$lib/components/chessboard/AnalysisPanel.svelte";
  import EvaluationBar from "$lib/components/chessboard/EvaluationBar.svelte";
  import {buildBoard, updateStatus} from "$lib/utils/chessboard";
  import {hashFEN} from "$lib/utils/positionHash";
  import {convertUciToSan, groupMovesByPair, rebuildGamePosition} from "$lib/utils/chessNotation";
  import {type BestMove, fetchBestMoves} from "$lib/services/bestMovesService";
  import {type StockfishAnalysis, StockfishService} from "$lib/services/stockfishService";

  const {parties, collections} = $props();

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
    isAnalyzing: false,
    wdl: null,
    depth: null,
    version: "Stockfish 17.1",
    evaluation: null,
    principalVariation: null
  });

  let stockfishService: StockfishService;
  let currentFen = $state<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  let freePlayMode = $state(false);
  let freePlayMoves = $state<string[]>([]);
  let basePositionIndex = $state(0);

  const selectedPartie = $derived(parties.find((p: any) => p.id === selectedGameIndex));

  const startingFen = $derived(() => {
    if (!selectedPartie?.coups || selectedPartie.coups.length === 0) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    return selectedPartie.coups[0]?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  });

  const moves = $derived(() => {
    if (!selectedPartie?.coups || selectedPartie.coups.length === 0) {
      return [];
    }
    return convertUciToSan(selectedPartie.coups);
  });

  const groupedMoves = $derived(groupMovesByPair(moves(), selectedPartie?.coups));

  $effect(() => {
    if (selectedGameIndex) {
      game = new Chess(startingFen());
      board = buildBoard(game);
      currentFen = game.fen();
      currentIndex = 0;
      freePlayMode = false;
      freePlayMoves = [];
    }
  });

  onMount(() => {
    board = buildBoard(game);
    currentFen = game.fen();
    stockfishService = new StockfishService((analysis) => {
      stockfishAnalysis = analysis;
    });
  });

  onDestroy(() => {
    stockfishService?.destroy();
  });

  function updateAnalysis() {
    const fen = game.fen();

    if (selectedCollectionId && showBestMoves) {
      const hashPosition = hashFEN(fen);
      fetchBestMoves(selectedCollectionId, hashPosition.toString()).then((fetchedMoves) => {
        meilleursCoups = fetchedMoves;
      });
    }

    if (showAnalysis) {
      stockfishService.analyze(fen, 1000, 300);
    }
  }

  $effect(() => {
    if (!selectedCollectionId || !showBestMoves) {
      meilleursCoups = [];
      return;
    }

    currentIndex;
    freePlayMoves;

    const fen = game.fen();
    const hashPosition = hashFEN(fen);

    fetchBestMoves(selectedCollectionId, hashPosition.toString()).then((fetchedMoves) => {
      meilleursCoups = fetchedMoves;
    });
  });

  $effect(() => {
    currentIndex;
    freePlayMoves;

    if (!showAnalysis) {
      return;
    }

    if (!freePlayMode) {
      game = rebuildGamePosition(moves(), currentIndex, startingFen());
    }

    currentFen = game.fen();
    stockfishService.analyze(currentFen, 1000, 300);
  });

  function selectSquare(square: string) {
    selectedSquare = square;
    const moves = game.moves({square: square as any, verbose: true}) as any[];
    possibleMoves = moves.map((m) => m.to);
  }

  function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
  }

  let draggedSquare = $state<string | null>(null);

  function handleDragStart(square: string) {
    const piece = game.get(square as any);
    if (piece && piece.color === game.turn()) {
      draggedSquare = square;
      selectSquare(square);
    }
  }

  function handleDragEnd() {
    draggedSquare = null;
  }

  function handleDrop(targetSquare: string) {
    if (!draggedSquare) return;

    if (possibleMoves.includes(targetSquare)) {
      const move = game.move({from: draggedSquare, to: targetSquare, promotion: "q"});

      if (move) {
        freePlayMode = true;
        freePlayMoves = [...freePlayMoves, move.lan];
        currentFen = game.fen();
        updateAnalysis();
        board = buildBoard(game);
        clearSelection();
        statusMessage = updateStatus(game);
      }
    }

    draggedSquare = null;
    clearSelection();
  }

  function handleTileClick(square: string) {
    freePlayMode = true;
    const clickedPiece = game.get(square as any);

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
      const move = game.move({from: selectedSquare, to: square, promotion: "q"});

      if (move) {
        if (freePlayMode) {
          freePlayMoves = [...freePlayMoves, move.lan];
          currentFen = game.fen();
          updateAnalysis();
        } else {
          currentIndex = moves().length;
        }
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
    game = rebuildGamePosition(moves(), currentIndex, startingFen());
    board = buildBoard(game);
    statusMessage = updateStatus(game);
    currentFen = game.fen();
  }

  function firstMove() {
    freePlayMode = false;
    currentIndex = 0;
    rebuildPosition();
    clearSelection();
  }

  function prevMove() {
    freePlayMode = false;
    if (currentIndex > 0) {
      currentIndex--;
      rebuildPosition();
      clearSelection();
    }
  }

  function nextMove() {
    freePlayMode = false;
    if (currentIndex < moves().length) {
      currentIndex++;
      rebuildPosition();
      clearSelection();
    }
  }

  function lastMove() {
    freePlayMode = false;
    currentIndex = moves().length;
    rebuildPosition();
  }

  function handleMoveClick(index: number) {
    currentIndex = index;
    basePositionIndex = index;
    freePlayMode = false;
    freePlayMoves = [];
    rebuildPosition();
  }

  function exitFreePlayMode() {
    freePlayMode = false;
    freePlayMoves = [];
    currentIndex = basePositionIndex;
    rebuildPosition();
    clearSelection();
  }
</script>

<div class="flex grow gap-8 items-start p-8 bg-surface-900 overflow-auto">
    <div class="flex flex-col items-center gap-4 max-w-[50%]">
        <div class="w-full mb-4 overflow-auto">

            <GameSelector bind:selectedGameIndex {parties}/>
        </div>

        <div class="board-container">
            {#if showAnalysis}
                <EvaluationBar wdl={stockfishAnalysis.wdl}/>
            {/if}

            <div class="board-wrapper">
                <div class="board-with-coordinates">
                    <div class="row-numbers">
                        {#each [8, 7, 6, 5, 4, 3, 2, 1] as num}
                            <div class="row-number">{num}</div>
                        {/each}
                    </div>

                    <div class="board-and-columns">
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
                                                onDragStart={handleDragStart}
                                                onDragEnd={handleDragEnd}
                                                onDrop={handleDrop}
                                        />
                                    {/each}
                                </div>
                            {/each}
                        </div>

                        <div class="column-letters">
                            {#each ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as letter}
                                <div class="column-letter">{letter}</div>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <h2 class="h4">{statusMessage}</h2>
        {#if freePlayMode}
            <div class="flex gap-2 items-center">
                <span class="badge variant-filled-warning">Mode Jeu Libre</span>
                <button class="btn variant-filled-surface" onclick={exitFreePlayMode}>
                    Revenir à la partie
                </button>
            </div>
        {/if}
        <NavigationControls
                {currentIndex}
                onFirst={firstMove}
                onLast={lastMove}
                onNext={nextMove}
                onPrevious={prevMove}
                totalMoves={moves().length}
        />
    </div>

    <div class="flex h-full flex-col justify-start grow gap-4">
        <MoveNotation {currentIndex} {groupedMoves} onMoveClick={handleMoveClick}/>

        <BestMovesPanel
                bind:selectedCollectionId
                bind:showBestMoves
                {collections}
                {currentFen}
                {meilleursCoups}
        />

        <AnalysisPanel
                analysis={stockfishAnalysis}
                bind:showAnalysis
                {currentFen}
        />
    </div>
</div>

<style>
    .board-container {
        display: flex;
        align-items: stretch;
        gap: 1rem;
        height: fit-content;
    }

    .board-wrapper {
        display: flex;
        flex-direction: column;
    }

    .board-with-coordinates {
        display: flex;
        gap: 0.5rem;
    }

    .row-numbers {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding-right: 0.5rem;
    }

    .row-number {
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #aaa;
        font-weight: 600;
        font-size: .8rem;
    }

    .board-and-columns {
        display: flex;
        flex-direction: column;
    }

    .board {
        display: flex;
        width: fit-content;
        flex-direction: column;
        border: 2px solid #333;
    }

    .rank {
        display: flex;
    }

    .column-letters {
        display: flex;
        justify-content: space-around;
        padding-top: 0.5rem;
    }

    .column-letter {
        width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #aaa;
        font-weight: 600;
        font-size: .8rem;
    }
</style>
