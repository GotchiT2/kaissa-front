# API Position Moves

Documentation de l'API pour récupérer les meilleurs coups joués dans une position donnée.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Endpoint](#endpoint)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Calcul des agrégats](#calcul-des-agrégats)
- [Tests](#tests)

## Vue d'ensemble

L'API Position Moves permet de récupérer les statistiques des coups les plus joués dans une position donnée au sein d'une collection de parties. Les données sont pré-calculées et stockées dans la table `AgregatCoupsCollection` pour des performances optimales.

### Caractéristiques principales

- **Requêtes rapides** : Les statistiques sont pré-calculées lors de l'import
- **Filtrage par collection** : Seules les parties de la collection spécifiée sont prises en compte
- **Top N coups** : Retourne les 6 coups les plus joués (configurable)
- **Statistiques de résultats** : Inclut les victoires blancs/noirs et nulles

## Endpoint

### GET /api/collections/[id]/position-moves

Récupère les meilleurs coups joués dans une position donnée pour une collection spécifique.

#### Authentification

✅ **Requise** : L'utilisateur doit être authentifié et propriétaire de la collection.

#### Paramètres

**Route** :
- `id` : Identifiant de la collection

**Query String** :
- `hashPosition` : Hash (bigint en string) de la position FEN

| Paramètre    | Type   | Requis | Description                          |
|--------------|--------|--------|--------------------------------------|
| hashPosition | string | ✅     | Hash de la position (bigint string)  |

#### Réponses

**200 OK** - Statistiques récupérées avec succès

```json
{
  "moves": [
    {
      "coup": "e2e4",
      "nbParties": 1523,
      "victoiresBlancs": 687,
      "nulles": 423,
      "victoiresNoirs": 413
    },
    {
      "coup": "d2d4",
      "nbParties": 1289,
      "victoiresBlancs": 601,
      "nulles": 378,
      "victoiresNoirs": 310
    }
  ]
}
```

**400 Bad Request** - Paramètre manquant

```json
{
  "message": "Le paramètre hashPosition est requis"
}
```

**401 Unauthorized** - Utilisateur non authentifié

```json
{
  "message": "Vous devez être connecté"
}
```

**403 Forbidden** - Accès non autorisé

```json
{
  "message": "Accès non autorisé à cette collection"
}
```

**404 Not Found** - Collection non trouvée

```json
{
  "message": "Collection non trouvée"
}
```

**500 Internal Server Error** - Erreur serveur

```json
{
  "message": "Erreur lors de la récupération des meilleurs coups"
}
```

#### Codes de statut HTTP

| Code | Description                          |
|------|--------------------------------------|
| 200  | Statistiques récupérées avec succès  |
| 400  | Paramètre hashPosition manquant      |
| 401  | Authentification requise             |
| 403  | Accès non autorisé à la collection   |
| 404  | Collection non trouvée               |
| 500  | Erreur interne du serveur            |

## Exemples d'utilisation

### Récupérer les meilleurs coups depuis le client

```typescript
import { hashFEN } from '$lib/utils/positionHash';

// Calculer le hash de la position
const fen = game.fen();
const hashPosition = hashFEN(fen);

// Appeler l'API
const response = await fetch(
  `/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`
);

if (response.ok) {
  const data = await response.json();
  console.log('Meilleurs coups:', data.moves);
  
  // Afficher les statistiques
  data.moves.forEach(move => {
    const total = move.victoiresBlancs + move.nulles + move.victoiresNoirs;
    const winRate = (move.victoiresBlancs / total * 100).toFixed(1);
    console.log(`${move.coup}: ${move.nbParties} parties, ${winRate}% victoires blancs`);
  });
} else {
  console.error('Erreur:', await response.json());
}
```

### Utilisation avec Svelte 5

```svelte
<script lang="ts">
  import { hashFEN } from '$lib/utils/positionHash';
  
  let selectedCollectionId = $state<string | null>(null);
  let topMoves = $state<any[]>([]);
  
  // Effet réactif qui se déclenche quand la position change
  $effect(() => {
    if (!selectedCollectionId) return;
    
    const fen = game.fen();
    const hashPosition = hashFEN(fen);
    
    fetch(`/api/collections/${selectedCollectionId}/position-moves?hashPosition=${hashPosition}`)
      .then(res => res.json())
      .then(data => {
        topMoves = data.moves;
      });
  });
</script>

{#each topMoves as move}
  <div>
    <span>{move.coup}</span>
    <span>{move.nbParties} parties</span>
  </div>
{/each}
```

### Gestion d'erreurs complète

```typescript
async function getTopMoves(collectionId: string, fen: string) {
  try {
    const hashPosition = hashFEN(fen);
    
    const response = await fetch(
      `/api/collections/${collectionId}/position-moves?hashPosition=${hashPosition}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const data = await response.json();
    return data.moves;
  } catch (error) {
    console.error('Erreur lors de la récupération des coups:', error);
    return [];
  }
}
```

## Calcul des agrégats

### Lors de l'import PGN

Les agrégats sont calculés automatiquement lors de l'import de parties PGN :

1. **Création des TransitionPartie** : Pour chaque coup de la ligne principale, une transition est créée stockant :
   - Hash de position avant le coup
   - Coup UCI
   - Hash de position après le coup
   - Numéro de ply
   - Camp au trait

2. **Calcul des agrégats** : Après l'import, la fonction `updateAggregates()` :
   - Récupère toutes les transitions de la collection
   - Groupe par position et coup
   - Compte les parties distinctes
   - Agrège les résultats (victoires blancs/noirs, nulles)
   - Met à jour `AgregatCoupsCollection` via upsert

### Structure des données

#### TransitionPartie

```typescript
interface TransitionPartie {
  id: string;
  partieId: string;
  hashPositionAvant: bigint;
  coupUci: string;
  hashPositionApres: bigint;
  ply: number;
  estDansPrincipal: boolean;
  campAuTrait: 'BLANCS' | 'NOIRS';
}
```

#### AgregatCoupsCollection

```typescript
interface AgregatCoupsCollection {
  collectionId: string;
  hashPosition: bigint;
  filtreHash: string;
  coupUci: string;
  nbParties: bigint;
  victoiresBlancs: bigint;
  nulles: bigint;
  victoiresNoirs: bigint;
  createdAt: Date;
  updatedAt: Date;
}
```

### Filtre par défaut

Actuellement, le système utilise un filtre par défaut (`filtreHash = "default"`) qui inclut toutes les parties de la collection sans filtrage.

Des filtres avancés (par ELO, date, cadence, tags) pourront être ajoutés ultérieurement selon l'architecture prévue.

### Optimisations futures

1. **Calcul incrémental** : Ne recalculer que les agrégats des nouvelles parties importées
2. **Lazy-build** : Utiliser `CalculAgregatStatut` pour un calcul asynchrone à la demande
3. **Mise en cache** : Ajouter un cache Redis pour les requêtes fréquentes
4. **Filtres avancés** : Implémenter les filtres par ELO, date, cadence

## Tests

### Tests d'intégration API

Les tests couvrent :

- ✅ Récupération réussie des meilleurs coups (200)
- ✅ Rejet si utilisateur non authentifié (401)
- ✅ Rejet si hashPosition manquant (400)
- ✅ Rejet si collection non trouvée (404)
- ✅ Rejet si accès non autorisé (403)
- ✅ Gestion des erreurs du service (500)
- ✅ Vérification que les coups sont triés par fréquence

**Fichier** : `tests/api/position-moves.spec.ts`

### Tests d'import avec agrégats

Les tests couvrent :

- ✅ Création des TransitionPartie lors de l'import
- ✅ Calcul correct des agrégats
- ✅ Comptage distinct des parties
- ✅ Comptage correct des résultats
- ✅ Mise à jour des agrégats existants

**Fichier** : `tests/api/collections-import-aggregates.spec.ts`

### Exécuter les tests

```bash
# Tous les tests
npm test

