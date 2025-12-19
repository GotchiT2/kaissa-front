# Documentation - Architecture technique

## Vue d'ensemble du projet

**Kaissa** est une application web destinée aux joueurs professionnels d'échecs participant à des tournois. L'objectif est de les aider dans leur organisation et leur préparation aux tournois au quotidien.

## Stack technique

### Frontend

- **Framework** : SvelteKit (v5.43.8)
- **Langage** : TypeScript (v5.9.3)
- **Bibliothèque UI** : Skeleton (v4.7.2)
- **CSS** : Tailwind CSS (v4.1.17)
- **Icônes** : Lucide Svelte

### Backend

- **Framework** : SvelteKit (full-stack)
- **ORM** : Prisma (v7.2.0)
- **Base de données** : PostgreSQL
- **Authentification** : Lucia (v3.2.2)

### Outils de développement

- **Gestionnaire de paquets** : pnpm
- **Linter** : ESLint (v9.39.1)
- **Formatter** : Prettier (v3.6.2)
- **Tests** : Vitest (v4.0.10) + Playwright
- **Conteneurisation** : Docker (via docker-compose)

## Architecture du projet

### Structure des dossiers

```
kaissa-front/
├── docs/                      # Documentation du projet
│   ├── architecture.md        # Ce fichier
│   └── authentification.md    # Documentation de l'authentification
├── prisma/
│   ├── migrations/            # Migrations de base de données
│   └── schema.prisma          # Schéma Prisma
├── src/
│   ├── lib/
│   │   ├── components/        # Composants Svelte réutilisables
│   │   │   ├── chessboard/   # Composants pour l'échiquier
│   │   │   ├── common/       # Composants communs (Header, Footer, etc.)
│   │   │   └── table/        # Composants pour les tableaux de données
│   │   ├── server/           # Code côté serveur uniquement
│   │   │   └── auth.ts       # Configuration de l'authentification
│   │   ├── services/         # Services métier
│   │   │   └── chessApi.ts   # Service d'API d'échecs
│   │   └── utils/            # Utilitaires réutilisables
│   │       ├── chessboard.ts
│   │       ├── fakeGames.ts
│   │       └── formatNumber.ts
│   ├── routes/               # Routes SvelteKit (file-based routing)
│   │   ├── chessboard/       # Page de l'échiquier
│   │   ├── database/         # Page de base de données
│   │   ├── me/               # Page de profil utilisateur
│   │   ├── +layout.svelte    # Layout principal
│   │   └── +page.svelte      # Page d'accueil
│   ├── app.d.ts              # Définitions de types TypeScript
│   ├── app.html              # Template HTML de base
│   └── kaissa.css            # Styles globaux
├── static/                   # Fichiers statiques
│   ├── partenaires/          # Logos des partenaires
│   ├── analyse1.jpg
│   ├── kaissa-logo.png
│   └── robots.txt
├── .clinerules               # Règles de développement
├── docker-compose.yml        # Configuration Docker
├── package.json              # Dépendances npm
└── vite.config.ts            # Configuration Vite
```

### Principes architecturaux

#### Séparation des responsabilités

- **Présentation** (`src/routes` et `src/lib/components`) : Composants Svelte pour l'interface utilisateur
- **Logique métier** (`src/lib/services`) : Services encapsulant la logique métier
- **Accès aux données** (`src/lib/server` et Prisma) : Interaction avec la base de données
- **Utilitaires** (`src/lib/utils`) : Fonctions réutilisables sans dépendances métier

#### Principes SOLID

- **Single Responsibility** : Chaque composant/service a une seule raison de changer
- **Open/Closed** : Ouvert à l'extension, fermé à la modification
- **Liskov Substitution** : Les sous-types doivent être substituables
- **Interface Segregation** : Interfaces spécifiques plutôt que génériques
- **Dependency Inversion** : Dépendre d'abstractions, pas de concrétions

## Modèle de données

### Schéma Prisma actuel

```prisma
model User {
  id       String    @id
  email    String    @unique
  password String
  sessions Session[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Note :** Ce schéma est minimal et sera étendu au fur et à mesure du développement pour inclure :
- Informations de profil des joueurs (nom, prénom, classement Elo, etc.)
- Tournois
- Parties d'échecs
- Préparations et analyses
- Calendrier

## Configuration de la base de données

### PostgreSQL via Docker

Le projet utilise Docker Compose pour gérer la base de données PostgreSQL en développement.

**Fichier** : `docker-compose.yml`

Pour démarrer la base de données :
```bash
docker-compose up -d
```

### Migrations Prisma

Les migrations sont stockées dans `prisma/migrations/`.

**Commandes utiles :**
```bash
# Créer une nouvelle migration
pnpm prisma migrate dev --name nom_migration

# Appliquer les migrations en production
pnpm prisma migrate deploy

# Générer le client Prisma
pnpm prisma generate

