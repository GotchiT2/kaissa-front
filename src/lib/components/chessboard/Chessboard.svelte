<script lang="ts">
  import { Chess } from "chess.js";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  type Square = string;
  type Color = "w" | "b";
  type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
  interface Piece { color: Color; type: PieceType }

  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  // Jeu actif
  let game = new Chess();

  // 🔥 Historique complet des coups
  let moves: string[] = [];

  // 🔥 Index actuel dans l’historique (pour navigation)
  let currentIndex = 0;

  // État interface
  let board = [];
  let selectedSquare: Square | null = null;
  let possibleMoves: Square[] = [];
  let statusMessage = "";

  // -----------------------------------------------------
  // CONSTRUCTION DU BOARD
  // -----------------------------------------------------

  function buildBoard() {
    board = ranks.map((rank) =>
      files.map((file) => {
        const square = `${file}${rank}` as Square;
        const piece = game.get(square) as Piece | null;
        return { square, piece };
      })
    );
  }

  buildBoard();

  // -----------------------------------------------------
  // PIECES → UNICODE
  // -----------------------------------------------------

  function pieceToUnicode(piece: Piece): string {
    const map = {
      w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
      b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" }
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
    possibleMoves = game.moves({ square, verbose: true }).map((m) => m.to);
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
      const move = game.move({ from: selectedSquare, to: square, promotion: "q" });

      if (move) {
        moves.push(move.san);
        currentIndex = moves.length; // 🔥 On reste à la fin
        buildBoard();
        clearSelection();
        updateStatus();
        dispatch("move", { move, history: moves });
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
</script>

<!-- ===================================================== -->
<!--  UI : BOARD + HISTORIQUE + NAVIGATION                 -->
<!-- ===================================================== -->

<div class="wrapper">

    <!-- BOARD -->
    <div class="board">
        {#each board as row, r}
            <div class="rank">
                {#each row as cell, c}
                    <div
                            class="square {(r+c)%2===0 ? 'light':'dark'}
                          {selectedSquare===cell.square ? 'selected':''}
                          {possibleMoves.includes(cell.square) ? 'target':''}"
                            on:click={() => handleSquareClick(cell.square)}
                    >
                        {#if cell.piece}
              <span class="piece {cell.piece.color}">
                {pieceToUnicode(cell.piece)}
              </span>
                        {/if}
                    </div>
                {/each}
            </div>
        {/each}
    </div>

    <!-- SIDEBAR -->
    <div class="sidebar">
        <h3>Historique</h3>

        <ol>
            {#each moves as m, i}
                <li class="{i === currentIndex - 1 ? 'active-move' : ''}">
                    {m}
                </li>
            {/each}
        </ol>

        <div class="buttons">
            <button on:click={prevMove} disabled={currentIndex === 0}>⟸ Précédent</button>
            <button on:click={nextMove} disabled={currentIndex === moves.length}>Suivant ⟹</button>
        </div>

        {#if currentIndex !== moves.length}
            <button class="resume" on:click={resumeGame}>
                Retour à la partie
            </button>
        {/if}

        <h3>Statut</h3>
        <p>{statusMessage}</p>
    </div>
</div>

<style>
    .wrapper {
        display: flex;
        gap: 20px;
    }

    .board {
        display: flex;
        flex-direction: column;
        border: 2px solid #333;
    }

    .rank {
        display: flex;
    }

    .square {
        width: 64px;
        height: 64px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        cursor: pointer;
    }

    .light { background: #f0d9b5; }
    .dark  { background: #b58863; }

    .selected { box-shadow: inset 0 0 0 3px rgba(50,150,250,0.9); }
    .target::after {
        content: "";
        position: absolute;
        width: 18px;
        height: 18px;
        background: rgba(0,0,0,0.35);
        border-radius: 50%;
    }

    .piece { font-size: 44px; }
    .piece.w { color: white; text-shadow: 0 0 4px black; }
    .piece.b { color: black; text-shadow: 0 0 4px white; }

    .sidebar {
        min-width: 200px;
        border-left: 2px solid #ccc;
        padding-left: 10px;
    }

    ol { padding-left: 20px; }
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
        background: #ddd;
    }
</style>