# Tests de l'API position-moves
npm test position-moves.spec.ts

# Tests d'import avec agrégats
npm test collections-import-aggregates.spec.ts

# Avec coverage
npm run test:coverage
```

## Architecture technique

### Route Handler

**Fichier** : `src/routes/api/collections/[id]/position-moves/+server.ts`

Le handler gère :
- Authentification via `locals.user`
- Validation du paramètre `hashPosition`
- Vérification des droits d'accès à la collection
- Requête Prisma pour récupérer les agrégats
- Formatage des réponses (conversion BigInt en Number)
- Gestion des erreurs

### Fonction updateAggregates

**Fichier** : `src/routes/api/collections/[id]/import/+server.ts`

La fonction `updateAggregates()` :
- Est appelée après l'import de toutes les parties
- Récupère toutes les transitions de la collection
- Utilise une Map pour agréger les données en mémoire
- Utilise `upsert` pour créer ou mettre à jour les entrées
- Gère le comptage distinct des parties via un Set

### Flux de données

```
Import PGN
    ↓
Création PartieTravail
    ↓
Création CoupNoeud (ligne principale)
    ↓
Création TransitionPartie (pour chaque coup)
    ↓
Calcul agrégats (updateAggregates)
    ↓
Stockage AgregatCoupsCollection
    ↓
API position-moves (lecture)
```

## Références

- [Modèle de données complet](./modele-donnees.md)
- [API Collections](./api-collections.md)
- [API Import](./collections-api.md)
- [Prisma Documentation](https://www.prisma.io/docs)
