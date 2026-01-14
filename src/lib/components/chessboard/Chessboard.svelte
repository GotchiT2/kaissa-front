<script lang="ts">
  import {Chess} from "chess.js";
  import {Switch, Tabs} from "@skeletonlabs/skeleton-svelte";
  import {ChevronFirst, ChevronLast, ChevronLeft, ChevronRight} from "@lucide/svelte";
  import Tile from "$lib/components/chessboard/Tile.svelte";
  import {buildBoard, updateStatus} from "$lib/utils/chessboard";
  import {hashFEN} from "$lib/utils/positionHash";

  const {parties, collections} = $props();
  let game = new Chess();

  let selectedGameIndex = $state(parties[0]?.id || null);

  const selectedPartie = $derived(parties.find(p => p.id === selectedGameIndex));

  const moves = $derived(() => {
    if (!selectedPartie?.coups || selectedPartie.coups.length === 0) {
      return [];
    }
    
    const tempGame = new Chess();
    const movesInSan: string[] = [];
    
    for (const coup of selectedPartie.coups) {
      if (coup.coupUci) {
        try {
          const move = tempGame.move({
            from: coup.coupUci.substring(0, 2),
            to: coup.coupUci.substring(2, 4),
            promotion: coup.coupUci.length > 4 ? coup.coupUci[4] : undefined
          });
          if (move) {
            movesInSan.push(move.san);
          }
        } catch (e) {
          console.error("Erreur lors de la conversion du coup:", coup.coupUci, e);
        }
      }
    }
    
    return movesInSan;
  });

  let currentIndex = $state(0);
  let board = $state<{ square: string; piece: Piece | null }[][]>([]);
  let selectedSquare = $state<string | null>(null);
  let possibleMoves = $state<string[]>([]);
  let statusMessage = $state<string>("Trait aux Blancs");
  let selectedCollectionId = $state<string | null>(collections[0]?.id || null);


  type MeilleurCoup = {
    coup: string;
    nbParties: string;
    statsVictoires: [number, number, number];
  };

  let meilleursCoups: MeilleurCoup[]  = $state([]);

  board = buildBoard(game);

  $effect(() => {
    if (!selectedCollectionId) return;

    currentIndex;

    const fen = game.fen();
    const hashPosition = hashFEN(fen);

    fetch(`/api/collections/${selectedCollectionId}/position-moves?hashPosition=${hashPosition}`)
      .then(response => response.json())
      .then(data => {
        meilleursCoups = data.moves.map((move => {
          const statsVictoires = calculePourcentageVictoires(move.victoiresBlancs, move.victoiresNoirs, move.nulles);
          return {
            coup: move.coup,
            nbParties: move.nbParties,
            statsVictoires,
            // elo: move.eloMoyen.toFixed(0)
          };
        }));
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des coups:', error);
      });
  });

  function selectSquare(square: string) {
    selectedSquare = square;
    possibleMoves = game.moves({square, verbose: true}).map((m) => m.to);
  }

  function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
  }

  function handleTileClick(square: string) {
    const clickedPiece = game.get(square);

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
      const move = game.move({from: selectedSquare, to: square, promotion: "q"});

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
    game = new Chess();
    const currentMoves = moves();
    for (let i = 0; i < currentIndex; i++) {
      if (currentMoves[i]) {
        game.move(currentMoves[i]);
      }
    }
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

  function resumeGame() {
    currentIndex = moves().length;
    rebuildPosition();
  }

  function groupedMoves() {
    const currentMoves = moves();
    const result = [];
    for (let i = 0; i < currentMoves.length; i += 2) {
      result.push({
        moveNumber: i / 2 + 1,
        white: currentMoves[i] ?? "",
        black: currentMoves[i + 1] ?? "",
        whiteIndex: i + 1,
        blackIndex: i + 2
      });
    }
    return result;
  }

  function calculePourcentageVictoires(nbBlancs: number, nbNoirs: number, nbNulles: number) {
    const total = nbBlancs + nbNoirs + nbNulles;
    if (total === 0) {
      return {victoiresBlancs: 0, victoiresNoirs: 0, nulles: 0};
    }
    return [Math.round((nbBlancs / total) * 100), Math.round((nbNoirs / total) * 100), Math.round((nbNulles / total) * 100)]
  }
</script>

<div class="flex gap-8 items-start p-8 bg-surface-900 overflow-auto">
    <div class="flex flex-col items-center gap-4 max-w-[50%]">
        <Tabs value={selectedGameIndex} onValueChange={(tab) => selectedGameIndex = tab.value}>
            <Tabs.List>
                {#each parties as partie}
                    <Tabs.Trigger class="flex-1" value={partie.id.toString()}>
                        {partie.titre || 'Partie sans titre'}
                    </Tabs.Trigger>
                {/each}
            </Tabs.List>
        </Tabs>

        <div class="board">
            {#each board as row, r}
                <div class="rank">
                    {#each row as cell, c}
                        <Tile {cell} {r} {c} isSelected={selectedSquare === cell.square}
                              isPossibleMove={possibleMoves.includes(cell.square)} {handleTileClick}/>
                    {/each}
                </div>
            {/each}
        </div>
        <h2 class="h4">{statusMessage}</h2>
        <div class="buttons flex gap-2">
            <button class="btn preset-tonal" disabled={currentIndex === 0} onclick={firstMove}>
                <ChevronFirst/>
                <span class="sr-only">Aller au premier coup</span></button>
            <button class="btn preset-tonal" disabled={currentIndex === 0} onclick={prevMove}>
                <ChevronLeft/>
                <span class="sr-only">Précédent</span></button>
            <button class="btn preset-tonal" disabled={currentIndex === moves().length} onclick={nextMove}>
                <ChevronRight/>
                <span class="sr-only">Suivant</span>
            </button>
            <button class="btn preset-tonal" disabled={currentIndex === moves().length} onclick={resumeGame}>
                <ChevronLast/>
                <span class="sr-only">Aller au dernier coup</span>
            </button>
        </div>
    </div>

    <div class="flex h-full flex-col justify-start grow gap-4">
        <div class="flex flex-col gap-4 items-center w-full">
            <Switch dir="rtl" defaultChecked>
                <Switch.Control>
                    <Switch.Thumb/>
                </Switch.Control>
                <Switch.Label>Notation</Switch.Label>
                <Switch.HiddenInput/>
            </Switch>

            <div class="notation-text w-full bg-surface-800 p-4 rounded max-h-96 overflow-y-auto">
                {#each groupedMoves() as row}
                    <span class="move-number">{row.moveNumber}.</span>
                    <button
                            class="move-btn {currentIndex === row.whiteIndex ? 'active' : ''}"
                            onclick={() => { currentIndex = row.whiteIndex; rebuildPosition(); }}
                    >
                        {row.white}
                    </button>
                    {#if row.black}
                        <button
                                class="move-btn {currentIndex === row.blackIndex ? 'active' : ''}"
                                onclick={() => { currentIndex = row.blackIndex; rebuildPosition(); }}
                        >
                            {row.black}
                        </button>
                    {/if}
                {/each}
            </div>
        </div>

        <div class="flex flex-col gap-4 items-center">
            <Switch dir="rtl" defaultChecked>
                <Switch.Control>
                    <Switch.Thumb/>
                </Switch.Control>
                <Switch.Label>Meilleurs coups joués</Switch.Label>
                <Switch.HiddenInput/>
            </Switch>

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
<!--                            <td class="text-right">{row.elo}</td>-->
                        </tr>
                    {/each}
                    </tbody>
                </table>
            </div>

        </div>

        <div class="flex flex-col gap-4 items-center">
            <Switch dir="rtl" defaultChecked>
                <Switch.Control>
                    <Switch.Thumb/>
                </Switch.Control>
                <Switch.Label>Analyse</Switch.Label>
                <Switch.HiddenInput/>
            </Switch>

            <div class="flex flex-col gap-4 border border-surface-500 p-4 rounded w-full">
                <div class="flex items-start gap-4">
                    <span>Stockfish 17.1</span>
                    <span>depth: 22</span>
                    <span>toto: bidule</span>
                    <span>truc: pouet</span>
                </div>

                <p>
                    (0.31) 1. e4 e5   2. Nf3 Nf6  3. Nxe5 d6   4. Nf3 Nxe4  5. d4 d5   6. Bd3 Bd6   7. O-OO-O   8. Re1 Bf5   9. c4 Bb4    10. Nbd2 c6
                    (0.22)1. Nf3 d5   2. d4 e6  3. c4 Nf6  4. Bg5 Be7  5. e3 h6  6. Bh4 O-O  7. Nc3 a6  8. Qc2 dxc4  9. Bxc4 b5  10. Bxf6 Bxf6
                    (0.22)1. d4 d5  2. c4 e6  3. Nf3 Nf6  4. Bg5 Be7  5. e3 h6  6. Bh4 O-O  7. cxd5 exd5  8. Qc2 c6  9. Bd3
                    (0.22)1. d4 d5  2. c4 e6  3. Nf3 Nf6  4. Bg5 Be7  5. e3 h6  6. Bh4 O-O  7. cxd5 exd5  8. Qc2 c6  9. Bd3
                </p>
            </div>
        </div>
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

    .sidebar {
        min-width: 200px;
        border-left: 2px solid #ccc;
        padding-left: 10px;
    }

    ol {
        padding-left: 20px;
    }

    .active-move {
        font-weight: bold;
        color: #0b79d0;
    }

    .buttons button {
        margin: 4px 0;
        width: 100%;
    }

    .resume {
        margin-top: 10px;
        width: 100%;
        background: rgba(255, 255, 255, 0.15);
    }

    .notation-text {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.8;
    }

    .move-number {
        color: #aaa;
        margin-right: 4px;
        margin-left: 8px;
    }

    .move-number:first-child {
        margin-left: 0;
    }

    .move-btn {
        padding: 2px 4px;
        margin: 0 2px;
        border-radius: 3px;
        cursor: pointer;
        background: transparent;
        color: inherit;
        transition: background 0.15s;
    }

    .move-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .move-btn.active {
        background: rgba(59, 130, 246, 0.5);
        color: white;
        font-weight: 600;
    }
</style>
