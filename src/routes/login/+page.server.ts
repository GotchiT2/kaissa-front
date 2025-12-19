import { fail, redirect } from '@sveltejs/kit';
import { validateEmailField, validatePasswordField } from '$lib/utils/validation';
import { createUserSession, verifyPassword } from '$lib/server/services/authService';
import { findUserByEmail } from '$lib/server/services/userService';
import type { Actions, PageServerLoad } from './$types';

// Vérifier si l'utilisateur est déjà connecté
export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/database');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		// Validation de l'email
		const emailValidation = validateEmailField(email);
		if (!emailValidation.isValid) {
			return fail(400, {
				message: emailValidation.error!,
				email: email?.toString() || '',
			});
		}

		// Validation du mot de passe
		const passwordValidation = validatePasswordField(password);
		if (!passwordValidation.isValid) {
			return fail(400, {
				message: passwordValidation.error!,
				email: email!.toString(),
			});
		}

		try {
			// Récupérer l'utilisateur de la base de données
			const existingUser = await findUserByEmail(email as string);

			if (!existingUser) {
				// Utilisateur non trouvé - message générique pour la sécurité
				return fail(400, {
					message: 'Email ou mot de passe incorrect',
					email: email!.toString(),
				});
			}

			// Vérifier le mot de passe
			const validPassword = await verifyPassword(existingUser.password, password as string);

			if (!validPassword) {
				// Mot de passe incorrect - message générique pour la sécurité
				return fail(400, {
					message: 'Email ou mot de passe incorrect',
					email: email!.toString(),
				});
			}

			// Créer une session pour l'utilisateur
			await createUserSession(existingUser.id, cookies);
		} catch (error) {
			console.error('Erreur lors de la connexion:', error);
			return fail(500, {
				message: 'Une erreur est survenue lors de la connexion',
				email: email!.toString(),
			});
		}

		// Rediriger vers la page database après connexion réussie
		throw redirect(302, '/database');
	},
};
