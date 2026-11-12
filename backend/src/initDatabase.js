const {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
} = require("./models");

async function initDatabase() {
  try {
    console.log("Connexion à PostgreSQL...");

    await sequelize.authenticate();

    console.log("Connexion réussie !");
    console.log("Création des tables...");

    await sequelize.sync();

    console.log("Tables créées ou déjà présentes !");
    console.log("Modèles synchronisés :");
    console.log("- User");
    console.log("- Product");
    console.log("- Order");
    console.log("- OrderItem");
  } catch (error) {
    console.error(
      "Erreur lors de la création des tables :",
      error.message
    );
  } finally {
    await sequelize.close();
  }
}

initDatabase();