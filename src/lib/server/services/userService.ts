import { prisma } from '$lib/server/db';
import { generateIdFromEntropySize } from 'lucia';
import type { User } from '@prisma/client';

/**
 * Service utilisateur
 * Gère les opérations CRUD sur les utilisateurs
 */

/**
 * Données pour créer un nouvel utilisateur
 */
export interface CreateUserData {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	nationality: string;
}

/**
 * Recherche un utilisateur par son adresse email
 * 
 * @param email - L'adresse email à rechercher
 * @returns L'utilisateur trouvé ou null si aucun utilisateur ne correspond
 */
export async function findUserByEmail(email: string): Promise<User | null> {
	return prisma.user.findUnique({
		where: { email },
	});
}

/**
 * Vérifie si un utilisateur existe avec l'email donné
 * 
 * @param email - L'adresse email à vérifier
 * @returns true si un utilisateur existe, false sinon
 */
export async function userExists(email: string): Promise<boolean> {
	const user = await findUserByEmail(email);
	return user !== null;
}

/**
 * Crée un nouvel utilisateur dans la base de données
 * 
 * @param data - Les données de l'utilisateur à créer
 * @returns L'utilisateur créé
 */
export async function createUser(data: CreateUserData): Promise<User> {
	const userId = generateIdFromEntropySize(10);

	return prisma.user.create({
		data: {
			id: userId,
			email: data.email,
			password: data.password,
			firstName: data.firstName,
			lastName: data.lastName,
			nationality: data.nationality,
		},
	});
}

/**
 * Définit le code de vérification pour un utilisateur
 * 
 * @param userId - L'identifiant de l'utilisateur
 * @param code - Le code de vérification
 * @param expiresAt - La date d'expiration du code
 * @returns L'utilisateur mis à jour
 */
export async function setVerificationCode(
	userId: string,
	code: string,
	expiresAt: Date
): Promise<User> {
	return prisma.user.update({
		where: { id: userId },
		data: {
			verificationCode: code,
			verificationCodeExpiresAt: expiresAt,
		},
	});
}

/**
 * Vérifie le code de vérification d'un utilisateur
 * 
 * @param userId - L'identifiant de l'utilisateur
 * @param code - Le code à vérifier
 * @returns true si le code est valide, false sinon
 */
export async function verifyUserCode(userId: string, code: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
	});

	if (!user) {
		return false;
	}

	if (!user.verificationCode || !user.verificationCodeExpiresAt) {
		return false;
	}

	if (user.verificationCode !== code) {
		return false;
	}

	if (new Date() > user.verificationCodeExpiresAt) {
		return false;
	}

	return true;
}

/**
 * Marque l'email d'un utilisateur comme vérifié et nettoie le code de vérification
 * 
 * @param userId - L'identifiant de l'utilisateur
 * @returns L'utilisateur mis à jour
 */
export async function markEmailAsVerified(userId: string): Promise<User> {
	return prisma.user.update({
		where: { id: userId },
		data: {
			emailVerified: true,
			verificationCode: null,
			verificationCodeExpiresAt: null,
		},
	});
}
