# Schéma relationnel

| Table                  | Relation et rôle                                                      |
| ---------------------- | --------------------------------------------------------------------- |
| `profiles`             | 1:1 avec `auth.users`, prénom                                         |
| `user_preferences`     | 1:1 avec profil, préférences validées par RPC                         |
| `households`           | Foyer, propriétaire, mood, objectif et portions de semaine, révision  |
| `household_members`    | N membres par foyer ; un foyer actif par profil dans ce MVP           |
| `invitations`          | Code aléatoire, expiration, consommation unique sous verrou           |
| `recipe_sources`       | Provenance, auteur, licence et droits distincts                       |
| `recipes`              | Métadonnées indexées et projection de présentation                    |
| `ingredients`          | Identité canonique, rayon, allergènes                                 |
| `recipe_ingredients`   | N:N avec quantité et unité pour le nombre de portions de base         |
| `recipe_nutrition`     | Valeur, unité, source, méthode, référence et confiance par nutriment  |
| `swipes`               | Un vote par personne/foyer/recette ; lecture réservée au votant       |
| `matches`              | Consensus de tous les membres, unique par foyer/recette               |
| `favorites`            | Recettes favorites privées de chaque personne                         |
| `meal_plan_items`      | Planning actif, recette, portions, position et jour facultatif        |
| `pantry_items`         | Présence simple d’un ingrédient dans un foyer                         |
| `shopping_list_items`  | Identité stable ingrédient/unité ou UUID manuel, quantité, case       |
| `recipe_adaptations`   | Futur contenu distinct de l’original, modèle et contraintes conservés |
| `processed_operations` | Idempotence des écritures rejouées                                    |

Les clés étrangères empêchent les références fantômes. Les clés composites évitent les doublons. Les nombres de repas et de personnes sont bornés. Les filtres et recherches utilisent des indexes sur temps/budget/mood, régimes GIN et ingrédients. Les accès par foyer et les votes nécessaires au consensus sont indexés.

Les entités « meal_plans » et « shopping_lists » ne sont pas ajoutées artificiellement : un seul planning et une liste active par foyer, sans historique. Les tags de régime sont des arrays indexés. Les sessions de swipe et l’historique des semaines pourront devenir des tables à part lors de l’ajout des archives.

## Permissions

Les données culinaires sont lisibles par un utilisateur authentifié. Les profils/préférences et favoris sont lisibles directement par leur propriétaire ; le snapshot du foyer expose explicitement les prénoms et préférences des membres. Les swipes des autres utilisateurs ne sont jamais retournés. Les codes d’invitation ne sont pas listables, même par les membres. Les données du foyer sont invisibles aux non-membres.

Les écritures directes des clients sont retirées. `setup_profile`, `create_household`, `invite_member`, `join_household` et `apply_action` sont les points d’entrée. `recipe_allowed` est interne et inaccessible aux clients. Le changement de préférences retire les matchs incompatibles et interdit de générer les courses à partir d’un planning devenu incompatible.

## Tests

`npm run test:db` initialise PostgreSQL, applique le vrai fichier de migration puis le seed, crée trois identités et deux foyers et teste les accès autorisés et interdits. Les fonctions `auth.uid()` et `realtime.send()` sont remplacées uniquement dans ce banc de test. Le seed n’insère aucun utilisateur ni aucune donnée privée.
