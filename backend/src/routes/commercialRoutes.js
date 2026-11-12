const express = require("express");
const router = express.Router();

const { Order, OrderItem, Product, User } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ============================================
// GET /api/commercial/orders
// Récupérer toutes les commandes
// Réservé aux commerciaux et administrateurs
// ============================================

router.get(
"/orders",
authMiddleware,
roleMiddleware("commercial", "admin"),
async (req, res) => {
try {
const orders = await Order.findAll({
include: [
{
model: OrderItem,
as: "items",
include: [
{
model: Product,
as: "product",
required: false,
},
],
},
{
model: User,
as: "user",
attributes: ["id", "firstName", "lastName", "email"],
},
],
order: [["createdAt", "DESC"]],
});

  return res.status(200).json({
    success: true,
    message: "Toutes les commandes ont été récupérées.",
    orders,
  });
} catch (error) {
  console.error("Erreur récupération commandes commerciales :", error);

  return res.status(500).json({
    success: false,
    message: "Impossible de récupérer les commandes.",
  });
}

}
);

// ============================================
// PATCH /api/commercial/orders/:id/status
// Modifier le statut d'une commande
// ============================================

router.patch(
"/orders/:id/status",
authMiddleware,
roleMiddleware("commercial", "admin"),
async (req, res) => {
try {
const orderId = Number(req.params.id);
const { status } = req.body;

  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Identifiant de commande invalide.",
    });
  }

  const allowedStatuses = [
    "processing",
    "shipped",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Statut de commande invalide.",
    });
  }

  const order = await Order.findByPk(orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Commande introuvable.",
    });
  }

  if (order.status !== "paid" && order.status !== "processing") {
    return res.status(400).json({
      success: false,
      message: "Cette commande ne peut pas être modifiée.",
    });
  }

  if (order.status === "processing" && status === "processing") {
    return res.status(400).json({
      success: false,
      message: "La commande est déjà en préparation.",
    });
  }

  if (order.status === "shipped" || order.status === "cancelled") {
    return res.status(400).json({
      success: false,
      message: "Cette commande est déjà terminée.",
    });
  }

  await order.update({ status });

  return res.status(200).json({
    success: true,
    message: "Statut de la commande mis à jour.",
    order,
  });
} catch (error) {
  console.error("Erreur modification statut :", error);

  return res.status(500).json({
    success: false,
    message: "Impossible de modifier le statut de la commande.",
  });
}

}
);

module.exports = router;
