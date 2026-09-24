# Nemufy

Nemufy est une plateforme web de streaming audio dédiée à l’ASMR. Elle réunit l’application d’écoute et un backoffice unique pour les artistes, labels et administrateurs, protégé par Firebase, des memberships et un moteur de permissions centralisé.

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
pnpm firebase:migrate-backoffice       # aperçu sans écriture
pnpm firebase:migrate-backoffice -- --apply
pnpm firebase:deploy:rules  # règles et index Firebase
```

## Architecture

```text
src/
├── app/
│   ├── (app)/              # routes protégées de l’application
│   ├── (auth)/             # connexion, inscription, vérification et onboarding
│   ├── (manage)/manage/    # backoffice Artiste, Label et Admin unifié
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

L’onboarding réserve le nom d’utilisateur dans une transaction Firestore afin d’éviter les doublons concurrents. Les mutations du backoffice passent par des Route Handlers utilisant l’Admin SDK : session, compte actif, membership et permission sont revérifiés à chaque opération. Les clients ne peuvent pas écrire directement les documents sensibles.

## Rôles et permissions

`User`, `Artist`, `Label` et `Admin` sont cumulables. `Premium` reste un abonnement séparé (`subscriptionPlan` et `subscriptionStatus`) et ne donne aucun droit de gestion. Seul `Admin` est un Custom Claim global. Les accès Artiste et Label proviennent exclusivement des memberships actifs dans Firestore.

Les relations sont normalisées dans `artistMemberships`, `labelMemberships` et `labelArtists`. Le moteur `can(...)` centralise les décisions. Voir [`docs/roles-and-permissions.md`](docs/roles-and-permissions.md) et [`docs/firestore-schema.md`](docs/firestore-schema.md).

## Backoffice unifié

`/manage` construit les contextes accessibles au compte courant. Le même sélecteur permet de passer d’un artiste à un label ou à l’administration sans changer de compte et sans accorder de permission supplémentaire.

- Artiste : Overview, Music, Profile, Team.
- Label : Overview, Artists, Music, Team, Profile.
- Admin : Overview, Users, Artists, Labels, Music, Playlists, Platform, Audit Logs.

Releases et Tracks sont regroupés dans Music. Une release s’ouvre directement sur `/manage/releases/[releaseId]`. Les anciennes URLs `/studio/*` et `/admin/*` redirigent vers leur destination canonique. Les parcours sont détaillés dans [`docs/studio.md`](docs/studio.md).

L’administration exige simultanément une session Firebase valide, un compte actif et le Custom Claim `admin`. Les pages admin ouvrent les mêmes workspaces Artiste et Label que les équipes, sans éditeur parallèle. Les accès et abonnements sont modifiés via des APIs serveur auditées ; l’impersonation n’est pas implémentée.

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
- `/manage`
- `/manage/artists/[artistId]`, `/music`, `/profile`, `/team`
- `/manage/labels/[labelId]`, `/artists`, `/music`, `/profile`, `/team`
- `/manage/releases/[releaseId]`
- `/manage/admin`, `/users`, `/artists`, `/labels`, `/music`, `/playlists`, `/platform`, `/audit-logs`

## Migration d’un projet existant

`pnpm firebase:migrate-backoffice` affiche uniquement le nombre de memberships et de claims à convertir. Après sauvegarde et revue, ajouter `-- --apply`. Le script conserve les exceptions dans `permissionOverrides`, supprime les maps de permissions dupliquées et retire les anciens claims `artist`/`label`. Les rôles restent inchangés ; les utilisateurs devront renouveler leur session après application.

## Avant une mise en production

- activer Email/Password et Google dans Firebase Authentication ;
- ajouter le domaine public aux domaines autorisés ;
- créer Firestore et Storage dans la région choisie ;
- déployer et vérifier les règles de sécurité ;
- stocker les identifiants Admin dans le gestionnaire de secrets de l’hébergeur ;
- activer App Check, les alertes de budget et la journalisation adaptée.
