<script lang="ts">
  import {ChartPie, ChessQueen, Cloud, Database} from '@lucide/svelte';
  import {_} from '$lib/i18n';
</script>

<section class="flex flex-col gap-8 p-8 lg:p-16 items-center w-full">
    <div class="flex flex-col items-center mb-8">
        <img alt="Kaissa" class="w-64" src="/kaissa-logo.png"/>
        <p class="text-2xl">{$_('home.tagline')}</p>
    </div>
    <h1 class="h1">{$_('home.hero.title')}</h1>
    <h2 class="text-2xl">{$_('home.hero.subtitle')}</h2>

    <div class="grid w-2/3 grid-flow-col grid-cols-3 gap-y-8 mt-16">
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <Database/>
            <p class="w-1/3"><span
                    class="text-primary-500 font-bold">{$_('home.features.intuitive.title')}</span><br/>{$_('home.features.intuitive.description')}
            </p>
        </div>
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <ChartPie/>
            <p class="w-1/3"><span
                    class="text-primary-500 font-bold">{$_('home.features.statistics.title')}</span><br/>{$_('home.features.statistics.description')}
            </p>
        </div>

        <div class="row-span-2 flex justify-center items-center">
            <img alt="" src="/chessboard.webp"/>
        </div>
        <div class="flex flex-col items-center justify-center text-center gap-4">
            <ChessQueen/>
            <p class="w-1/3"><span
                    class="text-primary-500 font-bold">{$_('home.features.stockfish.title')}</span><br/>{$_('home.features.stockfish.description')}
            </p>
        </div>

        <div class="flex flex-col items-center justify-center text-center gap-4">
            <Cloud/>
            <p class="w-1/3"><span
                    class="text-primary-500 font-bold">{$_('home.features.cloud.title')}</span><br/>{$_('home.features.cloud.description')}
            </p>
        </div>
    </div>


    <p class="text-center mt-16"><span
            class="text-primary-500 font-bold">{$_('home.features.scan.title')}</span><br/>{$_('home.features.scan.description')}
    </p>

    <button class="btn btn-lg preset-filled-primary-500 font-bold" type="button">{$_('home.cta')}</button>

</section>

<section class="w-full bg-surface-100 py-16 min-h-[100vh] flex items-center justify-center gap-16">
    <p class="text-8xl max-w-[50%] text-end font-normal text-surface-700">{$_('home.vision.text')}<span
            class="font-black">{$_('home.vision.emphasis')}</span></p>
    <img alt="" src="/analyse1.jpg"/>

    <!--    <div class="aspect-video w-1/2 h-full mx-auto bg-primary-500">-->
    <!--        &lt;!&ndash;        <video src=""></video>&ndash;&gt;-->
    <!--    </div>-->
</section>

<section class="w-full py-16 flex flex-col gap-8 items-center bg-surface-700">
    <h2 class="text-5xl">{$_('home.unique.title')}</h2>

    <ul class="w-1/2 mt-16 md:mt-20 flex flex-col gap-12">
        <!-- Item 1 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">1.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">
                {@html ($_('home.unique.point1'))} :
            </p>
        </li>

        <!-- Item 2 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">2.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">{@html ($_('home.unique.point2'))}</p>
        </li>

        <!-- Item 3 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">3.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">{@html ($_('home.unique.point3'))}</p>
        </li>

        <!-- Item 4 -->
        <li class="flex gap-12 items-center">
            <div class="text-[#D6A645] text-7xl md:text-8xl leading-none font-light select-none">4.</div>
            <p class="text-2xl md:text-3xl leading-snug font-light">{@html ($_('home.unique.point4'))}</p>
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
                    <h3 class="h3 text-primary-500">{$_('home.team.erwan.role')}</h3>
                </div>
                <p class="opacity-60">
                    {$_('home.team.erwan.bio1')}
                </p>
                <p class="opacity-60">
                    {$_('home.team.erwan.bio2')}
                </p>
                <p class="opacity-60">
                    {$_('home.team.erwan.bio3')}
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
                    <h3 class="h3 text-primary-500">{$_('home.team.thibault.role')}</h3>
                </div>
                <p class="opacity-60">
                    {$_('home.team.thibault.bio1')}</p>
                <p class="opacity-60">

                    {$_('home.team.thibault.bio2')}
                </p>
                <p class="opacity-60">

                    {$_('home.team.thibault.bio3')}
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
                    <h3 class="h3 text-primary-500">{$_('home.team.anthony.role')}</h3>
                </div>
                <p class="opacity-60">
                    {$_('home.team.anthony.bio1')}</p>
                <p class="opacity-60">
                    {$_('home.team.anthony.bio2')}
                </p>
                <p class="opacity-60">
                    {$_('home.team.anthony.bio3')}
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
                    <h3 class="h3 text-primary-500">{$_('home.team.theo.role')}</h3>
                </div>
                <p class="opacity-60">
                    {$_('home.team.theo.bio1')}</p>
                <p class="opacity-60">
                    {$_('home.team.theo.bio2')} </p>
                <p class="opacity-60">
                    {$_('home.team.theo.bio3')}
                </p>
            </article>
        </div>
    </div>

    <p class="h2 text-surface-900 italic text-center">{$_('home.quote', {values: {analysis: $_('home.analysis')}})}<br/>
        -
        {$_('home.quoteAuthor')}</p>

</section>

<section class="w-full bg-primary-500 py-16 flex flex-col gap-8 items-center text-surface-900">
    <h2 class="h2">{$_('home.beta.title')}</h2>
    <p class="h5">{$_('home.beta.subtitle')}</p>
    <div class="flex gap-16">
        <ul class="list-disc flex flex-col gap-4 font-bold">
            <li>{$_('home.beta.benefit1')}</li>
            <li>{$_('home.beta.benefit2')}
            </li>
            <li>{$_('home.beta.benefit3')}
            </li>
        </ul>
        <button class="btn btn-lg bg-surface-900 text-primary-500" type="button"><span
                class="font-bold">{$_('home.beta.cta')}</span><br/>{$_('home.beta.limited')}
        </button>
    </div>
</section>

<section class="w-full py-16 flex flex-col gap-8 items-center">
    <h2 class="h2">{$_('home.partners.title')}</h2>
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
