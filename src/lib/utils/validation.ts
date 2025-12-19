/**
 * Utilitaires de validation pour les formulaires
 */

/**
 * Valide le format d'une adresse email
 * 
 * @param email - L'adresse email à valider
 * @returns true si l'email est valide, false sinon
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Valide qu'une chaîne n'est pas vide
 * 
 * @param value - La valeur à valider
 * @returns true si la valeur n'est pas vide, false sinon
 */
export function isNotEmpty(value: string): boolean {
	return value.length > 0;
}

/**
 * Résultat de validation d'un champ de formulaire
 */
export interface FieldValidationResult {
	isValid: boolean;
	error?: string;
}

/**
 * Valide un champ email de formulaire
 * 
 * @param email - L'email à valider
 * @returns Un objet avec le statut de validation et l'erreur éventuelle
 */
export function validateEmailField(email: unknown): FieldValidationResult {
	if (!email || typeof email !== 'string' || !isNotEmpty(email)) {
		return {
			isValid: false,
			error: "L'adresse email est requise",
		};
	}

	if (!validateEmail(email)) {
		return {
			isValid: false,
			error: "L'adresse email n'est pas valide",
		};
	}

	return { isValid: true };
}

/**
 * Valide un champ de mot de passe
 * 
 * @param password - Le mot de passe à valider
 * @returns Un objet avec le statut de validation et l'erreur éventuelle
 */
export function validatePasswordField(password: unknown): FieldValidationResult {
	if (!password || typeof password !== 'string' || !isNotEmpty(password)) {
		return {
			isValid: false,
			error: 'Le mot de passe est requis',
		};
	}

	return { isValid: true };
}
