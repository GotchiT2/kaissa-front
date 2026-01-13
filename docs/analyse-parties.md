# Analyse des Parties

## Vue d'ensemble

La fonctionnalité d'analyse des parties permet aux utilisateurs de marquer jusqu'à 5 parties pour une analyse approfondie. Ces parties marquées sont facilement accessibles et affichées dans la page Chessboard pour faciliter le travail d'analyse.

## Objectifs

- Permettre aux joueurs de sélectionner les parties qu'ils souhaitent étudier en détail
- Limiter le nombre de parties en analyse à 5 pour maintenir la concentration
- Offrir un accès rapide aux parties sélectionnées depuis la page d'analyse

## Modèle de données

### Champ ajouté au modèle `PartieTravail`

```prisma
model PartieTravail {
  // ... autres champs
  isInAnalysis Boolean @default(false)
  // ... autres champs
  
  @@index([isInAnalysis])
}
```

**Propriétés** :
- **Type** : `Boolean`
- **Défaut** : `false`
- **Indexé** : Oui (pour optimiser les requêtes)
- **Description** : Indique si la partie est actuellement marquée pour l'analyse

## API

### PATCH `/api/parties/[id]`

Modifie le statut d'analyse d'une partie.

#### Requête

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "isInAnalysis": boolean
}
```

**Paramètres** :
- `id` (URL) : Identifiant de la partie

#### Réponse

**Succès (200)** :
```json
{
  "success": true,
  "message": "Partie ajoutée à l'analyse" | "Partie retirée de l'analyse",
  "partie": {
    // Objet PartieTravail mis à jour
  }
}
```

**Erreurs** :
- `401` : Utilisateur non authentifié
- `400` : 
  - ID de partie manquant
  - Champ `isInAnalysis` invalide (doit être un booléen)
  - Limite de 5 parties atteinte
- `403` : Utilisateur non autorisé (pas propriétaire de la collection)
- `404` : Partie introuvable
- `500` : Erreur serveur

#### Règles de gestion

1. **Authentification requise** : L'utilisateur doit être connecté
2. **Vérification de propriété** : Seul le propriétaire de la collection peut modifier le statut
3. **Limite de 5 parties** : Un utilisateur ne peut pas avoir plus de 5 parties en analyse simultanément
4. **Comptage par utilisateur** : La limite s'applique à l'ensemble des parties de toutes les collections de l'utilisateur

#### Exemples d'utilisation

**Ajouter une partie à l'analyse** :
```javascript
const response = await fetch('/api/parties/partie_123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ isInAnalysis: true }),
});

const data = await response.json();
console.log(data.message); // "Partie ajoutée à l'analyse"
```

**Retirer une partie de l'analyse** :
```javascript
const response = await fetch('/api/parties/partie_123', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ isInAnalysis: false }),
});

const data = await response.json();
console.log(data.message); // "Partie retirée de l'analyse"
```

## Interface utilisateur

### Page Database

#### Bouton d'analyse

- **Icône** : Flask (🧪)
- **Position** : À gauche du bouton de suppression dans le tableau des parties
- **États visuels** :
  - Non en analyse : Bouton gris avec hover bleu
  - En analyse : Bouton rempli en bleu
  - Chargement : Bouton désactivé
- **Tooltip** :
  - "Ajouter à l'analyse" (si `isInAnalysis` = false)
  - "Retirer de l'analyse" (si `isInAnalysis` = true)

#### Notifications

Après chaque action, un toast s'affiche :
- **Succès** : Message de confirmation
- **Erreur** : Message d'erreur (ex: "Vous ne pouvez pas avoir plus de 5 parties en analyse simultanément")

### Page Chessboard

#### Chargement des parties en analyse

Au chargement de la page, les parties marquées pour l'analyse sont automatiquement récupérées et loggées dans la console du navigateur.

**Informations loguées** :
- Nombre total de parties en analyse
- Pour chaque partie :
  - ID
  - Titre
  - Joueurs (blancs et noirs) avec leur Elo
  - Résultat
  - Date
  - Collection
  - Nombre de coups
  - Contenu complet (JSON)

**Exemple de log** :
```
=== PARTIES EN ANALYSE ===
Nombre de parties en analyse: 2

