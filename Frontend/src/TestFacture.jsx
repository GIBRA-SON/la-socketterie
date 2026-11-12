import { useState } from "react";

function TestFacture() {
  const [message, setMessage] = useState("");

  const telechargerFacture = async () => {
    try {
      const token = prompt("Colle ton token JWT :");

      const response = await fetch(
        "http://localhost:3000/api/invoices/1/pdf",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const lien = document.createElement("a");
      lien.href = url;
      lien.download = "facture-demonstration.pdf";
      lien.click();

      window.URL.revokeObjectURL(url);

      setMessage("Facture téléchargée avec succès !");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Test téléchargement facture</h2>

      <button onClick={telechargerFacture}>
        Télécharger la facture
      </button>

      <p>{message}</p>
    </div>
  );
}

export default TestFacture;