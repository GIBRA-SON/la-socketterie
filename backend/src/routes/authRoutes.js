const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET est absent du fichier .env");
  }

  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
};

const publicUser = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
});

// ============================================
// POST /api/auth/register
// Créer un compte client
// ============================================
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez renseigner tous les champs obligatoires.",
      });
    }

    const normalizedFirstName = firstName.trim();
    const normalizedLastName = lastName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Le prénom, le nom et l'e-mail sont obligatoires.",
      });
    }

    if (password.length < 12 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir entre 12 et 72 caractères.",
      });
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Cette adresse e-mail est déjà utilisée.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
      role: "client",
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "Cette adresse e-mail est déjà utilisée.",
      });
    }

    console.error("Erreur inscription :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de créer le compte pour le moment.",
    });
  }
});

// ============================================
// POST /api/auth/login
// Connecter un client
// ============================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez renseigner votre e-mail et votre mot de passe.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Adresse e-mail ou mot de passe incorrect.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Adresse e-mail ou mot de passe incorrect.",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Erreur connexion :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de vous connecter pour le moment.",
    });
  }
});

// ============================================
// GET /api/auth/me
// Vérifier la session du client
// ============================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "firstName", "lastName", "email", "role"],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur introuvable. Veuillez vous reconnecter.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Authentification réussie.",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Erreur vérification utilisateur :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de vérifier votre session.",
    });
  }
});

module.exports = router;