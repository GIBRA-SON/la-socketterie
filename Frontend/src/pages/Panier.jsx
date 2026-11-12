import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Panier.css";

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

function Panier() {
const {
cart,
removeFromCart,
updateQuantity,
total,
} = useCart();

const { isAuthenticated } = useAuth();

const shipping = 5;
const finalTotal = total + shipping;

if (cart.length === 0) {
return ( <section className="cart"> <div className="cart__container"> <h1>Votre panier</h1>
      <p>Votre panier est actuellement vide.</p>

      <Link to="/boutique" className="cart__button">
        Découvrir la boutique
      </Link>
    </div>
  </section>
);

}

return ( <section className="cart"> <div className="cart__container"> <h1>Votre panier</h1>

    <div className="cart__items">
      {cart.map((item) => {
        const productName = item.name?.toLowerCase() ?? "";

        const imageKey = Object.keys(productImages).find((key) =>
          productName.includes(key),
        );

        const productImage = imageKey
          ? productImages[imageKey]
          : null;

        return (
          <article key={item.id} className="cart__item">
            <div className="cart__item-image">
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

            <div className="cart__item-info">
              <h2>{item.name}</h2>

              <p>
                Prix unitaire :{" "}
                {Number(item.price).toFixed(2)} €
              </p>

              <div className="cart__quantity">
                <button
                  type="button"
                  aria-label={`Diminuer la quantité de ${item.name}`}
                  onClick={() =>
                    updateQuantity(item.id, item.quantity - 1)
                  }
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  aria-label={`Augmenter la quantité de ${item.name}`}
                  onClick={() =>
                    updateQuantity(item.id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="cart__remove"
                onClick={() => removeFromCart(item.id)}
              >
                Supprimer
              </button>
            </div>

            <p className="cart__item-total">
              {(Number(item.price) * item.quantity).toFixed(2)} €
            </p>
          </article>
        );
      })}
    </div>

    <div className="cart__summary">
      <div className="cart__summary-row">
        <span>Sous-total</span>
        <span>{total.toFixed(2)} €</span>
      </div>

      <div className="cart__summary-row">
        <span>Livraison</span>
        <span>{shipping.toFixed(2)} €</span>
      </div>

      <div className="cart__summary-total">
        <span>Total</span>
        <span>{finalTotal.toFixed(2)} €</span>
      </div>

      {isAuthenticated ? (
        <Link to="/commande" className="cart__checkout">
          Passer la commande
        </Link>
      ) : (
        <Link to="/connexion" className="cart__checkout">
          Se connecter pour commander
        </Link>
      )}
    </div>
  </div>
</section>

);
}

export default Panier;
