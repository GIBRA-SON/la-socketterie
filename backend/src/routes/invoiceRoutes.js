const express = require("express");
const PDFDocument = require("pdfkit");

const router = express.Router();

const { Invoice, Order } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

// ============================================
// FORMATAGE DES MONTANTS
// ============================================

function formatPrice(amount) {
  return `${(Number(amount) / 100).toFixed(2).replace(".", ",")} EUR`;
}

// ============================================
// FORMATAGE DES DATES
// ============================================

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

// ============================================
// RÉCUPÉRER UNE FACTURE APPARTENANT AU CLIENT
// ============================================

async function findCustomerInvoice(invoiceId, userId) {
  return Invoice.findOne({
    where: {
      id: invoiceId,
    },
    include: [
      {
        model: Order,
        as: "order",
        where: {
          userId,
        },
        required: true,
        attributes: ["id", "status", "paidAt"],
      },
    ],
  });
}

// ============================================
// GET /api/invoices
// Récupérer les factures du client connecté
// ============================================

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiant utilisateur invalide.",
      });
    }

    const invoices = await Invoice.findAll({
      include: [
        {
          model: Order,
          as: "order",
          where: { userId },
          required: true,
          attributes: ["id", "status", "paidAt"],
        },
      ],
      order: [["issuedAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Factures récupérées avec succès.",
      invoices,
    });
  } catch (error) {
    console.error("Erreur récupération factures :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les factures.",
    });
  }
});

// ============================================
// GET /api/invoices/:id/pdf
// Télécharger une facture en PDF
// ============================================

