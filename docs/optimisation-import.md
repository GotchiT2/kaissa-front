# Optimisation de l'import de parties PGN

## Contexte

L'import de parties PGN présentait des problèmes de performance majeurs :
- **Temps initial** : ~5 minutes pour 3000 parties
- **Objectif** : < 20 secondes pour 3000 parties

## Analyse des goulots d'étranglement

### Problèmes identifiés

1. **Transaction par partie**
   - Avant : 3000 transactions individuelles pour 3000 parties
   - Impact : Overhead important de commit/rollback

2. **Insertions individuelles**
   - Avant : 2 requêtes SQL par coup (CoupNoeud + TransitionPartie)
   - Pour 3000 parties avec ~40 coups en moyenne : **240,000+ requêtes SQL**
   - Impact : Latence réseau et overhead de requêtes

3. **Recalcul complet des agrégats**
   - Avant : Récupération de TOUTES les transitions puis upserts individuels
   - Impact : Requêtes N+1, pas de batch processing

## Solutions implémentées

### 1. Batch processing

**Avant :**
```typescript
for (const game of games) {
  await prisma.$transaction(async (tx) => {
    // Créer une partie
    await tx.partieTravail.create({ ... });
    
    // Pour chaque coup
    for (const move of game.parsedMoves) {
      await tx.coupNoeud.create({ ... });
      await tx.transitionPartie.create({ ... });
    }
  });
}
```

**Après :**
```typescript
const BATCH_SIZE = 100;

for (let batchStart = 0; batchStart < games.length; batchStart += BATCH_SIZE) {
  const batchGames = games.slice(batchStart, batchStart + BATCH_SIZE);
  
  await prisma.$transaction(async (tx) => {
    // Préparer toutes les données du batch
    const partiesData = [];
    const allNoeudsData = [];
    const allTransitionsData = [];
    
    for (const game of batchGames) {
      // Collecter toutes les données
      partiesData.push({ ... });
      // ...
    }
    
    // Insérer en masse
    await tx.partieTravail.createMany({ data: partiesData });
    await tx.coupNoeud.createMany({ data: allNoeudsData });
    await tx.transitionPartie.createMany({ data: allTransitionsData });
  });
}
```

**Bénéfices :**
- Réduction de 3000 à ~30 transactions
- Réduction de 240,000 à ~30 requêtes SQL d'insertion

### 2. Génération des IDs côté application

Pour utiliser `createMany`, les IDs doivent être générés côté application :

```typescript
import { randomUUID } from "crypto";

const partieId = randomUUID();
const noeudId = randomUUID();
```

Cela permet de maintenir les relations parent-enfant sans requêtes supplémentaires.

### 3. Optimisation des agrégats avec SQL brut

**Avant :**
```typescript
// Récupérer toutes les transitions
const transitions = await prisma.transitionPartie.findMany({ ... });

// Calculer les agrégats en mémoire
const aggregatesMap = new Map();
for (const transition of transitions) {
  // Accumuler les stats
}

// Upsert individuel pour chaque agrégat
for (const [key, agg] of aggregatesMap.entries()) {
  await prisma.agregatCoupsCollection.upsert({ ... });
}
```

**Après :**
```typescript
await prisma.$executeRaw`
  INSERT INTO "AgregatCoupsCollection" (...)
  SELECT
    ${collectionId}::text as "collectionId",
    t."hashPositionAvant" as "hashPosition",
    ${filtreHash}::text as "filtreHash",
    t."coupUci",
    COUNT(DISTINCT t."partieId")::bigint as "nbParties",
    COUNT(DISTINCT CASE WHEN p."resultat" = 'BLANCS' THEN t."partieId" END)::bigint as "victoiresBlancs",
    COUNT(DISTINCT CASE WHEN p."resultat" = 'NULLE' THEN t."partieId" END)::bigint as "nulles",
    COUNT(DISTINCT CASE WHEN p."resultat" = 'NOIRS' THEN t."partieId" END)::bigint as "victoiresNoirs",
    NOW() as "createdAt",
    NOW() as "updatedAt"
  FROM "TransitionPartie" t
  INNER JOIN "PartieTravail" p ON t."partieId" = p.id
  WHERE p."collectionId" = ${collectionId}
    AND t."estDansPrincipal" = true
  GROUP BY t."hashPositionAvant", t."coupUci"
  ON CONFLICT (...) DO UPDATE SET ...
`;
```

**Bénéfices :**
- Calcul des agrégats directement en SQL (beaucoup plus rapide)
- Upsert en masse au lieu d'upserts individuels
- Pas de transfert de données entre la base et l'application

## Résultats attendus

### Gains de performance

| Métrique | Avant | Après | Amélioration |
|----------|-------|-------|--------------|
| Nombre de transactions | 3000 | ~30 | **99% de réduction** |
| Nombre de requêtes SQL | ~240,000 | ~90 | **99.96% de réduction** |
| Temps d'import (3000 parties) | ~5 min | < 20s | **93% de réduction** |

### Scalabilité

Le système peut maintenant gérer :
- **10,000 parties** : ~1 minute (vs ~17 minutes avant)
- **100,000 parties** : ~10 minutes (vs ~3 heures avant)

## Configuration

Le batch size peut être ajusté selon les besoins :

```typescript
const BATCH_SIZE = 100; // Ajuster selon la mémoire disponible
```

**Recommandations :**
- Batch size trop petit (< 50) : Moins efficace, plus de transactions
- Batch size trop grand (> 500) : Risque de timeout, consommation mémoire élevée
- **Optimal : 100-200** pour un bon équilibre

## Considérations techniques

### Gestion des erreurs

Les erreurs sont gérées par batch :
- Si un batch échoue, les autres continuent
- Les parties déjà importées sont conservées (grâce à `skipDuplicates`)
- Les logs permettent d'identifier les problèmes

### Streaming des progrès

Le streaming SSE (Server-Sent Events) est maintenu pour le retour temps réel :
- Événement `start` : Total de parties
- Événement `progress` : Progression après chaque batch
- Événement `complete` : Fin de l'import avec statistiques

### Compatibilité

Les modifications sont rétrocompatibles :
- L'API reste identique
- Le frontend n'a pas besoin de changements
- Les données existantes ne sont pas affectées

## Tests

Pour tester les performances :

```bash
# Générer un fichier PGN de test avec 3000 parties
# Mesurer le temps d'import via l'interface ou :
curl -X POST http://localhost:5173/api/collections/{id}/import \
  -F "file=@test_3000_games.pgn" \
  -F "stream=false"
```

## Évolutions futures possibles

1. **Parallélisation** : Traiter plusieurs batches en parallèle
2. **Worker threads** : Déplacer le parsing PGN dans un worker
3. **Streaming du fichier** : Parser le PGN par chunks au lieu de tout charger en mémoire
4. **Cache** : Mettre en cache les hash de positions courantes
5. **Index** : Ajouter des index supplémentaires si nécessaire selon les requêtes fréquentes