--- Partie 1 ---
ID: partie_123
Titre: Partie d'entraînement
Blancs: Magnus Carlsen (2800)
Noirs: Fabiano Caruana (2750)
Résultat: NULLE
Date: 01/12/2025
Collection: Mes parties importantes
Nombre de coups: 45
Contenu complet: { ... }
```

## Flux utilisateur

### Ajouter une partie à l'analyse

1. L'utilisateur navigue vers la page Database
2. Il sélectionne une collection contenant des parties
3. Dans le tableau, il clique sur l'icône Flask (🧪) d'une partie
4. Si la limite n'est pas atteinte :
   - La partie est marquée comme étant en analyse
   - Le bouton devient bleu (rempli)
   - Un toast de succès s'affiche
5. Si la limite est atteinte :
   - Un toast d'erreur s'affiche indiquant la limite

### Retirer une partie de l'analyse

1. L'utilisateur clique sur l'icône Flask (🧪) d'une partie déjà en analyse
2. La partie est retirée de l'analyse
3. Le bouton redevient gris
4. Un toast de succès s'affiche

### Consulter les parties en analyse

1. L'utilisateur navigue vers la page Chessboard
2. Les parties en analyse sont automatiquement chargées
3. Il ouvre la console du navigateur (F12)
4. Il peut consulter les détails complets de chaque partie en analyse

## Limitations et contraintes

### Limite de 5 parties

- **Raison** : Maintenir la concentration de l'utilisateur sur un nombre limité de parties
- **Portée** : Par utilisateur (toutes collections confondues)
- **Comportement** : Lorsque la limite est atteinte, l'utilisateur doit retirer une partie avant d'en ajouter une nouvelle

### Permissions

- Seul le propriétaire d'une collection peut modifier le statut d'analyse des parties qu'elle contient
- Les parties partagées ne peuvent pas être ajoutées à l'analyse par d'autres utilisateurs

## Tests

Les tests unitaires couvrent les cas suivants :

### Tests de succès
- ✅ Ajout d'une partie à l'analyse
- ✅ Retrait d'une partie de l'analyse

### Tests de validation
- ✅ Authentification requise
- ✅ ID de partie requis
- ✅ Type `isInAnalysis` doit être booléen
- ✅ Limite de 5 parties respectée

### Tests de sécurité
- ✅ Vérification de propriété de la collection
- ✅ Partie doit exister

### Tests d'erreur
- ✅ Gestion des erreurs de base de données

Pour exécuter les tests :
```bash
pnpm test tests/api/parties-analysis.spec.ts
```

## Améliorations futures possibles

1. **Persistance de l'ordre** : Permettre à l'utilisateur de réorganiser les parties en analyse
2. **Annotations** : Ajouter des notes spécifiques aux parties en analyse
3. **Export** : Permettre d'exporter les parties en analyse en PGN
4. **Statistiques** : Afficher des statistiques globales sur les parties en analyse
5. **Notifications** : Rappeler à l'utilisateur les parties en attente d'analyse
6. **Limite configurable** : Permettre aux utilisateurs de choisir leur propre limite (avec un maximum)

## Migration

La migration `20260113152519_add_is_in_analysis_to_partie` ajoute le champ `isInAnalysis` à la table `PartieTravail`.

**Pour appliquer la migration** :
```bash
pnpm prisma migrate dev
```

**Pour régénérer le client Prisma** :
```bash
pnpm prisma generate
```

## Dépendances

- Prisma (ORM)
- SvelteKit (Framework)
- Lucide Svelte (Icônes)
- Skeleton UI (Composants UI)