router.get("/:id/pdf", authMiddleware, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const userId = req.user?.id;

    if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de facture invalide.",
      });
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const invoice = await findCustomerInvoice(invoiceId, userId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Facture introuvable.",
      });
    }

    if (!invoice.order.paidAt) {
      return res.status(400).json({
        success: false,
        message: "Cette commande ne possède pas de paiement confirmé.",
      });
    }

    const customer = invoice.customerSnapshot;
    const seller = invoice.sellerSnapshot;
    const items = invoice.itemsSnapshot;

    if (!Array.isArray(items)) {
      throw new Error("Détail de facture invalide.");
    }

    // Créer le document PDF au format A4
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      info: {
        Title: `Facture ${invoice.invoiceNumber}`,
        Author: "La Socketterie",
      },
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    doc.on("error", (error) => {
      console.error("Erreur génération PDF :", error);

      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.destroy(error);
      }
    });

    doc.pipe(res);

    // ========================================
    // BANDEAU DE DÉMONSTRATION
    // ========================================

    doc
      .rect(50, 45, 495, 45)
      .fill("#FEE2E2");

    doc
      .fillColor("#991B1B")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text(
        "DOCUMENT DE DEMONSTRATION - SANS VALEUR FISCALE",
        60,
        62,
        {
          width: 475,
          align: "center",
        }
      );

    // ========================================
    // TITRE
    // ========================================

    doc
      .fillColor("#1F2937")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("FACTURE", 50, 115);

    // ========================================
    // INFORMATIONS VENDEUR
    // ========================================

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#B45309")
      .text(seller.name || "La Socketterie", 50, 165);

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#374151")
      .text(seller.address || "Coordonnées non renseignées", 50, 185);

    doc.text(seller.email || "Adresse non renseignée", 50, 200);

    // ========================================
    // INFORMATIONS CLIENT
    // ========================================

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#B45309")
      .text("FACTURE POUR", 320, 165);

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text(
        `${customer.firstName} ${customer.lastName}`,
        320,
        185
      );

    doc.text(customer.email, 320, 200);

    // ========================================
    // RÉFÉRENCES DE LA FACTURE
    // ========================================

    doc
      .moveTo(50, 235)
      .lineTo(545, 235)
      .strokeColor("#E5E7EB")
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1F2937")
      .text("Numéro :", 50, 250);

    doc
      .font("Helvetica")
      .text(invoice.invoiceNumber, 115, 250);

    doc
      .font("Helvetica-Bold")
      .text("Date :", 320, 250);

    doc
      .font("Helvetica")
      .text(formatDate(invoice.issuedAt), 365, 250);

    doc
      .font("Helvetica-Bold")
      .text("Commande :", 50, 270);

    doc
      .font("Helvetica")
      .text(`#${invoice.orderId}`, 125, 270);

    // ========================================
    // TABLEAU DES PRODUITS
    // ========================================

    const tableX = 50;
    let tableY = 310;

    const columns = {
      product: 255,
      quantity: 50,
      unitPrice: 95,
      total: 95,
    };

    doc
      .rect(tableX, tableY, 495, 30)
      .fill("#1F2937");

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(9);

    doc.text("Article", 58, tableY + 10, {
      width: columns.product - 15,
    });

    doc.text("Qté", 310, tableY + 10, {
      width: 40,
      align: "center",
    });

    doc.text("Prix unitaire", 365, tableY + 10, {
      width: 85,
      align: "right",
    });

    doc.text("Total", 470, tableY + 10, {
      width: 65,
      align: "right",
    });

    tableY += 30;

    // Afficher les articles
    items.forEach((item, index) => {
      const background = index % 2 === 0 ? "#F9FAFB" : "#FFFFFF";

      doc
        .rect(tableX, tableY, 495, 32)
        .fill(background);

      doc
        .fillColor("#374151")
        .font("Helvetica")
        .fontSize(9);

      doc.text(item.productName || "Produit", 58, tableY + 10, {
        width: columns.product - 15,
        height: 15,
        ellipsis: true,
      });

      doc.text(String(item.quantity), 310, tableY + 10, {
        width: 40,
        align: "center",
      });

      doc.text(formatPrice(item.unitPrice), 365, tableY + 10, {
        width: 85,
        align: "right",
      });

      doc.text(formatPrice(item.lineTotal), 460, tableY + 10, {
        width: 75,
        align: "right",
      });

      tableY += 32;
    });

    // ========================================
    // TOTAL
    // ========================================

    tableY += 20;

    doc
      .moveTo(50, tableY)
      .lineTo(545, tableY)
      .strokeColor("#E5E7EB")
      .stroke();

    tableY += 18;

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("#1F2937")
      .text("TOTAL A PAYER", 300, tableY);

    doc
      .fillColor("#B45309")
      .text(
        formatPrice(invoice.totalAmount),
        425,
        tableY,
        {
          width: 110,
          align: "right",
        }
      );

    // ========================================
    // MENTION FISCALE
    // ========================================

    tableY += 55;

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#991B1B")
      .text(
        "DOCUMENT DE DEMONSTRATION - SANS VALEUR FISCALE",
        50,
        tableY,
        {
          width: 495,
          align: "center",
        }
      );

    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6B7280")
      .text(
        seller.taxNote ||
          "TVA non calculée - facture de démonstration.",
        50,
        tableY + 22,
        {
          width: 495,
          align: "center",
        }
      );

    // ========================================
    // PIED DE PAGE
    // ========================================

    doc
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text(
        "La Socketterie - Projet scolaire de démonstration",
        50,
        780,
        {
          width: 495,
          align: "center",
        }
      );

    doc.end();

  } catch (error) {
    console.error("Erreur téléchargement facture :", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Impossible de générer la facture PDF.",
      });
    }
  }
});

// ============================================
// GET /api/invoices/:id
// Récupérer une facture précise
// ============================================

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const invoiceId = Number(req.params.id);
    const userId = req.user?.id;

    if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Identifiant de facture invalide.",
      });
    }

    const invoice = await findCustomerInvoice(invoiceId, userId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Facture introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Facture récupérée avec succès.",
      invoice,
    });
  } catch (error) {
    console.error("Erreur récupération facture :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer cette facture.",
    });
  }
});

module.exports = router;