# Ouvrir Prisma Studio (interface de gestion)
pnpm prisma studio
```

## Routing SvelteKit

SvelteKit utilise le **file-based routing** : la structure des fichiers dans `src/routes/` définit automatiquement les routes de l'application.

### Structure actuelle des routes

- `/` - Page d'accueil
- `/chessboard` - Visualisation de l'échiquier
- `/database` - Interface de base de données
- `/me` - Profil utilisateur

### Conventions SvelteKit

- `+page.svelte` : Composant de page
- `+page.ts` ou `+page.server.ts` : Chargement de données
- `+layout.svelte` : Layout partagé
- `+error.svelte` : Page d'erreur personnalisée
- `+server.ts` : Endpoints API

## Composants UI

### Skeleton UI

Le projet utilise **Skeleton** comme bibliothèque de composants UI, qui fournit :
- Composants pré-stylisés
- Thèmes personnalisables
- Intégration native avec Tailwind CSS

### Composants personnalisés

#### Échiquier (`src/lib/components/chessboard/`)
- `Chessboard.svelte` : Composant principal de l'échiquier
- `Tile.svelte` : Représentation d'une case de l'échiquier

#### Tableaux (`src/lib/components/table/`)
- `GamesTable.svelte` : Tableau des parties
- `data-table.svelte.ts` : Logique de gestion du tableau
- Utilise **@tanstack/svelte-table** pour les fonctionnalités avancées

#### Communs (`src/lib/components/common/`)
- `Header.svelte` : En-tête de l'application
- `Footer.svelte` : Pied de page
- `SVG.svelte` : Wrapper pour les icônes SVG

## Services

### ChessApi (`src/lib/services/chessApi.ts`)

Service d'interaction avec des API d'échecs externes (à documenter plus en détail lors de son développement).

## Tests

### Stratégie de test

- **Tests unitaires** : Fonctions utilitaires et logique métier isolée
- **Tests de composants** : Composants Svelte avec Vitest
- **Tests d'intégration** : Workflows utilisateurs avec Playwright

### Commandes de test

```bash
# Exécuter les tests en mode watch
pnpm test:unit

# Exécuter les tests une fois
pnpm test
```

### Fichiers de test

- Tests unitaires : fichiers `.spec.ts` à côté du code source
- Exemple : `src/routes/page.svelte.spec.ts`

## Build et déploiement

### Développement

```bash
# Démarrer le serveur de développement
pnpm dev

# Vérifier les types TypeScript
pnpm check

# Linter et formatter
pnpm lint
pnpm format
```

### Production

```bash
# Build de production
pnpm build

# Prévisualiser le build
pnpm preview
```

### Adapter SvelteKit

Actuellement configuré avec `@sveltejs/adapter-auto` qui détecte automatiquement la plateforme de déploiement.

## Sécurité

### Authentification

Voir la documentation détaillée : [docs/authentification.md](./authentification.md)

### Variables d'environnement

Les variables sensibles sont stockées dans `.env` (non versionné).

**Exemple de structure** :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kaissa"
```

### Protection CSRF

SvelteKit inclut une protection CSRF native pour les formulaires.

## Performance

### Optimisations SvelteKit

- **Streaming** : Chargement progressif des données
- **Prefetching** : Préchargement des pages lors du survol des liens
- **Code splitting** : Division automatique du code par route
- **SSR** : Server-Side Rendering pour un meilleur SEO et performance initiale

### Tailwind CSS

- Production : Classes inutilisées supprimées automatiquement
- Taille minimale du CSS en production

## Accessibilité

### Standards respectés

- **WCAG 2.1** niveau AA minimum
- Balises sémantiques HTML5
- Navigation au clavier
- Attributs ARIA appropriés

### Skeleton UI

La bibliothèque Skeleton intègre des pratiques d'accessibilité par défaut.

## Concepts métier (à développer)

Cette section sera enrichie au fur et à mesure du développement. Concepts à documenter :

### Gestion des tournois
- Types de tournois (Swiss, Round-Robin, Knockout, etc.)
- Calendrier et planning
- Inscriptions et confirmations

### Préparation aux parties
- Analyse des adversaires
- Répertoire d'ouvertures
- Base de données de parties
- Notes et préparations

### Suivi des performances
- Historique des parties
- Évolution du classement
- Statistiques détaillées
- Analyse post-partie

### Organisation quotidienne
- Calendrier des événements
- Rappels et notifications
- Gestion des déplacements
- Planning d'entraînement

## Évolution future

### Fonctionnalités prévues

- Dashboard personnalisé pour chaque joueur
- Intégration avec les plateformes d'échecs (Lichess, Chess.com)
- Système de notifications
- Analyse automatique des parties
- Recommandations de préparation
- Mode hors ligne
- Application mobile (potentiel)

### Améliorations techniques

- Migration vers Lucia v4 (Arctic + Oslo)
- Mise en place de tests E2E complets
- CI/CD avec GitHub Actions
- Monitoring et logging
- Internationalisation (i18n)

## Ressources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Skeleton UI](https://www.skeleton.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vitest](https://vitest.dev/)
