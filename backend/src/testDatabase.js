require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testDatabase() {
  try {
    await client.connect();

    console.log("Connexion PostgreSQL réussie !");

    const result = await client.query(
      "SELECT NOW() AS date_serveur"
    );

    console.log(
      "Date du serveur PostgreSQL :",
      result.rows[0].date_serveur
    );
  } catch (error) {
    console.error(
      "Erreur de connexion PostgreSQL :",
      error.message
    );
  } finally {
    await client.end();
  }
}

testDatabase();