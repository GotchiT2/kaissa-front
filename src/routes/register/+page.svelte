<script lang="ts">
	import { enhance } from '$app/forms';
	import { COUNTRIES } from '$lib/utils/countries';
	import { getPasswordRulesMessage } from '$lib/utils/passwordValidation';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let email = $state(form?.email || '');
	let password = $state('');
	let confirmPassword = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let nationality = $state('');
	let isSubmitting = $state(false);

	const passwordRules = getPasswordRulesMessage();
</script>

<svelte:head>
    <title>Créer un compte - Kaissa</title>
</svelte:head>

<div class="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
        <div class="card variant-glass-surface p-8">
            <header class="mb-6 text-center">
                <h1 class="text-3xl font-bold">Créer un compte</h1>
                <p class="mt-2 text-surface-600-300-token">
                    Rejoignez Kaissa pour gérer vos tournois d'échecs
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
                        <span>Adresse email *</span>
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

                    <!-- Prénom -->
                    <label class="label">
                        <span>Prénom *</span>
                        <input
                                bind:value={firstName}
                                class="input"
                                disabled={isSubmitting}
                                name="firstName"
                                placeholder="Jean"
                                required
                                type="text"
                        />
                    </label>

                    <!-- Nom -->
                    <label class="label">
                        <span>Nom *</span>
                        <input
                                bind:value={lastName}
                                class="input"
                                disabled={isSubmitting}
                                name="lastName"
                                placeholder="Dupont"
                                required
                                type="text"
                        />
                    </label>

			<!-- Nationalité -->
			<label class="label">
				<span>Nationalité *</span>
				<select
					name="nationality"
					bind:value={nationality}
					required
					class="select"
					disabled={isSubmitting}
				>
					<option value="">Sélectionnez votre nationalité</option>
					{#each COUNTRIES as country}
						<option value={country}>{country}</option>
					{/each}
				</select>
			</label>

			<!-- Mot de passe -->
			<label class="label">
				<span>Mot de passe *</span>
				<input
					type="password"
					name="password"
					bind:value={password}
					required
					minlength="12"
					class="input"
					placeholder="••••••••••••"
					disabled={isSubmitting}
				/>
				<span class="text-sm text-surface-600-300-token">
					{passwordRules}
				</span>
			</label>

			<!-- Confirmation du mot de passe -->
			<label class="label">
				<span>Confirmer le mot de passe *</span>
				<input
					type="password"
					name="confirmPassword"
					bind:value={confirmPassword}
					required
					minlength="12"
					class="input"
					placeholder="••••••••••••"
					disabled={isSubmitting}
				/>
			</label>
                </div>

                <button
                        class="btn variant-filled-primary mt-6 w-full"
                        disabled={isSubmitting}
                        type="submit"
                >
                    {#if isSubmitting}
                        <span class="animate-pulse">Création du compte...</span>
                    {:else}
                        Créer mon compte
                    {/if}
                </button>
            </form>

            <footer class="mt-6 text-center">
                <p class="text-sm text-surface-600-300-token">
                    Vous avez déjà un compte ?
                    <a class="anchor text-primary-500" href="/login">Se connecter</a>
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
