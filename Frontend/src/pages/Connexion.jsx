import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Connexion.css";

function Connexion() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);

      navigate("/compte");
    } catch (error) {
      setError(
        error.message || "Impossible de se connecter. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login">
      <div className="login__container">
        <div className="login__header">
          <p className="login__subtitle">La Socketterie</p>

          <h1>Connexion</h1>

          <p>
            Connectez-vous à votre compte pour accéder à vos commandes.
          </p>
        </div>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="login__group">
            <label htmlFor="password">Mot de passe</label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="login__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login__button"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="login__register">
          <p>Vous n'avez pas encore de compte ?</p>

          <Link to="/inscription">Créer un compte</Link>
        </div>
      </div>
    </section>
  );
}

export default Connexion;