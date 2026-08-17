"use client";

import { useRef, useState } from "react";
import type { Prestataire, Projet, TarifMonteur, TypeRemuneration } from "@/types/database";

export function TacheForm({
  mois,
  prestataires,
  projets,
  tarifsMonteur,
  action,
}: {
  mois: string;
  prestataires: Prestataire[];
  projets: Projet[];
  tarifsMonteur: TarifMonteur[];
  action: (formData: FormData) => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<TypeRemuneration | "">("");
  const [sousType, setSousType] = useState<string>("");

  const tarifPremium = tarifsMonteur.find((t) => t.cle === "video_premium");
  const tarifClassique = tarifsMonteur.find((t) => t.cle === "video_classique");

  return (
    <form
      ref={ref}
      action={(fd) => {
        action(fd);
        ref.current?.reset();
        setType("");
        setSousType("");
      }}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4"
    >
      <input type="hidden" name="mois" value={mois} />
      <div className="grid grid-cols-4 gap-3">
        <select name="prestataire_id" required className="input">
          <option value="">Prestataire...</option>
          {prestataires.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom}
            </option>
          ))}
        </select>

        <select
          name="type_remuneration"
          required
          value={type}
          onChange={(e) => {
            setType(e.target.value as TypeRemuneration);
            setSousType("");
          }}
          className="input"
        >
          <option value="">Type de rémunération...</option>
          <option value="monteur">Monteur</option>
          <option value="graphiste">Graphiste</option>
          <option value="chef_de_projet">Chef de projet</option>
        </select>

        {type !== "chef_de_projet" && (
          <select name="projet_id" className="input">
            <option value="">Projet (optionnel)</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        )}

        {type === "chef_de_projet" && (
          <select name="projet_id" required className="input">
            <option value="">Projet...</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        )}

        <input name="date_tache" type="date" defaultValue={`${mois}-01`} className="input" />
      </div>

      {type === "monteur" && (
        <div className="grid grid-cols-4 gap-3">
          <select
            name="sous_type"
            required
            value={sousType}
            onChange={(e) => setSousType(e.target.value)}
            className="input"
          >
            <option value="">Type de vidéo...</option>
            <option value="video_premium">
              Vidéo montée premium {tarifPremium ? `(${tarifPremium.prix} €/vidéo)` : ""}
            </option>
            <option value="video_classique">
              Vidéo montée classique {tarifClassique ? `(${tarifClassique.prix} €/vidéo)` : ""}
            </option>
            <option value="sur_mesure">Montant sur mesure</option>
          </select>

          {(sousType === "video_premium" || sousType === "video_classique") && (
            <input name="quantite" type="number" min={1} placeholder="Nombre de vidéos" required className="input" />
          )}

          {sousType === "sur_mesure" && (
            <>
              <input name="description" placeholder="Description" required className="input" />
              <input name="montant" type="number" step="0.01" placeholder="Montant (€)" required className="input" />
            </>
          )}
        </div>
      )}

      {type === "graphiste" && (
        <div className="grid grid-cols-4 gap-3">
          <input name="description" placeholder="Description" required className="input" />
          <input name="montant" type="number" step="0.01" placeholder="Montant (€)" required className="input" />
        </div>
      )}

      {type === "chef_de_projet" && (
        <div className="grid grid-cols-4 gap-3">
          <input
            name="pourcentage_remuneration"
            type="number"
            step="0.1"
            min={0}
            max={100}
            placeholder="% de rémunération sur le projet"
            required
            className="input"
          />
          <input
            name="pourcentage_effectue"
            type="number"
            step="0.1"
            min={0}
            max={100}
            placeholder="% du projet effectué ce mois"
            required
            className="input"
          />
          <p className="col-span-2 self-center text-xs text-zinc-500">
            Rémunération = prix de l&apos;offre × % rémunération × % effectué
          </p>
        </div>
      )}

      {type !== "" && (
        <button
          type="submit"
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Ajouter
        </button>
      )}
    </form>
  );
}
