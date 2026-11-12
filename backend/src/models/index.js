const sequelize = require("../config/database");
const User = require("./User");
const Product = require("./Product");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Invoice = require("./Invoice");

// Un utilisateur peut passer plusieurs commandes.
User.hasMany(Order, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "orders",
  onDelete: "RESTRICT",
});

Order.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "user",
});

// Une commande contient plusieurs lignes de produits.
Order.hasMany(OrderItem, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "items",
  onDelete: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "order",
});

// Un produit peut apparaître dans plusieurs lignes de commande.
Product.hasMany(OrderItem, {
  foreignKey: {
    name: "productId",
    allowNull: true,
  },
  as: "orderItems",
  onDelete: "SET NULL",
});

OrderItem.belongsTo(Product, {
  foreignKey: {
    name: "productId",
    allowNull: true,
  },
  as: "product",
});

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  Invoice,
};

// Une commande possède une seule facture.
Order.hasOne(Invoice, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "invoice",
  onDelete: "RESTRICT",
});

Invoice.belongsTo(Order, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "order",
});
