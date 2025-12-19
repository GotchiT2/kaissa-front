<script lang="ts">
  import ChessBoard from "$lib/components/chessboard/Chessboard.svelte";
  import {Navigation} from "@skeletonlabs/skeleton-svelte";
  import {ChessQueen, Database} from "@lucide/svelte";
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

    <ChessBoard/>

</div>