import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./BackOfficeCommercial.css";

const API_URL = "http://localhost:3000/api/commercial/orders";

const STATUS_LABELS = {
  pending: "En attente de paiement",
  paid: "Payée",
  processing: "En préparation",
  shipped: "Expédiée",
  cancelled: "Annulée",
};

function formatPrice(amount, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function BackOfficeCommercial() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Récupérer toutes les commandes
  const fetchOrders = useCallback(async () => {
    if (!token) {
      setError("Vous devez être connecté pour accéder aux commandes.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Impossible de récupérer les commandes.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Modifier le statut d'une commande
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Impossible de modifier le statut.");
      }

      setOrders((previousOrders) =>
      previousOrders.map((order) =>
      order.id === orderId
      ? {
          ...order,
          status: data.order.status,
          updatedAt: data.order.updatedAt,
        }
        : order
       )
     );

      setSuccess(`La commande n°${orderId} a été mise à jour.`);
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculer quelques statistiques
  const paidOrders = orders.filter(
    (order) => ["paid", "processing", "shipped"].includes(order.status)
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  );

  const totalRevenue = paidOrders.reduce(
    (total, order) => total + Number(order.totalAmount || 0),
    0
  );

  if (loading) {
    return (
      <section className="commercial">
        <p className="commercial__message">
          Chargement des commandes...
        </p>
      </section>
    );
  }

  return (
    <section className="commercial">
      <div className="commercial__container">

        <header className="commercial__header">
          <div>
            <p className="commercial__subtitle">La Socketterie</p>
            <h1>Back-office commercial</h1>
            <p>Gestion et suivi des commandes clients.</p>
          </div>

          <Link to="/compte" className="commercial__back">
            Retour à mon compte
          </Link>
        </header>

        {error && (
          <div className="commercial__alert commercial__alert--error">
            {error}
          </div>
        )}

        {success && (
          <div className="commercial__alert commercial__alert--success">
            {success}
          </div>
        )}

        <div className="commercial__stats">

          <article className="commercial__stat">
            <span>Commandes totales</span>
            <strong>{orders.length}</strong>
          </article>

          <article className="commercial__stat">
            <span>En attente de paiement</span>
            <strong>{pendingOrders.length}</strong>
          </article>

          <article className="commercial__stat">
            <span>Commandes payées ou traitées</span>
            <strong>{paidOrders.length}</strong>
          </article>

          <article className="commercial__stat">
            <span>Montant des commandes payées</span>
            <strong>{formatPrice(totalRevenue)}</strong>
          </article>

        </div>

        <div className="commercial__toolbar">
          <h2>Liste des commandes</h2>

          <button
            type="button"
            className="commercial__refresh"
            onClick={fetchOrders}
          >
            Actualiser
          </button>
        </div>

        {orders.length === 0 ? (
          <p className="commercial__empty">
            Aucune commande enregistrée.
          </p>
        ) : (
          <div className="commercial__table-wrapper">

            <table className="commercial__table">
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Produits</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const nextStatus =
                    order.status === "paid"
                      ? "processing"
                      : order.status === "processing"
                        ? "shipped"
                        : null;

                  return (
                    <tr key={order.id}>
                      <td>#{order.id}</td>

                      <td>
                        <strong>
                          {order.user?.firstName} {order.user?.lastName}
                        </strong>
                        <small>{order.user?.email}</small>
                      </td>

                      <td>{formatDate(order.createdAt)}</td>

                      <td>
                        {order.items?.map((item) => (
                          <div key={item.id}>
                            {item.productName} × {item.quantity}
                          </div>
                        ))}
                      </td>

                      <td>
                        <strong>
                          {formatPrice(
                            order.totalAmount,
                            order.currency
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`commercial__badge commercial__badge--${order.status}`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>

                      <td>
                        {nextStatus ? (
                          <button
                            type="button"
                            className="commercial__action"
                            disabled={updatingId === order.id}
                            onClick={() =>
                              handleStatusChange(order.id, nextStatus)
                            }
                          >
                            {updatingId === order.id
                              ? "Mise à jour..."
                              : nextStatus === "processing"
                                ? "Préparer"
                                : "Expédier"}
                          </button>
                        ) : (
                          <span className="commercial__no-action">
                            Aucune action
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

          </div>
        )}

      </div>
    </section>
  );
}

export default BackOfficeCommercial;