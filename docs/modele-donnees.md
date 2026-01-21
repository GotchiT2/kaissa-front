# Modèle de données Kaissa

## Vue d'ensemble

Ce document décrit le modèle de données complet de l'application Kaissa, conçu pour supporter :
- Collections arborescentes avec statistiques agrégées
- Parties d'échecs avec variantes et commentaires
- Statistiques de coups joués avec filtres avancés
- Performances optimisées pour des millions de parties

## Architecture générale

Le modèle est organisé en plusieurs domaines :

1. **Utilisateurs et sessions** : Authentification et gestion des utilisateurs
2. **Collections** : Arborescence de collections avec closure table pour les requêtes performantes
3. **Parties de travail** : Fichiers de parties avec métadonnées PGN
4. **Arbre de coups** : Représentation en nœuds pour supporter variantes et ligne principale
5. **Commentaires** : Annotations sur les coups
6. **Tags** : Classification des parties
7. **Statistiques** : Agrégats pré-calculés et système de lazy-build
8. **Transitions** : Matérialisation des coups de la ligne principale pour les statistiques

## Schéma détaillé

### Enums

#### Visibilite
```prisma
enum Visibilite {
  PRIVEE
  PUBLIQUE
}
```

#### Resultat
```prisma
enum Resultat {
  BLANCS    // Victoire des blancs
  NOIRS     // Victoire des noirs
  NULLE     // Match nul
  INCONNU   // Résultat inconnu ou partie en cours
}
```

#### Camp
```prisma
enum Camp {
  BLANCS
  NOIRS
}
```

#### CalculStatut
```prisma
enum CalculStatut {
  EN_ATTENTE  // Calcul demandé mais pas encore démarré
  EN_COURS    // Calcul en cours par un worker
  TERMINE     // Calcul terminé avec succès
  ERREUR      // Erreur lors du calcul
}
```

### Utilisateurs

#### User
- **id** : Identifiant unique
- **email** : Email unique de l'utilisateur
- **password** : Hash du mot de passe
- **firstName** : Prénom
- **lastName** : Nom
- **nationality** : Nationalité
- **createdAt** / **updatedAt** : Timestamps

**Relations** :
- sessions : Les sessions de l'utilisateur
- collections : Les collections créées par l'utilisateur

**Index** :
- `email` : Pour la recherche rapide par email

#### Session
- **id** : Identifiant de session
- **userId** : Référence vers l'utilisateur
- **expiresAt** : Date d'expiration de la session

**Index** :
- `userId` : Pour les lookups par utilisateur

### Collections

#### Collection
Structure arborescente permettant d'organiser les parties.

- **id** : Identifiant unique
- **nom** : Nom de la collection
- **visibilite** : PRIVEE ou PUBLIQUE (défaut: PRIVEE)
- **proprietaireId** : Référence vers l'utilisateur propriétaire (nullable pour collections système)
- **parentId** : Référence vers la collection parente (nullable pour racines)
- **createdAt** / **updatedAt** : Timestamps

**Relations** :
- proprietaire : L'utilisateur propriétaire
- parent : La collection parente
- enfants : Les sous-collections
- parties : Les parties contenues
- ancetres / descendants : Via la closure table
- agregats : Les statistiques pré-calculées
- calculs : Les états de calcul

**Index** :
- `proprietaireId` : Pour lister les collections d'un utilisateur
- `parentId` : Pour la navigation hiérarchique
- `visibilite` : Pour filtrer les collections publiques

**Invariants** (à implémenter en applicatif) :
- Profondeur limitée (recommandé : 2-3 niveaux max)
- Pas de cycles dans la hiérarchie
- Si `proprietaireId` non null, le parent doit avoir le même propriétaire

#### CollectionClosure
Table de fermeture transitive pour requêtes hiérarchiques performantes.

- **ancetreId** : Collection ancêtre
- **descendantId** : Collection descendante
- **profondeur** : Distance entre ancêtre et descendant (0 si même collection)

**Clé primaire** : `[ancetreId, descendantId]`

