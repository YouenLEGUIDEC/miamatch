# Connexion et distribution de Miamatch

**Ne pas souscrire, engager de frais ni envoyer sur un store sans l’accord du fondateur.** Aucun build signé ou publication d’application n’a été créé.

## 1. Projet Supabase de développement

Créé le 9 septembre 2026 dans l’organisation Miamatch, offre Free, région Paris (`eu-west-3`). Coût de création annoncé : 0 par mois.

- Projet : `vraijjvfduypysrphybx`.
- Console : https://supabase.com/dashboard/project/vraijjvfduypysrphybx
- API : https://vraijjvfduypysrphybx.supabase.co
- Les deux migrations de `supabase/migrations/` sont appliquées et leurs versions correspondent à l’historique distant.
- Le seed de 16 fixtures est chargé ; ce ne sont pas des recettes culinaires validées.
- Le fichier `.env` du poste de travail est raccordé avec la clé publishable, hors Git.

Ne pas réexécuter les migrations manuellement sur ce projet. Pour un autre environnement vide, appliquer les deux migrations dans l’ordre puis `supabase/seed.sql`. Ne jamais lancer `db reset` sur un environnement partagé ou de production. Ne transmettre aucun mot de passe de base ou clé service role dans le chat ou le dépôt.

### Connexion par lien email — iPhone et Android

Le parcours utilise maintenant les templates Supabase par défaut, sans modification ni domaine à acheter. L’app demande le lien avec `emailRedirectTo`, échange le code PKCE au retour dans `auth/callback`, conserve le nom d’un profil existant et charge son foyer. La session et le vérificateur PKCE sont conservés dans SecureStore sur mobile. Un adaptateur Expo Crypto apporte un aléa sécurisé et SHA-256 sur Hermes ; aucune dégradation vers un challenge PKCE en clair n’est acceptée.

**Étape manuelle nécessaire :** dans [Authentication → URL Configuration](https://supabase.com/dashboard/project/vraijjvfduypysrphybx/auth/url-configuration), ajouter exactement `miamatch://auth/callback` aux **Redirect URLs**. Le connecteur ne peut pas modifier ce réglage. Ne pas remplacer ni supprimer les autres adresses. Le changement de `config.toml` concerne seulement Supabase local.

Cette adresse fonctionne avec une version native installée de Miamatch. Avec Expo Go, `Linking.createURL` utilise une adresse `exp://…/--/auth/callback` dépendante du serveur : il faut autoriser cette adresse exacte et maintenir le serveur accessible. Le QR Expo Go ne constitue pas une version autonome. Pour un essai web local, autoriser `http://localhost:8081/auth/callback` et ouvrir le lien dans le navigateur qui a demandé la connexion. Une version web distante doit utiliser HTTPS et sa propre URL exacte.

Ouvrir le dernier email sur le même téléphone et dans la même application que celle ayant demandé le lien. Les liens expirés ou ouverts ailleurs présentent un message et permettent de recommencer. Ne pas partager les liens de connexion ou les paramètres qu’ils contiennent.

**Limite du service gratuit par défaut :** seules les adresses membres de l’équipe Supabase reçoivent les emails, actuellement au maximum deux emails par heure pour le projet. Commencer avec l’adresse du fondateur. Tester ce même compte sur deux appareils valide la synchronisation mais ne représente pas deux convives distincts. Ne pas inviter des testeurs dans l’administration Supabase uniquement pour contourner cette limite : prévoir un service email externe avant une bêta multi-utilisateurs. [Documentation SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

La [modification du 3 juin 2026](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier) explique pourquoi les templates ne sont pas modifiables sur ce projet Free. Le fichier `supabase/templates/email-otp.html` est une ancienne préparation pour une éventuelle connexion par code ; ne pas l’appliquer au parcours par lien actuel.

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

Un compte Expo et une autorisation du fondateur sont nécessaires. Le projet EAS est créé dans `youen_lg` : `0b5e053e-cc8c-4338-8757-bff55c6da2a6`. L’accès par le secret GitHub `EXPO_TOKEN` a été vérifié. Console : https://expo.dev/accounts/youen_lg/projects/miamatch . Le dépôt contient maintenant le véritable `extra.eas.projectId`.

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

- Connexion par lien réussie sur chaque appareil et reprise de session.
- Invitation consommée une fois ; isolation d’un troisième compte.
- Filtrage des restrictions des deux personnes et match seulement après leurs deux votes positifs.
- Cinq repas différents, quantités justes, courses sans doublons et présence au garde-manger.
- Case cochée visible sur l’autre appareil ; reconnexion après passage en mode avion ; conflit de cases compris.
- Catalogue de recettes réellement autorisées et testées, photos et nutrition sourcées.
- Retour visuel sur petite taille d’écran, lecteur d’écran et gestes natifs.

Les builds et les essais hébergés restent distincts des tests de code. L’état exact est dans `docs/VALIDATION.md`.

## Essais préparés le 10 septembre 2026

Le fondateur confirme avoir ajouté `miamatch://auth/callback` dans Supabase. iPhone est prioritaire ; Android est destiné à sa compagne.

- Le workflow `expo-access.yml` a validé le compte `youen_lg` à partir du secret GitHub. Le jeton reste dans GitHub et n’est pas recopié dans le poste de travail.
- `expo-setup.yml` a créé le projet Expo. Aucun abonnement ni build EAS payant n’est déclenché.
- `android-preview.yml` prépare un APK autonome arm64 depuis un projet natif généré avec Expo, signé avec la clé de développement de ce projet. C’est un fichier de test, pas une signature de production. L’artefact GitHub expire après 14 jours. Les paramètres Supabase inclus sont uniquement l’URL et la clé publishable.
- L’essai iPhone via Expo Go exige un serveur accessible. L’ouverture du tunnel ngrok a été rejetée par le contrôle automatique faute d’autorisation explicite pour exposer le serveur de développement sur Internet. Ne pas retenter ni contourner ce blocage sans cet accord. L’URL Expo Go serait différente du lien natif et devrait être ajoutée aux Redirect URLs pour tester la connexion email.
- Aucune installation ou ouverture sur appareil physique n’a encore été vérifiée.
