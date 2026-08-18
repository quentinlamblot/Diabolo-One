"use client";

import type { Client, Offre, Statut, Projet, Prestataire } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

interface Props {
  clients: Client[];
  offres: Offre[];
  statuts: Statut[];
  prestataires: Prestataire[];
  projet?: Projet;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
  autosave?: boolean;
}

export function ProjetForm({ clients, offres, statuts, prestataires, projet, action, submitLabel, autosave }: Props) {
  const fields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom du projet">
          <input
            name="nom"
            defaultValue={projet?.nom}
            required
            className="input"
          />
        </Field>
        <Field label="Client">
          <select name="client_id" defaultValue={projet?.client_id} required className="input">
            <option value="">— Sélectionner —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Offre">
          <select name="offre_id" defaultValue={projet?.offre_id ?? ""} className="input">
            <option value="">— Aucune —</option>
            {offres.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Format">
          <select name="format" defaultValue={projet?.format ?? "16:9"} className="input">
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="16:9 et 9:16">16:9 et 9:16</option>
          </select>
        </Field>
        <Field label="Durée moyenne">
          <input
            name="duree_moyenne"
            defaultValue={projet?.duree_moyenne ?? ""}
            placeholder="ex: 60-90s"
            className="input"
          />
        </Field>
        <Field label="Statut">
          <select name="statut_id" defaultValue={projet?.statut_id ?? ""} className="input">
            <option value="">— Aucun —</option>
            {statuts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Charte graphique">
          <select
            name="charte_graphique"
            defaultValue={projet?.charte_graphique ?? "en_attente"}
            className="input"
          >
            <option value="en_attente">En attente</option>
            <option value="ok">OK</option>
          </select>
        </Field>
        <Field label="Nombre de vidéos commandées">
          <input
            type="number"
            min={0}
            name="nombre_commande"
            defaultValue={projet?.nombre_commande ?? 0}
            className="input"
          />
        </Field>
      </div>
      {projet && (
        <p className="-mt-4 text-xs text-zinc-500">
          Augmenter ce nombre crée automatiquement les fiches vidéo manquantes en statut « à tourner ».
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsable tournage par défaut">
          <select name="prestataire_tournage_defaut_id" defaultValue={projet?.prestataire_tournage_defaut_id ?? ""} className="input">
            <option value="">— Aucun —</option>
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Responsable montage par défaut">
          <select name="prestataire_montage_defaut_id" defaultValue={projet?.prestataire_montage_defaut_id ?? ""} className="input">
            <option value="">— Aucun —</option>
            {prestataires.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="-mt-4 text-xs text-zinc-500">
        Appliqué automatiquement aux nouvelles vidéos et à celles qui entrent dans l&apos;étape correspondante sans
        responsable déjà assigné.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Lien édito">
          <input
            name="lien_edito"
            type="url"
            defaultValue={projet?.lien_edito ?? ""}
            placeholder="https://..."
            className="input"
          />
        </Field>
        <Field label="Lien Riverside">
          <input
            name="lien_riverside"
            type="url"
            defaultValue={projet?.lien_riverside ?? ""}
            placeholder="https://..."
            className="input"
          />
        </Field>
      </div>

      <Field label="Informations complémentaires">
        <textarea
          name="infos_complementaires"
          defaultValue={projet?.infos_complementaires ?? ""}
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Instructions individuelles">
        <textarea
          name="instructions_individuelles"
          defaultValue={projet?.instructions_individuelles ?? ""}
          rows={3}
          className="input"
        />
      </Field>
    </>
  );

  if (autosave) {
    return (
      <AutosaveForm action={action} className="flex flex-col gap-6">
        {fields}
      </AutosaveForm>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {fields}
      <button
        type="submit"
        className="w-fit rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}
