# Nemufy

Nemufy est une première version navigable d’une plateforme de streaming audio dédiée à l’ASMR. L’interface privilégie une expérience nocturne, calme et immersive, avec une identité visuelle propre et un lecteur persistant.

Cette étape est volontairement centrée sur le front-end et le modèle métier. Les artistes, sorties, morceaux, collaborations, playlists et catégories sont fournis par un catalogue mock typé et centralisé, prêt à être remplacé par une API.

## Stack

- Next.js 16 avec App Router et Server Components par défaut
- React 19 et TypeScript strict
- Tailwind CSS 4
- composants shadcn/ui (configuration `new-york` et variables CSS)
- Lucide React
- Zustand pour l’état global du lecteur
- Zod pour valider les catalogues structurés
- ESLint et Prettier
- pnpm

## Installation

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

## Commandes

```bash
pnpm dev          # serveur de développement
pnpm typecheck    # vérification TypeScript
pnpm lint         # vérification ESLint
pnpm format       # formatage Prettier
pnpm format:check # contrôle du formatage
pnpm build        # build de production (webpack, stable en environnement contraint)
pnpm start        # serveur de production après build
```

## Architecture principale

```text
src/
├── app/                 # routes App Router, layouts, loading et erreurs
│   ├── artist/[slug]/
│   ├── playlist/[slug]/
│   ├── release/[slug]/
│   ├── search/
│   └── library/
├── components/
│   ├── artist/          # liens, cartes et profil artiste
│   ├── home/            # hero et sections éditoriales
│   ├── layout/          # shell, sidebar, header et navigation mobile
│   ├── media/           # images avec fallback
│   ├── player/          # contrôles et élément audio global
│   ├── playlist/
│   ├── release/
│   ├── search/
│   ├── track/
│   └── ui/              # primitives shadcn/ui locales
├── data/mock/           # catalogue centralisé et sélecteurs
├── lib/                 # utilitaires partagés
├── stores/              # store Zustand du lecteur
└── types/               # modèle métier TypeScript
```

## Lecteur audio

Le store `src/stores/player-store.ts` contient la piste courante, la file, l’index, l’état de lecture, la progression, le volume et le mute. Les cartes et listes ne créent jamais d’élément audio : `GlobalAudio` est l’unique `HTMLAudioElement` de l’application et synchronise le média avec Zustand.

Une ambiance locale de démonstration est fournie dans `public/audio/quiet-night.wav`, afin que la lecture fonctionne sans service externe. Toutes les pistes utilisent actuellement ce même aperçu local.

## Données mockées

Le catalogue vit dans `src/data/mock/catalog.ts` et expose :

- 7 artistes fictifs ;
- des singles, EP et albums ;
- des morceaux multi-artistes et des featurings ;
- des playlists éditoriales ;
- des sélecteurs pour les discographies, apparitions et titres populaires.

Les images sont également locales : la route `src/app/images/art/[name]/route.ts` produit des placeholders SVG déterministes et mis en cache. Une future couche de repository ou de service pourra remplacer les imports mock sans changer les composants de présentation.

## Routes

- `/` — Discover
- `/search` — recherche locale et catégories
- `/library` — bibliothèque simulée
- `/artist/[slug]` — profil artiste
- `/release/[slug]` — album, EP ou single
- `/playlist/[slug]` — playlist

## Périmètre volontairement simulé

L’authentification, la persistance des likes, les comptes, abonnements, recommandations, uploads et la base de données ne sont pas implémentés. Les boutons concernés servent à valider les interactions et l’architecture UI, mais leurs données ne persistent pas après rechargement.

## Suites recommandées

1. Introduire une interface de repository puis connecter une API PostgreSQL.
2. Ajouter l’authentification et persister bibliothèque, likes et historique.
3. Remplacer les aperçus locaux par des médias signés et une vraie gestion de queue.
4. Ajouter tests unitaires du store, tests de composants et tests E2E des parcours de lecture.
5. Ajouter le player mobile plein écran, les profils et les réglages.
