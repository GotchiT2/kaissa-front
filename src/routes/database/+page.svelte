<script lang="ts">
  import {ChessQueen, Clock4, Database, Folder, FolderArchive, Hash, Plus, Star, Trash2} from '@lucide/svelte';
  import {Navigation} from '@skeletonlabs/skeleton-svelte';
  import {formatNumber} from '$lib/utils/formatNumber';
  import GamesTable from '$lib/components/table/GamesTable.svelte';
  import {onMount} from 'svelte';
  import {generateFakeGames} from '$lib/utils/fakeGames';

  const collections = [
    {label: 'Toutes les parties', href: '#', value: 1300000, icon: Folder},
    {label: 'Collection Kaissa', href: '#', value: 15203, icon: Folder},
    {label: 'Non classées', href: '#', value: 33, icon: FolderArchive},
    {label: 'Corbeille', href: '#', value: 12, icon: Trash2}
  ];

  const listes = [
    {label: 'Parties favorites', href: '#', value: 1803, icon: Star},
    {label: 'A analyser plus tard', href: '#', value: 1, icon: Clock4}
  ];

  const balises = [
    {label: 'New', href: '#', value: 13, icon: Hash},
    {label: 'Scandinave', href: '#', value: 164, icon: Hash}
  ];

  let data: GameRow[] = [];
  onMount(() => {
    data = generateFakeGames(50);
  });

  let anchorSidebar = 'btn hover:preset-tonal justify-between px-2 w-full flex items-center gap-2';
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

    <Navigation
            class="w-auto h-full grid grid-rows-[auto_1fr_auto] gap-4 border-r-1 border-b-primary-100 py-8"
            layout="sidebar"
    >
        <Navigation.Content class="ml-4 overflow-y-auto">
            <Navigation.Group class="w-full">
                <Navigation.Label class="capitalize pl-2 flex justify-between">Collections
                    <button>
                        <Plus class="size-4 hover:preset-filled-primary-500"/>
                        <span class="sr-only">Ajouter une balise</span></button>
                </Navigation.Label>
                <Navigation.Menu class="w-full">
                    {#each collections as link (link)}
                        {@const Icon = link.icon}
                        <a href={link.href} class={anchorSidebar} title={link.label} aria-label={link.label}>
								<span class="flex items-center gap-2">
									<Icon class="size-4"/>
                                    {link.label}
								</span>
                            <span class="opacity-60">{formatNumber(link.value)}</span>
                        </a>
                    {/each}
                </Navigation.Menu>
            </Navigation.Group>

            <Navigation.Group class="w-full">
                <Navigation.Label class="capitalize pl-2">Listes</Navigation.Label>
                <Navigation.Menu class="w-full">
                    {#each listes as liste (liste)}
                        {@const Icon = liste.icon}
                        <a href={liste.href} class={anchorSidebar} title={liste.label} aria-label={liste.label}>
								<span class="flex items-center gap-2">
									<Icon class="size-4"/>
                                    {liste.label}
								</span>
                            <span class="opacity-60">{formatNumber(liste.value)}</span>
                        </a>
                    {/each}
                </Navigation.Menu>
            </Navigation.Group>

            <Navigation.Group class="w-full">
                <Navigation.Label class="capitalize pl-2 flex justify-between">Balises
                    <button>
                        <Plus class="size-4 hover:preset-filled-primary-500"/>
                        <span class="sr-only">Ajouter une balise</span></button>
                </Navigation.Label>
                <Navigation.Menu class="w-full">
                    {#each balises as balise (balise)}
                        {@const Icon = balise.icon}
                        <a href={balise.href} class={anchorSidebar} title={balise.label} aria-label={balise.label}>
								<span class="flex items-center gap-2">
									<Icon class="size-4"/>
                                    {balise.label}
								</span>
                            <span class="opacity-60">{formatNumber(balise.value)}</span>
                        </a>
                    {/each}
                </Navigation.Menu>
            </Navigation.Group>
        </Navigation.Content>
    </Navigation>

    <!-- contenu principal -->
    <div class="grow flex flex-col items-center bg-surface-900 overflow-auto">
        <h2>Collection Kaissa</h2>
        <p>{data.length} résultats</p>
        <GamesTable {data}/>
    </div>

</div>
