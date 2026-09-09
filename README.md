# Miamatch ✳

**Swipe ton prochain kiff.** Une application mobile pour décider ensemble quoi manger, préparer la semaine et faire les courses.

## Ce qui est livré

Application Expo / React Native en français, avec navigation, identité visuelle, démo persistante sur le téléphone, préférences, mood, swipe, favoris, mode aléatoire filtré, deux convives sur le même téléphone, matchs, choix des repas, planning réordonnable, courses agrégées et garde-manger.

L’adaptateur Supabase implémente la connexion par code email, la création du foyer, les invitations à usage unique, les votes privés, les matchs validés côté serveur et les courses partagées par Broadcast privé. Les migrations, le jeu de développement et les tests de permissions sont inclus. **Il faut raccorder un projet Supabase pour essayer ce mode sur deux téléphones.**

Les 16 fiches actuelles sont des **fixtures synthétiques de développement**, avec illustrations provisoires. Elles ne sont pas validées en cuisine. Pas de notes, de chiffres nutritionnels ou de recettes réelles inventés. Le catalogue culinaire et les photos autorisées restent à sélectionner : voir [RECIPE_SOURCES.md](RECIPE_SOURCES.md).

## Démarrer sans compte externe

Prérequis : Node.js 22.13 ou plus récent, npm. Node 24 a servi aux vérifications initiales.

```sh
npm ci
npm start
```

Installer Expo Go compatible SDK 57 sur le téléphone, puis scanner le QR code affiché par Expo. Le téléphone et l’ordinateur doivent pouvoir communiquer sur le réseau local. Appuyer sur **Explorer la démo**, saisir un prénom puis enregistrer ses préférences. Aucun `.env` n’est nécessaire pour la démo.

```sh
npm run web       # ouverture web de développement
npm run android   # ouvre un émulateur Android installé localement
npm run ios       # nécessite macOS + Xcode pour le simulateur
```

### Parcours à essayer

1. Accueil → régler le mood → **Fais-moi swiper**.
2. Dire oui à une recette. Passer au second convive avec le bouton prévu ; dire oui à la même recette pour obtenir un Miamatch.
3. **Prépare ma semaine** → choisir cinq repas → voir le planning.
4. Affecter les jours, déplacer les repas si besoin, puis **Générer ma liste de courses**.
5. Cocher un produit, ajouter « Éponge », puis retrouver les éléments au prochain lancement.
6. Ajouter du riz au garde-manger : il passe dans **Déjà chez nous**.

La démo du même téléphone n’est pas une simulation de réseau : les deux utilisateurs votent vraiment, mais partagent un stockage local.

## Raccorder Supabase

Guide pas à pas : [DEPLOYMENT.md](DEPLOYMENT.md). Les deux seules valeurs présentes dans le mobile sont l’URL du projet et sa clé **publishable**. Une clé `service_role`, un mot de passe de base ou une clé d’API de recettes ne doivent jamais figurer dans une variable `EXPO_PUBLIC_*`.

```sh
cp .env.example .env
# Compléter EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
npm start -- --clear
```

Les migrations et le seed doivent être appliqués avant de se connecter. Le template d’email Supabase doit afficher le code `{{ .Token }}`. Aucun email n’a été envoyé pendant le développement.

## Vérifier

```sh
npm run typecheck
npm run lint
npm test
npm run test:db
npm run format:check
npm run export:web
```

Les tests SQL utilisent PostgreSQL via PGlite : vraies contraintes, fonctions et RLS ; services Auth et transport WebSocket simulés. Ils ne remplacent pas l’essai d’un Supabase hébergé ni celui de deux téléphones. [État des vérifications](docs/VALIDATION.md).

## Se repérer

| Dossier / fichier        | Rôle                                                    |
| ------------------------ | ------------------------------------------------------- |
| `app/`                   | Routes Expo Router                                      |
| `src/screens/`           | Écrans fonctionnels                                     |
| `src/ui/`                | Composants et design tokens                             |
| `src/domain/`            | Recommandation, planning et courses, sans dépendance UI |
| `src/state/`             | État, démo, synchronisation et reconnexion              |
| `src/data/`              | Client Supabase et catalogue de démonstration           |
| `supabase/`              | Schéma SQL, sécurité, configuration et seed             |
| `tests/`                 | Tests métier, interaction et permissions                |
| `PRODUCT.md`             | Vision, périmètre et hypothèses                         |
| `ARCHITECTURE.md`        | Choix techniques et limites                             |
| `docs/SCHEMA.md`         | Tables et règles d’accès                                |
| `docs/RECOMMENDATION.md` | Fonction de classement explicable                       |
| `RECIPE_SOURCES.md`      | Comparaison actuelle et droits                          |
| `DEPLOYMENT.md`          | Android, iOS, bêta, TestFlight, Play Internal Testing   |

Aucun abonnement, paiement, déploiement d’application public ou envoi sur les stores n’est effectué automatiquement. Le code du dépôt peut être public ; cela ne rend pas les données Supabase publiques.
