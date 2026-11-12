const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

async function createInvoicesTable() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    // Vérifier que la table des commandes existe
    await queryInterface.describeTable("orders");

    // Vérifier si la table des factures existe déjà
    const tables = await queryInterface.showAllTables();

    const tableNames = tables.map((table) =>
      typeof table === "string" ? table : table.tableName
    );

    if (tableNames.includes("invoices")) {
      console.log("La table invoices existe déjà. Aucune modification.");
      return;
    }

    // Créer uniquement la nouvelle table
    await sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        "invoices",
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },

          invoiceNumber: {
            type: DataTypes.STRING(60),
            allowNull: false,
            unique: true,
          },

          orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
              model: "orders",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "RESTRICT",
          },

          issuedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },

          currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: "eur",
          },

          totalAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Montant total en centimes",
          },

          customerSnapshot: {
            type: DataTypes.JSONB,
            allowNull: false,
          },

          itemsSnapshot: {
            type: DataTypes.JSONB,
            allowNull: false,
          },

          sellerSnapshot: {
            type: DataTypes.JSONB,
            allowNull: false,
          },

          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
          },

          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
          },
        },
        { transaction }
      );
    });

    console.log("Table invoices créée avec succès !");
  } catch (error) {
    console.error(
      "Erreur lors de la création de la table invoices :",
      error
    );

    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

createInvoicesTable();