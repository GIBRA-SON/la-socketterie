import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Inscription.css";

function Inscription() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Vérifier que les mots de passe correspondent
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe sont différents.");
      return;
    }

    // Empêcher les doubles soumissions
    setLoading(true);

    try {
      // Envoyer les données au backend
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });

      // Le compte est créé et la session est ouverte
      navigate("/compte");
    } catch (error) {
      setError(
        error.message || "Une erreur est survenue lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register">
      <div className="register__container">
        <div className="register__header">
          <p className="register__subtitle">La Socketterie</p>

          <h1>Créer un compte</h1>

          <p>
            Créez votre compte pour commander
            et suivre vos achats.
          </p>
        </div>

        <form
          className="register__form"
          onSubmit={handleSubmit}
        >
          {error && (
            <p role="alert" className="register__error">
              {error}
            </p>
          )}

          <div className="register__group">
            <label htmlFor="firstName">Prénom</label>

            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              required
            />
          </div>

          <div className="register__group">
            <label htmlFor="lastName">Nom</label>

            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              required
            />
          </div>

          <div className="register__group">
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

          <div className="register__group">
            <label htmlFor="password">Mot de passe</label>

            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </div>

          <div className="register__group">
            <label htmlFor="confirmPassword">
              Confirmer le mot de passe
            </label>

            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
            />
          </div>

          <button
            type="submit"
            className="register__button"
            disabled={loading}
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Inscription;