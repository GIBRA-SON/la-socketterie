import { Link } from "react-router-dom";
import "./Home.css";

import modeleColore from "../assets/Modèle-coloré.jpg";
import modeleFun from "../assets/Modèle-fun.jpg";
import modeleNice from "../assets/Modèle-nice.jpg";
import modeleOriginal from "../assets/Modèle-original.jpg";
import modelePop from "../assets/Modèle-pop.jpg";
import modeleStreet from "../assets/Modèle-street.jpg";

const products = [
{
id: "colore",
name: "Modèle Coloré",
price: "12,00 €",
image: modeleColore,
},
{
id: "original",
name: "Modèle Original",
price: "14,00 €",
image: modeleOriginal,
},
{
id: "fun",
name: "Modèle Fun",
price: "15,00 €",
image: modeleFun,
},
{
id: "nice",
name: "Modèle Nice",
price: "12,00 €",
image: modeleNice,
},
{
id: "pop",
name: "Modèle Pop",
price: "14,00 €",
image: modelePop,
},
{
id: "street",
name: "Modèle Street",
price: "15,00 €",
image: modeleStreet,
},
];

function Home() {
return (
<> <section className="hero"> <div className="hero__content"> <p className="hero__subtitle">La Socketterie</p>

```
      <h1>
        Osez dépareiller
        <br />
        vos chaussettes
      </h1>

      <p className="hero__text">
        Des chaussettes originales pour celles et ceux
        qui aiment sortir du lot.
      </p>

      <Link to="/boutique" className="hero__button">
        Découvrir la boutique
      </Link>
    </div>
  </section>

  <section className="products">
    <div className="section__container">
      <p className="section__subtitle">Notre sélection</p>

      <h2>Nos chaussettes</h2>

      <p className="section__text">
        Découvrez notre sélection de chaussettes dépareillées.
      </p>

      <div className="products__grid">
        {products.map((product) => (
          <Link
            key={product.id}
            to="/boutique"
            className="product-card home-product-card"
          >
            <div className="product-card__image">
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
              />
            </div>

            <div className="home-product-card__content">
              <h3>{product.name}</h3>
              <p>{product.price}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link to="/boutique" className="section__button">
        Voir tous les produits
      </Link>
    </div>
  </section>

  <section className="about-preview">
    <div className="section__container">
      <p className="section__subtitle">Notre histoire</p>

      <h2>La Socketterie depuis 2019</h2>

      <p>
        Créée à Nice en 2019, La Socketterie propose une
        manière originale et décalée de porter ses chaussettes.
      </p>

      <Link to="/a-propos" className="section__button">
        Découvrir notre histoire
      </Link>
    </div>
  </section>
</>

);
}

export default Home;
