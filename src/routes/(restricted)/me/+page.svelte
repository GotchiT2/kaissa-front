<script lang="ts">
  import {Navigation} from "@skeletonlabs/skeleton-svelte";
  import {ChessQueen, Database} from "@lucide/svelte";
  import {writable} from "svelte/store";

  let ws = $state<WebSocket>(new WebSocket('wss://chess-api.com/v1'));
  const winChance = writable<number[] | null>(null);

  ws.onmessage = (event) => {
    const chessApiMessage = JSON.parse(event.data);

    console.log(chessApiMessage.depth, chessApiMessage.winChance, chessApiMessage.continuationArr);
    winChance.set(chessApiMessage.winChance);

  };

  const ready = writable(false);
  let fen =
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  async function toto(fen: string) {
    ws.send(JSON.stringify({
      fen,
      variants: 3,
      depth: 18,
      searchMoves: 'a2a4',
    }));
  }
</script>

<div class="flex h-[90vh] w-full">
    <Navigation
            class="w-auto h-full bg-[#121212] flex flex-col gap-4"
            layout="sidebar"
    >
        <Navigation.Header class="flex flex-col gap-2 py-4">
            <a class="btn-icon btn-icon-lg preset-filled-primary-500" href="/chessboard" title="Mode échiquier">
                <ChessQueen class="size-6"/>
                <span class="sr-only">Mode échiquier</span>
            </a>
            <a class="btn-icon btn-icon-lg preset-filled-primary-500" href="/database"
               title="Bases de données">
                <Database class="size-6"/>
                <span class="sr-only">Bases de données</span>
            </a>
        </Navigation.Header>
    </Navigation>

    <h1 class="h1">Mon compte</h1>

    <div class="max-w-md space-y-4">
        <button
                class="disabled:opacity-50"
                onclick={() => toto(fen)}
        >
            Évaluer
        </button>

        {#if $winChance}
            <div class="space-y-1 text-sm">
                <div>Joueur A : {$winChance}%</div>
                <div>Joueur B : {100 - Number($winChance)}%</div>
            </div>
        {/if}
    </div>
</div>

