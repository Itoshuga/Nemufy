# Nemufy

Nemufy est une plateforme web de streaming audio dédiée à l’ASMR. Cette version relie l’interface Next.js à Firebase pour l’authentification, les sessions serveur, le catalogue Firestore et le futur stockage des médias.

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
pnpm firebase:seed -- --dry-run
pnpm firebase:seed          # import du catalogue dans un projet vide
pnpm firebase:deploy:rules  # règles et index Firebase
```

## Architecture

```text
src/
├── app/
│   ├── (app)/              # routes protégées de l’application
│   ├── (auth)/             # connexion, inscription, vérification et onboarding
│   └── api/                # session serveur et profil
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
├── stores/                 # store Zustand du lecteur
└── types/                  # modèles UI et documents Firestore
```

## Authentification et sécurité

Nemufy prend en charge l’email/mot de passe et Google. Une connexion réussie échange le jeton Firebase contre un cookie de session serveur `__session`, `httpOnly`, `sameSite=lax` et sécurisé en production. L’accès aux routes de l’application exige une session valide, une adresse vérifiée, un profil finalisé et un compte actif.

L’onboarding réserve le nom d’utilisateur dans une transaction Firestore afin d’éviter les doublons concurrents. Les règles de sécurité séparent les données privées par utilisateur et limitent les écritures du catalogue aux comptes possédant le custom claim `admin`.

## Données

Le catalogue Firestore normalisé comprend les collections `artists`, `tracks`, `releases`, `playlists` et `categories`. Les documents utilisateur et leurs sous-collections couvrent le profil, les favoris, les artistes suivis, l’historique et les réglages. Le modèle et ses choix de dénormalisation sont détaillés dans [`docs/firestore-data-model.md`](docs/firestore-data-model.md).

En développement, `src/data/catalog.ts` peut revenir au catalogue mock si Firestore est indisponible. Ce repli n’est pas utilisé en production.

## Lecteur audio

`src/stores/player-store.ts` contient la piste courante, la file, la progression, le volume et le mute. `GlobalAudio` est l’unique élément audio de l’application. Une ambiance locale de démonstration est fournie dans `public/audio/quiet-night.wav` jusqu’à la mise en ligne de médias réels.

## Routes principales

- `/login`, `/register`, `/forgot-password`
- `/verify-email`, `/onboarding`
- `/`, `/search`, `/library`
- `/artist/[slug]`, `/release/[slug]`, `/playlist/[slug]`

## Avant une mise en production

- activer Email/Password et Google dans Firebase Authentication ;
- ajouter le domaine public aux domaines autorisés ;
- créer Firestore et Storage dans la région choisie ;
- déployer et vérifier les règles de sécurité ;
- stocker les identifiants Admin dans le gestionnaire de secrets de l’hébergeur ;
- activer App Check, les alertes de budget et la journalisation adaptée.
