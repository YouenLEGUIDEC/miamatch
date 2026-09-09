# Recommandation déterministe V1

`eligible` applique les contraintes de chaque membre : allergies et ingrédients exclus, régime, temps maximal, budget, difficulté et équipement. Si une allergie est déclarée et que la couverture des allergènes d’une recette n’est pas vérifiée, la recette est exclue. Ni exploration ni hasard ne contournent cette étape.

Le `score` retourne un total et ses contributions :

| Contribution                       | Valeur                               |
| ---------------------------------- | ------------------------------------ |
| Proximité du mood                  | `50 × (1 − abs(recipe.mood − mood))` |
| Rapidité                           | `10 × (1 − minutes / 90)`            |
| Ingrédients favoris                | 5 points chacun, maximum 15          |
| Favori historique                  | 10                                   |
| Protéines, si demandées et connues | `min(10, protéines / 5)`             |
| Note et volume d’avis réels        | `note × min(1, avis / 20)`           |

Les recettes déjà votées sont écartées du deck découverte. Le deck de semaine peut réutiliser les recettes appréciées mais exclut les rejets et les repas déjà sélectionnés. À chaque sélection, une pénalité de 18 points par famille similaire parmi les deux dernières cartes favorise la diversité. Toutes les cinq cartes, le troisième candidat disponible reçoit une place d’exploration. Les égalités sont résolues par identifiant, de façon reproductible.

Le mode aléatoire tire dans les cinq premiers résultats éligibles, plutôt que dans tout le catalogue. Le slider ne représente pas une définition médicale du « sain ». Les fixtures n’ont pas de nutrition : seules leurs étiquettes produit de démonstration contribuent au mood. Fibres, densité calorique et équilibre macro pourront enrichir le classement après validation des sources ; aucun chiffre n’est inventé pour les activer.

Tests : exclusions, contraintes du foyer, équipement, inconnues d’allergènes, variation du mood, répétabilité, historique, hasard vide, quantités et parcours jusqu’aux courses.
