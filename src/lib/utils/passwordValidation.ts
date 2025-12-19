/**
 * Règles de validation pour les mots de passe
 */
export const PASSWORD_RULES = {
	minLength: 12,
	requireUppercase: true,
	requireNumber: true,
	requireSpecialChar: true,
} as const;

/**
 * Résultat de la validation du mot de passe
 */
export interface PasswordValidationResult {
	isValid: boolean;
	errors: string[];
}

/**
 * Valide qu'un mot de passe respecte toutes les règles de sécurité
 * 
 * Règles :
 * - Minimum 12 caractères
 * - Au moins une lettre majuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * 
 * @param password - Le mot de passe à valider
 * @returns Un objet contenant le statut de validation et la liste des erreurs
 */
export function validatePassword(password: string): PasswordValidationResult {
	const errors: string[] = [];

	// Vérification de la longueur minimale
	if (password.length < PASSWORD_RULES.minLength) {
		errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_RULES.minLength} caractères`);
	}

	// Vérification de la présence d'au moins une majuscule
	if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
		errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
	}

	// Vérification de la présence d'au moins un chiffre
	if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password)) {
		errors.push('Le mot de passe doit contenir au moins un chiffre');
	}

	// Vérification de la présence d'au moins un caractère spécial
	if (PASSWORD_RULES.requireSpecialChar && !/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
		errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Obtient un message d'aide listant toutes les règles de mot de passe
 * 
 * @returns Une chaîne de caractères décrivant les règles
 */
export function getPasswordRulesMessage(): string {
	const rules = [
		`Au moins ${PASSWORD_RULES.minLength} caractères`,
		'Au moins une lettre majuscule',
		'Au moins un chiffre',
		'Au moins un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)',
	];

	return rules.join(', ');
}
