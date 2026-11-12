const express = require("express");
const Stripe = require("stripe");

const {
  sequelize,
  Product,
  Order,
  OrderItem,
} = require("../models");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Vérification de la clé secrète Stripe.
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY est absente du fichier .env"
  );
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Frais de livraison : 5 €.
const SHIPPING_COST = 500;

// URL du frontend.
const FRONTEND_URL = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/+$/, "");

// Images des produits dans le dossier public/images.
const PRODUCT_IMAGES = {
  colore: "/images/Mod%C3%A8le-color%C3%A9.jpg",
  fun: "/images/Mod%C3%A8le-fun.jpg",
  nice: "/images/Mod%C3%A8le-nice.jpg",
  original: "/images/Mod%C3%A8le-original.jpg",
  pop: "/images/Mod%C3%A8le-pop.jpg",
  street: "/images/Mod%C3%A8le-street.jpg",
};

// Retrouver l'image correspondant au produit.
function getProductImageUrl(product) {
  // Une URL HTTPS enregistrée en base est prioritaire.
  if (
    typeof product.imageUrl === "string" &&
    /^https:\/\//i.test(product.imageUrl)
  ) {
    return product.imageUrl;
  }

  const name = (product.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let key = null;

  if (name.includes("colore")) {
    key = "colore";
  } else if (name.includes("fun")) {
    key = "fun";
  } else if (name.includes("nice")) {
    key = "nice";
  } else if (name.includes("original")) {
    key = "original";
  } else if (name.includes("pop")) {
    key = "pop";
  } else if (name.includes("street")) {
    key = "street";
  }

  if (!key) {
    return null;
  }

  return `${FRONTEND_URL}${PRODUCT_IMAGES[key]}`;
}

// POST /api/payment/create-checkout-session
router.post(
  "/create-checkout-session",
  authMiddleware,
  async (req, res) => {
    let transaction;

    try {
      const userId = req.user?.id;
      const { cart } = req.body || {};

      // Vérifier l'utilisateur connecté.
      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(401).json({
          success: false,
          message: "Utilisateur non authentifié.",
        });
      }

      // Vérifier le panier.
      if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Le panier est vide ou invalide.",
        });
      }

      // Vérifier les identifiants et les quantités.
      const validCart = cart.every(
        (item) =>
          item &&
          Number.isInteger(Number(item.id)) &&
          Number(item.id) > 0 &&
          Number.isInteger(item.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 100
      );

      if (!validCart) {
        return res.status(400).json({
          success: false,
          message: "Un produit ou une quantité est invalide.",
        });
      }

      const productIds = cart.map((item) =>
        Number(item.id)
      );

      // Refuser les produits dupliqués dans le panier.
      if (
        new Set(productIds).size !== productIds.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Le panier contient des produits en double.",
        });
      }

      // Récupérer les produits actifs dans PostgreSQL.
      const products = await Product.findAll({
        where: {
          id: productIds,
          isActive: true,
        },
      });

      if (products.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message:
            "Un ou plusieurs produits sont indisponibles.",
        });
      }

      const productMap = new Map(
        products.map((product) => [
          Number(product.id),
          product,
        ])
      );

      // Vérifier que le stock est suffisant.
      for (const item of cart) {
        const product = productMap.get(Number(item.id));

        if (
          !product ||
          !Number.isInteger(Number(product.stock)) ||
          Number(product.stock) < item.quantity
        ) {
          return res.status(400).json({
            success: false,
            message: product
              ? `Stock insuffisant pour "${product.name}". Stock disponible : ${product.stock}.`
              : "Un produit du panier est indisponible.",
          });
        }
      }

      // Calculer les montants à partir des prix en base.
      let totalAmount = SHIPPING_COST;

      const orderItems = cart.map((item) => {
        const product = productMap.get(Number(item.id));

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * item.quantity;

        if (
          !Number.isSafeInteger(unitPrice) ||
          unitPrice <= 0 ||
          !Number.isSafeInteger(lineTotal)
        ) {
          throw new Error(
            `Prix invalide pour le produit ${product.id}.`
          );
        }

        totalAmount += lineTotal;

        return {
          productId: product.id,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        };
      });

      if (
        !Number.isSafeInteger(totalAmount) ||
        totalAmount <= SHIPPING_COST
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Le montant total de la commande est invalide.",
        });
      }

      // Créer la commande et ses articles en transaction.
      transaction = await sequelize.transaction();

      const order = await Order.create(
        {
          userId,
          status: "pending",
          totalAmount,
          currency: "eur",
        },
        { transaction }
      );

      await OrderItem.bulkCreate(
        orderItems.map((item) => ({
          ...item,
          orderId: order.id,
        })),
        { transaction }
      );

      // Préparer les articles pour Stripe Checkout.
      const lineItems = cart.map((item) => {
        const product = productMap.get(Number(item.id));
        const imageUrl = getProductImageUrl(product);

        const productData = {
          name: product.name,
        };

        if (
          imageUrl &&
          /^https:\/\//i.test(imageUrl)
        ) {
          productData.images = [imageUrl];
        }

        return {
          price_data: {
            currency: "eur",
            product_data: productData,
            unit_amount: Number(product.price),
          },
          quantity: item.quantity,
        };
      });

      // Ajouter les frais de livraison.
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Frais de livraison",
          },
          unit_amount: SHIPPING_COST,
        },
        quantity: 1,
      });

      // Créer la session Stripe Checkout.
      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: lineItems,

          client_reference_id: String(order.id),

          metadata: {
            orderId: String(order.id),
            userId: String(userId),
          },

          success_url:
            `${FRONTEND_URL}/commande?success=true`,

          cancel_url:
            `${FRONTEND_URL}/commande?cancel=true`,
        });

      // Enregistrer l'identifiant de session Stripe.
      await order.update(
        {
          stripeSessionId: session.id,
        },
        { transaction }
      );

      await transaction.commit();
      transaction = null;

      return res.status(200).json({
        success: true,
        message:
          "Commande créée. Vous pouvez procéder au paiement.",
        orderId: order.id,
        url: session.url,
      });
    } catch (error) {
      if (transaction) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error(
            "Erreur lors de l'annulation de la transaction :",
            rollbackError.message
          );
        }
      }

      console.error(
        "Erreur création commande et paiement :",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Impossible de préparer la commande et le paiement.",
      });
    }
  }
);

module.exports = router;
