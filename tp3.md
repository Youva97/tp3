###  TP 3
# Réalisation d'un prototype de site de vente

Nous allons dupliquer le projet tp2 et le modifier pour rajouter une base de données à la place du fichier JSON.


1. Dupliquer le dossier `/david/tp2` avec son contenu sur `/david/tp3`

2. Ouvrir ce dossier `/david/tp3` dans VS Code (Fichier > Ouvrir le dossier)

3. **Effacer le dossier `.git` !!!** (pour ne pas avoir de conflit avec le dépôt git du tp2)

4. Dans le terminal intégré de VS Code (bien vérifier que vous vous trouvez dans le bon dossier du projet) :
```bash
# remplacer [xxxxx] par votre identifiant sur gogs
git init
git remote add origin gogs@gogs.greta.wywiwyg.net:[xxxxx]/tp3.git
git add .
git commit -m "initialisation du projet"
git push -u origin master
```

5. Installer les nouvelles dépendances :
```bash
npm i sequelize mysql2 dotenv @faker-js/faker
```
...et corriger dans `package.json` le "name" 

6. Créer un fichier `.env` à la racine du projet avec le contenu suivant :
```text
DB_HOST="localhost"
DB_NAME="tp3"
DB_LOGIN="monlogin"
DB_PASSWORD="monpass"
```

7. Dans le fichier `/index.js`, ajouter les lignes suivantes :

```js
require("dotenv").config();
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_LOGIN, 
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        // logging: false,
    }
);
```

8. Dans le fichier `/index.js`, ajouter la définition du modèle `Product` et du modèle `Type`. Ajouter également les relations. Voir le cours pour les détails.

9. Dans le fichier `/index.js`, appeler après la définition des modèles `sequelize.sync()` pour créer ou modifier les tables automatiquement.

10. Dans le fichier `/index.js`, ajouter le code permettant de créer des produits et des types aléatoires avec faker.js. Voir le cours "cours-database.md" pour les détails.

11. Dans le fichier `/index.js`, corriger tous les controllers pour utiliser les modèles Sequelize. Voir le cours "cours-database.md" pour les détails.
