# Nemufy

Nemufy est une plateforme web de streaming audio dédiée à l’ASMR. Elle réunit l’application d’écoute, un Artist Studio, un Label Studio et un panneau d’administration protégés par Firebase, des memberships et un moteur de permissions centralisé.

## Stack

- Next.js 16, React 19 et TypeScript strict
- Tailwind CSS 4 et composants shadcn/ui
- Firebase Authentication, Cloud Firestore et Cloud Storage
- Firebase Admin SDK pour les sessions `httpOnly` et les écritures serveur
- Zustand pour le lecteur audio global
- Zod pour la validation des données
- Firebase Emulator Suite pour tester les règles de sécurité

## Démarrage local

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Renseigner les variables Firebase avant de lancer l’application, puis ouvrir [http://localhost:3000](http://localhost:3000). Le guide complet se trouve dans [`docs/firebase-setup.md`](docs/firebase-setup.md).

## Commandes

```bash
pnpm dev                    # serveur de développement
pnpm typecheck              # vérification TypeScript
pnpm lint                   # vérification ESLint
pnpm format                 # formatage Prettier
pnpm format:check           # contrôle du formatage
pnpm build                  # build de production
pnpm start                  # serveur de production après build
pnpm firebase:emulators     # suite locale Auth/Firestore/Storage
pnpm test:rules             # tests des règles Firestore et Storage
pnpm test:permissions       # tests unitaires des rôles et permissions
pnpm firebase:seed -- --dry-run
pnpm firebase:seed          # import du catalogue dans un projet vide
pnpm firebase:set-capabilities -- --uid=UID --admin=true
pnpm firebase:deploy:rules  # règles et index Firebase
```

## Architecture

```text
src/
├── app/
│   ├── (app)/              # routes protégées de l’application
│   ├── (auth)/             # connexion, inscription, vérification et onboarding
│   ├── (studio)/studio/    # Artist Studio, Label Studio et context switcher
│   ├── (admin)/admin/      # panneau protégé par Custom Claim
│   └── api/                # session et mutations serveur autorisées
├── components/
│   ├── auth/               # formulaires et contexte Firebase Auth
│   ├── layout/             # shell, navigation et menu utilisateur
│   ├── player/             # lecteur audio persistant
│   └── …                   # artistes, sorties, playlists, recherche
├── data/
│   ├── catalog.ts          # lecture Firestore avec repli mock en développement
│   └── mock/               # catalogue typé et source du seed
├── lib/firebase/
│   ├── auth/               # helpers client et session serveur
│   ├── firestore/          # collections, convertisseurs et repositories
│   ├── storage/            # initialisation client et serveur
│   ├── admin.ts            # Firebase Admin, serveur uniquement
│   └── client.ts           # SDK Web, singleton
├── lib/permissions/        # actions, presets et autorisation centralisée
├── lib/services/           # transactions métier et audit côté serveur
├── stores/                 # store Zustand du lecteur
└── types/                  # modèles UI et documents Firestore
```

## Authentification et sécurité

Nemufy prend en charge l’email/mot de passe et Google. Une connexion réussie échange le jeton Firebase contre un cookie de session serveur `__session`, `httpOnly`, `sameSite=lax` et sécurisé en production. L’accès exige une session valide, une adresse vérifiée, un profil finalisé et un compte actif. Un utilisateur suspendu est refusé lors de la résolution de session et ses refresh tokens sont révoqués.

L’onboarding réserve le nom d’utilisateur dans une transaction Firestore afin d’éviter les doublons concurrents. Les mutations de Studio et d’administration passent par des Route Handlers utilisant l’Admin SDK : session, compte actif, membership et permission sont revérifiés à chaque opération. Les clients ne peuvent pas écrire directement les documents sensibles.

## Rôles et permissions

`User`, `Artist`, `Label` et `Admin` sont des capacités cumulables. `Premium` reste un abonnement séparé (`subscriptionPlan` et `subscriptionStatus`) et ne donne aucun droit de gestion. Les Custom Claims ne contiennent que les capacités système rapides ; artistes, labels, équipes et permissions détaillées restent dans Firestore.

Les relations sont normalisées dans `artistMemberships`, `labelMemberships` et `labelArtists`. Le moteur `can(...)` centralise les décisions. Voir [`docs/roles-and-permissions.md`](docs/roles-and-permissions.md) et [`docs/firestore-schema.md`](docs/firestore-schema.md).

## Artist Studio et Label Studio

`/studio` construit les contextes accessibles au compte courant. Le sélecteur permet de passer d’un artiste à un label sans changer de compte et sans accorder de permission supplémentaire. Releases, uploads, crédits, publication, artistes de label, équipes et analytics préparées sont décrits dans [`docs/studio.md`](docs/studio.md).

## Admin Panel

`/admin` exige simultanément une session Firebase valide, un compte actif et le Custom Claim `admin`. Il expose Users, Artists, Labels, Releases, Tracks, Playlists, Moderation, Platform, Settings et Audit Logs. Les capacités et abonnements sont modifiés via des APIs serveur auditées ; l’impersonation n’est pas implémentée.

## Données

Le modèle Firestore comprend `artists`, `labels`, `artistMemberships`, `labelMemberships`, `labelArtists`, `tracks`, `releases`, `playlists`, `categories`, `invitations` et `auditLogs`. Les documents utilisateur et leurs sous-collections couvrent le profil, les favoris, les artistes suivis, l’historique et les réglages.

En développement, `src/data/catalog.ts` peut revenir au catalogue mock si Firestore est indisponible. Ce repli n’est pas utilisé en production.

## Lecteur audio

`src/stores/player-store.ts` contient la piste courante, la file, la progression, le volume et le mute. `GlobalAudio` est l’unique élément audio de l’application. Une ambiance locale de démonstration est fournie dans `public/audio/quiet-night.wav` jusqu’à la mise en ligne de médias réels.

## Routes principales

- `/login`, `/register`, `/forgot-password`
- `/verify-email`, `/onboarding`
- `/`, `/search`, `/library`
- `/artist/[slug]`, `/release/[slug]`, `/playlist/[slug]`
- `/studio`, `/studio/artists/[artistId]/*`, `/studio/labels/[labelId]/*`
- `/admin`, `/admin/users`, `/admin/artists`, `/admin/labels`
- `/admin/releases`, `/admin/tracks`, `/admin/playlists`, `/admin/categories`, `/admin/audit-logs`

## Avant une mise en production

- activer Email/Password et Google dans Firebase Authentication ;
- ajouter le domaine public aux domaines autorisés ;
- créer Firestore et Storage dans la région choisie ;
- déployer et vérifier les règles de sécurité ;
- stocker les identifiants Admin dans le gestionnaire de secrets de l’hébergeur ;
- activer App Check, les alertes de budget et la journalisation adaptée.
