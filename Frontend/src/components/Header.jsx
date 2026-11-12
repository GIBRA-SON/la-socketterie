import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { cart } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  const cartQuantity = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <header className="header">
      <div className="header__container">

        <Link
          to="/"
          className="header__logo"
          onClick={closeMenu}
        >
          La Socketterie
        </Link>

        <button
          className="header__menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
        >
          ☰
        </button>

        <nav
          className={`header__nav ${
            menuOpen ? "header__nav--open" : ""
          }`}
        >
          <Link to="/" onClick={closeMenu}>
            Accueil
          </Link>

          <Link to="/boutique" onClick={closeMenu}>
            Boutique
          </Link>

          <Link to="/a-propos" onClick={closeMenu}>
            À propos
          </Link>

          <Link to="/actualites" onClick={closeMenu}>
            Actualités
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>
        </nav>

        <div className="header__actions">

          {isAuthenticated ? (
            <>
              <Link
                to="/compte"
                aria-label="Mon compte"
                onClick={closeMenu}
              >
                👤
              </Link>

              <button
                className="header__logout"
                onClick={handleLogout}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link
              to="/connexion"
              aria-label="Connexion"
              onClick={closeMenu}
            >
              👤
            </Link>
          )}

          <Link
            to="/panier"
            className="header__cart"
            aria-label={`Mon panier, ${cartQuantity} article(s)`}
          >
            🛒

            {cartQuantity > 0 && (
              <span className="header__cart-count">
                {cartQuantity}
              </span>
            )}
          </Link>

        </div>

      </div>
    </header>
  );
}

export default Header;