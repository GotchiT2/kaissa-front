<script lang="ts">
  import {ChartPie, ChessQueen, Cloud, Database} from '@lucide/svelte';
</script>

<section class="flex flex-col gap-8 p-8 lg:p-16 items-center w-full">
    <div class="flex flex-col items-center mb-8">
        <img alt="Kaissa" class="w-64" src="/kaissa-logo.png"/>
        <p class="text-2xl">Think deeper, play smarter.</p>
    </div>
    <h1 class="h1">La nouvelle génération de logiciel d’analyse d’échecs.</h1>
    <h2 class="text-2xl">Plus rapide, plus fluide, plus moderne. Accessible partout, pour tous les niveaux</h2>

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
            <img alt="" src="/chessboard.webp"/>
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

<section class="w-full bg-surface-100 py-16 min-h-[100vh] flex items-center justify-center gap-16">
    <p class="text-8xl max-w-[50%] text-end font-normal text-surface-700">Kaissa n’est pas une simple alternative, <span
            class="font-black">c’est une nouvelle façon de penser l’analyse d’échecs.</span></p>
    <img alt="" src="/analyse1.jpg"/>

    <!--    <div class="aspect-video w-1/2 h-full mx-auto bg-primary-500">-->
    <!--        &lt;!&ndash;        <video src=""></video>&ndash;&gt;-->
    <!--    </div>-->
</section>

<section class="w-full py-16 flex flex-col gap-8 items-center bg-surface-700">
    <h2 class="text-5xl">Ce qui rend Kaissa unique ?</h2>

    <ul class="w-1/2 mt-16 md:mt-20 flex flex-col gap-12">
        <!-- Item 1 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">1.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">
                Une interface pensée avec et pour les joueurs :
                <span class="text-[#D6A645]">Moderne</span>, fluide et
                <span class="text-[#D6A645]">agréable</span> à utiliser.
            </p>
        </li>

        <!-- Item 2 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">2.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">
                <span class="text-[#D6A645]">Une approche intelligente des bases de parties</span> :
                Classez, filtrez et retrouvez vos parties facilement.
            </p>
        </li>

        <!-- Item 3 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">3.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">
                Des outils puissants et simples à prendre en main :
                <span class="text-[#D6A645]">Annotation simplifiée</span>,
                <span class="text-[#D6A645]">analyse repensée</span> et intégration de
                <span class="text-[#D6A645]">Stockfish</span>.
            </p>
        </li>

        <!-- Item 4 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">4.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">
                Un backlog riche et vivant :
                <span class="text-[#D6A645]">Kaissa évolue chaque jour</span> grâce à notre
                communauté de joueurs passionnés.
            </p>
        </li>
    </ul>
</section>

<section class="w-full bg-surface-100 py-16 min-h-[100vh] flex flex-col items-center gap-16">
    <div class="w-full flex justify-center gap-16">

        <div
                class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
        >
            <header>
                <img alt="banner" class="cover w-full grayscale hue-rotate-90" src="/erwan.webp"/>
            </header>
            <article class="space-y-4 p-4">
                <div>
                    <h2 class="h6">Erwan LEVER</h2>
                    <h3 class="h3 text-primary-500">Co-fondateur de Kaissa</h3>
                </div>
                <p class="opacity-60">
                    Toujours en tournoi et sur la route, j'avais besoin d'un outil simple, rapide et accessible partout,
                    depuis n'importe quel appareil.
                </p>
                <p class="opacity-60">
                    Pas une usine à gaz, mais un espace clair pour analyser, réviser et progresser, directement en
                    ligne.
                </p>
                <p class="opacity-60">
                    Cette application est née de ce besoin et de celui de beaucoup d'autres joueurs.
                </p>
            </article>
        </div>

        <div
                class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
        >
            <header>
                <img alt="banner" class="cover w-full grayscale hue-rotate-90" src="/thibault.webp"/>
            </header>
            <article class="space-y-4 p-4">
                <div>
                    <h2 class="h6">Thibault SOULOUMIAC</h2>
                    <h3 class="h3 text-primary-500">Co-fondateur de Kaissa</h3>
                </div>
                <p class="opacity-60">
                    Quand j'ai découvert les échecs il y a quelques années, j'ai voulu progresser sérieusement, mais je
                    me
                    suis rendu compte que les outils disponibles n'étaient pas faits pour ça : trop compliqués, trop
                    anciens, ou simplement pas adaptés aux débutants.</p>
                <p class="opacity-60">

                    Avec Erwan, on a décidé de créer Kaissa : une application facile à prendre en main et assez
                    puissante
                    pour aider les joueurs les plus expérimentés.
                </p>
                <p class="opacity-60">

                    Mon rôle est de piloter la conception du produit afin que Kaissa libère tout son potentiel, pour
                    vous.
                </p>
            </article>
        </div>

        <div
                class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
        >
            <header>
                <img alt="banner" class="cover w-full grayscale hue-rotate-90" src="/anthony.webp"/>
            </header>
            <article class="space-y-4 p-4">
                <div>
                    <h2 class="h6">Anthony ROFFIDAL</h2>
                    <h3 class="h3 text-primary-500">UX designer</h3>
                </div>
                <p class="opacity-60">
                    J'ai été contacté par Thibault pour apporter mon expertise dans le domaine de l'expérience
                    utilisateur.</p>
                <p class="opacity-60">
                    L'enjeu de Kaissa est de taille : résoudre les problèmes d'ergnomie des applications d'analyse de
                    partie
                    et proposer une solution moderne, fluide, et ultra puissante.
                </p>
                <p class="opacity-60">
                    Aujourd'hui, je suis super fier de ce que Pionics a développé !
                </p>
            </article>
        </div>

        <div
                class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden"
        >
            <header>
                <img alt="banner" class="cover w-full grayscale hue-rotate-90" src="/theo.webp"/>
            </header>
            <article class="space-y-4 p-4">
                <div>
                    <h2 class="h6">Théo GAUTIER</h2>
                    <h3 class="h3 text-primary-500">CTO de Kaissa</h3>
                </div>
                <p class="opacity-60">
                    --</p>
                <p class="opacity-60">
                    -- </p>
                <p class="opacity-60">
                    --
                </p>
            </article>
        </div>
    </div>

    <p class="h2 text-surface-900 italic text-center">Les échecs sont l'art de l'<span
            class="underline">analyse</span><br/>
        -
        Mikhaïl
        Botvinnik</p>

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


