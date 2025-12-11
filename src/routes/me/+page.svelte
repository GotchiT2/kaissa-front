<script lang="ts">
  import ChessBoard from "$lib/components/chessboard/ChessBoard.svelte";

  let boardRef: ChessBoard;

  function onMove(e) {
    console.log("Dernier coup :", e.detail.move);
    console.log("Historique :", e.detail.history);
  }

  function flipBoard() {
    boardRef.flip();
  }

  function showSampleArrows() {
    boardRef.setArrows([
      { from: "e2", to: "e4" },
      { from: "g1", to: "f3" }
    ]);
  }

  function clearArrows() {
    boardRef.clearArrows();
  }
</script>

<button on:click={flipBoard}>Flip board</button>
<button on:click={showSampleArrows}>Montrer des flèches</button>
<button on:click={clearArrows}>Effacer les flèches</button>

<ChessBoard bind:this={boardRef} on:move={onMove} />