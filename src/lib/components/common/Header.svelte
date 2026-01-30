<script lang="ts">
  import {ChessQueen, CircleUserIcon, Database, Loader2, LogOutIcon, MenuIcon} from '@lucide/svelte';
  import {AppBar, Menu, Portal} from '@skeletonlabs/skeleton-svelte';
  import type {User} from 'lucia';
  import {_, locale} from '$lib/i18n';
  import {updateUserLanguage} from '$lib/services/languageService';

  let {user}: { user: User | null } = $props();

  let currentLocale = $derived($locale ? $locale : 'fr');
  let isChangingLanguage = $state(false);

  async function handleLanguageChange(event: Event) {
    isChangingLanguage = true;
    try {
      const newLocale = (event.target as HTMLSelectElement).value;
      if (user) {
        await updateUserLanguage(newLocale);
      } else {
        locale.set(newLocale);
      }
    } finally {
      isChangingLanguage = false;
    }
  }
</script>

<AppBar class="border-b-1 border-b-primary-100 bg-[#121212]">
    <AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
        <AppBar.Lead>
            <Menu>
                <Menu.Trigger class="btn-icon btn-icon-lg hover:preset-tonal">
                    <MenuIcon/>
                </Menu.Trigger>
                <Portal>
                    <Menu.Positioner>
                        <Menu.Content>
                            {#if user}
                                <Menu.Item value="analysis">
                                    <a class="hover:preset-tonal" href="/chessboard">
                                        <ChessQueen class="size-4 btn-icon"/>
                                        {$_('common.nav.chessboard')}
                                    </a>
                                </Menu.Item>
                                <Menu.Item value="database">
                                    <a class="hover:preset-tonal" href="/database">
                                        <Database class="size-4 btn-icon"/>
                                        {$_('common.nav.database')}
                                    </a>
                                </Menu.Item>
                                <Menu.Item value="account">
                                    <a class="hover:preset-tonal" href="/me">
                                        <CircleUserIcon class="size-4 btn-icon"/>
                                        {$_('common.nav.profile')}
                                    </a>
                                </Menu.Item>
                                <Menu.Item value="logout">
                                    <form method="POST" action="/logout">
                                        <button class="hover:preset-tonal" type="submit">
                                            <LogOutIcon class="size-4 btn-icon"/>
                                            {$_('common.nav.logout')}
                                        </button>
                                    </form>
                                </Menu.Item>
                            {:else}
                                <Menu.Item value="login">
                                    <a class="btn preset-filled-primary-500" href="/login">
                                        {$_('auth.login.submit')}
                                    </a>
                                </Menu.Item>
                            {/if}
                        </Menu.Content>
                    </Menu.Positioner>
                </Portal>
            </Menu>
        </AppBar.Lead>
        <AppBar.Headline>
            <a href="/" title="Accueil">
                <img alt="Kaissa" class="w-32" src="/kaissa-logo.png"/>
            </a>
        </AppBar.Headline>
        <AppBar.Trail>
            <div class="flex items-center gap-2">
                <select
                        bind:value={currentLocale}
                        class="select variant-filled-surface rounded-lg px-3 py-2 text-sm cursor-pointer"
                        disabled={isChangingLanguage}
                        onchange={handleLanguageChange}
                >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="hi">🇮🇳 हिंदी</option>
                    <option value="ca">🇮🇳 Català</option>
                </select>
                {#if isChangingLanguage}
                    <Loader2 class="size-5 animate-spin text-primary-500"/>
                {/if}
            </div>

            {#if user}
                <a class="btn-icon hover:preset-tonal" href="/me">
                    <CircleUserIcon class="size-8"/>
                    <span class="sr-only">{$_('common.nav.profile')}</span>
                </a>
                <form method="POST" action="/logout">
                    <button class="btn-icon hover:preset-tonal" type="submit">
                        <LogOutIcon class="size-8"/>
                        <span class="sr-only">{$_('common.nav.logout')}</span>
                    </button>
                </form>
            {:else}
                <a class="btn preset-filled-primary-500" href="/login">
                    {$_('auth.login.submit')}
                </a>
            {/if}
        </AppBar.Trail>
    </AppBar.Toolbar>
</AppBar>
