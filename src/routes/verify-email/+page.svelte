<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let form: ActionData;

	let isSubmitting = false;
</script>

<svelte:head>
	<title>Vérification de l'email - Kaissa</title>
</svelte:head>

<div class="container mx-auto max-w-md px-4 py-8">
	<div class="card p-8 shadow-xl">
		<div class="text-center mb-6">
			<h1 class="h2 mb-4">Vérification de l'email</h1>
			<p class="text-surface-600-300-token">
				Un code de vérification a été envoyé à l'adresse email :
			</p>
			<p class="font-bold text-primary-500 mt-2">{data.email}</p>
		</div>

		{#if form?.message}
			<aside class="alert variant-ghost-error mb-4">
				<div class="alert-message">
					<p>{form.message}</p>
				</div>
			</aside>
		{/if}

		<form 
			method="POST" 
			class="space-y-4"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
				};
			}}
		>
			<input type="hidden" name="email" value={data.email} />

			<label class="label">
				<span>Code de vérification</span>
				<input
					class="input"
					type="text"
					name="code"
					placeholder="123456"
					required
					minlength="6"
					maxlength="6"
					autocomplete="one-time-code"
					inputmode="numeric"
					disabled={isSubmitting}
				/>
				<p class="text-sm text-surface-600-300-token mt-1">
					Entrez le code à 6 chiffres reçu par email
				</p>
			</label>

			<button
				type="submit"
				class="btn variant-filled-primary w-full"
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Vérification en cours...' : 'Vérifier'}
			</button>
		</form>

		<div class="text-center mt-6">
			<p class="text-sm text-surface-600-300-token">
				Vous n'avez pas reçu le code ?
			</p>
			<p class="text-sm text-surface-600-300-token mt-1">
				Vérifiez vos spams ou attendez quelques minutes.
			</p>
		</div>

		<div class="text-center mt-4">
			<a href="/register" class="anchor text-sm">
				Retour à l'inscription
			</a>
		</div>
	</div>

	<div class="card p-6 mt-6 bg-surface-100-800-token">
		<div class="flex items-start gap-4">
			<div class="text-2xl">⏱️</div>
			<div>
				<h3 class="font-bold mb-1">Code valable 15 minutes</h3>
				<p class="text-sm text-surface-600-300-token">
					Le code de vérification expire après 15 minutes. Si le code a expiré, 
					vous devrez créer un nouveau compte.
				</p>
			</div>
		</div>
	</div>

	<div class="card p-6 mt-4 bg-surface-100-800-token">
		<div class="flex items-start gap-4">
			<div class="text-2xl">🔒</div>
			<div>
				<h3 class="font-bold mb-1">Sécurité</h3>
				<p class="text-sm text-surface-600-300-token">
					Ne partagez jamais votre code de vérification avec qui que ce soit. 
					L'équipe Kaissa ne vous demandera jamais ce code.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		min-height: calc(100vh - 200px);
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
</style>
