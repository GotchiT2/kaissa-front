# API Collections

Documentation de l'API de gestion des collections de parties d'échecs.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Endpoints](#endpoints)
  - [POST /api/collections](#post-apicollections)
- [Modèle de données](#modèle-de-données)
- [Closure Table](#closure-table)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Tests](#tests)

## Vue d'ensemble

L'API Collections permet de gérer les collections de parties d'échecs. Les collections sont organisées de manière hiérarchique (arborescence) avec un système de closure table pour des requêtes performantes.

### Caractéristiques principales

- **Hiérarchie** : Collections imbriquées (jusqu'à 2-3 niveaux recommandés)
- **Visibilité** : Collections privées ou publiques
- **Closure Table** : Gestion automatique pour requêtes performantes
- **Authentification** : Requise pour toutes les opérations

## Endpoints

### POST /api/collections

Crée une nouvelle collection privée pour l'utilisateur authentifié.

#### Authentification

✅ **Requise** : L'utilisateur doit être authentifié via session.

#### Paramètres de requête

**Body (JSON)** :

```typescript
{
  nom: string;       // Requis, 1-100 caractères
  parentId?: string; // Optionnel, ID de la collection parente
}
```

| Paramètre | Type   | Requis | Description                          | Contraintes           |
|-----------|--------|--------|--------------------------------------|-----------------------|
| nom       | string | ✅     | Nom de la collection                 | 1-100 caractères      |
| parentId  | string | ❌     | ID de la collection parente          | Doit exister          |

#### Réponses

**201 Created** - Collection créée avec succès

```json
{
  "success": true,
  "collection": {
    "id": "clxxx...",
    "nom": "Ma collection d'ouvertures",
    "visibilite": "PRIVEE",
    "proprietaireId": "user_123",
    "parentId": null,
    "createdAt": "2026-01-11T23:08:00.000Z",
    "updatedAt": "2026-01-11T23:08:00.000Z"
  }
}
```

**400 Bad Request** - Données invalides

```json
{
  "message": "Le nom de la collection est requis"
}
```

```json
{
  "message": "Le nom de la collection ne peut pas dépasser 100 caractères"
}
```

**401 Unauthorized** - Utilisateur non authentifié

```json
{
  "message": "Vous devez être connecté pour créer une collection"
}
```

**500 Internal Server Error** - Erreur serveur

```json
{
  "message": "Erreur lors de la création de la collection"
}
```

#### Codes de statut HTTP

| Code | Description                          |
|------|--------------------------------------|
| 201  | Collection créée avec succès         |
| 400  | Données de requête invalides         |
| 401  | Authentification requise             |
| 500  | Erreur interne du serveur            |

## Modèle de données

### Collection

```typescript
interface Collection {
  id: string;
  nom: string;
  visibilite: "PRIVEE" | "PUBLIQUE";
  proprietaireId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Relations

- **Utilisateur** : Une collection appartient à un utilisateur (`proprietaireId`)
- **Parent** : Une collection peut avoir une collection parente (`parentId`)
- **Enfants** : Une collection peut avoir plusieurs sous-collections
- **Parties** : Une collection contient plusieurs parties d'échecs

## Closure Table

### Principe

La closure table (`CollectionClosure`) maintient toutes les relations ancêtre-descendant de la hiérarchie de collections.

### Structure

```typescript
interface CollectionClosure {
  ancetreId: string;
  descendantId: string;
  profondeur: number;
}
```

### Gestion automatique

Lors de la création d'une collection :

1. **Entrée auto-référencée** : `(collection.id, collection.id, 0)`
2. **Si parent existe** : Pour chaque ancêtre du parent, créer `(ancetre.id, collection.id, profondeur + 1)`

**Exemple** :

```
Hiérarchie :
Grand-Parent (GP)
  └─ Parent (P)
      └─ Enfant (E)

Closure table :
ancetre | descendant | profondeur
--------|------------|------------
GP      | GP         | 0
P       | P          | 0
E       | E          | 0
GP      | P          | 1
GP      | E          | 2
P       | E          | 1
```

### Avantages

- **Requêtes rapides** : Récupération de tous les descendants en une seule requête
- **Performances** : Index optimisés pour les recherches hiérarchiques
- **Simplicité** : Pas besoin de récursion SQL

## Exemples d'utilisation

### Créer une collection racine

```typescript
const response = await fetch('/api/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nom: 'Mes ouvertures préférées'
  })
});

const { collection } = await response.json();
console.log(collection.id); // "clxxx..."
```

### Créer une sous-collection

```typescript
const response = await fetch('/api/collections', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nom: 'Défense Sicilienne',
    parentId: 'collection_parent_id'
  })
});

