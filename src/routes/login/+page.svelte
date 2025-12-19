<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let email = $state(form?.email || '');
	let password = $state('');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Se connecter - Kaissa</title>
</svelte:head>

<div class="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
	<div class="w-full max-w-md">
		<div class="card variant-glass-surface p-8">
			<header class="mb-6 text-center">
				<h1 class="text-3xl font-bold">Connexion</h1>
				<p class="mt-2 text-surface-600-300-token">
					Accédez à votre compte Kaissa
				</p>
			</header>

			{#if form?.message}
				<aside class="alert variant-filled-error mb-6">
					<div class="alert-message">
						<p>{form.message}</p>
					</div>
				</aside>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						await update();
						isSubmitting = false;
					};
				}}
			>
				<div class="space-y-4">
					<!-- Email -->
					<label class="label">
						<span>Adresse email</span>
						<input
							bind:value={email}
							class="input"
							disabled={isSubmitting}
							name="email"
							placeholder="votre.email@exemple.com"
							required
							type="email"
						/>
					</label>

					<!-- Mot de passe -->
					<label class="label">
						<span>Mot de passe</span>
						<input
							bind:value={password}
							class="input"
							disabled={isSubmitting}
							name="password"
							placeholder="••••••••••••"
							required
							type="password"
						/>
					</label>
				</div>

				<button
					class="btn variant-filled-primary mt-6 w-full"
					disabled={isSubmitting}
					type="submit"
				>
					{#if isSubmitting}
						<span class="animate-pulse">Connexion en cours...</span>
					{:else}
						Se connecter
					{/if}
				</button>
			</form>

			<footer class="mt-6 space-y-3 text-center">
				<p class="text-sm text-surface-600-300-token">
					Vous n'avez pas encore de compte ?
					<a class="anchor text-primary-500" href="/register">Créer un compte</a>
				</p>
			</footer>
		</div>
	</div>
</div>

<style>
	.card {
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
	}
</style>
