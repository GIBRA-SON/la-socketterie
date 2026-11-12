import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Compte.css";

function Compte() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Attendre le chargement de la session
  if (loading) {
    return (
      <section className="account">
        <div className="account__container">
          <h1>Mon compte</h1>
          <p>Chargement de votre espace client...</p>
        </div>
      </section>
    );
  }

  // Vérifier que le client est connecté
  if (!isAuthenticated || !user) {
    return (
      <section className="account">
        <div className="account__container">
          <h1>Mon compte</h1>

          <p>
            Vous devez être connecté pour accéder
            à votre espace client.
          </p>

          <Link
            to="/connexion"
            className="account__button"
          >
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <section className="account">
      <div className="account__container">
        <div className="account__header">
          <p className="account__subtitle">
            La Socketterie
          </p>

          <h1>Mon compte</h1>

          <p>
            Bienvenue dans votre espace client.
          </p>
        </div>

        <div className="account__welcome">
          <h2>
            Bonjour {user.firstName} 👋
          </h2>

          <p>Voici les informations de votre compte :</p>

          <p>
            <strong>Prénom :</strong>{" "}
            {user.firstName}
          </p>

          <p>
            <strong>Nom :</strong>{" "}
            {user.lastName}
          </p>

          <p>
            <strong>Adresse e-mail :</strong>{" "}
            {user.email}
          </p>
        </div>

        <div className="account__grid">
          <Link
            to="/commandes"
            className="account__card"
          >
            <span className="account__icon">📦</span>

            <h2>Mes commandes</h2>

            <p>
              Consultez l'historique de vos commandes.
            </p>
          </Link>

          <Link
            to="/factures"
            className="account__card"
          >
            <span className="account__icon">🧾</span>

            <h2>Mes factures</h2>

            <p>
              Retrouvez vos factures.
            </p>
          </Link>

          <Link
            to="/informations-personnelles"
            className="account__card"
          >
            <span className="account__icon">⚙️</span>

            <h2>Mes informations</h2>

            <p>
              Gérez vos informations personnelles.
            </p>
          </Link>
        </div>

        <button
          type="button"
          className="account__logout"
          onClick={handleLogout}
        >
          Se déconnecter
        </button>
      </div>
    </section>
  );
}

export default Compte;