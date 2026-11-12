const { sequelize, Product } = require("./models");

const products = [
  {
    name: "Modèle Coloré",
    description: "Des chaussettes colorées pour égayer votre tenue.",
    price: 1200,
    stock: 50,
    isActive: true,
  },
  {
    name: "Modèle Original",
    description: "Des chaussettes originales pour affirmer votre style.",
    price: 1400,
    stock: 50,
    isActive: true,
  },
  {
    name: "Modèle Fun",
    description: "Des chaussettes fun pour un look décontracté.",
    price: 1500,
    stock: 50,
    isActive: true,
  },
  {
    name: "Modèle Pop",
    description: "Des chaussettes pop aux couleurs tendance.",
    price: 1300,
    stock: 50,
    isActive: true,
  },
  {
    name: "Modèle Street",
    description: "Des chaussettes streetwear pour un style urbain.",
    price: 1600,
    stock: 50,
    isActive: true,
  },
  {
    name: "Modèle Nice",
    description: "Des chaussettes inspirées de l'esprit de Nice.",
    price: 1500,
    stock: 50,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await sequelize.authenticate();

    for (const product of products) {
      await Product.findOrCreate({
        where: { name: product.name },
        defaults: product,
      });
    }

    console.log("Les produits ont été enregistrés !");
    console.log("Nombre de produits dans le catalogue :",
      await Product.count()
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout des produits :", error.message);
  } finally {
    await sequelize.close();
  }
}

seedProducts();