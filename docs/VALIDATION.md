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
| Supabase hébergé, vrais emails, vrais WebSockets       | Non effectué : aucun projet externe connecté                                                                         |
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

Raccorder Supabase ; tester OTP et invitation sur deux comptes ; vérifier le canal privé avec un troisième compte ; essayer une coupure réseau et des coches concurrentes sur appareils. Remplacer les fixtures par un lot de recettes autorisées, testées et sourcées. Vérifier l’affichage et l’accessibilité sur petits écrans iOS/Android. Créer les builds signés seulement après les accès et autorisations nécessaires.
