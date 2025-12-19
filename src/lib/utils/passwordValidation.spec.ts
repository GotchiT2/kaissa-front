import { describe, it, expect } from 'vitest';
import { validatePassword, getPasswordRulesMessage, PASSWORD_RULES } from './passwordValidation';

describe('passwordValidation', () => {
	describe('validatePassword', () => {
		it('devrait valider un mot de passe conforme à toutes les règles', () => {
			const result = validatePassword('MonMotDePasse123!');
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait rejeter un mot de passe trop court', () => {
			const result = validatePassword('Court1!');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				`Le mot de passe doit contenir au moins ${PASSWORD_RULES.minLength} caractères`
			);
		});

		it('devrait rejeter un mot de passe sans majuscule', () => {
			const result = validatePassword('monmotdepasse123!');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'Le mot de passe doit contenir au moins une lettre majuscule'
			);
		});

		it('devrait rejeter un mot de passe sans chiffre', () => {
			const result = validatePassword('MonMotDePasse!');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Le mot de passe doit contenir au moins un chiffre');
		});

		it('devrait rejeter un mot de passe sans caractère spécial', () => {
			const result = validatePassword('MonMotDePasse123');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)'
			);
		});

		it('devrait retourner plusieurs erreurs si plusieurs règles ne sont pas respectées', () => {
			const result = validatePassword('court');
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(1);
		});

		it('devrait accepter différents caractères spéciaux', () => {
			const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
			for (const char of specialChars) {
				const result = validatePassword(`MonMotDePasse123${char}`);
				expect(result.isValid).toBe(true);
			}
		});

		it('devrait valider un mot de passe complexe avec tous les critères', () => {
			const result = validatePassword('Super$ecur3P@ssw0rd!');
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait valider un mot de passe exactement de longueur minimale', () => {
			const result = validatePassword('Password123!');
			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('devrait rejeter un mot de passe vide', () => {
			const result = validatePassword('');
			expect(result.isValid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it('devrait rejeter un mot de passe avec seulement des espaces', () => {
			const result = validatePassword('            ');
			expect(result.isValid).toBe(false);
			expect(result.errors).toContain(
				'Le mot de passe doit contenir au moins une lettre majuscule'
			);
		});
	});

	describe('getPasswordRulesMessage', () => {
		it('devrait retourner un message décrivant toutes les règles', () => {
			const message = getPasswordRulesMessage();
			expect(message).toContain('12 caractères');
			expect(message).toContain('majuscule');
			expect(message).toContain('chiffre');
			expect(message).toContain('caractère spécial');
		});

		it('devrait retourner un message non vide', () => {
			const message = getPasswordRulesMessage();
			expect(message.length).toBeGreaterThan(0);
		});
	});
});
