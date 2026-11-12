const {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
} = require("./models");

async function testModels() {
  try {
    await sequelize.authenticate();

    console.log("Connexion PostgreSQL réussie !");
    console.log("Modèle User chargé :", Boolean(User));
    console.log("Modèle Product chargé :", Boolean(Product));
    console.log("Modèle Order chargé :", Boolean(Order));
    console.log("Modèle OrderItem chargé :", Boolean(OrderItem));

    console.log(
      "Relations entre les modèles :",
      Object.keys(Order.associations)
    );

    console.log("Vérification des modèles réussie !");
  } catch (error) {
    console.error("Erreur lors du test :", error.message);
  } finally {
    await sequelize.close();
  }
}

testModels();