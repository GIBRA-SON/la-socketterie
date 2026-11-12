const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Invoice = sequelize.define(
  "Invoice",
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
      validate: {
        min: 0,
      },
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
  },
  {
    tableName: "invoices",
    timestamps: true,
  }
);

module.exports = Invoice;