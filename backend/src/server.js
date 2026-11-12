const express = require("express");
const cors = require("cors");
require("dotenv").config();

const Stripe = require("stripe");
const { Op } = require("sequelize");

// ============================================
// MODÈLES SEQUELIZE
// ============================================

const {
  sequelize,
  User,
  Order,
  OrderItem,
  Product,
  Invoice,
} = require("./models");

// ============================================
// ROUTES
// ============================================

const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const commercialRoutes = require("./routes/commercialRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

// ============================================
// INITIALISATION EXPRESS
// ============================================

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// VÉRIFICATION DES CLÉS STRIPE
// ============================================

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY est absente du fichier .env");
  process.exit(1);
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error("STRIPE_WEBHOOK_SECRET est absente du fichier .env");
  process.exit(1);
}

// ============================================
// INITIALISATION STRIPE
// ============================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ============================================
// CONFIGURATION CORS
// ============================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      ...(process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL.replace(/\/+$/, "")]
        : []),
    ],
  })
);

// ============================================
// WEBHOOK STRIPE
// IMPORTANT : AVANT express.json()
// ============================================

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    // 1. Vérifier la signature Stripe
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error(
        "Signature du webhook invalide :",
        error.message
      );

      return res.status(400).send(
        `Webhook Error: ${error.message}`
      );
    }

    try {
      // 2. Traiter les événements nécessaires
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const session = event.data.object;

          console.log("Session Stripe reçue :", session.id);

          // Vérifier que le paiement est réellement effectué
          if (session.payment_status !== "paid") {
            console.log(
              "Paiement non confirmé. Commande laissée en attente."
            );
            break;
          }

          // Vérifier le mode de paiement
          if (session.mode !== "payment") {
            console.log("Session ignorée : mode incorrect.");
            break;
          }

          // 3. Vérifier les identifiants de la commande
          const orderId = Number(session.metadata?.orderId);
          const userId = Number(session.metadata?.userId);

          if (
            !Number.isSafeInteger(orderId) ||
            orderId <= 0 ||
            !Number.isSafeInteger(userId) ||
            userId <= 0 ||
            session.client_reference_id !== String(orderId)
          ) {
            console.error("Identifiants invalides.");

            return res.status(400).json({
              received: false,
              error: "Identifiants invalides.",
            });
          }

          // 4. Vérifier le montant et la devise
          if (
            !Number.isSafeInteger(session.amount_total) ||
            session.amount_total <= 0 ||
            session.currency !== "eur"
          ) {
            console.error("Montant ou devise invalide.");

            return res.status(400).json({
              received: false,
              error: "Montant ou devise invalide.",
            });
          }

          // 5. Traitement transactionnel :
          // stock + commande + facture
          await sequelize.transaction(async (transaction) => {
            const currentOrder = await Order.findOne({
              where: {
                id: orderId,
                userId,
                stripeSessionId: session.id,
              },
              transaction,
              lock: transaction.LOCK.UPDATE,
            });

            if (!currentOrder) {
              throw new Error(
                `Commande introuvable pour la session ${session.id}.`
              );
            }

            // Vérifier le montant enregistré
            if (
              Number(currentOrder.totalAmount) !== session.amount_total ||
              currentOrder.currency !== session.currency
            ) {
              throw new Error(
                `Le montant payé ne correspond pas à la commande ${orderId}.`
              );
            }

            // Récupérer les articles
            const items = await OrderItem.findAll({
              where: {
                orderId: currentOrder.id,
              },
              transaction,
            });

            if (!items.length) {
              throw new Error(
                `La commande ${orderId} ne contient aucun article.`
              );
            }

            // Vérifier les montants des articles
            let productsTotal = 0;

            for (const item of items) {
              const quantity = Number(item.quantity);
              const unitPrice = Number(item.unitPrice);
              const lineTotal = Number(item.lineTotal);

              if (
                !Number.isSafeInteger(quantity) ||
                quantity <= 0 ||
                !Number.isSafeInteger(unitPrice) ||
                unitPrice <= 0 ||
                !Number.isSafeInteger(lineTotal) ||
                lineTotal !== unitPrice * quantity
              ) {
                throw new Error(
                  `Article invalide dans la commande ${orderId}.`
                );
              }

              productsTotal += lineTotal;
            }

            if (!Number.isSafeInteger(productsTotal)) {
              throw new Error("Montant des produits invalide.");
            }

            // Déduire les frais de livraison du total
            const shippingAmount =
              Number(currentOrder.totalAmount) - productsTotal;

            if (shippingAmount < 0) {
              throw new Error(
                "Le total des produits dépasse le montant de la commande."
              );
            }

            // 6. Traiter le stock uniquement si la commande
            // est encore en attente de paiement
            if (currentOrder.status === "pending") {
              for (const item of items) {
                const quantity = Number(item.quantity);
                const productId = Number(item.productId);

                if (
                  !Number.isSafeInteger(productId) ||
                  productId <= 0
                ) {
                  throw new Error(
                    `Produit invalide dans la commande ${orderId}.`
                  );
                }

                const [updatedRows] = await Product.update(
                  {
                    stock: sequelize.literal(
                      `stock - ${quantity}`
                    ),
                  },
                  {
                    where: {
                      id: productId,
                      isActive: true,
                      stock: {
                        [Op.gte]: quantity,
                      },
                    },
                    transaction,
                  }
                );

                if (updatedRows !== 1) {
                  throw new Error(
                    `Stock insuffisant ou produit indisponible : ${productId}.`
                  );
                }
              }

              // Marquer la commande comme payée
              await currentOrder.update(
                {
                  status: "paid",
                  stripePaymentIntentId:
                    typeof session.payment_intent === "string"
                      ? session.payment_intent
                      : session.payment_intent?.id || null,
                  paidAt: new Date(),
                },
                { transaction }
              );
            } else if (
              !["paid", "processing", "shipped"].includes(
                currentOrder.status
              )
            ) {
              throw new Error(
                `Statut inattendu : ${currentOrder.status}.`
              );
            }

            // 7. Récupérer les informations du client
            const customer = await User.findByPk(userId, {
              attributes: [
                "id",
                "firstName",
                "lastName",
                "email",
              ],
              transaction,
            });

            if (!customer) {
              throw new Error(
                `Client introuvable pour la commande ${orderId}.`
              );
            }

            // 8. Vérifier si une facture existe déjà
            const existingInvoice = await Invoice.findOne({
              where: {
                orderId: currentOrder.id,
              },
              transaction,
            });

            // Ne jamais créer deux factures pour une commande
            if (!existingInvoice) {
              const issuedAt = currentOrder.paidAt
                ? new Date(currentOrder.paidAt)
                : new Date();

              const invoiceNumber =
                `DEMO-${issuedAt.getUTCFullYear()}-` +
                String(currentOrder.id).padStart(6, "0");

              // Copier les articles de la commande
              const itemsSnapshot = items.map((item) => ({
                type: "product",
                productName: item.productName,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                lineTotal: Number(item.lineTotal),
              }));

              // Ajouter les frais de livraison
              if (shippingAmount > 0) {
                itemsSnapshot.push({
                  type: "shipping",
                  productName: "Frais de livraison",
                  quantity: 1,
                  unitPrice: shippingAmount,
                  lineTotal: shippingAmount,
                });
              }

              // Informations du client
              const customerSnapshot = {
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
              };

              // Informations fictives du vendeur
              const sellerSnapshot = {
                name: "La Socketterie",
                documentLabel:
                  "DOCUMENT DE DÉMONSTRATION — SANS VALEUR FISCALE",
                address:
                  "Coordonnées fictives - projet scolaire",
                email: "Adresse non renseignée",
                siren: "Non renseigné",
                vatNumber: "Non renseigné",
                taxNote:
                  "TVA non calculée - facture de démonstration.",
              };

              // 9. Créer la facture
              await Invoice.create(
                {
                  invoiceNumber,
                  orderId: currentOrder.id,
                  issuedAt,
                  currency: currentOrder.currency,
                  totalAmount: currentOrder.totalAmount,
                  customerSnapshot,
                  itemsSnapshot,
                  sellerSnapshot,
                },
                { transaction }
              );

              console.log(
                `Facture ${invoiceNumber} créée pour la commande ${orderId}.`
              );
            } else {
              console.log(
                `Facture déjà existante pour la commande ${orderId}.`
              );
            }
          });

          break;
        }

        default:
          console.log(
            `Événement Stripe ignoré : ${event.type}`
          );
      }

      return res.status(200).json({
        received: true,
      });
    } catch (error) {
      console.error(
        "Erreur lors du traitement du webhook Stripe :",
        error.message
      );

      return res.status(500).json({
        received: false,
        error: "Erreur lors du traitement du paiement.",
      });
    }
  }
);

// ============================================
// MIDDLEWARES POUR LES AUTRES ROUTES
// ============================================

app.use(express.json());

// ============================================
// ROUTES API
// ============================================

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/commercial", commercialRoutes);
app.use("/api/invoices", invoiceRoutes);

// ============================================
// ROUTE D'ACCUEIL
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API La Socketterie 🚀",
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log("Connexion à PostgreSQL réussie.");

    app.listen(PORT, () => {
      console.log(
        `API démarrée sur http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Impossible de démarrer le serveur ou de se connecter à PostgreSQL :",
      error
    );

    process.exit(1);
  }
}

startServer();