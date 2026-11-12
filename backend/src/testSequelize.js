const sequelize = require("./config/database");

async function testSequelize() {
  try {
    await sequelize.authenticate();

    console.log("Connexion Sequelize à PostgreSQL réussie !");

  } catch (error) {
    console.error(
      "Erreur de connexion Sequelize :",
      error.message
    );

  } finally {
    await sequelize.close();
  }
}

testSequelize();