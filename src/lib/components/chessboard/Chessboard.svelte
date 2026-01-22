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
  import {type BestMove, fetchBestMoves} from "$lib/services/bestMovesService";
  import {type StockfishAnalysis, StockfishService} from "$lib/services/stockfishService";
  import {buildMoveTree, flattenMoveTree, buildPathToNode, type MoveNode, type DisplayLine} from "$lib/utils/variations";

  const {parties, collections} = $props();

  let game = new Chess();
  let selectedGameIndex = $state(parties[0]?.id || null);
  let currentNodeId = $state<string | null>(null);
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
  let prochainCoupDisplay: string = $state('');
  let freePlayMode = $state(false);
  let baseNodeId = $state<string | null>(null);

  const selectedPartie = $derived(parties.find((p: any) => p.id === selectedGameIndex));

  const moveTree = $derived(() => {
    if (!selectedPartie?.coups || selectedPartie.coups.length === 0) {
      return null;
    }
    return buildMoveTree(selectedPartie.coups as MoveNode[]);
  });

  const displayLines = $derived(() => {
    const tree = moveTree();
    if (!tree) return [];
    return flattenMoveTree(tree);
  });

  onMount(() => {
    board = buildBoard(game);
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
      const prochainCoupId = game.moveNumber();
      const prochainJoueur = game.turn() === 'w' ? '.' : '...';
      prochainCoupDisplay = `${prochainCoupId}${prochainJoueur}`;
      stockfishService.analyze(fen, 1000, 300);
    }
  }

  $effect(() => {
    if (!selectedCollectionId || !showBestMoves || !currentNodeId) {
      meilleursCoups = [];
      return;
    }

    const fen = game.fen();
    const hashPosition = hashFEN(fen);

    fetchBestMoves(selectedCollectionId, hashPosition.toString()).then((fetchedMoves) => {
      meilleursCoups = fetchedMoves;
    });
  });

  $effect(() => {
    if (!showAnalysis || !currentNodeId) {
      return;
    }

    const prochainCoupId = game.moveNumber();
    const prochainJoueur = game.turn() === 'w' ? '.' : '...';
    prochainCoupDisplay = `${prochainCoupId}${prochainJoueur}`;
    
    const fen = game.fen();
    stockfishService.analyze(fen, 1000, 300);
  });

  function selectSquare(square: string) {
    selectedSquare = square;
    const legalMoves = game.moves({square: square as any, verbose: true}) as any[];
    possibleMoves = legalMoves.map((m: { to: string }) => m.to);
  }

  function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
  }

  function rebuildPositionFromNode(nodeId: string | null) {
    if (!nodeId) {
      game = new Chess();
      board = buildBoard(game);
      statusMessage = updateStatus(game);
      return;
    }

    const tree = moveTree();
    if (!tree) return;

    const path = buildPathToNode(tree, nodeId);
    game = new Chess();

    for (const node of path) {
      if (node.coupUci) {
        game.move(node.coupUci as any);
      }
    }

    board = buildBoard(game);
    statusMessage = updateStatus(game);
  }

  function handleTileClick(square: string) {
    const clickedPiece = game.get(square);

    if (!freePlayMode) return;

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
        if (freePlayMode && currentNodeId) {
          createVariation(currentNodeId, move.lan);
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

  async function createVariation(parentNodeId: string, coupUci: string) {
    try {
      const response = await fetch(`/api/nodes/${parentNodeId}/variations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coupUci }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la création de la variante');
      }

      const newNode = await response.json();
      currentNodeId = newNode.id;
      
      await reloadPartie();
    } catch (error) {
      console.error('Erreur lors de la création de la variante:', error);
    }
  }

  async function reloadPartie() {
    try {
      const response = await fetch(`/api/parties/${selectedPartie.id}`);
      if (!response.ok) {
        throw new Error('Erreur lors du rechargement de la partie');
      }

      const updatedPartie = await response.json();
      const partieIndex = parties.findIndex((p: any) => p.id === selectedPartie.id);
      if (partieIndex !== -1) {
        parties[partieIndex] = updatedPartie;
      }
    } catch (error) {
      console.error('Erreur lors du rechargement de la partie:', error);
    }
  }

  function handleMoveClick(nodeId: string) {
    currentNodeId = nodeId;
    baseNodeId = nodeId;
    freePlayMode = true;
    rebuildPositionFromNode(nodeId);
  }

  function exitFreePlayMode() {
    freePlayMode = false;
    currentNodeId = baseNodeId;
    rebuildPositionFromNode(baseNodeId);
    clearSelection();
  }
</script>

<div class="flex gap-8 items-start p-8 bg-surface-900 overflow-auto">
    <div class="flex flex-col items-center gap-4 max-w-[50%]">
        <div class="w-full mb-4 overflow-auto">

            <GameSelector bind:selectedGameIndex {parties}/>
        </div>

        <div class="board-container">
            {#if showAnalysis}
                <EvaluationBar wdl={stockfishAnalysis.wdl}/>
            {/if}

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
    </div>

    <div class="flex h-full flex-col justify-start grow gap-4">
        <MoveNotation {currentNodeId} displayLines={displayLines()} onMoveClick={handleMoveClick}/>

        <BestMovesPanel
                bind:selectedCollectionId
                bind:showBestMoves
                {collections}
                {meilleursCoups}
        />

        <AnalysisPanel
                analysis={stockfishAnalysis}
                bind:showAnalysis
                moveNumber={prochainCoupDisplay}
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
