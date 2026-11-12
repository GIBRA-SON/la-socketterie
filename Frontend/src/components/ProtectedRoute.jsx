import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated, loading } = useAuth();

  // Attendre la vérification de la session
  if (loading) {
    return <p>Vérification de votre session...</p>;
  }

  // Rediriger les utilisateurs non connectés
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  // Vérifier le rôle de l'utilisateur
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;