**Index** :
- `descendantId` : Pour trouver tous les ancêtres
- `[ancetreId, profondeur]` : Pour les requêtes par niveau

**Maintenance** :
- À la création d'une collection C avec parent P :
  - Insérer `(C.id, C.id, 0)`
  - Pour chaque ancêtre A de P : insérer `(A.id, C.id, A.profondeur + 1)`
- Au déplacement d'une collection : recalculer pour le sous-arbre

### Parties

#### PartieTravail
Représente un "fichier" de partie avec métadonnées PGN.

- **id** : Identifiant unique
- **collectionId** : Collection contenant la partie
- **titre** : Titre optionnel de la partie
- **resultat** : Résultat de la partie (défaut: INCONNU)
- **blancNom** / **noirNom** : Noms des joueurs
- **blancElo** / **noirElo** : Classements ELO
- **datePartie** : Date de la partie
- **cadence** : Cadence de jeu (ex: "Blitz", "Rapid")
- **site** : Lieu de la partie
- **event** : Événement/tournoi
- **createdAt** / **updatedAt** : Timestamps

**Relations** :
- collection : La collection parente
- coups : L'arbre des coups
- tags : Les tags associés
- transitions : Les transitions de la ligne principale

**Index** :
- `collectionId` : Pour lister les parties d'une collection
- `datePartie`, `blancElo`, `noirElo`, `cadence`, `resultat` : Pour les filtres

**Duplication** :
Lorsqu'une partie est dupliquée vers une autre collection :
1. Créer une nouvelle `PartieTravail`
2. Copier tous les `CoupNoeud` en préservant la structure
3. Copier tous les `CommentaireNoeud`
4. Copier les `PartieTag`
5. Reconstruire les `TransitionPartie`

### Arbre de coups

#### CoupNoeud
Représente un nœud dans l'arbre des coups (ligne principale + variantes).

- **id** : Identifiant unique
- **partieId** : Référence vers la partie
- **parentId** : Nœud parent (NULL pour la racine)
- **coupUci** : Coup en notation UCI (NULL pour la racine)
- **ply** : Numéro du demi-coup depuis le début (racine = 0)
- **hashPosition** : Hash64 (Zobrist) de la position après le coup
- **fen** : FEN optionnel de la position
- **estPrincipal** : Indique si ce nœud fait partie de la ligne principale
- **createdAt** / **updatedAt** : Timestamps

**Relations** :
- partie : La partie parente
- parent : Le nœud parent dans l'arbre
- enfants : Les coups suivants (variantes ou suite)
- commentaires : Les commentaires associés

**Index** :
- `partieId` : Pour charger tous les coups d'une partie
- `[partieId, parentId]` : Pour la navigation dans l'arbre
- `[partieId, ply]` : Pour afficher l'UI par demi-coup
- `hashPosition` : Pour les statistiques

**Contrainte importante** (à ajouter manuellement en SQL) :
- Pour un `parentId` donné, au plus un enfant peut avoir `estPrincipal = true`
- Contrainte PostgreSQL : `UNIQUE (parentId) WHERE estPrincipal = true`

**Invariants** (à implémenter en applicatif) :
- Un seul nœud racine par partie (`parentId IS NULL`)
- Pour un nœud non-racine : `coupUci NOT NULL`
- `ply = parent.ply + 1`

### Commentaires

#### CommentaireNoeud
Annotations textuelles sur les coups.

- **id** : Identifiant unique
- **noeudId** : Référence vers le coup
- **contenu** : Texte du commentaire
- **createdAt** / **updatedAt** : Timestamps

**Index** :
- `noeudId` : Pour charger les commentaires d'un coup

### Tags

#### Tag
- **id** : Identifiant unique
- **nom** : Nom unique du tag

#### PartieTag
Table de liaison entre parties et tags.

- **partieId** / **tagId** : Références
- **Clé primaire** : `[partieId, tagId]`

**Index** :
- `[tagId, partieId]` : Pour trouver toutes les parties d'un tag

