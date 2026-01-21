# API Parties

Documentation de l'API de gestion des parties d'échecs.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Endpoints](#endpoints)
  - [DELETE /api/parties/[id]](#delete-apipartiesid)
- [Modèle de données](#modèle-de-données)
- [Tests](#tests)

## Vue d'ensemble

L'API Parties permet de gérer les parties d'échecs dans les collections. Les parties sont liées à une collection et appartiennent indirectement à un utilisateur via la collection.

### Caractéristiques principales

- **Authentification** : Requise pour toutes les opérations
- **Autorisation** : Vérification de propriété via la collection
- **Cascade** : Suppression automatique des relations (coups, commentaires, tags)

## Endpoints

### DELETE /api/parties/[id]

Supprime une partie d'échecs et toutes ses données associées.

#### Authentification

✅ **Requise** : L'utilisateur doit être authentifié via session.

#### Autorisation

✅ **Requise** : L'utilisateur doit être propriétaire de la collection contenant la partie.

#### Paramètres de route

| Paramètre | Type   | Description           |
|-----------|--------|-----------------------|
| id        | string | ID de la partie (CUID)|

#### Réponses

**200 OK** - Partie supprimée avec succès

```json
{
  "success": true,
  "message": "Partie supprimée avec succès"
}
```

**400 Bad Request** - ID de la partie manquant

```json
{
  "message": "L'ID de la partie est requis"
}
```

**401 Unauthorized** - Utilisateur non authentifié

```json
{
  "message": "Vous devez être connecté pour supprimer une partie"
}
```

**403 Forbidden** - L'utilisateur n'est pas propriétaire de la collection

```json
{
  "message": "Vous n'êtes pas autorisé à supprimer cette partie"
}
```

**404 Not Found** - Partie introuvable

```json
{
  "message": "Partie introuvable"
}
```

**500 Internal Server Error** - Erreur serveur

```json
{
  "message": "Erreur lors de la suppression de la partie"
}
```

#### Codes de statut HTTP

| Code | Description                          |
|------|--------------------------------------|
| 200  | Partie supprimée avec succès         |
| 400  | ID de la partie manquant             |
| 401  | Authentification requise             |
| 403  | Autorisation refusée                 |
| 404  | Partie introuvable                   |
| 500  | Erreur interne du serveur            |

## Modèle de données

### PartieTravail

```typescript
interface PartieTravail {
  id: string;
  collectionId: string;
  titre: string | null;
  resultat: Resultat;
  blancNom: string | null;
  noirNom: string | null;
  blancElo: number | null;
  noirElo: number | null;
  datePartie: Date | null;
  cadence: string | null;
  site: string | null;
  event: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relations

- **Collection** : Une partie appartient à une collection (`collectionId`)
- **Coups** : Une partie contient plusieurs coups/nœuds (`CoupNoeud`)
- **Tags** : Une partie peut avoir plusieurs tags (`PartieTag`)
- **Transitions** : Une partie peut avoir des transitions matérialisées (`TransitionPartie`)

### Suppression en cascade

Lors de la suppression d'une partie, les éléments suivants sont automatiquement supprimés grâce à `onDelete: Cascade` :

- **Coups** : Tous les coups/nœuds de la partie
- **Commentaires** : Tous les commentaires sur les coups
- **Tags** : Toutes les associations de tags
- **Transitions** : Toutes les transitions matérialisées

## Exemples d'utilisation

### Supprimer une partie

```typescript
const response = await fetch(`/api/parties/${partieId}`, {
  method: 'DELETE',
});

if (response.ok) {
  const { message } = await response.json();
  console.log(message); // "Partie supprimée avec succès"
} else {
  const error = await response.json();
  console.error(error.message);
}
```

### Gestion d'erreurs complète

```typescript
async function deletePartie(partieId: string) {
  try {
    const response = await fetch(`/api/parties/${partieId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const { message } = await response.json();
    return { success: true, message };
  } catch (error) {
    console.error('Erreur lors de la suppression:', error.message);
    return { success: false, error: error.message };
  }
}

// Utilisation
const result = await deletePartie('partie_123');
if (result.success) {
  console.log(result.message);
} else {
  alert(`Erreur: ${result.error}`);
}
```

### Suppression avec confirmation

```typescript
async function deletePartieWithConfirmation(partieId: string, partieName: string) {
  const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer la partie "${partieName}" ?`);
  
  if (!confirmed) {
    return { success: false, cancelled: true };
  }

  const response = await fetch(`/api/parties/${partieId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.message };
  }

  const { message } = await response.json();
  return { success: true, message };
}
```

### Suppression avec invalidation de données

```typescript
// Dans un composant SvelteKit
import { invalidateAll } from '$app/navigation';

async function handleDeletePartie(partieId: string) {
  try {
    const response = await fetch(`/api/parties/${partieId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    // Invalider les données pour recharger les parties
    await invalidateAll();

    // Afficher un message de succès
    toaster.success({
      title: 'Succès',
      description: 'Partie supprimée avec succès',
    });
  } catch (error) {
    toaster.error({
      title: 'Erreur',
      description: error.message,
    });
  }
}
```

## Tests

### Tests d'intégration API

Les tests couvrent :

- ✅ Suppression réussie avec code 200
- ✅ Rejet si utilisateur non authentifié (401)
- ✅ Rejet si ID manquant (400)
- ✅ Rejet si partie introuvable (404)
- ✅ Rejet si utilisateur non propriétaire (403)
- ✅ Gestion des erreurs de base de données (500)

**Fichier** : `tests/api/parties-delete.spec.ts`

### Exécuter les tests

```bash
# Tous les tests
pnpm test

# Tests de suppression de parties uniquement
pnpm test parties-delete.spec.ts

# Avec coverage
pnpm run test:coverage
```

## Architecture technique

### Route Handler

**Fichier** : `src/routes/api/parties/[id]/+server.ts`

Le handler gère :
- Authentification via `locals.user`
- Récupération de la partie avec sa collection
- Vérification de propriété
- Suppression de la partie
- Gestion des erreurs

### Séquence de suppression

```
┌─────────────────┐
│  DELETE Request │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Authentification│
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Récupération   │
│  de la partie   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Vérification   │
│  propriété      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Suppression    │
│  (Cascade)      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Réponse 200 OK │
└─────────────────┘
```

## Sécurité

### Authentification

- **Session requise** : L'utilisateur doit être connecté
- **Vérification** : Via `locals.user` fourni par le middleware d'authentification

### Autorisation

- **Propriété de collection** : L'utilisateur doit être propriétaire de la collection
- **Vérification** : Via jointure avec la table `Collection`

### Protection contre les attaques

- **Injection SQL** : Protection via Prisma ORM
- **CSRF** : Protection via les mécanismes de SvelteKit
- **Autorisation** : Vérification stricte de propriété

## Bonnes pratiques

### Confirmation utilisateur

Toujours demander une confirmation avant de supprimer une partie :

```typescript
if (!confirm('Êtes-vous sûr ?')) {
  return;
}
```

### Gestion de l'état UI

Désactiver les boutons pendant la suppression :

```typescript
let isDeleting = $state(false);

async function handleDelete() {
  isDeleting = true;
  try {
    await deletePartie(partieId);
  } finally {
    isDeleting = false;
  }
}
```

### Messages utilisateur clairs

Fournir des messages d'erreur explicites :

```typescript
if (response.status === 403) {
  alert("Vous n'avez pas la permission de supprimer cette partie");
} else if (response.status === 404) {
  alert("Cette partie n'existe plus");
}
```

## Références

- [Modèle de données complet](./modele-donnees.md)
- [API Collections](./api-collections.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [SvelteKit API Routes](https://kit.svelte.dev/docs/routing#server)
