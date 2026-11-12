const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "processing",
        "shipped",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: "Montant total en centimes d'euro",
    },

    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "eur",
    },

    stripeSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },

    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

module.exports = Order;