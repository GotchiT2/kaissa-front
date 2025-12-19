# Documentation - Authentification

## Vue d'ensemble

Le projet Kaissa utilise **Lucia** pour gérer l'authentification des utilisateurs avec **Prisma** comme ORM pour la persistance des données.

## Configuration actuelle

### Stack d'authentification

- **Lucia** v3.2.2
- **@lucia-auth/adapter-prisma** v4.0.1
- **Prisma** v7.2.0
- **Base de données** : PostgreSQL

### Structure des données

#### Modèle User (Prisma)

```prisma
model User {
  id          String    @id
  email       String    @unique
  password    String
  firstName   String
  lastName    String
  nationality String
  sessions    Session[]
}
```

**Champs :**
- `id` : Identifiant unique de l'utilisateur (String)
- `email` : Adresse email de l'utilisateur (unique)
- `password` : Mot de passe hashé de l'utilisateur (Argon2id)
- `firstName` : Prénom de l'utilisateur
- `lastName` : Nom de famille de l'utilisateur
- `nationality` : Nationalité de l'utilisateur
- `sessions` : Relation vers les sessions actives de l'utilisateur

#### Modèle Session (Prisma)

```prisma
model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Champs :**
- `id` : Identifiant unique de la session
- `userId` : Référence vers l'utilisateur
- `expiresAt` : Date d'expiration de la session
- `user` : Relation vers le modèle User (suppression en cascade)

### Configuration de Lucia

Fichier : `src/lib/server/auth.ts`

```typescript
import { Lucia } from "lucia";
import { dev } from "$app/environment";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();
const adapter = new PrismaAdapter(client.session, client.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: !dev, // HTTPS uniquement en production
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
    };
  },
});
```

**Fonctionnalités :**
- Cookies de session sécurisés (HTTPS en production)
- Attributs utilisateur exposés : `email`, `firstName`, `lastName`, `nationality`
- Adapter Prisma pour la persistance des sessions

## ⚠️ Avertissements importants

### 1. Dépréciation de Lucia v3

**Statut :** Lucia v3 et son adapter Prisma sont **dépréciés**.

**Message d'avertissement :**
```
WARN deprecated lucia@3.2.2: This package has been deprecated. 
Please see https://lucia-auth.com/lucia-v3/migrate.

WARN deprecated @lucia-auth/adapter-prisma@4.0.1: This package has been deprecated. 
Please see https://lucia-auth.com/lucia-v3/migrate.
```

**Impact :**
- Pas de nouvelles fonctionnalités
- Pas de correctifs de bugs (sauf critiques)
- Support communautaire limité

### 2. Incompatibilité de version avec Prisma

**Problème :** L'adapter Prisma de Lucia attend Prisma v4 ou v5, mais le projet utilise Prisma v7.

**Message d'avertissement :**
```
Issues with peer dependencies found
├─┬ @lucia-auth/adapter-prisma 4.0.1
│ └── ✕ unmet peer @prisma/client@"^4.2.0 || ^5.0.0": found 7.2.0
```

**Conséquences potentielles :**
- Risque de bugs liés à l'incompatibilité
- Comportements non testés avec Prisma v7
- Problèmes potentiels lors des mises à jour

## 📋 Recommandations

### Option 1 : Migrer vers Lucia v4 (Arctic + Oslo) - **RECOMMANDÉ**

Lucia v4 utilise une approche différente avec deux bibliothèques complémentaires :
- **Arctic** : Gestion de l'authentification OAuth
- **Oslo** : Utilitaires cryptographiques et de sécurité

**Avantages :**
- ✅ Support actif et maintenance continue
- ✅ Compatible avec Prisma v7
- ✅ Architecture plus modulaire
- ✅ Meilleures performances

**Inconvénients :**
- ❌ Nécessite une refonte du code d'authentification
- ❌ Changement d'API significatif

**Documentation de migration :** https://lucia-auth.com/lucia-v3/migrate

### Option 2 : Rester avec Lucia v3

**Avantages :**
- ✅ Pas de refonte nécessaire
- ✅ Code fonctionnel actuel

**Inconvénients :**
- ❌ Package déprécié
- ❌ Incompatibilité avec Prisma v7
- ❌ Risques de sécurité à long terme
- ❌ Pas de support futur

**À faire si cette option est choisie :**
- Surveiller les problèmes liés à Prisma v7
- Prévoir une migration future
- Tester exhaustivement l'authentification

### Option 3 : Downgrader Prisma à la version 5

**Non recommandé** car :
- Perte des fonctionnalités de Prisma v7
- Dette technique accrue
- Ne résout pas le problème de dépréciation de Lucia

## 🔐 Bonnes pratiques de sécurité

### Hashage des mots de passe

✅ **Implémentation actuelle :** Les mots de passe sont hashés avec **Argon2id** via la bibliothèque `oslo`.

**Fichier :** `src/routes/register/+page.server.ts`

```typescript
import { Argon2id } from "oslo/password";

