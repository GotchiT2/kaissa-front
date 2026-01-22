<script lang="ts">
  import {CircleUserIcon, LogOutIcon, MenuIcon, Loader2} from '@lucide/svelte';
  import {AppBar, ToggleGroup} from '@skeletonlabs/skeleton-svelte';
  import type {User} from 'lucia';
  import {_, locale} from '$lib/i18n';
  import {updateUserLanguage} from '$lib/services/languageService';

  let {user}: { user: User | null } = $props();

  let currentLocale = $derived([$locale ? $locale.toUpperCase() : 'FR']);
  let isChangingLanguage = $state(false);

  async function handleLanguageChange(details: { value: string[] }) {
    isChangingLanguage = true;
    try {
      const newLocale = details.value[0].toLowerCase();
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
            <div class="flex items-center gap-2">
                <ToggleGroup value={currentLocale} onValueChange={handleLanguageChange} disabled={isChangingLanguage}>
                    <ToggleGroup.Item value="FR">
                        FR
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="EN">
                        EN
                    </ToggleGroup.Item>
                </ToggleGroup>
                {#if isChangingLanguage}
                    <Loader2 class="size-5 animate-spin text-primary-500" />
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
