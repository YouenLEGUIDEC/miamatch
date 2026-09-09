# Connexion et distribution de Miamatch

Ce guide prépare les étapes externes. **Ne pas souscrire, engager de frais ni envoyer sur un store sans l’accord du fondateur.** Aucun build signé, projet Supabase distant ou publication d’application n’a été créé automatiquement.

## 1. Projet Supabase de développement

Action du fondateur : créer un projet gratuit dans [Supabase](https://supabase.com/dashboard), de préférence dans une région proche des deux testeurs. Conserver le mot de passe de la base privé. Transmettre uniquement la **Project URL** et la **publishable key** pour raccorder le mobile ; ces deux valeurs sont conçues pour être publiques, la sécurité repose sur les RLS.

Pour appliquer le schéma, l’ingénieur aura besoin d’un accès autorisé au projet. Deux chemins sont possibles : exécuter les fichiers dans SQL Editor sur le nouveau projet, ou utiliser la CLI authentifiée. Ne pas coller de mot de passe de base ou de service role dans le chat ou le dépôt.

Dans SQL Editor du projet **de développement vide** : exécuter `supabase/migrations/202609090001_core.sql`, puis `supabase/seed.sql`. Le second fichier ne contient que des fixtures. Il ne transforme pas ces fiches en recettes de production.

Avec une CLI Supabase authentifiée, l’équivalent préparé est :

```sh
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase db push --include-seed
```

Le mot de passe et les accès sont saisis dans le canal sécurisé de l’outil concerné. Ne jamais lancer `db reset` sur un environnement partagé ou de production.

### Email OTP

Dans Authentication → Email Templates, adapter le template **Magic Link** pour afficher `{{ .Token }}`. Le mobile utilise `signInWithOtp` puis `verifyOtp` avec le code saisi ; un lien email seul ne suffit pas à ce parcours. Pour les utilisateurs initiaux, vérifier également le template de confirmation et y conserver le code lorsque nécessaire.

L’email de test Supabase peut être limité aux destinataires autorisés. Un SMTP externe est généralement nécessaire pour de vrais testeurs hors équipe ; aucune configuration ou dépense SMTP n’est engagée ici. [Documentation OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).

### Configuration du mobile

Copier `.env.example` en `.env`, compléter les deux valeurs publiques puis redémarrer Expo avec le cache vidé :

```sh
npm start -- --clear
```

Se déconnecter du mode démo pour afficher la connexion email. Créer un foyer sur le premier compte, générer un code puis rejoindre le foyer avec le second compte. Chaque code expire après 48 h et ne fonctionne qu’une fois. Le lien `miamatch://crew?code=…` suppose une app installée ; le code fonctionne même sans lien universel.

### Temps réel

Realtime doit être activé sur le projet. La migration crée le trigger `realtime.send` et la politique d’accès au canal privé. Aucune publication Postgres Changes n’est nécessaire. Tester les deux comptes : une case apparaît cochée sur l’autre téléphone ; un compte d’un autre foyer ne voit ni la liste ni le canal.

## 2. Essai local gratuit

```sh
npm ci
npm start
```

Utiliser Expo Go SDK 57 sur les deux appareils tant que les modules utilisés y sont disponibles. Vérifier la connexion au même serveur Metro. Un développement build permet ensuite une application indépendante d’Expo Go.

## 3. Préparer EAS

Un compte Expo et une autorisation du fondateur sont nécessaires. Le projet EAS n’a pas été créé. Après autorisation :

```sh
npx eas-cli login
npx eas-cli init
```

Ces commandes relient `app.json` au projet EAS réel ; ne pas inventer son `projectId`. Ajouter les deux valeurs publiques Supabase à l’environnement EAS du profil choisi. Les `.env` locaux ne doivent pas être commités.

Le profil `preview` est en distribution interne. Dans les réglages Expo, désactiver l’accès non authentifié aux builds internes si une diffusion strictement restreinte est souhaitée. Vérifier les quotas gratuits avant chaque lancement ; ne pas basculer sur une offre payante automatiquement.

## 4. Android

Après autorisation de lancer le build :

```sh
npx eas-cli build --platform android --profile preview
```

Le résultat est un APK de test installable directement sur Android, signé par le keystore configuré. L’AAB est réservé à une distribution Play. Vérifier les identifiants `app.miamatch.mobile` avant la première publication, puis conserver la clé de signature.

## 5. iOS en interne

La distribution ad hoc requiert un compte Apple Developer et l’enregistrement des appareils. Ne pas acheter ce compte sans accord.

```sh
npx eas-cli device:create
npx eas-cli build --platform ios --profile preview
```

Seuls les appareils inclus dans le profil peuvent installer le build. Ajouter un appareil peut demander un nouveau build. [Guide officiel de distribution interne Expo](https://docs.expo.dev/build/internal-distribution/).

## 6. TestFlight — préparation seulement

Créer la fiche d’app dans App Store Connect avec le bon bundle identifier, configurer la signature, puis construire le profil `production`. Après accord explicite d’envoi, téléverser le build signé et remplir les informations de bêta/confidentialité. Ajouter les testeurs internes autorisés ou un groupe externe ; une revue bêta peut être requise pour les externes. Ne pas publier de lien public sans accord. [TestFlight officiel](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/).

## 7. Google Play Internal Testing — préparation seulement

Créer l’app dans Play Console après autorisation, configurer Play App Signing, construire un AAB avec `production`, puis créer une version dans **Testing → Internal testing**. Ajouter les emails des testeurs et partager le lien d’inscription privé. Remplir les déclarations de données réellement collectées avant de distribuer. Ne pas promouvoir en production. [Guide Google](https://support.google.com/googleplay/android-developer/answer/9845334).

## 8. Critères avant les deux premiers utilisateurs

- Connexion OTP réussie sur chaque appareil et reprise de session.
- Invitation consommée une fois ; isolation d’un troisième compte.
- Filtrage des restrictions des deux personnes et match seulement après leurs deux votes positifs.
- Cinq repas différents, quantités justes, courses sans doublons et présence au garde-manger.
- Case cochée visible sur l’autre appareil ; reconnexion après passage en mode avion ; conflit de cases compris.
- Catalogue de recettes réellement autorisées et testées, photos et nutrition sourcées.
- Retour visuel sur petite taille d’écran, lecteur d’écran et gestes natifs.

Les builds et les essais hébergés restent distincts des tests de code. L’état exact est dans `docs/VALIDATION.md`.
