<script lang="ts">
	import { enhance } from '$app/forms';
	import { COUNTRIES } from '$lib/utils/countries';
	import { getPasswordRulesMessage } from '$lib/utils/passwordValidation';
	import type { ActionData } from './$types';
	import { _ } from '$lib/i18n';

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
    <title>{$_('auth.register.title')} - Kaissa</title>
</svelte:head>

<div class="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
        <div class="card variant-glass-surface p-8">
            <header class="mb-6 text-center">
                <h1 class="text-3xl font-bold">{$_('auth.register.title')}</h1>
                <p class="mt-2 text-surface-600-300-token">
                    {$_('common.app.tagline')}
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
                        <span>{$_('auth.register.email')} *</span>
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
                        <span>{$_('auth.register.firstName')} *</span>
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
                        <span>{$_('auth.register.lastName')} *</span>
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
				<span>{$_('auth.register.nationality')} *</span>
				<select
					name="nationality"
					bind:value={nationality}
					required
					class="select"
					disabled={isSubmitting}
				>
					<option value="">{$_('auth.register.nationality')}</option>
					{#each COUNTRIES as country}
						<option value={country}>{country}</option>
					{/each}
				</select>
			</label>

			<!-- Mot de passe -->
			<label class="label">
				<span>{$_('auth.register.password')} *</span>
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
				<span>{$_('auth.register.password')} *</span>
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
                        <span class="animate-pulse">{$_('common.messages.loading')}</span>
                    {:else}
                        {$_('auth.register.submit')}
                    {/if}
                </button>
            </form>

            <footer class="mt-6 text-center">
                <p class="text-sm text-surface-600-300-token">
                    {$_('auth.register.hasAccount')}
                    <a class="anchor text-primary-500" href="/login">{$_('auth.register.login')}</a>
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
