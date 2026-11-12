const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Vérifier que la clé secrète est configurée
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET est absent du fichier .env");

      return res.status(500).json({
        success: false,
        message: "Erreur de configuration de l'authentification.",
      });
    }

    // Récupérer l'en-tête Authorization
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise. Veuillez vous connecter.",
      });
    }

    // Extraire le jeton
    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Jeton d'authentification manquant.",
      });
    }

    // Vérifier le JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Accepter les deux formats d'identifiant :
    // id ou userId
    const userId = decoded.id ?? decoded.userId;

    // Vérifier que le jeton contient un identifiant valide
    if (
      userId === undefined ||
      userId === null ||
      !Number.isInteger(Number(userId)) ||
      Number(userId) <= 0
    ) {
      return res.status(401).json({
        success: false,
        message: "Le jeton ne contient pas d'identifiant utilisateur valide. Veuillez vous reconnecter.",
      });
    }

    // Rendre les informations disponibles dans les routes
    req.user = {
      id: Number(userId),
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Votre session a expiré. Veuillez vous reconnecter.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Jeton invalide. Veuillez vous reconnecter.",
      });
    }

    console.error("Erreur middleware JWT :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification de l'authentification.",
    });
  }
};

module.exports = authMiddleware;