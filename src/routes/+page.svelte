<script lang="ts">
  import {ChartPie, ChessQueen, Cloud, Database} from '@lucide/svelte';
</script>

<section class="flex flex-col gap-8 p-8 lg:p-16 items-center w-full">
    <h1 class="h1">La nouvelle génération de logiciel d’analyse d’échecs.</h1>
    <h2 class="h2">Plus rapide, plus fluide, plus moderne. Accessible partout, pour tous les niveaux</h2>

    <div class="grid w-2/3 grid-flow-col grid-cols-3 gap-y-8 mt-16">
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <Database/>
            <p class="w-1/3"><span class="text-primary-500 font-bold">Gestion intuitive des parties</span><br/>Collections,
                filtres, tags,
                tout
                est
                simple et rapide.</p>
        </div>
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <ChartPie/>
            <p class="w-1/3"><span class="text-primary-500 font-bold">Statistiques intelligentes</span><br/>Coups les
                plus
                joués
                avec
                pourcentages
                de victoire.</p>
        </div>

        <div class="row-span-2 flex justify-center items-center">
            <img alt="" src="/chessboard.jpg"/>
        </div>
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <ChessQueen/>
            <p class="w-1/3"><span class="text-primary-500 font-bold">Analyse par Stockfish</span><br/>Meilleur coup et
                variantes
                accessibles
                instantanément.</p>
        </div>

        <div class="flex flex-col items-center justify-center text-center gap-4">
            <Cloud/>
            <p class="w-1/3"><span class="text-primary-500 font-bold">Sauvegarde en ligne</span><br/>Accédez à vos
                parties où
                que
                vous soyez.
            </p>
        </div>
    </div>


    <p class="text-center mt-16"><span
            class="text-primary-500 font-bold">Scan intelligent (en cours de développement)</span><br/>Prenez
        une photo,
        votre partie est ajoutée automatiquement.</p>

    <button class="btn btn-lg preset-filled-primary-500 font-bold" type="button">ESSAYER KAISSA</button>

</section>

<section class="w-full bg-surface-500 py-16">
    <div class="aspect-video w-1/2 h-full mx-auto bg-primary-500">
        <!--        <video src=""></video>-->
    </div>
</section>

<section class="w-full py-16 flex flex-col gap-8 items-center">
    <h2 class="h2">Ce qui rend Kaissa unique ?</h2>
    <p class="h5">Kaissa n’est pas une simple alternative, c’est une nouvelle façon de penser l’analyse d’échecs.</p>
    <div class="w-full flex items-center justify-center gap-16">
        <img alt="" class="w-1/4" src="/analyse1.jpg">
        <ul class="list-disc flex flex-col gap-4">
            <li>Une interface pensée avec et pour les joueurs : moderne, fluide et agréable à utiliser.</li>
            <li>Une approche intelligente du stockage de parties : classez, retrouvez et commentez vos parties
                facilement.
            </li>
            <li>Des outils puissants et simples à prendre en main : Notation simple et efficace, Moteur de statistiques
                repensé, et intégration de Stockfish.
            </li>
            <li>Un backlog foisonnant : Kaissa s’améliore chaque jour grâce à notre communauté de joueurs et est là pour
                rester.
            </li>
        </ul>
    </div>
</section>

<section class="w-full bg-primary-500 py-16 flex flex-col gap-8 items-center text-surface-900">
    <h2 class="h2">Accès à la Bêta privée</h2>
    <p class="h5">Participez au lancement de Kaissa et testez l’application en avant-première !</p>
    <div class="flex gap-16">
        <ul class="list-disc flex flex-col gap-4 font-bold">
            <li>Accès GRATUIT à la Bêta</li>
            <li>Une notification dès l’ouverture du service
            </li>
            <li>Donnez votre avis et influencez les prochaines évolutions.
            </li>
        </ul>
        <button class="btn btn-lg bg-surface-900 text-primary-500" type="button"><span
                class="font-bold">ESSAYER KAISSA</span><br/>(places
            limitées)
        </button>
    </div>
</section>

<section class="w-full py-16 flex flex-col gap-8 items-center">
    <h2 class="h2">Nos partenaires</h2>
    <ul class="w-2/3 mt-8 flex justify-around">
        <li class="opacity-60 hover:opacity-100 cursor-pointer transition-all"><img alt=""
                                                                                    src="/partenaires/chess-club.png">
        </li>
        <li class="opacity-60 hover:opacity-100 cursor-pointer transition-all"><img alt=""
                                                                                    src="/partenaires/chess-club-premium.png">
        </li>
        <li class="opacity-60 hover:opacity-100 cursor-pointer transition-all"><img alt=""
                                                                                    src="/partenaires/chess-club-since-1990.png">
        </li>
        <li class="opacity-60 hover:opacity-100 cursor-pointer transition-all"><img alt=""
                                                                                    src="/partenaires/chess-club-nogent.png">
        </li>
        <li class="opacity-60 hover:opacity-100 cursor-pointer transition-all"><img alt=""
                                                                                    src="/partenaires/chess-club-sautron.png">
        </li>
    </ul>
</section>


