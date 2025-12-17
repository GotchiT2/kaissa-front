<script>
    import SVG from '$lib/components/common/SVG.svelte';
</script>

<footer class="w-full bg-[#121212] border-t-1 border-t-primary-100" role="contentinfo">
    <nav class="text-white">
        <ul class="flex flex-col items-center md:items-start">
            <li class="mb-1"><a class="hover:underline hover:text-primary-500 transition-all" href="/mentions-legales">Mentions
                Légales</a></li>
            <li class="mb-1"><a class="hover:underline hover:text-primary-500 transition-all"
                                href="/politique-de-confidentialite">Politique de Confidentialité</a></li>
            <li class="mb-2">
                <a class="hover:underline hover:text-primary-500 transition-all" href="/cgv">Conditions Générales de
                    Vente</a>
            </li>
        </ul>

        <ul class="mt-4 flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <li>
                <a
                        aria-label="Page Facebook de Kaissa (lien externe)"
                        href="https://www.facebook.com/"
                        rel="noopener noreferrer"
                        target="_blank"
                >
                    <span class="sr-only">Page Facebook de Kaissa (lien externe)</span>

                    <SVG class="h-8 w-8" viewBox="0 0 448 512">
                        <path
                                d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
                        ></path>
                    </SVG>
                </a>
            </li>

            <li>
                <a
                        aria-label="Page Instagram de Kaissa (lien externe)"
                        href="https://www.instagram.com/"
                        rel="noopener noreferrer"
                        target="_blank"
                >
                    <span class="sr-only">Page Instagram de Kaissa (lien externe)</span>

                    <SVG class="h-8 w-8" viewBox="0 0 448 512">
                        <path
                                d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
                        ></path>
                    </SVG>
                </a>
            </li>


            <li>
                <a
                        aria-label="Compte Tiktok de Kaissa (lien externe)"
                        href="https://www.tiktok.com/"
                        rel="noopener noreferrer"
                        target="_blank"
                >
                    <span class="sr-only">Compte Tiktok de Kaissa (lien externe)</span>
                    <SVG class="h-8 w-8" viewBox="0 0 512 512">
                        <path
                                d="M448 209.9a210.1 210.1 0 0 1 -122.8-39.3V349.4A162.6 162.6 0 1 1 185 188.3V278.2a74.6 74.6 0 1 0 52.2 71.2V0l88 0a121.2 121.2 0 0 0 1.9 22.2h0A122.2 122.2 0 0 0 381 102.4a121.4 121.4 0 0 0 67 20.1z"
                        />
                    </SVG>
                </a>
            </li>
        </ul>
    </nav>

    <div class="flex flex-col items-center md:items-start">
        <img alt="Kaissa" class="w-32" src="/kaissa-logo.png"/>
        <p class="mt-2">&copy;Kaissa 2025 - Tous droits réservés</p>
    </div>
</footer>

<style>
    footer {
        padding: 2rem 1em;
        display: flex;
        align-items: center;
        flex-direction: column;
        text-align: center;
        gap: 2rem;
    }

    @media (min-width: 600px) {
        footer {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
        }
    }
</style>
