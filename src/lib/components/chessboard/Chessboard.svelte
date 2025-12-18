<script lang="ts">
  import {Chess} from "chess.js";
  import {Navigation, Switch} from "@skeletonlabs/skeleton-svelte";
  import {ChevronFirst, ChevronLast, ChevronLeft, ChevronRight} from "@lucide/svelte";
  import Tile from "$lib/components/chessboard/Tile.svelte";
  import {buildBoard, updateStatus} from "$lib/utils/chessboard";

  let game = new Chess();

  let moves = $state<string[]>([]);
  let currentIndex = $state(0);
  let board = $state<{ square: string; piece: Piece | null }[][]>([]);
  let selectedSquare = $state<string | null>(null);
  let possibleMoves = $state<string[]>([]);
  let statusMessage = $state<string>("Trait aux Blancs");

  board = buildBoard(game);

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
        currentIndex = moves.length;
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
    for (let i = 0; i < currentIndex; i++) {
      game.move(moves[i]);
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
    if (currentIndex < moves.length) {
      currentIndex++;
      rebuildPosition();
      clearSelection();
    }
  }

  function resumeGame() {
    currentIndex = moves.length;
    rebuildPosition();
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

  const tableData = [
    {coup: 'c5', frequence: '41%', eval: [47, 4, 49], elo: '1459'},
    {coup: 'd6', frequence: '28%', eval: [51, 5, 44], elo: '1620'},
    {coup: 'c5', frequence: '41%', eval: [47, 4, 49], elo: '1459'},
    {coup: 'd6', frequence: '28%', eval: [51, 5, 44], elo: '1620'},
    {coup: 'c5', frequence: '41%', eval: [47, 4, 49], elo: '1459'},
    {coup: 'd6', frequence: '28%', eval: [51, 5, 44], elo: '1620'},
  ];
</script>

<Navigation
        class="grow h-full grid grid-rows-[auto_1fr_auto] gap-4 border-r-1 border-b-primary-100 py-8"
        layout="sidebar"
>
    <Navigation.Content class="
    ml-4 overflow-y-auto">
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
    </Navigation.Content>
</Navigation>

<div class="grow flex gap-8 items-start p-8 bg-surface-900 overflow-auto">
    <div class="flex flex-col items-center gap-4">
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
            <button class="btn preset-tonal" disabled={currentIndex === moves.length} onclick={nextMove}>
                <ChevronRight/>
                <span class="sr-only">Suivant</span>
            </button>
            <button class="btn preset-tonal" disabled={currentIndex === moves.length} onclick={resumeGame}>
                <ChevronLast/>
                <span class="sr-only">Aller au dernier coup</span>
            </button>
        </div>
    </div>

    <div class="flex h-full flex-col justify-start grow gap-4">
        <div class="flex flex-col gap-4 items-center">
            <Switch dir="rtl" defaultChecked>
                <Switch.Control>
                    <Switch.Thumb/>
                </Switch.Control>
                <Switch.Label>Notation</Switch.Label>
                <Switch.HiddenInput/>
            </Switch>

            <textarea
                    class="w-full h-48 bg-surface-800 text-white p-2 rounded resize-none"
                    readonly
            >{moves.join(' ')}</textarea>
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
                <select class="select">
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                    <option value="4">Option 4</option>
                    <option value="5">Option 5</option>
                </select>
            </label>


            <div class="table-wrap border border-surface-500">
                <table class="table caption-bottom">
                    <thead>
                    <tr class="text-white">
                        <th>Coup</th>
                        <th>Fréquence</th>
                        <th>Blanc / Neutre / Noir</th>
                        <th class="text-right!">ELO Moyen</th>
                    </tr>
                    </thead>
                    <tbody class="[&>tr]:hover:preset-tonal-primary">
                    {#each tableData as row}
                        <tr>
                            <td>{row.coup}</td>
                            <td>{row.frequence}</td>
                            <td>
                                <div class="flex h-6 w-full overflow-hidden rounded-md text-xs font-semibold">
                                    <div
                                            class="flex items-center justify-center bg-surface-50 text-black"
                                            style="width: {row.eval[0]}%"
                                    >
                                        {row.eval[0]}%
                                    </div>
                                    <div
                                            class="flex items-center justify-center bg-surface-200 text-black"
                                            style="width: {row.eval[1]}%"
                                    >
                                    </div>
                                    <div
                                            class="flex items-center justify-center bg-surface-400 text-white"
                                            style="width: {row.eval[2]}%"
                                    >
                                        {row.eval[2]}%
                                    </div>
                                </div>
                            </td>
                            <td class="text-right">{row.elo}</td>
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
                        <select class="select">
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                            <option value="5">Option 5</option>
                        </select>
                        <select class="select">
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                            <option value="5">Option 5</option>
                        </select>
                        <select class="select">
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                            <option value="5">Option 5</option>
                        </select>
                        <select class="select">
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                            <option value="5">Option 5</option>
                        </select>
                        <select class="select">
                            <option value="1">Option 1</option>
                            <option value="2">Option 2</option>
                            <option value="3">Option 3</option>
                            <option value="4">Option 4</option>
                            <option value="5">Option 5</option>
                        </select>
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
