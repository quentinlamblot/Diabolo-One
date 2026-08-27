"use client";

// Pastille cliquable payé/à régler, réutilisée partout où un statut de
// paiement (client ou prestataire) doit pouvoir être basculé en un clic.
export function PayeToggleButton({
  paye,
  action,
  labelPaye = "Réglé ✓",
  labelAPayer = "À régler",
}: {
  paye: boolean;
  action: (paye: boolean) => Promise<void>;
  labelPaye?: string;
  labelAPayer?: string;
}) {
  return (
    <form action={() => action(!paye)}>
      <button
        type="submit"
        className={
          paye
            ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
            : "rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-200"
        }
      >
        {paye ? labelPaye : labelAPayer}
      </button>
    </form>
  );
}
