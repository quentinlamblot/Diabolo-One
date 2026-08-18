"use client";

import { useState } from "react";
import type { Video, Statut, Prestataire, Interviewe, UserRole } from "@/types/database";
import { AutosaveForm } from "@/components/AutosaveForm";

function contactLabel(i: Pick<Interviewe, "nom" | "prenom">) {
  return [i.prenom, i.nom].filter(Boolean).join(" ") || "Sans nom";
}

interface Props {
  statuts: Statut[];
  videos: Video[];
  prestataires: Prestataire[];
  interviewes: Interviewe[];
  role: UserRole;
  currentPrestataireId: string | null;
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (videoId: string, formData: FormData) => Promise<void>;
  updateStatutAction: (videoId: string, statutId: string) => Promise<void>;
  deleteAction: (videoId: string) => Promise<void>;
}

export function VideoBoard({
  statuts,
  videos,
  prestataires,
  interviewes,
  role,
  currentPrestataireId,
  createAction,
  updateAction,
  updateStatutAction,
  deleteAction,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const isAdmin = role === "admin";
  const maxOrdre = statuts.length > 0 ? Math.max(...statuts.map((s) => s.ordre)) : 0;

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div>
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="w-fit rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark"
          >
            {showAdd ? "Annuler" : "+ Ajouter une vidéo"}
          </button>
          {showAdd && (
            <form
              action={async (fd: FormData) => {
                await createAction(fd);
                setShowAdd(false);
              }}
              className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-3"
            >
              <input name="titre" placeholder="Titre (optionnel)" className="input" />
              <select name="prestataire_tournage_id" defaultValue="" className="input" title="Responsable tournage">
                <option value="">— Responsable tournage —</option>
                {prestataires.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
              <select name="prestataire_montage_id" defaultValue="" className="input" title="Responsable montage">
                <option value="">— Responsable montage —</option>
                {prestataires.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
              <select name="interviewe_id" defaultValue="" className="input">
                <option value="">— Contact —</option>
                {interviewes.map((i) => (
                  <option key={i.id} value={i.id}>
                    {contactLabel(i)}
                  </option>
                ))}
              </select>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Date de tournage
                <input type="date" name="date_tournage" className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
                Date de livraison
                <input type="date" name="date_livraison" className="input" />
              </label>
              <button
                type="submit"
                className="col-span-2 w-fit rounded-full bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-sky-dark sm:col-span-3"
              >
                Créer
              </button>
            </form>
          )}
        </div>
      )}

      <div
        className="grid gap-4 overflow-x-auto"
        style={{ gridTemplateColumns: `repeat(${statuts.length}, minmax(230px, 1fr))` }}
      >
        {statuts.map((statut) => {
          const columnVideos = videos.filter((v) => v.statut_id === statut.id);
          return (
            <div key={statut.id} className="flex flex-col gap-3 rounded-xl bg-zinc-100 p-3">
              <div className="flex items-center gap-2 px-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statut.couleur }} />
                <h3 className="text-sm font-semibold text-zinc-900">{statut.label}</h3>
                <span className="ml-auto text-xs text-zinc-400">{columnVideos.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {columnVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    statuts={statuts}
                    maxOrdre={maxOrdre}
                    prestataires={prestataires}
                    interviewes={interviewes}
                    canEditStatut={
                      isAdmin ||
                      video.prestataire_tournage_id === currentPrestataireId ||
                      video.prestataire_montage_id === currentPrestataireId
                    }
                    canEditFull={isAdmin}
                    updateAction={updateAction}
                    updateStatutAction={updateStatutAction}
                    deleteAction={deleteAction}
                  />
                ))}
                {columnVideos.length === 0 && <p className="px-1 text-xs text-zinc-400">Aucune vidéo</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  statuts,
  maxOrdre,
  prestataires,
  interviewes,
  canEditStatut,
  canEditFull,
  updateAction,
  updateStatutAction,
  deleteAction,
}: {
  video: Video;
  statuts: Statut[];
  maxOrdre: number;
  prestataires: Prestataire[];
  interviewes: Interviewe[];
  canEditStatut: boolean;
  canEditFull: boolean;
  updateAction: (videoId: string, formData: FormData) => Promise<void>;
  updateStatutAction: (videoId: string, statutId: string) => Promise<void>;
  deleteAction: (videoId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  // Les statuts sont personnalisables (libellé) : on se base sur la
  // position dans le pipeline (ordre) plutôt que sur le texte, qui peut
  // être renommé par l'admin (ex. "Tourné" → "Booké").
  const ordreActuel = video.statuts?.ordre;
  const isLivre = ordreActuel !== undefined && ordreActuel >= maxOrdre;
  // Le tournage n'est "en retard" que tant qu'il n'a pas encore eu lieu :
  // une fois la vidéo passée à l'étape suivante, la date de tournage
  // passée n'est plus une alerte.
  const tournageEnRetard = ordreActuel === 0 && video.date_tournage !== null && video.date_tournage < today;
  const livraisonEnRetard = !isLivre && video.date_livraison !== null && video.date_livraison < today;
  const overdue = tournageEnRetard || livraisonEnRetard;

  return (
    <div className={`rounded-lg border bg-white p-3 text-sm shadow-sm ${overdue ? "border-red-300" : "border-zinc-200"}`}>
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-zinc-900">{video.titre || "Vidéo sans titre"}</p>
            {canEditFull && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 text-zinc-400 hover:text-zinc-700"
                aria-label="Modifier"
              >
                ✎
              </button>
            )}
          </div>
          {(video.prestataire_tournage || video.prestataire_montage) && (
            <p className="mt-1 text-xs text-zinc-500">
              {video.prestataire_tournage && <>🎥 {video.prestataire_tournage.nom}</>}
              {video.prestataire_tournage && video.prestataire_montage && " · "}
              {video.prestataire_montage && <>✂️ {video.prestataire_montage.nom}</>}
            </p>
          )}
          {video.interviewes && (
            <p className="mt-0.5 text-xs text-zinc-400">🎤 {contactLabel(video.interviewes)}</p>
          )}
          {(video.date_tournage || video.date_livraison) && (
            <p className="mt-1 text-xs text-zinc-400">
              {video.date_tournage && (
                <span className={tournageEnRetard ? "font-medium text-red-600" : ""}>
                  Tournage : {formatDate(video.date_tournage)}
                </span>
              )}
              {video.date_tournage && video.date_livraison && " · "}
              {video.date_livraison && (
                <span className={livraisonEnRetard ? "font-medium text-red-600" : ""}>
                  Livraison : {formatDate(video.date_livraison)}
                </span>
              )}
            </p>
          )}
          {canEditStatut && (
            <select
              key={video.id}
              defaultValue={video.statut_id ?? ""}
              onChange={(e) => {
                void updateStatutAction(video.id, e.target.value);
              }}
              className="input mt-2 w-full py-1 text-xs"
            >
              {statuts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <AutosaveForm action={(fd) => updateAction(video.id, fd)} className="flex flex-col gap-2">
            <input name="titre" defaultValue={video.titre ?? ""} placeholder="Titre" className="input" />
            <select name="statut_id" defaultValue={video.statut_id ?? ""} className="input">
              {statuts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select name="prestataire_tournage_id" defaultValue={video.prestataire_tournage_id ?? ""} className="input">
              <option value="">— Responsable tournage —</option>
              {prestataires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <select name="prestataire_montage_id" defaultValue={video.prestataire_montage_id ?? ""} className="input">
              <option value="">— Responsable montage —</option>
              {prestataires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
            <select name="interviewe_id" defaultValue={video.interviewe_id ?? ""} className="input">
              <option value="">— Contact —</option>
              {interviewes.map((i) => (
                <option key={i.id} value={i.id}>
                  {contactLabel(i)}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              Date de tournage
              <input type="date" name="date_tournage" defaultValue={video.date_tournage ?? ""} className="input" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
              Date de livraison
              <input type="date" name="date_livraison" defaultValue={video.date_livraison ?? ""} className="input" />
            </label>
            <textarea
              name="notes"
              defaultValue={video.notes ?? ""}
              placeholder="Notes"
              rows={2}
              className="input"
            />
          </AutosaveForm>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-500 hover:underline">
              Fermer
            </button>
            <form action={() => deleteAction(video.id)}>
              <button type="submit" className="text-xs text-red-600 hover:underline">
                Supprimer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}
