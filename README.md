# SafeCom — CRM de prospection Safecheck RDC

Frontend **Next.js 16** (App Router, React 19, Bootstrap) et API **Laravel** (`backend/`) sur **MySQL**.

```
Navigateur ──► Next.js (server components / server actions)
                   │  lib/prisma.ts : API façon Prisma
                   ▼
              POST /api/data  (en-tête X-Internal-Token)
                   ▼
              Laravel PrismaGateway ──► MySQL
```

L'API Laravel n'est jamais appelée par le navigateur : seul le serveur Next la contacte, avec un token partagé.
L'authentification, les rôles et le cloisonnement par organisation (`orgScope`) sont gérés côté Next (`lib/auth.ts`).

## Installation locale

Prérequis : Node 20+, PHP 8.3+, Composer, MySQL (MAMP, port 8889 par défaut).

```bash
npm install
```

```bash
composer install --working-dir=backend
```

1. Copier `.env.example` vers `.env.local`, et `backend/.env.example` vers `backend/.env`.
2. Mettre **la même valeur** dans `LARAVEL_INTERNAL_TOKEN` (Next) et `INTERNAL_API_TOKEN` (Laravel). Sans elle, toutes les requêtes sont refusées.
3. Renseigner `SESSION_SECRET` (au moins 16 caractères) et les variables `DB_*` du backend.
4. Générer la clé Laravel, migrer et remplir la base :

```bash
php backend/artisan key:generate
```

```bash
npm run db:migrate && npm run db:seed
```

5. Lancer les deux serveurs (deux terminaux) :

```bash
npm run dev:api
```

```bash
npm run dev
```

Les comptes de démonstration créés par le seeder ne sont affichés sur `/login` qu'en développement.
**Ne lancez jamais `db:seed` en production** : il crée des comptes avec des mots de passe connus.

## Vérifications

| Commande | Rôle |
| --- | --- |
| `npm test` | tests unitaires de la logique métier (`lib/*.test.ts`) |
| `npm run lint` | ESLint (le dossier `backend/` est exclu) |
| `npx tsc --noEmit` | vérification des types |
| `cd backend && php artisan test` | tests PHPUnit de l'API `/api/data` (SQLite en mémoire) |
| `npm run build` | build de production |

## Déploiement

- Backend : `APP_DEBUG=false`, puis `composer dump-autoload -o` et `php artisan config:cache`.
- Le token interne est lu via `config('services.internal.token')`, il reste donc valable après `config:cache`.
- Une session reste valide 7 jours, mais chaque requête revérifie que le compte est actif. Désactiver un utilisateur le déconnecte immédiatement (`/auth/signout`).
