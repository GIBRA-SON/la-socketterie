import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import "./Boutique.css";

function Boutique() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/products"
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer les produits.");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.data)) {
          throw new Error("La réponse du serveur est invalide.");
        }

        setProducts(data.data);
      } catch (error) {
        console.error("Erreur lors du chargement des produits :", error);
        setError(
          "Impossible de charger la boutique. Vérifiez que le serveur est démarré."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="shop">
      <div className="shop__container">
        <div className="shop__header">
          <p className="shop__subtitle">La Socketterie</p>

          <h1>Notre boutique</h1>

          <p>
            Découvrez notre collection de chaussettes
            dépareillées et originales.
          </p>
        </div>

        {loading && (
          <p role="status">Chargement des produits...</p>
        )}

        {error && (
          <p role="alert">{error}</p>
        )}

        {!loading && !error && products.length === 0 && (
          <p>Aucun produit disponible pour le moment.</p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="shop__grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Boutique;