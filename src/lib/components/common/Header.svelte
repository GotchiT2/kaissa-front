<script lang="ts">
	import {CircleUserIcon, LogOutIcon, MenuIcon} from '@lucide/svelte';
	import {AppBar, ToggleGroup} from '@skeletonlabs/skeleton-svelte';
	import type {User} from 'lucia';

	let {user}: { user: User | null } = $props();
</script>

<AppBar class="border-b-1 border-b-primary-100 bg-[#121212]">
    <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
        <AppBar.Lead>
            <button class="btn-icon btn-icon-lg hover:preset-tonal" type="button">
                <MenuIcon/>
            </button>
        </AppBar.Lead>
        <AppBar.Headline>
            <a href="/" title="Accueil">
                <img alt="Kaissa" class="w-32" src="/kaissa-logo.png"/>
            </a>
        </AppBar.Headline>
        <AppBar.Trail>
            <ToggleGroup defaultValue={['FR']}>
                <ToggleGroup.Item value="FR">
                    FR
                </ToggleGroup.Item>
                <ToggleGroup.Item value="EN">
                    EN
                </ToggleGroup.Item>
            </ToggleGroup>

            {#if user}
                <a class="btn-icon hover:preset-tonal" href="/me">
                    <CircleUserIcon class="size-8"/>
                    <span class="sr-only">Profil</span>
                </a>
                <form method="POST" action="/logout">
                    <button class="btn-icon hover:preset-tonal" type="submit">
                        <LogOutIcon class="size-8"/>
                        <span class="sr-only">Déconnexion</span>
                    </button>
                </form>
            {:else}
                <a class="btn preset-filled-primary-500" href="/login">
                    Se connecter
                </a>
            {/if}
        </AppBar.Trail>
    </AppBar.Toolbar>
</AppBar>
