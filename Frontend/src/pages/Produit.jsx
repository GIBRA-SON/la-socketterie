import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Produit.css";

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
nice: modeleNice,
pop: modelePop,
street: modeleStreet,
};

function getProductImage(product) {
if (product.imageUrl) {
return product.imageUrl;
}

const productName = product.name?.toLowerCase() ?? "";

const imageKey = Object.keys(productImages).find((key) =>
productName.includes(key),
);

return imageKey ? productImages[imageKey] : null;
}

function Produit() {
const { id } = useParams();
const { addToCart } = useCart();

const [product, setProduct] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [added, setAdded] = useState(false);

useEffect(() => {
const fetchProduct = async () => {
try {
const response = await fetch(
"http://localhost:3000/api/products",
);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les produits.");
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.data)) {
      throw new Error("La réponse du serveur est invalide.");
    }

    const foundProduct = data.data.find(
      (item) => Number(item.id) === Number(id),
    );

    setProduct(foundProduct || null);
  } catch (error) {
    console.error("Erreur de chargement du produit :", error);
    setError("Impossible de charger ce produit.");
  } finally {
    setLoading(false);
  }
};

fetchProduct();

}, [id]);

const handleAddToCart = () => {
if (!product) return;

addToCart(product);
setAdded(true);

setTimeout(() => {
  setAdded(false);
}, 2000);

};

if (loading) {
return ( <section className="product-detail"> <p role="status">Chargement du produit...</p> </section>
);
}

if (error) {
return ( <section className="product-detail"> <h1>Erreur</h1> <p role="alert">{error}</p>

    <Link to="/boutique">Retour à la boutique</Link>
  </section>
);

}

if (!product) {
return ( <section className="product-detail"> <h1>Produit introuvable</h1>

    <Link to="/boutique">Retour à la boutique</Link>
  </section>
);

}

const productImage = getProductImage(product);

return ( <section className="product-detail"> <div className="product-detail__container"> <div className="product-detail__image">
{productImage ? ( <img src={productImage} alt={product.name} />
) : ( <span>{product.name}</span>
)} </div>

    <div className="product-detail__content">
      <p className="product-detail__subtitle">
        La Socketterie
      </p>

      <h1>{product.name}</h1>

      <p className="product-detail__description">
        {product.description}
      </p>

      <p className="product-detail__price">
        {Number(product.price).toFixed(2)} €
      </p>

      <button
        className="product-detail__button"
        onClick={handleAddToCart}
      >
        Ajouter au panier
      </button>

      {added && (
        <p className="product-detail__success">
          ✓ Produit ajouté au panier
        </p>
      )}

      <Link
        to="/boutique"
        className="product-detail__back"
      >
        ← Retour à la boutique
      </Link>
    </div>
  </div>
</section>

);
}

export default Produit;
