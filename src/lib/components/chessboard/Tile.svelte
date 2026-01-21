<script lang="ts">
  import {pieceToUnicode} from "$lib/utils/chessboard";

  let {
    cell,
    r,
    c,
    isSelected,
    isPossibleMove,
    handleTileClick
  }: {
    cell: Cell;
    r: number;
    c: number;
    isSelected: boolean;
    isPossibleMove: boolean;
    handleTileClick: (square: string) => void;
  } = $props();
</script>

<button
        class="tile {(r+c)%2===0 ? 'bg-primary-300':'bg-primary-800'}
                          {isSelected ? 'inset-ring-4 inset-ring-blue-500 ':''}
                          {isPossibleMove ? 'target':''}"
        onclick={() => handleTileClick(cell.square)}
>
    {#if cell.piece}
      <span class="piece {cell.piece.color}">
        {pieceToUnicode(cell.piece)}
      </span>
    {/if}
</button>

<style>
    .tile {
        width: 100px;
        height: 100px;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        cursor: pointer;
    }

    .target::after {
        content: "";
        position: absolute;
        width: 1rem;
        height: 1rem;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 50%;
    }

    .piece {
        font-size: 4rem;
    }

    .piece.w {
        color: white;
        text-shadow: 0 0 .3rem black;
    }

    .piece.b {
        color: black;
        text-shadow: 0 0 .3rem white;
    }
</style>