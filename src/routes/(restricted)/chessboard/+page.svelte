<script lang="ts">
  import ChessBoard from "$lib/components/chessboard/Chessboard.svelte";
  import {Navigation} from "@skeletonlabs/skeleton-svelte";
  import {ChessQueen, Database} from "@lucide/svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  $effect(() => {
    console.log('=== PARTIES EN ANALYSE ===');
    console.log(`Nombre de parties en analyse: ${data.partiesInAnalysis.length}`);
    
    data.partiesInAnalysis.forEach((partie, index) => {
      console.log(`\n--- Partie ${index + 1} ---`);
      console.log('ID:', partie.id);
      console.log('Titre:', partie.titre || 'Sans titre');
      console.log('Blancs:', partie.blancNom, `(${partie.blancElo || '?'})`);
      console.log('Noirs:', partie.noirNom, `(${partie.noirElo || '?'})`);
      console.log('Résultat:', partie.resultat);
      console.log('Date:', partie.datePartie ? new Date(partie.datePartie).toLocaleDateString() : 'Inconnue');
      console.log('Collection:', partie.collection.nom);
      console.log('Nombre de coups:', partie.coups.length);
      console.log('Contenu complet:', JSON.stringify(partie, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2
      ));
    });
    
    if (data.partiesInAnalysis.length === 0) {
      console.log('Aucune partie en analyse pour le moment.');
    }
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

    <ChessBoard/>

</div>
