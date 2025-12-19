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
  id       String    @id
  email    String    @unique
  password String
  sessions Session[]
}
```

**Champs :**
- `id` : Identifiant unique de l'utilisateur (String)
- `email` : Adresse email de l'utilisateur (unique)
- `password` : Mot de passe hashé de l'utilisateur
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
- Attributs utilisateur exposés : `email`
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

⚠️ **Important :** Le schéma actuel stocke un champ `password`, mais le code de hashage n'est pas visible dans `auth.ts`.

**Recommandations :**
- Utiliser **Argon2** (recommandé) ou **bcrypt** pour hasher les mots de passe
- Ne jamais stocker de mots de passe en clair
- Implémenter un service dédié pour la gestion des mots de passe

**Exemple avec Oslo (pour future migration) :**
```typescript
import { Argon2id } from "oslo/password";

const argon2id = new Argon2id();
const hashedPassword = await argon2id.hash(password);
const isValid = await argon2id.verify(hashedPassword, password);
```

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

## 🚀 Prochaines étapes

1. **Décider de la stratégie** : Migration vers Lucia v4 ou maintien de v3
2. **Implémenter le hashage des mots de passe** si ce n'est pas déjà fait
3. **Créer les routes d'authentification** :
   - `/login` : Connexion
   - `/register` : Inscription
   - `/logout` : Déconnexion
4. **Ajouter la validation des formulaires**
5. **Implémenter la gestion des erreurs**
6. **Créer les tests d'authentification**
7. **Documenter les workflows utilisateurs**

## 📚 Ressources

- [Documentation Lucia v3](https://v3.lucia-auth.com/)
- [Guide de migration Lucia v3 → v4](https://lucia-auth.com/lucia-v3/migrate)
- [Oslo (cryptographie)](https://oslo.js.org/)
- [Arctic (OAuth)](https://arctic.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)