### Statistiques

#### AgregatCoupsCollection
Stocke les statistiques pré-calculées des coups joués.

- **collectionId** : Collection racine
- **hashPosition** : Hash de la position
- **filtreHash** : Hash canonique des filtres appliqués
- **coupUci** : Le coup joué
- **nbParties** : Nombre de parties distinctes
- **victoiresBlancs** / **nulles** / **victoiresNoirs** : Compteurs par résultat
- **createdAt** / **updatedAt** : Timestamps

**Clé primaire** : `[collectionId, hashPosition, filtreHash, coupUci]`

**Index** :
- `[collectionId, hashPosition, filtreHash, nbParties DESC]` : Pour top N coups
- `[collectionId, hashPosition, filtreHash]` : Pour lookup

**Calcul** :
- Inclut la collection + tous ses descendants (via closure table)
- Compte distinct par partie (une partie ne contribue qu'une fois par coup)
- Utilise `TransitionPartie` pour les données sources

#### CalculAgregatStatut
Gère le lazy-build des agrégats.

- **collectionId** : Collection concernée
- **hashPosition** : Position concernée
- **filtreHash** : Filtres concernés
- **statut** : État du calcul
- **requestedAt** / **startedAt** / **finishedAt** : Timestamps
- **erreur** : Message d'erreur éventuel

**Clé primaire** : `[collectionId, hashPosition, filtreHash]`

**Index** :
- `[statut, requestedAt]` : Pour le worker

**Workflow** :
1. Premier accès à une position/filtre → créer entrée EN_ATTENTE
2. Worker consomme → passe à EN_COURS
3. Calcul terminé → passe à TERMINE et remplit `AgregatCoupsCollection`
4. En cas d'erreur → passe à ERREUR avec message

#### TransitionPartie
Matérialise les transitions de la ligne principale pour calculs performants.

- **id** : Identifiant unique
- **partieId** : Référence vers la partie
- **hashPositionAvant** : Hash avant le coup
- **coupUci** : Le coup joué
- **hashPositionApres** : Hash après le coup
- **ply** : Numéro du demi-coup
- **estDansPrincipal** : Toujours true pour MVP (variantes futures)
- **campAuTrait** : Camp qui joue (optionnel, pour filtres)

**Index** :
- `[hashPositionAvant, coupUci]` : Pour les statistiques
- `hashPositionAvant` : Pour tous les coups depuis une position
- `[partieId, ply]` : Pour reconstruction
- `[hashPositionAvant, campAuTrait]` : Pour filtres par couleur
- `[hashPositionAvant, coupUci, partieId]` : Pour distinct

**Maintenance** :
- Construire/reconstruire à chaque modification de la ligne principale
- Pour MVP : uniquement les coups avec `estPrincipal = true`
- Gestion des répétitions : ne garder que la première occurrence par position

## Filtres et normalisation

### Structure du filtre canonique

Pour garantir la cohérence des `filtreHash`, utiliser un JSON canonique :

```typescript
interface FiltreCanonique {
  couleur: 'BLANCS' | 'NOIRS' | 'TOUS';
  eloMin: number | null;
  eloMax: number | null;
  dateMin: string | null;  // ISO 8601
  dateMax: string | null;
  cadence: string[] | null;  // liste triée
  tags: string[] | null;     // liste triée
}
```

**Calcul du filtreHash** :
1. Normaliser les valeurs (ex: Elo par buckets de 100)
2. Sérialiser en JSON avec clés triées
3. Calculer hash SHA-256 en hexadécimal

**Guardrails** :
Pour limiter l'explosion combinatoire, surtout sur collections publiques :
- Buckets d'Elo : 100 points (1500-1599, 1600-1699, etc.)
- Dates : par mois ou trimestre
- Cadences : valeurs normalisées (Blitz, Rapid, Classical, etc.)

## Migration et déploiement

### Étapes pour générer la migration

1. **S'assurer que PostgreSQL est accessible** :
   ```bash
   # Démarrer avec Docker Compose
   docker-compose up -d
   
   # Ou vérifier qu'une instance locale tourne
   ```

2. **Générer la migration** :
   ```bash
   npx prisma migrate dev --name new_data_model
   ```

3. **Ajouter la contrainte unique partielle manuellement** :
   
   Ouvrir le fichier de migration SQL généré dans `prisma/migrations/XXXXXX_new_data_model/migration.sql` et ajouter après la création de la table `CoupNoeud` :
   
   ```sql
   -- Contrainte unique partielle : un seul coup principal par parent
   CREATE UNIQUE INDEX "unique_principal_per_parent" 
   ON "CoupNoeud"("parentId") 
   WHERE "estPrincipal" = true;
   ```

4. **Appliquer la migration** :
   ```bash
   npx prisma migrate deploy
   ```

5. **Générer le client Prisma** :
   ```bash
   npx prisma generate
   ```

### Notes de migration

- **Données existantes** : Les anciennes tables `Game`, `Collection`, `CollectionGame` seront supprimées. Prévoir une migration de données si nécessaire.
- **Closure table** : À peupler lors de la création/modification de collections via la logique applicative.
- **Transitions** : À calculer lors de l'import/modification de parties.

## Requêtes courantes

### Récupérer toutes les parties d'une collection et ses descendants

```typescript
// Utiliser la closure table
const parties = await prisma.partieTravail.findMany({
  where: {
    collection: {
      descendants: {
        some: {
          ancetreId: collectionId
        }
      }
    }
  }
});
```

### Calculer les statistiques pour une position

```typescript
// 1. Vérifier si agrégat existe
const agregat = await prisma.agregatCoupsCollection.findMany({
  where: {
    collectionId,
    hashPosition,
    filtreHash
  },
  orderBy: {
    nbParties: 'desc'
  }
});

// 2. Si absent, créer tâche de calcul
if (agregat.length === 0) {
  await prisma.calculAgregatStatut.upsert({
    where: {
      collectionId_hashPosition_filtreHash: {
        collectionId,
        hashPosition,
        filtreHash
      }
    },
    create: {
      collectionId,
      hashPosition,
      filtreHash,
      statut: 'EN_ATTENTE'
    },
    update: {}
  });
  
  // Attendre ou retourner état "en calcul"
}
```

### Construire les transitions pour une partie

```typescript
// Parcourir la ligne principale (estPrincipal = true)
// et créer une TransitionPartie par coup

async function buildTransitions(partieId: string) {
  const coups = await prisma.coupNoeud.findMany({
    where: { partieId, estPrincipal: true },
    orderBy: { ply: 'asc' }
  });
  
  // Supprimer anciennes transitions
  await prisma.transitionPartie.deleteMany({ where: { partieId } });
  
  // Créer nouvelles transitions
  const transitions = [];
  for (let i = 0; i < coups.length; i++) {
    const coup = coups[i];
    const parent = coups.find(c => c.id === coup.parentId);
    
    if (parent) {
      transitions.push({
        partieId,
        hashPositionAvant: parent.hashPosition,
        coupUci: coup.coupUci!,
        hashPositionApres: coup.hashPosition,
        ply: coup.ply,
        campAuTrait: coup.ply % 2 === 1 ? 'BLANCS' : 'NOIRS'
      });
    }
  }
  
  await prisma.transitionPartie.createMany({ data: transitions });
}
```

## Optimisations futures

### Index partiels
Pour de très gros volumes, considérer des index partiels :
```sql
CREATE INDEX idx_parties_high_elo 
ON "PartieTravail"("datePartie") 
WHERE "blancElo" > 2500 OR "noirElo" > 2500;
```

### Partitionnement
Pour collections massives (>10M parties), envisager le partitionnement de `TransitionPartie` par `hashPositionAvant` (hash range).

### Vues matérialisées
Pour collections publiques très consultées, créer des vues matérialisées des agrégats.

## Références

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Closure Table Pattern](https://www.slideshare.net/billkarwin/models-for-hierarchical-data)
