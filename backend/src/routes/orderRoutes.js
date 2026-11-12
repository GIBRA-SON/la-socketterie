const express = require("express");
const router = express.Router();

const { Order, OrderItem, Product } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

// ============================================
// GET /api/orders
// Récupérer les commandes du client connecté
// ============================================
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiant utilisateur invalide. Veuillez vous reconnecter.",
      });
    }

    const orders = await Order.findAll({
      where: {
        userId,
      },
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
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Commandes récupérées avec succès.",
      orders,
    });
  } catch (error) {
    console.error("Erreur récupération commandes :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les commandes.",
    });
  }
});

// ============================================
// GET /api/orders/:id
// Récupérer une commande du client connecté
// ============================================
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiant utilisateur invalide. Veuillez vous reconnecter.",
      });
    }

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de commande invalide.",
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
      },
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
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Commande récupérée avec succès.",
      order,
    });
  } catch (error) {
    console.error("Erreur récupération commande :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer cette commande.",
    });
  }
});

module.exports = router;