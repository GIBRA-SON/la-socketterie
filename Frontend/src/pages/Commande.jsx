import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Commande.css";

import modeleColore from "../assets/Modèle-coloré.jpg";
import modeleFun from "../assets/Modèle-fun.jpg";
import modeleNice from "../assets/Modèle-nice.jpg";
import modeleOriginal from "../assets/Modèle-original.jpg";
import modelePop from "../assets/Modèle-pop.jpg";
import modeleStreet from "../assets/Modèle-street.jpg";

const productImages = {
coloré: modeleColore,
colore: modeleColore,
fun: modeleFun,
nice: modeleNice,
original: modeleOriginal,
pop: modelePop,
street: modeleStreet,
};

function Commande() {
const { cart, total } = useCart();
const { user, token, isAuthenticated } = useAuth();

const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");

const shipping = 5;
const finalTotal = total + shipping;

const handlePayment = async () => {
if (!isAuthenticated || !token) {
setErrorMessage(
"Votre session a expiré. Veuillez vous reconnecter.",
);
return;
}

if (!cart || cart.length === 0) {
  setErrorMessage("Votre panier est vide.");
  return;
}

try {
  setLoading(true);
  setErrorMessage("");

  const response = await fetch(
    "http://localhost:3000/api/payment/create-checkout-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cart: cart.map((item) => ({
          id: Number(item.id),
          quantity: Number(item.quantity),
        })),
      }),
    },
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ||
        `Erreur lors de la création du paiement (HTTP ${response.status}).`,
    );
  }

  if (!data.url) {
    throw new Error(
      "Le serveur n'a pas renvoyé l'adresse de paiement Stripe.",
    );
  }

  window.location.assign(data.url);
} catch (error) {
  console.error("Erreur lors du paiement :", error);

  setErrorMessage(
    error.message ||
      "Impossible de lancer le paiement. Vérifiez que le serveur fonctionne.",
  );

  setLoading(false);
}

};

if (!isAuthenticated) {
return ( <section className="order"> <div className="order__container"> <h1>Validation de commande</h1>

      <p>Vous devez être connecté pour continuer.</p>

      <Link to="/connexion" className="order__button">
        Se connecter
      </Link>
    </div>
  </section>
);


}

if (!cart || cart.length === 0) {
return ( <section className="order"> <div className="order__container"> <h1>Votre panier est vide</h1>

      <p>
        Ajoutez au moins un produit avant de passer commande.
      </p>

      <Link to="/boutique" className="order__button">
        Retour à la boutique
      </Link>
    </div>
  </section>
);

}

return ( <section className="order"> <div className="order__container"> <div className="order__header"> <p className="order__subtitle">La Socketterie</p>

      <h1>Validation de commande</h1>

      <p>
        Vérifiez les informations de votre commande avant de
        continuer.
      </p>
    </div>

    <div className="order__customer">
      <h2>Informations client</h2>

      <p>
        <strong>Email :</strong> {user?.email}
      </p>
    </div>

    <div className="order__content">
      <div className="order__products">
        <h2>Votre commande</h2>

        {cart.map((item) => {
          const productName = item.name?.toLowerCase() ?? "";

          const imageKey = Object.keys(productImages).find(
            (key) => productName.includes(key),
          );

          const productImage = imageKey
            ? productImages[imageKey]
            : null;

          return (
            <article key={item.id} className="order__product">
              <div className="order__product-image">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={item.name}
                    loading="lazy"
                  />
                ) : (
                  <span>{item.name}</span>
                )}
              </div>

              <div className="order__product-info">
                <h3>{item.name}</h3>

                <p>
                  {item.quantity} ×{" "}
                  {Number(item.price).toFixed(2)} €
                </p>
              </div>

              <strong className="order__product-total">
                {(
                  Number(item.price) * Number(item.quantity)
                ).toFixed(2)} €
              </strong>
            </article>
          );
        })}
      </div>

      <div className="order__summary">
        <h2>Récapitulatif</h2>

        <div className="order__row">
          <span>Sous-total</span>
          <span>{Number(total).toFixed(2)} €</span>
        </div>

        <div className="order__row">
          <span>Livraison</span>
          <span>{shipping.toFixed(2)} €</span>
        </div>

        <div className="order__total">
          <span>Total</span>
          <span>{Number(finalTotal).toFixed(2)} €</span>
        </div>

        {errorMessage && (
          <p
            className="order__error"
            role="alert"
            aria-live="polite"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          className="order__payment"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading
            ? "Redirection vers Stripe..."
            : "Continuer vers le paiement"}
        </button>

        <Link to="/panier" className="order__back">
          ← Modifier mon panier
        </Link>
      </div>
    </div>
  </div>
</section>
);
}

export default Commande;
