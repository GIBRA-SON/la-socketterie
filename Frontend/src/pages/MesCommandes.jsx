import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./MesCommandes.css";

const API_URL = "http://localhost:3000";

function formatPrice(amount) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "Montant indisponible";
  }

  // Les montants de la base sont stockés en centimes.
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value / 100);
}

function formatDate(date) {
  if (!date) {
    return "Date indisponible";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date indisponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

const STATUS_LABELS = {
  pending: "En attente de paiement",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  cancelled: "Annulée",
};

function MesCommandes() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setLoadingOrders(false);
      setOrders([]);
      return;
    }

    const controller = new AbortController();

    async function fetchOrders() {
      setLoadingOrders(true);
      setError("");

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error(
            "Votre session a expiré. Veuillez vous reconnecter."
          );
        }

        const response = await fetch(`${API_URL}/api/orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Impossible de récupérer vos commandes."
          );
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(
            err.message || "Une erreur est survenue."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingOrders(false);
        }
      }
    }

    fetchOrders();

    return () => controller.abort();
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || loadingOrders) {
    return (
      <section className="orders-page">
        <div className="orders-page__container">
          <h1>Mes commandes</h1>
          <p>Chargement de vos commandes...</p>
        </div>
      </section>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <section className="orders-page">
        <div className="orders-page__container">
          <h1>Mes commandes</h1>
          <p>
            Vous devez être connecté pour consulter vos commandes.
          </p>
          <Link to="/connexion" className="orders-page__button">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="orders-page__container">
        <Link to="/compte" className="orders-page__back">
          ← Retour à mon compte
        </Link>

        <header className="orders-page__header">
          <p className="orders-page__subtitle">La Socketterie</p>
          <h1>Mes commandes</h1>
          <p>Retrouvez ici l'historique de vos achats.</p>
        </header>

        {error && (
          <div className="orders-page__error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="orders-page__button"
            >
              Réessayer
            </button>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="orders-page__empty">
            <span aria-hidden="true">📦</span>
            <h2>Aucune commande pour le moment</h2>
            <p>
              Vos commandes apparaîtront ici après vos achats.
            </p>
            <Link to="/boutique" className="orders-page__button">
              Découvrir la boutique
            </Link>
          </div>
        )}

        {!error && orders.length > 0 && (
          <div className="orders-page__list">
            {orders.map((order) => {
              const status = String(order.status || "").toLowerCase();

              return (
                <article
                  className="orders-page__card"
                  key={order.id}
                >
                  <div className="orders-page__card-header">
                    <h2>Commande #{order.id}</h2>

                    <span
                      className={`orders-page__status orders-page__status--${status}`}
                    >
                      {STATUS_LABELS[status] || "Statut inconnu"}
                    </span>
                  </div>

                  <p>
                    <strong>Date :</strong>{" "}
                    {formatDate(order.createdAt)}
                  </p>

                  <p>
                    <strong>Montant total :</strong>{" "}
                    {formatPrice(order.totalAmount)}
                  </p>

                  <div className="orders-page__items">
                    <h3>Articles commandés</h3>

                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      <ul>
                        {order.items.map((item, index) => (
                          <li key={item.id ?? `${order.id}-${index}`}>
                            <span>
                              {item.productName ||
                                item.product?.name ||
                                "Produit indisponible"}
                            </span>

                            <span>
                              Quantité : {item.quantity}
                            </span>

                            <span>
                              {formatPrice(item.lineTotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Les détails des articles sont indisponibles.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default MesCommandes;
