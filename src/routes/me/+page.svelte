<script>
    import {Navigation} from "@skeletonlabs/skeleton-svelte";
    import {ChessQueen, Database} from "@lucide/svelte";
    import {onMount} from 'svelte';
    import {connectChessApi, evaluateFen, evaluation} from '$lib/services/chessApi';
    import {writable} from "svelte/store";

    const ready = writable(false);
    let fen =
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';


    onMount(async () => {
        await connectChessApi();
        ready.set(true);
    });
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
                disabled={!$ready}
                onclick={() => evaluateFen(fen)}
        >
            Évaluer
        </button>

        {#if $evaluation}
            <div class="space-y-1 text-sm">
                <div>Joueur A : {$evaluation[0]}%</div>
                <div>Nul : {$evaluation[1]}%</div>
                <div>Joueur B : {$evaluation[2]}%</div>
            </div>
        {/if}
    </div>
</div>

