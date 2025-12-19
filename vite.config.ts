import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Environnement par défaut pour les tests
		environment: 'node',
		
		// Patterns de fichiers à inclure
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		
		// Fichiers à exclure (y compris les tests browser qui nécessitent une config spéciale)
		exclude: ['node_modules', '.svelte-kit', 'build', '**/*.svelte.{test,spec}.{js,ts}'],
		
		// Configuration des globals pour ne pas avoir à importer describe, it, expect
		globals: true,
		
		// Configuration du coverage (optionnel)
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'.svelte-kit/',
				'build/',
				'**/*.config.*',
				'**/.*',
			],
		},
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
		},
	},
});
