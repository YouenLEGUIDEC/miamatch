# Architecture et décisions

État initial : 9 septembre 2026. Versions obtenues par le registre npm et alignées sur le SDK Expo, verrouillées dans `package-lock.json`.

| Choix                                               | Justification                                                                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------- |
| Expo SDK 57.0.21, React Native 0.86.3, React 19.2.3 | Versions stables compatibles du template officiel, pas de canary                 |
| TypeScript 6 strict                                 | Modèles explicites, pas de `any` dans la logique métier                          |
| Expo Router                                         | Navigation native, onglets, routes de recettes et liens d’invitation             |
| Supabase JS 2, PostgreSQL et RLS                    | Comptes, isolation des foyers et opérations atomiques                            |
| Broadcast privé                                     | Notification de révision seulement, sans vote ni préférence dans les messages    |
| AsyncStorage + SecureStore natif                    | Démo/cache et file de cases offline ; sessions natives dans le stockage sécurisé |
| Jest / jest-expo + React Native Testing Library     | Tests métier et interactions des écrans                                          |
| PGlite PostgreSQL                                   | Vérification locale des migrations et permissions sans Docker                    |

Sources officielles : [SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/), [Supabase React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native), [Jest dans Expo](https://docs.expo.dev/develop/unit-testing/).

## Flux des données

Les écrans déclenchent une `Action` typée. En démo, un reducer pur applique l’action et persiste le résultat. En mode connecté, la fonction SQL `apply_action` vérifie le membre, verrouille le foyer, effectue l’opération, enregistre son identifiant et incrémente la révision. Un snapshot ne contient que les votes de l’utilisateur courant. Le client affiche le nouvel état et les autres membres sont informés via Broadcast.

Postgres Changes est plus simple mais nécessite une vérification par abonné. Broadcast est le choix recommandé par [Supabase](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) pour la montée en charge. Ici le serveur émet seulement `{revision}` sur `household:<uuid>`. Une RLS sur `realtime.messages` vérifie l’appartenance. Les clients ne peuvent pas émettre de faux événements d’autorité.

Une reconnexion ou un intervalle de cinq secondes relit le snapshot pour réparer les événements perdus. Cela couvre le premier petit foyer ; pour un grand déploiement, remplacer le polling systématique par un refetch lié à la reconnexion et un backoff avec jitter.

## Conflits et réseau

Les cases de courses utilisent une valeur explicite `checked=true/false`, jamais une inversion aveugle côté serveur. La file persistante contient un UUID d’opération. Une réponse perdue peut être rejouée sans appliquer deux fois l’action. En cas de conflit, la dernière écriture acceptée par le serveur gagne. Une ancienne case hors connexion peut donc remplacer une valeur plus récente : c’est une règle explicite du MVP, pas une fusion CRDT.

Les actions non idempotentes de planning attendent le serveur. Une erreur visible remplace toute fausse confirmation. Les cases en attente sont affichées comme telles. Le cache permet de relire les données après une perte de connexion ; la déconnexion est bloquée pendant une file non synchronisée afin de ne pas jeter silencieusement les modifications.

## Catalogue et droits

Le catalogue de développement utilise 16 fixtures, également présentes dans le seed SQL. Le client connecté lit les `display_data` du serveur. Le schéma stocke des ingrédients relationnels pour les filtres et les courses ; `display_data` est une projection de présentation. Une ingestion de production doit valider les deux représentations dans la même transaction.

La requête initiale du MVP lit une page de 100 fiches. Le préchargement des trois images suivantes existe pour les sources qui en autorisent l’usage. La pagination d’un grand catalogue et un fournisseur de production ne sont pas activés. Aucun contenu externe n’est stocké aujourd’hui.

Le modèle de provenance encode les droits de stockage, instructions et images. Il ne suffit pas de renseigner un booléen pour obtenir une licence : l’import réel exige une validation documentée et une politique d’expiration adaptée. Le cache mobile sera restreint aux sources autorisant cette conservation.

## Sécurité

RLS activée sur toutes les tables privées. Les clients disposent de droits SELECT ciblés ; les écritures passent par des RPC `SECURITY DEFINER` avec `search_path` vide et contrôle `auth.uid()`. Aucun membre ne peut s’insérer directement dans un foyer. Les invitations aléatoires de 12 caractères expirent sous 48 h et sont consommées atomiquement ; émission limitée à 10 par heure et par foyer.

Le MVP ne propose pas encore le départ/transfert/suppression de foyer ni l’effacement de compte en libre-service. Ces procédures doivent être ajoutées avant une distribution de production. Les préférences dans le cache local ne sont pas chiffrées par l’application ; les jetons natifs le sont via SecureStore. Les sessions web utilisent le stockage du navigateur et sont destinées ici à la prévisualisation de développement.

## Limites de validation

Pas d’émulateur iOS/Android, de compte Expo/EAS connecté ni de projet Supabase hébergé dans cette session. Les vérifications SQL simulent les entrées Auth et le transport Realtime ; elles vérifient réellement les RLS et transactions. L’autorisation Realtime et la latence doivent encore être confirmées sur un service Supabase et deux appareils. Voir `docs/VALIDATION.md`.
