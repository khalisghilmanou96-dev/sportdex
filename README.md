# SportDex — GitHub Pages + TheSportsDB

Mini application sportive inspirée d'un Pokédex, réalisée en HTML, CSS et JavaScript vanilla.

## Fonctionnalités

- Recherche d'un sportif par nom
- Recherche d'une équipe par nom
- Données récupérées en direct depuis l'API TheSportsDB
- Sélection de sportifs populaires au chargement
- Bouton aléatoire
- Fiches détaillées dans une fenêtre modale
- Interface responsive, compatible GitHub Pages

## API

Le projet utilise l'API V1 de TheSportsDB avec sa clé publique gratuite de test `123` :

- `searchplayers.php?p=...`
- `searchteams.php?t=...`

Documentation : https://www.thesportsdb.com/documentation

## Lancement

Ouvrir `index.html` avec un serveur local (par exemple Live Server dans VS Code) ou publier le dossier sur GitHub Pages.

> Une connexion Internet est nécessaire pour charger les données de TheSportsDB.
