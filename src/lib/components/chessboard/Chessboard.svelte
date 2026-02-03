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
  import {buildBoard, calculateCapturedPieces, type CapturedPieces, updateStatus} from "$lib/utils/chessboard";
  import {hashFEN} from "$lib/utils/positionHash";
  import {convertUciToSan, groupMovesByPair} from "$lib/utils/chessNotation";
  import {type BestMove, fetchBestMoves} from "$lib/services/bestMovesService";
  import {type StockfishAnalysis, StockfishService} from "$lib/services/stockfishService";
  import {buildVariantTree, findNodeById, flattenTreeWithVariants, type VariantNode, type FlatMoveNode} from "$lib/utils/variantTree";
  import {createMove as createMoveApi, getContinuations} from "$lib/services/variantService";
  import EditPartieMetadata from "$lib/components/modales/EditPartieMetadata.svelte";
  import {PencilIcon} from "@lucide/svelte";
  import {createToaster, Toast} from "@skeletonlabs/skeleton-svelte";
  import {invalidateAll} from "$app/navigation";

  const {parties, collections} = $props();

  const toaster = createToaster();

  let game = new Chess();
  let selectedGameIndex = $state(parties[0]?.id || null);
  let currentNodeId = $state<string | null>(null);
  let board = $state<{ square: string; piece: Piece | null }[][]>([]);
  let variantTree = $state<VariantNode[]>([]);
  let selectedSquare = $state<string | null>(null);
  let possibleMoves = $state<string[]>([]);
  let statusMessage = $state<string>("Trait aux Blancs");
  let capturedPieces = $state<CapturedPieces>({
    white: [],
    black: [],
    whiteScore: 0,
    blackScore: 0,
    scoreDifference: 0
  });
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
    principalVariation: null,
    variants: []
  });

  let stockfishService: StockfishService;
  let currentFen = $state<string>('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  let freePlayMode = $state(false);
  let freePlayMoves = $state<string[]>([]);
  let basePositionIndex = $state(0);
  let partieToEdit = $state<{
    id: string;
    whitePlayer: string;
    blackPlayer: string;
    whiteElo: number | null;
    blackElo: number | null;
    tournament: string;
    date: string;
  } | null>(null);

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

  const flattenedMoves = $derived(() => {
    if (!variantTree || variantTree.length === 0) return [];
    return flattenTreeWithVariants(variantTree);
  });

  const currentNode = $derived(() => {
    if (!variantTree || !currentNodeId || variantTree.length === 0) return null;
    return findNodeById(variantTree, currentNodeId);
  });

  $effect(() => {
    if (selectedGameIndex && selectedPartie) {
      variantTree = buildVariantTree(selectedPartie.coups);

      game = new Chess(startingFen());
      board = buildBoard(game);
      currentFen = game.fen();
      currentNodeId = null;
      freePlayMode = false;
      freePlayMoves = [];
      capturedPieces = calculateCapturedPieces(game);
    }
  });

  onMount(() => {
    board = buildBoard(game);
    currentFen = game.fen();
    capturedPieces = calculateCapturedPieces(game);
    stockfishService = new StockfishService((analysis) => {
      // console.log("Received Stockfish analysis:", analysis);
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
      stockfishService.analyze(fen, 24, 300);
    }
  }

  $effect(() => {
    if (!selectedCollectionId || !showBestMoves) {
      meilleursCoups = [];
      return;
    }

    currentNodeId;
    freePlayMoves;

    const fen = game.fen();
    const hashPosition = hashFEN(fen);

    fetchBestMoves(selectedCollectionId, hashPosition.toString()).then((fetchedMoves) => {
      meilleursCoups = fetchedMoves;
    });
  });

  $effect(() => {
    currentNodeId;
    freePlayMoves;

    if (!showAnalysis) {
      return;
    }

    currentFen = game.fen();
    stockfishService.analyze(currentFen, 24, 300);
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
        capturedPieces = calculateCapturedPieces(game);
        clearSelection();
        statusMessage = updateStatus(game);
      }
    }

    draggedSquare = null;
    clearSelection();
  }

  async function handleTileClick(square: string) {
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

      if (move && selectedPartie) {
        try {
          console.log('Coup joué:', move.lan, 'Depuis la position:', currentNodeId);
          const continuations = await getContinuations(selectedPartie.id, currentNodeId);
          console.log('Continuations existantes:', continuations);
          const existingMove = continuations.find(c => c.coupUci === move.lan);

          if (existingMove) {
            console.log('Coup existant trouvé:', existingMove.id);
            navigateToNode(existingMove.id);
          } else {
            console.log('Création d\'un nouveau coup');
            const currentPly = currentNode()?.ply ?? 0;
            const newMove = await createMoveApi(selectedPartie.id, {
              parentId: currentNodeId,
              coupUci: move.lan,
              fen: game.fen(),
              ply: currentPly + 1
            });

            console.log('Nouveau coup créé:', newMove);

            if (!newMove.parentId) {
              newMove.parentId = currentNodeId;
            }

            const updatedPartie = parties.find((p: any) => p.id === selectedPartie.id);
            if (updatedPartie) {
              const newCoups = [...updatedPartie.coups, newMove];
              updatedPartie.coups = newCoups;
              variantTree = buildVariantTree(newCoups);
              console.log('Arbre de variantes mis à jour, nombre de coups:', newCoups.length);
              console.log('Nouveau variantTree:', variantTree);
            }

            navigateToNode(newMove.id);
          }

          board = buildBoard(game);
          capturedPieces = calculateCapturedPieces(game);
          clearSelection();
          statusMessage = updateStatus(game);
        } catch (error) {
          console.error('Erreur lors de la création/navigation du coup:', error);
          toaster.error({title: 'Erreur', description: 'Impossible de créer le coup'});
        }
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === game.turn()) {
      selectSquare(square);
    } else {
      clearSelection();
    }
  }

  function navigateToNode(nodeId: string | null) {
    const node = nodeId ? findNodeById(variantTree, nodeId) : null;

    if (!node && nodeId !== null) {
      game = new Chess(startingFen());
    } else if (node?.fen) {
      game.load(node.fen);
    } else {
      game = new Chess(startingFen());
    }

    currentNodeId = nodeId;
    board = buildBoard(game);
    statusMessage = updateStatus(game);
    currentFen = game.fen();
    capturedPieces = calculateCapturedPieces(game);
  }

  function firstMove() {
    freePlayMode = false;
    navigateToNode(null);
    clearSelection();
  }

  function prevMove() {
    freePlayMode = false;
    const node = currentNode();
    if (node?.parentId !== undefined) {
      navigateToNode(node.parentId);
      clearSelection();
    }
  }

  function nextMove() {
    freePlayMode = false;
    const node = currentNode();
    if (node?.children && node.children.length > 0) {
      const mainChild = node.children.find(c => c.estPrincipal) || node.children[0];
      navigateToNode(mainChild.id);
      clearSelection();
    }
  }

  function lastMove() {
    freePlayMode = false;
    if (variantTree.length === 0) return;

    let node: VariantNode | undefined = variantTree.find(n => n.estPrincipal) || variantTree[0];
    while (node?.children && node.children.length > 0) {
      const mainChild: VariantNode | undefined = node.children.find((c: VariantNode) => c.estPrincipal) || node.children[0];
      if (!mainChild) break;
      node = mainChild;
    }
    if (node) {
      navigateToNode(node.id);
    }
  }

  function handleMoveClick(nodeId: string) {
    freePlayMode = false;
    freePlayMoves = [];

    const clickedNode = findNodeById(variantTree, nodeId);
    console.log('Coup cliqué', clickedNode);
    if (clickedNode && clickedNode.children && clickedNode.children.length > 0) {
      console.log(`Variantes disponibles pour le coup ${clickedNode.san} :`, clickedNode.children.map(child => ({
        id: child.id,
        san: child.san,
        estPrincipal: child.estPrincipal,
        ordre: child.ordre
      })));
    }

    navigateToNode(nodeId);
  }

  function exitFreePlayMode() {
    freePlayMode = false;
    freePlayMoves = [];
    navigateToNode(currentNodeId);
    clearSelection();
  }

  function openEditModal() {
    if (!selectedPartie) return;

    partieToEdit = {
      id: selectedPartie.id,
      whitePlayer: selectedPartie.blancNom || '',
      blackPlayer: selectedPartie.noirNom || '',
      whiteElo: selectedPartie.blancElo || null,
      blackElo: selectedPartie.noirElo || null,
      tournament: selectedPartie.event || '',
      date: selectedPartie.datePartie ? new Date(selectedPartie.datePartie).toLocaleDateString('fr-FR') : '',
    };
  }

  function closeEditModal() {
    partieToEdit = null;
  }

  async function handleEditSuccess(message: string) {
    toaster.success({title: 'Succès', description: message});
    await invalidateAll();
  }

  function handleEditError(message: string) {
    toaster.error({title: 'Erreur', description: message});
  }

  function handleExtendAnalysis() {
    stockfishService.extendAnalysis();
  }
</script>

<div class="flex grow gap-8 items-start p-8 bg-surface-900 overflow-auto">
    <div class="flex flex-col items-center gap-4 max-w-[50%]">
        <div class="w-full mb-4 overflow-auto flex items-center gap-2">
            <GameSelector bind:selectedGameIndex {parties}/>
            {#if selectedPartie}
                <button
                        class="btn-icon btn-icon-sm hover:preset-tonal"
                        onclick={openEditModal}
                        title="Éditer les métadonnées de la partie"
                        aria-label="Éditer les métadonnées de la partie"
                >
                    <PencilIcon class="size-4"/>
                </button>
            {/if}
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

        <div class="flex items-center gap-4 w-full justify-center">
            <!-- Pièces capturées par les Blancs (pièces noires perdues) -->
            <div class="flex items-center gap-1">
                {#each capturedPieces.white as piece}
                    <span class="text-2xl">{piece.unicode}</span>
                {/each}
                {#if capturedPieces.scoreDifference > 0}
                    <span class="text-sm text-green-400 ml-2">+{capturedPieces.scoreDifference}</span>
                {/if}
            </div>

            <h2 class="h4">{statusMessage}</h2>

            <!-- Pièces capturées par les Noirs (pièces blanches perdues) -->
            <div class="flex items-center gap-1">
                {#if capturedPieces.scoreDifference < 0}
                    <span class="text-sm text-green-400 mr-2">+{Math.abs(capturedPieces.scoreDifference)}</span>
                {/if}
                {#each capturedPieces.black as piece}
                    <span class="text-2xl">{piece.unicode}</span>
                {/each}
            </div>
        </div>

        {#if freePlayMode}
            <div class="flex gap-2 items-center">
                <span class="badge variant-filled-warning">Mode Jeu Libre</span>
                <button class="btn variant-filled-surface" onclick={exitFreePlayMode}>
                    Revenir à la partie
                </button>
            </div>
        {/if}
        <NavigationControls
                currentIndex={flattenedMoves().findIndex(n => n.id === currentNodeId)}
                onFirst={firstMove}
                onLast={lastMove}
                onNext={nextMove}
                onPrevious={prevMove}
                totalMoves={flattenedMoves().length}
        />
    </div>

    <div class="flex h-full flex-col justify-start grow gap-4">
        <MoveNotation currentNodeId={currentNodeId} flattenedMoves={flattenedMoves()} onMoveClick={handleMoveClick}/>

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
                onExtendAnalysis={handleExtendAnalysis}
        />
    </div>
</div>

<EditPartieMetadata
        onClose={closeEditModal}
        onError={handleEditError}
        onSuccess={handleEditSuccess}
        partieData={partieToEdit}
/>

<Toast.Group {toaster}>
    {#snippet children(toast)}
        <Toast {toast}>
            <Toast.Message>
                <Toast.Title>{toast.title}</Toast.Title>
                <Toast.Description>{toast.description}</Toast.Description>
            </Toast.Message>
            <Toast.CloseTrigger/>
        </Toast>
    {/snippet}
</Toast.Group>

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