const argon2id = new Argon2id();
const hashedPassword = await argon2id.hash(password);
```

**Caractéristiques :**
- Algorithme : Argon2id (recommandé pour le hashage de mots de passe)
- Les mots de passe ne sont jamais stockés en clair
- Vérification lors de la connexion avec `argon2id.verify()`

⚠️ **Note :** La bibliothèque `oslo` est dépréciée. Lors de la migration vers Lucia v4, utiliser `@oslojs/crypto`.

### Validation des données

- Valider tous les emails avec une regex appropriée
- Imposer des règles de complexité pour les mots de passe
- Limiter les tentatives de connexion (rate limiting)
- Implémenter une double authentification (2FA) si nécessaire

### Gestion des sessions

- Définir une durée d'expiration appropriée
- Invalider les sessions lors de la déconnexion
- Permettre la révocation des sessions actives
- Logger les activités suspectes

## ✅ Routes d'authentification implémentées

### Page d'inscription (`/register`)

**Fichiers :**
- `src/routes/register/+page.svelte` : Interface utilisateur
- `src/routes/register/+page.server.ts` : Logique serveur

**Fonctionnalités :**
- Formulaire avec validation côté client et serveur
- Champs : email, prénom, nom, nationalité (sélecteur), mot de passe, confirmation
- Validation du format email (regex)
- **Règles de mot de passe renforcées** :
  - Minimum 12 caractères
  - Au moins une lettre majuscule
  - Au moins un chiffre
  - Au moins un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?)
- Vérification de la correspondance des mots de passe
- Vérification de l'unicité de l'email
- **Sélecteur de nationalité** avec liste complète des pays (195 pays)
- Validation que la nationalité sélectionnée fait partie de la liste
- Hashage sécurisé avec Argon2id
- Création automatique d'une session après inscription
- Redirection vers la page d'accueil après succès
- Affichage des erreurs de validation

**Exemple de workflow :**
1. L'utilisateur remplit le formulaire d'inscription
2. Les données sont validées côté serveur
3. Le mot de passe est hashé avec Argon2id
4. L'utilisateur est créé dans la base de données
5. Une session est créée automatiquement
6. L'utilisateur est redirigé vers la page d'accueil, connecté

## ✅ Tests

### Tests unitaires

**Fichier** : `src/lib/utils/passwordValidation.spec.ts`

Tests de la validation des mots de passe :
- Validation d'un mot de passe conforme
- Rejet des mots de passe trop courts
- Rejet des mots de passe sans majuscule
- Rejet des mots de passe sans chiffre
- Rejet des mots de passe sans caractère spécial
- Gestion des erreurs multiples
- Acceptation de tous les caractères spéciaux autorisés

**Fichier** : `src/routes/register/+page.server.spec.ts`

Tests de l'action serveur d'inscription :
- Validation de tous les champs requis
- Validation du format email
- Validation des règles de mot de passe
- Vérification de la correspondance des mots de passe
- Validation de la nationalité
- Vérification du hashage des mots de passe

### Exécution des tests

```bash
# Exécuter tous les tests
pnpm test

# Exécuter les tests en mode watch
pnpm test:unit

# Exécuter les tests de validation du mot de passe
pnpm test src/lib/utils/passwordValidation.spec.ts
```

## 📁 Fichiers créés et modifiés

### Nouveaux fichiers

1. **`src/lib/utils/countries.ts`** : Liste complète des pays (195 pays)
2. **`src/lib/utils/passwordValidation.ts`** : Fonctions de validation du mot de passe
3. **`src/lib/utils/passwordValidation.spec.ts`** : Tests unitaires de validation
4. **`src/routes/register/+page.server.spec.ts`** : Tests de l'action serveur
5. **`src/lib/server/db.ts`** : Service partagé pour PrismaClient

### Fichiers modifiés

1. **`src/routes/register/+page.svelte`** :
   - Ajout du sélecteur de pays
   - Affichage des règles de mot de passe
   - Mise à jour des validations HTML5
   
2. **`src/routes/register/+page.server.ts`** :
   - Intégration de la validation du mot de passe
   - Validation de la nationalité
   - Messages d'erreur détaillés

3. **`src/lib/server/auth.ts`** :
   - Utilisation du service partagé PrismaClient

## 🚀 Prochaines étapes

1. **Décider de la stratégie** : Migration vers Lucia v4 ou maintien de v3
2. **Créer les routes d'authentification manquantes** :
   - `/login` : Connexion
   - `/logout` : Déconnexion
3. **Ajouter la gestion de session** :
   - Middleware de vérification de session
   - Protection des routes privées
   - Affichage conditionnel selon l'état de connexion
4. **Créer les tests d'authentification**
5. **Implémenter la réinitialisation de mot de passe**
6. **Documenter les workflows utilisateurs**

## 📚 Ressources

- [Documentation Lucia v3](https://v3.lucia-auth.com/)
- [Guide de migration Lucia v3 → v4](https://lucia-auth.com/lucia-v3/migrate)
- [Oslo (cryptographie)](https://oslo.js.org/)
- [Arctic (OAuth)](https://arctic.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
