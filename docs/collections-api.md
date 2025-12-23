# API des Collections de Parties

## Vue d'ensemble

Le système de collections permet aux utilisateurs de gérer et d'organiser leurs parties d'échecs. Chaque utilisateur peut créer plusieurs collections, et chaque collection peut contenir plusieurs parties.

## Modèle de données

### Game (Partie)

Représente une partie d'échecs avec ses métadonnées PGN.

```typescript
interface Game {
  id: string;
  whitePlayer: string;
  blackPlayer: string;
  tournament: string | null;
  date: Date | null;
  whiteElo: number | null;
  blackElo: number | null;
  moves: string;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Collection

Représente un regroupement de parties d'échecs.

```typescript
interface Collection {
  id: string;
  title: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  games: CollectionGame[];
}
```

### CollectionGame

Table de liaison entre les collections et les parties.

```typescript
interface CollectionGame {
  id: string;
  collectionId: string;
  gameId: string;
  game: Game;
  addedAt: Date;
}
```

## Services

### collection.service.ts

Service gérant la logique métier des collections de parties.

#### getUserCollections(userId: string): Promise<CollectionWithGames[]>

Récupère toutes les collections d'un utilisateur, triées par date de modification décroissante.

**Paramètres:**
- `userId`: Identifiant de l'utilisateur

**Retour:**
- Tableau de collections avec leurs parties associées

**Exemple:**
```typescript
const collections = await getUserCollections('user123');
```

#### getCollectionById(collectionId: string, userId: string): Promise<CollectionWithGames | null>

Récupère une collection spécifique appartenant à un utilisateur.

**Paramètres:**
- `collectionId`: Identifiant de la collection
- `userId`: Identifiant de l'utilisateur propriétaire

**Retour:**
- La collection avec ses parties, ou `null` si non trouvée

**Exemple:**
```typescript
const collection = await getCollectionById('col123', 'user123');
```

#### createCollection(userId: string, title: string): Promise<CollectionWithGames>

Crée une nouvelle collection pour un utilisateur.

**Paramètres:**
- `userId`: Identifiant de l'utilisateur
- `title`: Titre de la collection

**Retour:**
- La collection nouvellement créée

**Exemple:**
```typescript
const newCollection = await createCollection('user123', 'Mes parties de tournoi');
```

#### ensureDefaultCollection(userId: string): Promise<CollectionWithGames>

S'assure qu'une collection par défaut "Kaissa" existe pour l'utilisateur. Si elle n'existe pas, elle est créée.

**Paramètres:**
- `userId`: Identifiant de l'utilisateur

**Retour:**
- La collection "Kaissa" (existante ou nouvellement créée)

**Exemple:**
```typescript
const kaissaCollection = await ensureDefaultCollection('user123');
```

#### addGameToCollection(collectionId: string, gameData: CreateGameData): Promise<Game>

Ajoute une nouvelle partie à une collection.

**Paramètres:**
- `collectionId`: Identifiant de la collection
- `gameData`: Données de la partie à créer

**Retour:**
- La partie nouvellement créée

**Exemple:**
```typescript
const game = await addGameToCollection('col123', {
  whitePlayer: 'Magnus Carlsen',
  blackPlayer: 'Hikaru Nakamura',
  tournament: 'World Championship 2024',
  date: new Date('2024-01-15'),
  whiteElo: 2830,
  blackElo: 2800,
  moves: '1. e4 e5 2. Nf3 Nc6',
  result: '1-0'
});
```

## Routes

### GET /database

Charge et affiche les collections de l'utilisateur connecté.

**Réponse:**
```typescript
{
  collections: CollectionWithGames[]
}
```

**Comportement:**
1. Vérifie que l'utilisateur est authentifié
2. S'assure qu'une collection "Kaissa" existe par défaut
3. Récupère toutes les collections de l'utilisateur
4. Retourne les données au composant

## Interface utilisateur

### Page /database

La page affiche:
- Une sidebar avec la liste des collections de l'utilisateur
- Le nombre de parties dans chaque collection
- Les détails de la collection sélectionnée
- Un tableau avec les parties de la collection

**Interactions:**
- Cliquer sur une collection pour la sélectionner
- Voir les parties dans un tableau avec toutes les métadonnées
- Message informatif quand une collection est vide

## Tests

Les tests unitaires du service `collection.service.ts` couvrent:
- Récupération des collections d'un utilisateur
- Récupération d'une collection spécifique
- Création d'une nouvelle collection
- Création automatique de la collection par défaut "Kaissa"
- Ajout d'une partie à une collection
- Gestion des cas d'erreur (collection inexistante, etc.)

Exécuter les tests:
```bash
pnpm test
```

## Architecture

Le système suit les principes de Clean Architecture:

1. **Couche de données (Prisma)**: Gestion de la base de données PostgreSQL
2. **Couche de services**: Logique métier (collection.service.ts)
3. **Couche de routes serveur**: Chargement des données (+page.server.ts)
4. **Couche de présentation**: Composants Svelte (+page.svelte)

Cette séparation permet:
- Une meilleure testabilité
- Une maintenance facilitée
- Une évolution progressive du code
- Un découplage entre les couches
