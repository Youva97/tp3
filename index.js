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

const {fakerFR: faker} = require('@faker-js/faker');
const express = require("express");
const app = express();
const path = require("path");
const port = 8000;
const bodyParser = require("body-parser");

let { Eta } = require("eta");
let viewpath = path.join(__dirname, "views");
let eta = new Eta({ views: viewpath, cache: false });

const Products = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  typeId: {
    type: DataTypes.INTEGER,
  }
});


const Types = sequelize.define('Type', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    defaultValue:'',
  }
});

Products.belongsTo(Types, { foreignKey: 'typeId', as: 'type' });
Types.hasMany(Products, { foreignKey: 'typeId', as: 'products' });

try {
    sequelize.sync()
    console.log('Base de données synchronisée avec succès.');
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation de la base de données :', error);
  };

app.use(express.static(path.join(__dirname, "assets")));


async function fillDatabase() {
  let types = await Types.findAll();
  if (types.length > 0) return;

  
  for (let i = 0; i < 3; i++) {
    await Types.create({ name: faker.commerce.productMaterial() });
  }

  
  for (let i = 0; i < 10; i++) {
    await Products.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      typeId: faker.datatype.number({ min: 1, max: 3 }) 
    });
  }
}

fillDatabase();

async function createElement() {
  try {
    const types = await Types.findAll();
    const randomTypeId = Math.floor(Math.random() * types.length) + 1; 
    const product = await Products.create({
      name: 'Nom du produit',
      description: 'Description du produit',
      typeId: randomTypeId, 
    });
    console.log('Produit créé :', product);
  } catch (error) {
    console.error('Erreur lors de la création du produit :', error);
  }
}
createElement();

async function updateElement () {
  try {
    const product = await Products.findOne({
      where: {}
    });

    if (product) {
      product.name = 'Nouveau produit'; 
      product.typeId = 1; 
      await product.save();

      console.log('Produit mis à jour :', product);
    } else {
      console.error('Produit non trouvé avec l\'ID spécifié.');
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit :', error);
  }
}
updateElement();

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(eta.render("index.eta", { title: "Homepage" }));
});

app.get("/qui-sommes-nous", (req, res) => {
  res.send(
    eta.render("whoweare.eta", { title: "Qui sommes-nous", page: "whoweare" })
  );
});

app.get("/contact", (req, res) => {
  res.send(
    eta.render("contact.eta", { title: "Contactez-nous", page: "contact" })
  );
});

app.get("/nos-produits", async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT 
          products.id, 
          products.name AS product_name,
          products.description AS product_description,
          products.typeId,
          types.name AS type_name
      FROM 
          products 
      JOIN 
          types ON products.typeId = types.id;`
    );

    res.send(eta.render("products.eta", {
      title: "Nos produits",
      page: "products",
      products: rows, 
      types: [],
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des produits :', error);
    res.status(500).send('Erreur lors de la récupération des produits en base de données.');
  }
});

app.get("/nos-produits/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Products.findOne({ where: { id: productId }, include: 'type' });
    
    if (product && product.id === productId) {
      res.send(eta.render("product-details.eta", {
        title: "Détail du produit",
        page: "product-details",
        product,
      }));
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du détail du produit :', error);
    res.status(500).send('Erreur lors de la récupération des détails du produit en base de données.');
  }
});

app.get("/nos-produits/edit/:id", async (req, res) => {
  try {
    let productId = parseInt(req.params.id);

      
      let product = await Products.findByPk(productId, { include: 'type' });

      if (!product) {
        
        product = {
          id: 0,
          name: "",
          description: "",
          typeId: 0, 
        };
      
    }
    res.send(
      eta.render("product-form.eta", {
        title: "Création / Modification",
        page: "Création / Modification",
        product: product,
      })
    );

  } catch (error) {
    console.error('Erreur lors de la récupération du produit à éditer :', error);
    res.status(500).send('Erreur lors de la récupération du produit à éditer en base de données.');
  }
});

app.post("/nos-produits/edit/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, typeId } = req.body;

    if (productId) {
      
      const product = await Products.findByPk(productId);

      if (product) {
        product.name = name;
        product.description = description;
        product.typeId = typeId;
        await product.save();
      }
    } else {
      
      await Products.create({
        name: name,
        description: description,
        typeId: typeId,
      });
    }

    res.redirect("/nos-produits");
  } catch (error) {
    console.error('Erreur lors de la création ou de la mise à jour du produit :', error);
    res.status(500).send('Erreur lors de la création ou de la mise à jour du produit en base de données.');
  }
});

app.get("/nos-produits/delete/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (productId) {
      
      const product = await Products.findByPk(productId);

      if (product) {
        await product.destroy();
      }
    }

    res.redirect("/nos-produits");
  } catch (error) {
    console.error('Erreur lors de la suppression du produit :', error);
    res.status(500).send('Erreur lors de la suppression du produit en base de données.');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});





