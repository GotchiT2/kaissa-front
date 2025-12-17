<script lang="ts">
  import {Chess} from "chess.js";
  import {createEventDispatcher} from "svelte";
  import {Navigation} from "@skeletonlabs/skeleton-svelte";

  const dispatch = createEventDispatcher();

  type Square = string;
  type Color = "w" | "b";
  type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

  interface Piece {
    color: Color;
    type: PieceType
  }

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Jeu actif
  let game = new Chess();

  // 🔥 Historique complet des coups
  let moves = $state<string[]>([]);

  // 🔥 Index actuel dans l’historique (pour navigation)
  let currentIndex = $state(0);

  // État interface
  let board = $state<{ square: Square; piece: Piece | null }[][]>([]);
  let selectedSquare = $state<Square | null>(null);
  let possibleMoves = $state<Square[]>([]);
  let statusMessage = $state<string>("");

  // -----------------------------------------------------
  // CONSTRUCTION DU BOARD
  // -----------------------------------------------------

  function buildBoard() {
    board = ranks.map((rank) =>
      files.map((file) => {
        const square = `${file}${rank}` as Square;
        const piece = game.get(square) as Piece | null;
        return {square, piece};
      })
    );
  }

  buildBoard();

  // -----------------------------------------------------
  // PIECES → UNICODE
  // -----------------------------------------------------

  function pieceToUnicode(piece: Piece): string {
    const map = {
      w: {p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔"},
      b: {p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚"}
    };
    return map[piece.color][piece.type];
  }

  // -----------------------------------------------------
  // ÉTAT DU JEU (détection échec, mat, pat)
  // -----------------------------------------------------

  function updateStatus() {
    if (game.isCheckmate()) {
      statusMessage =
        game.turn() === "w"
          ? "Échec et mat — les Blancs perdent"
          : "Échec et mat — les Noirs perdent";
      return;
    }
    if (game.isStalemate()) {
      statusMessage = "Pat — match nul";
      return;
    }
    if (game.isDraw()) {
      statusMessage = "Match nul";
      return;
    }
    if (game.isCheck()) {
      statusMessage = game.turn() === "w"
        ? "Les Blancs sont en échec"
        : "Les Noirs sont en échec";
      return;
    }
    statusMessage = game.turn() === "w" ? "Trait aux Blancs" : "Trait aux Noirs";
  }

  // -----------------------------------------------------
  // GESTION DE LA SELECTION & DES MOUVEMENTS
  // -----------------------------------------------------

  function selectSquare(square: Square) {
    selectedSquare = square;
    possibleMoves = game.moves({square, verbose: true}).map((m) => m.to);
  }

  function clearSelection() {
    selectedSquare = null;
    possibleMoves = [];
  }

  function handleSquareClick(square: Square) {
    const clickedPiece = game.get(square);

    // Navigation active → impossible de jouer
    if (currentIndex !== moves.length) return;

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
        moves.push(move.san);
        currentIndex = moves.length; // 🔥 On reste à la fin
        buildBoard();
        clearSelection();
        updateStatus();
        dispatch("move", {move, history: moves});
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === game.turn()) {
      selectSquare(square);
    } else {
      clearSelection();
    }
  }

  // -----------------------------------------------------
  // NAVIGATION DANS L’HISTORIQUE
  // -----------------------------------------------------

  // 🔥 Reconstruit la position jusqu'à `currentIndex`
  function rebuildPosition() {
    game = new Chess();
    for (let i = 0; i < currentIndex; i++) {
      game.move(moves[i]);
    }
    buildBoard();
    updateStatus();
  }

  // Bouton : coup précédent
  function prevMove() {
    if (currentIndex > 0) {
      currentIndex--;
      rebuildPosition();
      clearSelection();
    }
  }

  // Bouton : coup suivant
  function nextMove() {
    if (currentIndex < moves.length) {
      currentIndex++;
      rebuildPosition();
      clearSelection();
    }
  }

  // Retour à la partie en cours
  function resumeGame() {
    currentIndex = moves.length;
    rebuildPosition();
  }

  // Réinitialisation
  export function reset() {
    game = new Chess();
    moves = [];
    currentIndex = 0;
    statusMessage = "";
    buildBoard();
    clearSelection();
  }

  function groupedMoves() {
    const result = [];
    for (let i = 0; i < moves.length; i += 2) {
      result.push({
        moveNumber: i / 2 + 1,
        white: moves[i] ?? "",
        black: moves[i + 1] ?? "",
        whiteIndex: i + 1,
        blackIndex: i + 2
      });
    }
    return result;
  }
</script>

<Navigation
        class="w-auto h-full grid grid-rows-[auto_1fr_auto] gap-4 border-r-1 border-b-primary-100 py-8"
        layout="sidebar"
>
    <Navigation.Content class="ml-4 overflow-y-auto">
        <h3>Historique</h3>

        <div class="history">
            {#each groupedMoves() as row}
                <div class={"history-row" + (row.moveNumber % 2 === 0 ? ' history-row-light' : '')}>
                    <div class="move-number">{row.moveNumber}.</div>

                    <button
                            class="move white
                                {currentIndex === row.whiteIndex ? 'active' : ''}"
                            onclick={() => { currentIndex = row.whiteIndex; rebuildPosition(); }}
                    >
                        {row.white}
                    </button>

                    <button
                            class="move black
                                {currentIndex === row.blackIndex ? 'active' : ''}"
                            onclick={() => { currentIndex = row.blackIndex; rebuildPosition(); }}
                    >
                        {row.black}
                    </button>
                </div>
            {/each}
        </div>

        <div class="buttons">
            <button disabled={currentIndex === 0} onclick={prevMove}>⟸ Précédent</button>
            <button disabled={currentIndex === moves.length} onclick={nextMove}>Suivant ⟹</button>
        </div>

        {#if currentIndex !== moves.length}
            <button class="resume" onclick={resumeGame}>
                Retour à la partie
            </button>
        {/if}

        <h3>Statut</h3>
        <p>{statusMessage}</p>
    </Navigation.Content>
</Navigation>

<!-- contenu principal -->
<div class="grow flex items-center p-8 bg-surface-900 overflow-auto">

    <!-- BOARD -->
    <div class="board">
        {#each board as row, r}
            <div class="rank">
                {#each row as cell, c}
                    <button
                            class="square {(r+c)%2===0 ? 'light':'dark'}
                          {selectedSquare===cell.square ? 'selected':''}
                          {possibleMoves.includes(cell.square) ? 'target':''}"
                            onclick={() => handleSquareClick(cell.square)}
                    >
                        {#if cell.piece}
                          <span class="piece {cell.piece.color}">
                            {pieceToUnicode(cell.piece)}
                          </span>
                        {/if}
                    </button>
                {/each}
            </div>
        {/each}
    </div>
</div>

<style>
    .board {
        display: flex;
        flex-direction: column;
        border: 2px solid #333;
    }

    .rank {
        display: flex;
    }

    .square {
        width: 100px;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        cursor: pointer;
    }

    .light {
        background: #F5D7B0;
    }

    .dark {
        background: #BC855E;
    }

    .selected {
        box-shadow: inset 0 0 0 3px rgba(50, 150, 250, 0.9);
    }

    .target::after {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 50%;
    }

    .piece {
        font-size: 60px;
    }

    .piece.w {
        color: white;
        text-shadow: 0 0 4px black;
    }

    .piece.b {
        color: black;
        text-shadow: 0 0 4px white;
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

    .history {
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
    }

    .history-row {
        display: grid;
        grid-template-columns: 32px 1fr 1fr;
        gap: 6px;
        padding: 4px 2px;
        align-items: center;
    }

    .history-row-light {
        background: rgba(255, 255, 255, 0.1);
    }

    .move-number {
        text-align: right;
        color: #aaa;
    }

    .move {
        padding: 3px 6px;
        border-radius: 4px;
        cursor: pointer;
    }

    .move:hover {
        background: rgba(255, 255, 255, 0.05);
    }

    .move.white {
        text-align: left;
    }

    .move.black {
        text-align: left;
    }

    .move.active {
        background: rgba(255, 255, 255, 0.15);
        color: white;
        font-weight: 600;
    }
</style>
