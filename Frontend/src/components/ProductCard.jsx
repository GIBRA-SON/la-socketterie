import { Link } from "react-router-dom";
import "./ProductCard.css";

import modeleColore from "../assets/Modèle-coloré.jpg";
import modeleFun from "../assets/Modèle-fun.jpg";
import modeleNice from "../assets/Modèle-nice.jpg";
import modeleOriginal from "../assets/Modèle-original.jpg";
import modelePop from "../assets/Modèle-pop.jpg";
import modeleStreet from "../assets/Modèle-street.jpg";

// Association des noms de modèles aux images
const productImages = {
coloré: modeleColore,
colore: modeleColore,
fun: modeleFun,
nice: modeleNice,
original: modeleOriginal,
pop: modelePop,
street: modeleStreet,
};

function ProductCard({ product }) {
// Recherche de l'image correspondant au nom du produit
const productName = product.name?.toLowerCase() ?? "";

const imageKey = Object.keys(productImages).find((key) =>
productName.includes(key),
);

const productImage = imageKey ? productImages[imageKey] : null;

return ( <article className="product-card">
<Link
to={`/boutique/${product.id}`}
className="product-card__link"
> <div className="product-card__image">
{productImage ? ( <img
           src={productImage}
           alt={product.name}
           loading="lazy"
         />
) : ( <span>{product.name}</span>
)} </div>

```
    <div className="product-card__content">
      <h2>{product.name}</h2>

      <p className="product-card__description">
        {product.description}
      </p>

      <p className="product-card__price">
        {Number(product.price).toFixed(2)} €
      </p>
    </div>
  </Link>
</article>

);
}

export default ProductCard;
