# API des Collections de Parties

## Vue d'ensemble

Le système de collections permet aux utilisateurs de gérer et d'organiser leurs parties d'échecs. Chaque utilisateur peut créer plusieurs collections, et chaque collection peut contenir plusieurs parties.

## Modèle de données

### PartieTravail (Partie)

Représente une partie d'échecs avec ses métadonnées.

```typescript
interface PartieTravail {
  id: string;
  collectionId: string;
  titre: string | null;
  resultat: 'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU';
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

### Collection

Représente un regroupement de parties d'échecs.

```typescript
interface Collection {
  id: string;
  nom: string;
  visibilite: 'PRIVEE' | 'PUBLIQUE';
  proprietaireId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parties: PartieTravail[];
}
```

## Services

### collection.service.ts

Service gérant la logique métier des collections de parties.

#### getUserCollections(userId: string)

Récupère toutes les collections d'un utilisateur, triées par date de modification décroissante.

**Paramètres:**
- `userId`: Identifiant de l'utilisateur

**Retour:**
- Tableau de collections avec leurs parties et le nombre de parties

**Exemple:**
```typescript
const collections = await getUserCollections('user123');
```

#### getCollectionById(collectionId: string, userId: string)

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

#### createCollection(data: CreateCollectionData)

Crée une nouvelle collection pour un utilisateur.

**Paramètres:**
- `data`: Objet contenant les informations de la collection
  - `nom`: Nom de la collection (requis)
  - `proprietaireId`: Identifiant de l'utilisateur (requis)
  - `parentId`: Identifiant de la collection parente (optionnel)

**Retour:**
- La collection nouvellement créée

**Exemple:**
```typescript
const newCollection = await createCollection({
  nom: 'Mes parties de tournoi',
  proprietaireId: 'user123'
});
```

## Routes API

### POST /api/collections

Crée une nouvelle collection.

**Headers:**
- `Content-Type: application/json`

**Corps de la requête:**
```json
{
  "nom": "Nom de la collection"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "collection": {
    "id": "col_xyz",
    "nom": "Nom de la collection",
    "proprietaireId": "user123",
    "visibilite": "PRIVEE",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**Erreurs:**
- `401`: Utilisateur non authentifié
- `400`: Nom de collection invalide (vide, trop long > 100 caractères)
- `500`: Erreur serveur

### POST /api/collections/[id]/import

Importe des parties d'échecs depuis un fichier PGN dans une collection.

**Headers:**
- `Content-Type: multipart/form-data`

**Corps de la requête:**
- `file`: Fichier PGN (extension .pgn requise)

**Réponse (200):**
```json
{
  "success": true,
  "message": "5 partie(s) importée(s) avec succès",
  "imported": 5,
  "total": 5
}
```

**Erreurs:**
- `401`: Utilisateur non authentifié
- `404`: Collection non trouvée
- `400`: Aucun fichier fourni ou format invalide
- `500`: Erreur lors du parsing ou de la sauvegarde

### GET /database

Charge et affiche les collections de l'utilisateur connecté.

**Réponse:**
```typescript
{
  collections: Collection[]
}
```

**Comportement:**
1. Vérifie que l'utilisateur est authentifié
2. Récupère toutes les collections de l'utilisateur avec leurs parties
3. Retourne les données au composant

## Import de fichiers PGN

### Utilitaire parsePGNFile

Situé dans `src/lib/server/utils/pgnParser.ts`, cet utilitaire parse les fichiers PGN et extrait les métadonnées des parties.

**Fonction:** `parsePGNFile(pgnContent: string): ParsedGame[]`

**Paramètres:**
- `pgnContent`: Contenu du fichier PGN sous forme de chaîne

**Retour:**
- Tableau de parties parsées avec leurs métadonnées

**Structure de ParsedGame:**
```typescript
interface ParsedGame {
  blancNom: string;
  noirNom: string;
  blancElo?: number;
  noirElo?: number;
  event?: string;
  site?: string;
  datePartie?: Date;
  resultat: 'BLANCS' | 'NOIRS' | 'NULLE' | 'INCONNU';
  moves: string;
}
```

**Métadonnées extraites:**
- Noms des joueurs (White/Black)
- ELO des joueurs (WhiteElo/BlackElo)
- Événement (Event)
- Site (Site)
- Date (Date, format YYYY.MM.DD)
- Résultat (Result: 1-0, 0-1, 1/2-1/2, *)
- Tous les coups de la partie

**Gestion des erreurs:**
- Lance une erreur si aucune partie n'est trouvée dans le fichier
- Log les erreurs de parsing pour chaque partie individuelle
- Continue le parsing même si certaines parties échouent

**Exemple:**
```typescript
const pgnContent = `
[Event "World Championship"]
[Site "London"]
[Date "2024.01.15"]
[White "Carlsen, Magnus"]
[Black "Nakamura, Hikaru"]
[Result "1-0"]
[WhiteElo "2830"]
[BlackElo "2800"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0
`;

const games = parsePGNFile(pgnContent);
// Retourne un tableau avec une partie
```

## Interface utilisateur

### Page /database

La page affiche:
- Une sidebar avec la liste des collections de l'utilisateur
- Un bouton "+" pour créer une nouvelle collection
- Le nombre de parties dans chaque collection
- Les détails de la collection sélectionnée
- Un tableau avec les parties de la collection
- Un bouton "Importer une partie" pour ajouter des parties depuis un fichier PGN

**Interactions:**
- Cliquer sur le bouton "+" pour ouvrir une modale de création de collection
- Cliquer sur une collection pour la sélectionner
- Cliquer sur "Importer une partie" pour ouvrir une modale d'import de fichier PGN
- Voir les parties dans un tableau avec toutes les métadonnées
- Message informatif quand une collection est vide

### Composant ImportGame

Le composant `ImportGame.svelte` gère l'import de fichiers PGN.

**Props:**
- `collectionId`: Identifiant de la collection cible (requis)
- `onSuccess`: Callback appelé en cas de succès (optionnel)
- `onError`: Callback appelé en cas d'erreur (optionnel)

**Fonctionnalités:**
- Zone de drag & drop pour les fichiers
- Validation du format (.pgn uniquement)
- Affichage de la taille du fichier
- État de chargement pendant l'import
- Rechargement automatique des données après succès

**Exemple d'utilisation:**
```svelte
<ImportGame 
  collectionId={selectedCollectionId} 
  onSuccess={(message) => showSuccessToast(message)}
  onError={(message) => showErrorToast(message)}
/>
```

## Tests

Les tests unitaires couvrent:

### collection.service.ts
- Récupération des collections d'un utilisateur
- Récupération d'une collection spécifique
- Création d'une nouvelle collection
- Gestion des cas d'erreur (collection inexistante, etc.)

### pgnParser.ts
- Parsing d'un fichier PGN avec une partie
- Parsing d'un fichier PGN avec plusieurs parties
- Extraction correcte des métadonnées (noms, ELO, date, résultat)
- Gestion des dates au format PGN
- Gestion des fichiers invalides
- Gestion des parties incomplètes

### API /api/collections (POST)
- Création d'une collection avec un nom valide
- Rejet des noms vides
- Rejet des noms trop longs (> 100 caractères)
- Vérification de l'authentification
- Gestion des erreurs serveur

### API /api/collections/[id]/import (POST)
- Import réussi d'un fichier PGN valide
- Rejet des fichiers non-PGN
- Vérification de la propriété de la collection
- Vérification de l'authentification
- Gestion des fichiers PGN invalides
- Comptage correct des parties importées

Exécuter les tests:
```bash
pnpm test
```

## Architecture

Le système suit les principes de Clean Architecture:

1. **Couche de données (Prisma)**: Gestion de la base de données PostgreSQL
2. **Couche de services**: Logique métier (collection.service.ts, pgnParser.ts)
3. **Couche de routes API**: Endpoints REST (/api/collections/*)
4. **Couche de routes serveur**: Chargement des données (+page.server.ts)
5. **Couche de présentation**: Composants Svelte (+page.svelte, ImportGame.svelte)

Cette séparation permet:
- Une meilleure testabilité
- Une maintenance facilitée
- Une évolution progressive du code
- Un découplage entre les couches
- Une réutilisation des composants
