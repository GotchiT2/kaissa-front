<script lang="ts">
	import { CircleUserIcon, MenuIcon } from '@lucide/svelte';
	import { AppBar, ToggleGroup } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar class="border-b-1 border-b-primary-100 bg-[#121212]">
	<AppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
		<AppBar.Lead>
			<button class="btn-icon btn-icon-lg hover:preset-tonal" type="button">
				<MenuIcon />
			</button>
		</AppBar.Lead>
		<AppBar.Headline>
			<a href="/" title="Accueil">
				<img alt="Kaissa" class="w-32" src="/kaissa-logo.png" />
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
			<a class="btn-icon hover:preset-tonal" href="/me">
				<CircleUserIcon class="size-8" />
				<span class="sr-only">Profil</span>
			</a>
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>