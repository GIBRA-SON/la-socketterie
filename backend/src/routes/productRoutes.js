const express = require("express");
const { Product } = require("../models");

const router = express.Router();

// GET : récupérer tous les produits actifs
router.get("/", async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        isActive: true,
      },
      order: [["id", "ASC"]],
    });

    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price / 100,
      stock: product.stock,
      imageUrl: product.imageUrl,
    }));

    res.json({
      success: true,
      count: formattedProducts.length,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);

    res.status(500).json({
      success: false,
      message: "Impossible de récupérer les produits.",
    });
  }
});

module.exports = router;