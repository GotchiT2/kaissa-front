import { lucia } from '$lib/server/auth';
import { Argon2id } from 'oslo/password';
import type { Cookies } from '@sveltejs/kit';

/**
 * Service d'authentification
 * Gère les opérations liées à l'authentification des utilisateurs
 */

/**
 * Hashe un mot de passe avec Argon2id
 * 
 * @param password - Le mot de passe en clair à hasher
 * @returns Le mot de passe hashé
 */
export async function hashPassword(password: string): Promise<string> {
	const argon2id = new Argon2id();
	return argon2id.hash(password);
}

/**
 * Vérifie qu'un mot de passe correspond au hash stocké
 * 
 * @param hashedPassword - Le mot de passe hashé stocké en base de données
 * @param password - Le mot de passe en clair à vérifier
 * @returns true si le mot de passe correspond, false sinon
 */
export async function verifyPassword(hashedPassword: string, password: string): Promise<boolean> {
	const argon2id = new Argon2id();
	return argon2id.verify(hashedPassword, password);
}

/**
 * Crée une session utilisateur et définit le cookie correspondant
 * 
 * @param userId - L'identifiant de l'utilisateur pour lequel créer la session
 * @param cookies - L'objet cookies de SvelteKit pour définir le cookie de session
 */
export async function createUserSession(userId: string, cookies: Cookies): Promise<void> {
	const session = await lucia.createSession(userId, {});
	const sessionCookie = lucia.createSessionCookie(session.id);
	cookies.set(sessionCookie.name, sessionCookie.value, {
		path: '.',
		...sessionCookie.attributes,
	});
}
