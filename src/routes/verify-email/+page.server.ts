import { fail, redirect } from '@sveltejs/kit';
import { findUserByEmail, verifyUserCode, markEmailAsVerified } from '$lib/server/services/userService';
import { createUserSession } from '$lib/server/services/authService';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const email = url.searchParams.get('email');
	
	if (!email) {
		throw redirect(302, '/register');
	}

	return {
		email
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const code = formData.get('code');

		if (!email || typeof email !== 'string') {
			return fail(400, {
				message: 'Email invalide',
			});
		}

		if (!code || typeof code !== 'string') {
			return fail(400, {
				message: 'Le code de vérification est requis',
				email,
			});
		}

		try {
			const user = await findUserByEmail(email);

			if (!user) {
				return fail(400, {
					message: 'Utilisateur introuvable',
					email,
				});
			}

			if (user.emailVerified) {
				return fail(400, {
					message: 'Votre email est déjà vérifié',
					email,
				});
			}

			const isCodeValid = await verifyUserCode(user.id, code);

			if (!isCodeValid) {
				return fail(400, {
					message: 'Code de vérification invalide ou expiré',
					email,
				});
			}

			await markEmailAsVerified(user.id);

			await createUserSession(user.id, cookies);
		} catch (error) {
			console.error('Erreur lors de la vérification du code:', error);
			return fail(500, {
				message: 'Une erreur est survenue lors de la vérification',
				email,
			});
		}

		throw redirect(302, '/');
	},
};
