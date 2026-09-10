# État des vérifications — 9 septembre 2026

| Vérification                                           | Résultat                                                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| TypeScript strict                                      | Réussi                                                                                                               |
| ESLint sans avertissement                              | Réussi                                                                                                               |
| Tests Jest métier                                      | 14 tests réussis                                                                                                     |
| Interactions des routes et écrans React Native         | 2 tests réussis : cinq repas jusqu’aux courses ; match après deux votes                                              |
| Reconnexion et file de courses                         | 1 test réussi : affichage optimiste, persistance, même UUID rejoué puis acquitté                                     |
| Migration et seed SQL                                  | Exécutés avec succès dans PostgreSQL PGlite                                                                          |
| Permissions SQL                                        | Membres autorisés, votes privés, troisième compte refusé, invitations non listables, écritures directes interdites   |
| Collaboration SQL                                      | Consensus, consommation unique d’invitation, cases visibles au second utilisateur, idempotence et règles d’allergies |
| Canaux Realtime                                        | RLS de canal vérifiée en SQL ; payload limité à la révision                                                          |
| Export Web / Android / iOS                             | Réussi ; bundles JavaScript/Hermes générés                                                                           |
| Serveur de test local                                  | Démarré sur le port 8081                                                                                             |
| Vérification visuelle dans le navigateur               | Bloquée : le navigateur distant ne peut pas ouvrir le serveur localhost                                              |
| APK / IPA installés sur de vrais appareils             | Non effectué : comptes, signature et appareils à raccorder                                                           |
| Supabase hébergé                                       | Réussi : 18 tables avec RLS, 16 fixtures, migrations appliquées, tests transactionnels sans données résiduelles      |
| Vrais emails et WebSockets sur appareils               | Non effectué : URL de retour à autoriser et appareils à raccorder                                                    |
| Catalogue culinaire, photos et nutrition de production | Non validé ; fixtures explicites uniquement                                                                          |

Les tests d’interaction utilisent les vrais écrans et routes Expo Router ; seuls les services natifs de test, fontes et stockage sont remplacés. La file de synchronisation est testée avec un serveur simulé. Les tests SQL exécutent le vrai schéma et les vraies politiques, mais simulent l’identité fournie par Auth et le transport Realtime. Il ne faut donc pas présenter ces tests comme un essai sur deux téléphones.

## Rejouer les vérifications

```sh
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:db
npx expo export --platform all
```

Le workflow `.github/workflows/check.yml` prépare ces contrôles de code et l’export web sur GitHub, sans déploiement d’application. Le succès d’une exécution distante doit être constaté dans Actions, il n’est pas déduit des résultats locaux.

## Avant une vraie bêta

Autoriser l’URL de retour Supabase ; tester les liens email et invitation sur deux comptes ; vérifier le canal privé avec un troisième compte ; essayer une coupure réseau et des coches concurrentes sur appareils. Remplacer les fixtures par un lot de recettes autorisées, testées et sourcées. Vérifier l’affichage et l’accessibilité sur petits écrans iOS/Android. Créer les builds signés seulement après les accès et autorisations nécessaires.

## Validation hébergée

`tests/hosted-smoke.sql` a été exécuté sur le projet de développement le 9 septembre 2026 : trois identités temporaires, votes privés, match après deux votes, courses partagées, génération depuis le planning, idempotence et refus inter-foyers. La transaction est annulée à la fin : zéro utilisateur et zéro foyer après le test. Les identités sont injectées dans le contexte SQL ; ce test ne valide pas l’envoi d’email ou le transport WebSocket.

L’audit Supabase ne signale plus d’accès anonyme à une fonction privilégiée. Il signale les sept fonctions SECURITY DEFINER accessibles aux utilisateurs connectés : ces points d’entrée sont intentionnels, avec contrôle d’identité ou d’appartenance et chemin de recherche vide. Voir [la règle Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Les fonctions internes ne sont pas exécutables par les clients. La lecture directe des invitations est explicitement refusée.

La CLI n’étant pas disponible dans l’environnement, les migrations distantes ont été appliquées par le connecteur puis enregistrées avec leurs versions réelles. Le test PGlite applique toutes les migrations et reproduit les grants par défaut Supabase pour prévenir une régression des accès anonymes.

## Connexion mobile par lien — 10 septembre 2026

Le parcours par code est remplacé par un lien email compatible avec les templates par défaut. Tests ajoutés : redirection explicite, persistance du prénom, erreur SMTP compréhensible, échange PKCE unique, refus d’un lien expiré, profil existant préservé, callback accessible avant connexion et vecteur S256 RFC 7636 via l’adaptateur crypto natif. Les appels Auth et les fonctions cryptographiques natives sont simulés dans Jest ; aucune réception d’email ni ouverture sur un vrai téléphone n’est revendiquée.

Le réglage distant Redirect URLs, l’accès Expo pour construire/distribuer et les essais sur appareils restent nécessaires. Aucun compte externe de test n’a été créé et aucun email envoyé. Les builds iPhone/Android restent non signés tant que la distribution n’est pas raccordée.