const { collection } = await response.json();
```

### Gestion d'erreurs

```typescript
try {
  const response = await fetch('/api/collections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nom: 'Ma collection'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { collection } = await response.json();
  // Collection créée avec succès
} catch (error) {
  console.error('Erreur lors de la création:', error.message);
}
```

### Validation côté client

```typescript
function validateCollectionName(nom: string): string | null {
  if (!nom || nom.trim().length === 0) {
    return "Le nom de la collection est requis";
  }

  if (nom.trim().length > 100) {
    return "Le nom ne peut pas dépasser 100 caractères";
  }

  return null; // Valide
}

// Utilisation
const error = validateCollectionName(userInput);
if (error) {
  alert(error);
} else {
  // Envoyer la requête API
}
```

## Tests

### Tests unitaires

Les tests couvrent :

- ✅ Création de collection racine avec closure table
- ✅ Création de sous-collection avec entrées closure appropriées
- ✅ Récupération des collections d'un utilisateur
- ✅ Récupération d'une collection par ID

**Fichier** : `tests/services/collection.service.spec.ts`

### Tests d'intégration API

Les tests couvrent :

- ✅ Création réussie avec code 201
- ✅ Trim automatique du nom
- ✅ Rejet si utilisateur non authentifié (401)
- ✅ Rejet si nom manquant (400)
- ✅ Rejet si nom vide après trim (400)
- ✅ Rejet si nom > 100 caractères (400)
- ✅ Rejet si nom n'est pas une chaîne (400)
- ✅ Gestion des erreurs du service (500)

**Fichier** : `tests/api/collections.spec.ts`

### Exécuter les tests

```bash
# Tous les tests
npm test

# Tests du service uniquement
npm test collection.service.spec.ts

# Tests de l'API uniquement
npm test collections.spec.ts

# Avec coverage
npm run test:coverage
```

## Architecture technique

### Service Layer

**Fichier** : `src/lib/server/services/collection.service.ts`

Le service encapsule la logique métier :
- Création de collection avec gestion de la closure table
- Récupération des collections d'un utilisateur
- Récupération d'une collection spécifique

### Route Handler

**Fichier** : `src/routes/api/collections/+server.ts`

Le handler gère :
- Authentification via `locals.user`
- Validation des entrées
- Appel au service
- Formatage des réponses
- Gestion des erreurs

### Séparation des responsabilités

```
┌─────────────────┐
│  Route Handler  │  ← Validation, Auth, HTTP
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Service     │  ← Logique métier
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Prisma DB     │  ← Accès données
└─────────────────┘
```

## Optimisations futures

### Index additionnels

Pour de très gros volumes :

```sql
-- Index partiel pour collections publiques
CREATE INDEX idx_collections_public 
ON "Collection"("nom") 
WHERE "visibilite" = 'PUBLIQUE';

-- Index composite pour recherche rapide
CREATE INDEX idx_collections_owner_updated 
ON "Collection"("proprietaireId", "updatedAt" DESC);
```

### Pagination

Pour les listes de collections :

```typescript
GET /api/collections?page=1&limit=20
```

### Recherche

Pour filtrer les collections :

```typescript
GET /api/collections?search=sicilienne
```

### Tri

Pour trier les résultats :

```typescript
GET /api/collections?sort=nom&order=asc
```

## Références

- [Modèle de données complet](./modele-donnees.md)
- [Closure Table Pattern](https://www.slideshare.net/billkarwin/models-for-hierarchical-data)
- [Prisma Documentation](https://www.prisma.io/docs)
- [SvelteKit API Routes](https://kit.svelte.dev/docs/routing#server)
