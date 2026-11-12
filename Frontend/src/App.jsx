import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Header from "./components/Header";

import Home from "./pages/Home";
import Boutique from "./pages/Boutique";
import Produit from "./pages/Produit";
import APropos from "./pages/APropos";
import Actualites from "./pages/Actualites";
import Contact from "./pages/Contact";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import Panier from "./pages/Panier";
import Compte from "./pages/Compte";
import Commande from "./pages/Commande";
import MesCommandes from "./pages/MesCommandes";
import ProtectedRoute from "./components/ProtectedRoute";
import BackOfficeCommercial from "./pages/BackOfficeCommercial";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>

          <Header />

          <main>
            <Routes>

              <Route
                path="/"
                element={<Home />}
              />

              <Route
                path="/boutique"
                element={<Boutique />}
              />

              <Route
                path="/boutique/:id"
                element={<Produit />}
              />

              <Route
                path="/a-propos"
                element={<APropos />}
              />

              <Route
                path="/actualites"
                element={<Actualites />}
              />

              <Route
                path="/contact"
                element={<Contact />}
              />

              <Route
                path="/connexion"
                element={<Connexion />}
              />

              <Route
                path="/inscription"
                element={<Inscription />}
              />

              <Route
                path="/panier"
                element={<Panier />}
              />

              <Route
                path="/compte"
                element={<Compte />}
              />

              <Route
                path="/commande"
                element={<Commande />}
              />

               <Route
                 path="/commandes"
                 element={<MesCommandes />}
              />

                <Route
                  path="/commercial"
                  element={
                  <ProtectedRoute allowedRoles={["commercial", "admin"]}>
                  <BackOfficeCommercial />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </main>

        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;