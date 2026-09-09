# Sources de recettes et licences

Recherche initiale du **9 septembre 2026**, sources officielles uniquement. Aucun abonnement, appel API facturable, import massif ou scraping effectué. Une documentation d’API n’accorde pas automatiquement tous les droits sur le contenu des auteurs.

## Décision

**Aucun fournisseur de production n’est validé.** Les fixtures permettent de développer le parcours. Pour une bêta destinée à cuisiner, privilégier un petit catalogue autorisé directement par des auteurs, avec photos et instructions explicitement licenciées. Les fournisseurs API ci-dessous nécessitent de vérifier les droits du planning, des listes dérivées, du cache offline et des adaptations IA.

## Droits et exploitation

| Source                          | Stockage                                                                                              | Texte et images                                                                                                              | Attribution                                     | Commercial / mise à jour                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Edamam Recipe Search            | Restrictions selon plan ; stockage seulement explicitement permis                                     | Recettes web : instructions non fournies, lien auteur. Autres contenus sous accord spécifique                                | Edamam et provenance                            | Usage gratuit limité ; contrat et maintien de l’abonnement requis selon données conservées. Relecture API |
| Spoonacular                     | ID, titre, URL image conservables ; autres données soumises aux restrictions de cache et accord écrit | Droits et responsabilité des contenus à vérifier ; pas de copie permanente des ingrédients/instructions/nutrition par défaut | Auteur et lien ; backlink pour l’offre gratuite | Clause de concurrence à faire clarifier pour Miamatch ; suppression/actualisation selon contrat           |
| TheMealDB                       | Non validé pour une base commerciale et offline                                                       | API documentée, mais étendue des droits de reproduction des textes/photos non établie par les pages consultées               | À confirmer par écrit                           | Ne pas déduire une licence complète du terme « free ». Contrôle des mises à jour à concevoir              |
| Partenariat direct avec auteurs | À négocier explicitement                                                                              | Obtenir textes, photos, quantités et droits de dérivés/adaptations                                                           | Nom, URL et mentions contractuelles             | Autorisation commerciale, retrait et mises à jour contractualisés                                         |
| Fixtures Miamatch               | Oui, internes au développement                                                                        | Données synthétiques, illustrations provisoires ; aucune instruction culinaire présentée                                     | Badge démo                                      | Interdites comme promesse de recettes testées ; versionnées avec le code                                  |

## Données, coût et qualité

| Source              | API / volume annoncé                                | Coût observé                                                                             | Notes / qualité                                                                         | Nutrition                                              |
| ------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Edamam              | API, millions de recettes web                       | Plans/accord à vérifier pour les droits nécessaires ; aucune souscription                | Provenance web ; notes et nombre d’avis à confirmer                                     | Données nutritionnelles calculées, méthode à conserver |
| Spoonacular         | API, vaste catalogue ; volume exact non vérifié ici | Gratuit : 50 points/jour ; Cook : 29 USD/mois, 1 500 points/jour, dépassements possibles | Ne pas confondre score fournisseur avec avis vérifiés ; qualification nécessaire        | Disponible via API selon requête ; stockage contraint  |
| TheMealDB           | API JSON ; accueil consulté : 793 plats             | Accueil : premium à 10 USD, paiement unique ; droits non validés                         | Contribution ouverte ; aucune garantie de recette testée ni de notes avec nombre d’avis | Couverture nutritionnelle complète non confirmée       |
| Auteurs partenaires | Petit lot au départ ; API non nécessaire            | Négociation, aucun budget engagé                                                         | Peut exiger recette cuisinée et testée ; avis seulement avec provenance                 | Analyse séparée documentée, jamais inventée            |

Sources : [Edamam – service et cache](https://developer.edamam.com/edamam-recipe-api), [Edamam – documentation des recettes web](https://developer.edamam.com/edamam-docs-recipe-api), [Edamam – CGU](https://www.edamam.com/terms/api/), [Spoonacular – CGU, mises à jour le 16 avril 2026](https://spoonacular.com/food-api/terms), [Spoonacular – tarifs](https://spoonacular.com/food-api/pricing), [TheMealDB – accueil](https://www.themealdb.com/), [TheMealDB – API](https://www.themealdb.com/api.php). La page de conditions TheMealDB tentée n’était pas exploitable ; ses droits sont donc **non validés**, pas présumés libres.

## Conditions d’admission dans le catalogue

Conserver auteur, URL originale, licence/accord, date, droits par champ et règles de retrait. Ne stocker que le contenu autorisé. Ne pas télécharger une image si seule son URL peut être conservée. En cas d’instructions non reproductibles, afficher le lien original.

Pour les allergies, documenter l’exhaustivité des ingrédients et les allergènes ; les données inconnues doivent exclure la recette lorsqu’une restriction correspondante existe. Pour la nutrition, conserver valeur, unité, référence par portion, source, méthode et confiance. Une donnée absente reste absente.

Une adaptation ultérieure sera séparée, sous « Adaptation Miamatch ✨ », jamais attribuée à l’auteur original. Vérifier que le contrat autorise ce traitement. Aucun connecteur de recettes n’est activé tant que ces points ne sont pas réglés.
