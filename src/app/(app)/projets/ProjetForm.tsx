"use client";

import { useState } from "react";
import type { Client, Offre, Statut, Projet, Prestataire } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";
import { LinkOpener } from "@/components/LinkOpener";

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

const FORMATS_PRESETS = ["16:9", "9:16", "4:5", "16:9 et 9:16"];

export function ProjetForm({ clients, offres, statuts, prestataires, projet, action, submitLabel, autosave }: Props) {
  const [formatValue, setFormatValue] = useState(projet?.format ?? "16:9");

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
          {/* Un seul champ, toujours le même : un select qui ferait
              apparaître/disparaître un input au même moment où on lit le
              formulaire enverrait une valeur de transition au lieu du vrai
              format (le rendu React n'a pas encore eu lieu à cet instant). */}
          <div className="flex items-center gap-2">
            <input
              name="format"
              value={formatValue}
              onChange={(e) => setFormatValue(e.target.value)}
              placeholder="ex: 16:9"
              className="input"
            />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setFormatValue(e.target.value);
              }}
              title="Formats courants"
              className="input w-14 shrink-0 px-1"
            >
              <option value="">▾</option>
              {FORMATS_PRESETS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
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
        <Field label="Chef de projet">
          <select name="chef_de_projet_id" defaultValue={projet?.chef_de_projet_id ?? ""} className="input">
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
        Le chef de projet est notifié par email quand le client remplit son brief ou ajoute des contacts.
      </p>
      {projet && (
        <p className="-mt-4 text-xs text-zinc-500">
          Augmenter ce nombre crée automatiquement les fiches vidéo manquantes en statut « à tourner ».
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Lien édito">
          <div className="flex items-center gap-1.5">
            <input
              name="lien_edito"
              type="url"
              defaultValue={projet?.lien_edito ?? ""}
              placeholder="https://..."
              className="input"
            />
            <LinkOpener value={projet?.lien_edito} />
          </div>
        </Field>
        <Field label="Lien Riverside">
          <div className="flex items-center gap-1.5">
            <input
              name="lien_riverside"
              type="url"
              defaultValue={projet?.lien_riverside ?? ""}
              placeholder="https://..."
              className="input"
            />
            <LinkOpener value={projet?.lien_riverside} />
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <span className="text-sm font-semibold text-zinc-900">Facturation client</span>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Montant facturé (€)">
            <input type="number" step="0.01" min={0} name="montant_facture" defaultValue={projet?.montant_facture ?? ""} className="input" />
          </Field>
          <Field label="Payé le">
            <input type="date" name="date_paiement_client" defaultValue={projet?.date_paiement_client ?? ""} className="input" />
          </Field>
        </div>
        <p className="text-xs text-zinc-500">Laisser « Payé le » vide tant que le client n&apos;a pas réglé — utilisé dans Finances.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900">Habillage</span>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="habillage_fait" defaultChecked={projet?.habillage_fait ?? false} className="h-4 w-4" />
            Fait
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Lien Drive (fichiers sources)">
            <div className="flex items-center gap-1.5">
              <input
                name="habillage_lien"
                type="url"
                defaultValue={projet?.habillage_lien ?? ""}
                placeholder="https://..."
                className="input"
              />
              <LinkOpener value={projet?.habillage_lien} />
            </div>
          </Field>
          <Field label="Date">
            <input name="habillage_date" type="date" defaultValue={projet?.habillage_date ?? ""} className="input" />
          </Field>
          <Field label="Prestataire">
            <select name="habillage_prestataire_id" defaultValue={projet?.habillage_prestataire_id ?? ""} className="input">
              <option value="">— Aucun —</option>
              {prestataires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-xs text-zinc-500">Le prestataire est notifié par email lors de son affectation à l&apos;habillage.</p>
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
